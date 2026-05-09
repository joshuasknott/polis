import type { QueryCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";

const KEYWORD_BOOST_TITLE = 3;
const KEYWORD_BOOST_AUTHOR = 2;
const MIN_TOKEN_LENGTH = 2;
const DEFAULT_MAX_RESULTS = 20;
const LOW_SCORE_THRESHOLD = 0.15;
const MIN_DISTINCT_SOURCES = 2;
const EXCERPT_MAX_LENGTH = 300;

export type RetrievalScope =
  | "whole_module"
  | "current_folder"
  | "selected_sources"
  | "assignment"
  | "source";

export interface RetrievalResult {
  chunkId: Id<"sourceChunks">;
  sourceId: Id<"sources">;
  sourceTitle: string;
  authors: string | null;
  year: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  quote: string;
  citationLabel: string;
  score: number;
  scope: RetrievalScope;
  warnings: string[];
}

export interface InsufficientEvidenceWarning {
  type:
    | "no_chunks_found"
    | "low_score"
    | "too_few_sources"
    | "no_selected_sources"
    | "missing_page_provenance";
  message: string;
  severity: "info" | "warning" | "critical";
}

function tokenise(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,.:;!?()[\]{}"'\/\\]+/)
    .filter((t) => t.length > MIN_TOKEN_LENGTH);
}

function countKeywordMatches(
  text: string,
  tokens: string[],
): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const token of tokens) {
    let idx = 0;
    while (true) {
      const found = lower.indexOf(token, idx);
      if (found === -1) break;
      count++;
      idx = found + 1;
    }
  }
  return count;
}

function normaliseScore(raw: number, textLength: number): number {
  if (textLength === 0) return 0;
  return raw / Math.sqrt(textLength);
}

function excerpt(text: string, maxLength: number = EXCERPT_MAX_LENGTH): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "\u2026";
}

export async function resolveSourceIds(
  ctx: QueryCtx,
  scope: RetrievalScope,
  params: {
    moduleId?: Id<"modules">;
    folderId?: Id<"folders">;
    sourceIds?: Id<"sources">[];
    assignmentId?: Id<"assignments">;
    sourceId?: Id<"sources">;
  },
  tokenIdentifier: string,
): Promise<Id<"sources">[]> {
  switch (scope) {
    case "whole_module": {
      if (!params.moduleId) return [];
      const sources = await ctx.db
        .query("sources")
        .withIndex("by_tokenIdentifier_and_module", (q) =>
          q.eq("tokenIdentifier", tokenIdentifier).eq("moduleId", params.moduleId!),
        )
        .take(500);
      return sources.map((s) => s._id);
    }
    case "current_folder": {
      if (!params.folderId) return [];
      const sources = await ctx.db
        .query("sources")
        .withIndex("by_folder", (q) => q.eq("folderId", params.folderId!))
        .take(200);
      const owned = sources.filter((s) => s.tokenIdentifier === tokenIdentifier);
      return owned.map((s) => s._id);
    }
    case "selected_sources": {
      return params.sourceIds ?? [];
    }
    case "assignment": {
      if (!params.assignmentId) return [];
      const links = await ctx.db
        .query("assignmentSources")
        .withIndex("by_assignment", (q) =>
          q.eq("assignmentId", params.assignmentId!),
        )
        .take(200);
      return links.map((l) => l.sourceId);
    }
    case "source": {
      if (!params.sourceId) return [];
      const source = await ctx.db.get(params.sourceId);
      if (!source || source.tokenIdentifier !== tokenIdentifier) return [];
      return [params.sourceId];
    }
  }
}

export async function getChunksForSources(
  ctx: QueryCtx,
  sourceIds: Id<"sources">[],
  maxPerSource: number = 100,
): Promise<Doc<"sourceChunks">[]> {
  const allChunks: Doc<"sourceChunks">[] = [];
  for (const sourceId of sourceIds) {
    const chunks = await ctx.db
      .query("sourceChunks")
      .withIndex("by_source", (q) => q.eq("sourceId", sourceId))
      .take(maxPerSource);
    allChunks.push(...chunks);
  }
  return allChunks;
}

export async function getSourceMetadata(
  ctx: QueryCtx,
  sourceIds: Id<"sources">[],
  tokenIdentifier: string,
): Promise<Map<Id<"sources">, Doc<"sources">>> {
  const map = new Map<Id<"sources">, Doc<"sources">>();
  for (const id of sourceIds) {
    const source = await ctx.db.get(id);
    if (source && source.tokenIdentifier === tokenIdentifier) {
      map.set(id, source);
    }
  }
  return map;
}

export function rankChunksByKeyword(
  chunks: Doc<"sourceChunks">[],
  sourceMetadata: Map<Id<"sources">, Doc<"sources">>,
  query: string,
  scope: RetrievalScope,
  maxResults: number = DEFAULT_MAX_RESULTS,
): RetrievalResult[] {
  const tokens = tokenise(query);
  if (tokens.length === 0) return [];

  const scored: RetrievalResult[] = [];

  for (const chunk of chunks) {
    const source = sourceMetadata.get(chunk.sourceId);
    if (!source) continue;

    let rawScore = 0;

    const textMatches = countKeywordMatches(chunk.text, tokens);
    rawScore += textMatches;

    const titleMatches = countKeywordMatches(source.title, tokens);
    rawScore += titleMatches * KEYWORD_BOOST_TITLE;

    if (source.authors) {
      const authorMatches = countKeywordMatches(source.authors, tokens);
      rawScore += authorMatches * KEYWORD_BOOST_AUTHOR;
    }

    const normalised = normaliseScore(rawScore, chunk.text.length);
    if (normalised <= 0) continue;

    const warnings: string[] = [];
    if (!chunk.pageStart && !chunk.pageEnd) {
      warnings.push("missing_page_provenance");
    }

    const citationLabel = buildCitationLabel(
      source.authors ?? null,
      source.year ?? null,
      chunk.pageStart ?? null,
    );

    scored.push({
      chunkId: chunk._id,
      sourceId: chunk.sourceId,
      sourceTitle: source.title,
      authors: source.authors ?? null,
      year: source.year ?? null,
      pageStart: chunk.pageStart ?? null,
      pageEnd: chunk.pageEnd ?? null,
      quote: excerpt(chunk.text),
      citationLabel,
      score: normalised,
      scope,
      warnings,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults);
}

export function buildCitationLabel(
  authors: string | null,
  year: number | null,
  pageStart: number | null,
): string {
  const authorPart = authors
    ? authors.split(",")[0].trim().split(" ").pop()
    : null;

  if (!authorPart && year === null) return "(Unknown)";
  if (!authorPart) return `(${year})`;
  if (year === null) return `${authorPart} (n.d.)`;

  if (pageStart !== null) {
    return `${authorPart} (${year}, p. ${pageStart})`;
  }
  return `${authorPart} (${year})`;
}

export function generateEvidenceWarnings(
  results: RetrievalResult[],
  sourceIds: Id<"sources">[],
  scope: RetrievalScope,
): InsufficientEvidenceWarning[] {
  const warnings: InsufficientEvidenceWarning[] = [];

  if (results.length === 0) {
    warnings.push({
      type: "no_chunks_found",
      message: "No relevant chunks found for the given query.",
      severity: "critical",
    });
    if (scope === "assignment" && sourceIds.length === 0) {
      warnings.push({
        type: "no_selected_sources",
        message: "No sources have been selected for this assignment.",
        severity: "critical",
      });
    }
    return warnings;
  }

  const maxScore = results[0]?.score ?? 0;
  if (maxScore < LOW_SCORE_THRESHOLD) {
    warnings.push({
      type: "low_score",
      message: `Best match score (${maxScore.toFixed(3)}) is below confidence threshold.`,
      severity: "warning",
    });
  }

  const distinctSources = new Set(results.map((r) => r.sourceId));
  if (distinctSources.size < MIN_DISTINCT_SOURCES && results.length > 0) {
    warnings.push({
      type: "too_few_sources",
      message: `Results come from only ${distinctSources.size} source(s). Consider broadening scope.`,
      severity: "info",
    });
  }

  const missingPage = results.some(
    (r) => r.warnings.includes("missing_page_provenance"),
  );
  if (missingPage) {
    warnings.push({
      type: "missing_page_provenance",
      message: "Some retrieved chunks lack page number information.",
      severity: "info",
    });
  }

  return warnings;
}

export async function retrieveKeyword(
  ctx: QueryCtx,
  query: string,
  scope: RetrievalScope,
  params: {
    moduleId?: Id<"modules">;
    folderId?: Id<"folders">;
    sourceIds?: Id<"sources">[];
    assignmentId?: Id<"assignments">;
    sourceId?: Id<"sources">;
  },
  tokenIdentifier: string,
  maxResults: number = DEFAULT_MAX_RESULTS,
): Promise<{
  results: RetrievalResult[];
  evidenceWarnings: InsufficientEvidenceWarning[];
}> {
  const sourceIds = await resolveSourceIds(ctx, scope, params, tokenIdentifier);

  if (sourceIds.length === 0) {
    return {
      results: [],
      evidenceWarnings: [
        {
          type: "no_chunks_found",
          message: scope === "selected_sources"
            ? "No sources specified for retrieval."
            : "No sources found in scope.",
          severity: "critical",
        },
      ],
    };
  }

  const chunks = await getChunksForSources(ctx, sourceIds);
  const metadata = await getSourceMetadata(ctx, sourceIds, tokenIdentifier);
  const results = rankChunksByKeyword(chunks, metadata, query, scope, maxResults);
  const evidenceWarnings = generateEvidenceWarnings(results, sourceIds, scope);

  return { results, evidenceWarnings };
}
