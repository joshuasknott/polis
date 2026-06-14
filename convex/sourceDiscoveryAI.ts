"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const CROSSREF_ENDPOINT = "https://api.crossref.org/works";
const OPENALEX_ENDPOINT = "https://api.openalex.org/works";
const MAX_QUERIES = 6;
const MAX_RESULTS_PER_QUERY = 5;
const MAX_TOTAL_RECOMMENDATIONS = 25;
const REQUEST_TIMEOUT_MS = 12000;
const THROTTLE_MS = 350;

type CatalogName = "crossref" | "openalex" | "semantic_scholar";

interface RawRecommendation {
  catalog: CatalogName;
  catalogId: string;
  title: string;
  authors: string | undefined;
  year: number | undefined;
  venue: string | undefined;
  doi: string | undefined;
  url: string | undefined;
  abstract: string | undefined;
  matchReason: string | undefined;
  raw: unknown;
}

interface GapFindingLite {
  gapCategory: string;
  title: string;
  suggestedSearchTerms: string[] | undefined;
}

interface AssignmentContext {
  title: string;
  question: string | undefined;
  rubric: Array<{ name: string; description: string; weight: number }> | undefined;
}

function getMailto(): string {
  return process.env.CATALOG_CONTACT_EMAIL || "polis-discovery@example.com";
}

function stripJats(abstract: string | undefined): string | undefined {
  if (!abstract) return undefined;
  return abstract
    .replace(/<jats:[^>]*>/g, "")
    .replace(/<\/jats:[^>]*>/g, "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function reconstructOpenAlexAbstract(
  invertedIndex: Record<string, number[]> | undefined,
): string | undefined {
  if (!invertedIndex) return undefined;
  const positions: Array<{ pos: number; word: string }> = [];
  for (const [word, indices] of Object.entries(invertedIndex)) {
    if (!Array.isArray(indices)) continue;
    for (const pos of indices) {
      positions.push({ pos, word });
    }
  }
  if (positions.length === 0) return undefined;
  positions.sort((a, b) => a.pos - b.pos);
  const text = positions.map((p) => p.word).join(" ");
  return text.length > 50 ? text : undefined;
}

function normalizeDoi(doi: string | undefined): string | undefined {
  if (!doi) return undefined;
  const trimmed = doi.trim();
  if (!trimmed) return undefined;
  const withoutPrefix = trimmed
    .replace(/^https?:\/\/doi\.org\//i, "")
    .replace(/^doi:/i, "");
  if (!/10\.\d{4,}\/.+/i.test(withoutPrefix)) return undefined;
  return withoutPrefix.toLowerCase();
}

function formatCrossrefAuthors(
  authors: Array<{ family?: string; given?: string }> | undefined,
): string | undefined {
  if (!Array.isArray(authors) || authors.length === 0) return undefined;
  const formatted = authors.slice(0, 6).map((a) => {
    if (a.family) {
      return a.given ? `${a.family}, ${a.given[0]}.` : a.family;
    }
    return a.given ?? undefined;
  }).filter(Boolean);
  if (formatted.length === 0) return undefined;
  const suffix = authors.length > 6 ? " et al." : formatted.length > 2 ? " et al." : "";
  if (formatted.length > 2) {
    return `${formatted[0]}${suffix}`;
  }
  return formatted.join(" and ");
}

function formatOpenAlexAuthors(
  authorships: Array<{ author?: { display_name?: string } }> | undefined,
): string | undefined {
  if (!Array.isArray(authorships) || authorships.length === 0) return undefined;
  const names = authorships
    .slice(0, 6)
    .map((a) => a.author?.display_name)
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return undefined;
  if (names.length > 2) {
    return `${names[0]} et al.`;
  }
  return names.join(" and ");
}

function extractCrossrefYear(work: {
  "published-print"?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
  published?: { "date-parts"?: number[][] };
  issued?: { "date-parts"?: number[][] };
  created?: { "date-parts"?: number[][] };
}): number | undefined {
  const candidates = [
    work["published-print"],
    work["published-online"],
    work.published,
    work.issued,
    work.created,
  ];
  for (const c of candidates) {
    const parts = c?.["date-parts"];
    if (Array.isArray(parts) && parts[0] && parts[0][0]) {
      const year = parts[0][0];
      if (typeof year === "number" && year > 1900 && year < 2200) return year;
    }
  }
  return undefined;
}

async function queryCrossref(
  term: string,
  rows: number,
): Promise<RawRecommendation[]> {
  const mailto = getMailto();
  const url = `${CROSSREF_ENDPOINT}?query=${encodeURIComponent(term)}&rows=${rows}&mailto=${encodeURIComponent(mailto)}&select=DOI,title,author,published-print,published-online,issued,created,container-title,abstract,URL,type`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": `Polis/1.0 (mailto:${mailto})`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const body = await res.json();
    const items = body?.message?.items;
    if (!Array.isArray(items)) return [];
    const recs: RawRecommendation[] = [];
    for (const item of items) {
      const titleArr = item.title;
      const title = Array.isArray(titleArr) ? titleArr[0] : undefined;
      if (!title || title.trim().length < 5) continue;
      const authors = formatCrossrefAuthors(item.author);
      if (!authors) continue;
      const doi = normalizeDoi(item.DOI);
      const year = extractCrossrefYear(item);
      const venueArr = item["container-title"];
      const venue = Array.isArray(venueArr) ? venueArr[0] : undefined;
      const abs = stripJats(item.abstract);
      recs.push({
        catalog: "crossref",
        catalogId: doi ?? item.DOI ?? `crossref:${title.slice(0, 60)}:${year ?? ""}`,
        title: title.trim(),
        authors,
        year,
        venue: venue?.trim() || undefined,
        doi,
        url: item.URL || (doi ? `https://doi.org/${doi}` : undefined),
        abstract: abs,
        matchReason: `Crossref match for "${term}"`,
        raw: {
          doi,
          type: item.type,
          containerTitle: venue,
        },
      });
    }
    return recs;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function queryOpenAlex(
  term: string,
  perPage: number,
): Promise<RawRecommendation[]> {
  const mailto = getMailto();
  const url = `${OPENALEX_ENDPOINT}?search=${encodeURIComponent(term)}&per-page=${perPage}&mailto=${encodeURIComponent(mailto)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": `Polis/1.0 (mailto:${mailto})`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const body = await res.json();
    const results = body?.results;
    if (!Array.isArray(results)) return [];
    const recs: RawRecommendation[] = [];
    for (const item of results) {
      const title = typeof item.title === "string" ? item.title : undefined;
      if (!title || title.trim().length < 5) continue;
      const authors = formatOpenAlexAuthors(item.authorships);
      if (!authors) continue;
      const doi = normalizeDoi(
        typeof item.doi === "string" ? item.doi : undefined,
      );
      const year = typeof item.publication_year === "number" ? item.publication_year : undefined;
      const venue =
        item.host_venue?.display_name || item.primary_location?.source?.display_name;
      const abs = reconstructOpenAlexAbstract(item.abstract_inverted_index);
      const openalexId =
        typeof item.id === "string"
          ? item.id.replace(/^https:\/\/openalex\.org\//i, "")
          : undefined;
      recs.push({
        catalog: "openalex",
        catalogId: doi ?? openalexId ?? `openalex:${title.slice(0, 60)}:${year ?? ""}`,
        title: title.trim(),
        authors,
        year,
        venue: venue?.trim() || undefined,
        doi,
        url: doi ? `https://doi.org/${doi}` : (typeof item.id === "string" ? item.id : undefined),
        abstract: abs,
        matchReason: `OpenAlex match for "${term}"`,
        raw: {
          openalexId,
          doi,
          type: item.type,
          citedByCount: item.cited_by_count,
        },
      });
    }
    return recs;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function normalizeTitleForDedup(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function dedupeRecommendations(recs: RawRecommendation[]): RawRecommendation[] {
  const byDoi = new Map<string, RawRecommendation>();
  const byTitle = new Map<string, RawRecommendation>();
  const result: RawRecommendation[] = [];

  for (const rec of recs) {
    if (rec.doi) {
      const existing = byDoi.get(rec.doi);
      if (existing) {
        if (!existing.abstract && rec.abstract) {
          existing.abstract = rec.abstract;
        }
        continue;
      }
      byDoi.set(rec.doi, rec);
      result.push(rec);
      continue;
    }

    const titleKey = `${normalizeTitleForDedup(rec.title)}:${rec.year ?? ""}`;
    const existing = byTitle.get(titleKey);
    if (existing) continue;
    byTitle.set(titleKey, rec);
    result.push(rec);
  }

  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSearchTermsFromAssignment(ctx: AssignmentContext): string[] {
  const terms: string[] = [];
  if (ctx.question && ctx.question.trim().length > 20) {
    const sentences = ctx.question
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && s.length < 200);
    if (sentences.length > 0) {
      terms.push(sentences[0]);
    }
  }
  if (ctx.rubric && ctx.rubric.length > 0) {
    for (const r of ctx.rubric.slice(0, 3)) {
      const desc = r.description.trim();
      if (desc.length > 15 && desc.length < 150) {
        terms.push(desc);
      }
    }
  }
  if (terms.length === 0 && ctx.question) {
    terms.push(ctx.question.slice(0, 150));
  }
  return terms.slice(0, MAX_QUERIES);
}

function collectSearchTermsFromFindings(findings: GapFindingLite[]): string[] {
  const terms: string[] = [];
  for (const f of findings) {
    if (f.suggestedSearchTerms) {
      for (const t of f.suggestedSearchTerms) {
        const trimmed = t.trim();
        if (trimmed.length > 3 && trimmed.length < 120 && !terms.includes(trimmed)) {
          terms.push(trimmed);
        }
        if (terms.length >= MAX_QUERIES) return terms;
      }
    }
  }
  return terms;
}

interface DiscoveryActionResult {
  success: boolean;
  reason: string | null;
  saved: number;
  duplicates?: number;
  searched: number;
  catalogs: ReadonlyArray<"crossref" | "openalex">;
}

export const discoverSources = action({
  args: {
    assignmentId: v.id("assignments"),
    gapAnalysisRunId: v.optional(v.id("gapAnalysisRuns")),
    queries: v.optional(v.array(v.string())),
    maxResults: v.optional(v.number()),
    catalogs: v.optional(
      v.array(v.union(v.literal("crossref"), v.literal("openalex"))),
    ),
  },
  handler: async (ctx, args): Promise<DiscoveryActionResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assignment = (await ctx.runQuery(api.assignments.get, {
      assignmentId: args.assignmentId,
    })) as AssignmentContext & { _id: Id<"assignments"> } | null;
    if (!assignment) throw new Error("Assignment not found");

    const enabledCatalogs = args.catalogs && args.catalogs.length > 0
      ? args.catalogs
      : (["crossref", "openalex"] as const);

    let searchTerms: string[] = [];
    if (args.queries && args.queries.length > 0) {
      searchTerms = args.queries
        .map((q) => q.trim())
        .filter((q) => q.length > 3 && q.length < 200)
        .slice(0, MAX_QUERIES);
    } else if (args.gapAnalysisRunId) {
      const runWithFindings = (await ctx.runQuery(
        api.gapAnalysis.getRunWithFindings,
        { runId: args.gapAnalysisRunId },
      )) as { findings: GapFindingLite[] } | null;
      if (runWithFindings) {
        searchTerms = collectSearchTermsFromFindings(runWithFindings.findings);
      }
    }
    if (searchTerms.length === 0) {
      searchTerms = buildSearchTermsFromAssignment(assignment);
    }

    if (searchTerms.length === 0) {
      return {
        success: false,
        reason: "no_search_terms" as const,
        saved: 0,
        searched: 0,
        catalogs: enabledCatalogs,
      };
    }

    const rateLimit = await ctx.runMutation(api.rateLimits.checkRateLimit, {
      provider: "source_discovery",
      estimatedTokens: 0,
    });
    if (!rateLimit.allowed) {
      await ctx.runMutation(api.observability.recordError, {
        source: "sourceDiscovery",
        errorType: "rate_limited",
        errorMessage: `Rate limit: ${rateLimit.reason}`,
      });
      return {
        success: false,
        reason: "rate_limited" as const,
        saved: 0,
        searched: searchTerms.length,
        catalogs: enabledCatalogs,
      };
    }

    const maxTotal = args.maxResults ?? MAX_TOTAL_RECOMMENDATIONS;
    const allRaw: RawRecommendation[] = [];

    for (const term of searchTerms) {
      const perQuery: RawRecommendation[] = [];
      const tasks: Promise<RawRecommendation[]>[] = [];
      if (enabledCatalogs.includes("crossref")) {
        tasks.push(queryCrossref(term, MAX_RESULTS_PER_QUERY));
      }
      if (enabledCatalogs.includes("openalex")) {
        tasks.push(queryOpenAlex(term, MAX_RESULTS_PER_QUERY));
      }
      const results = await Promise.all(tasks);
      for (const r of results) {
        perQuery.push(...r);
      }
      allRaw.push(...perQuery);
      await sleep(THROTTLE_MS);
    }

    const deduped = dedupeRecommendations(allRaw).slice(0, maxTotal);

    if (deduped.length === 0) {
      await ctx.runMutation(internal.ai_keys.internalLogUsage, {
        tokenIdentifier: identity.tokenIdentifier,
        provider: "source_discovery",
        type: "source_discovery",
        tokensIn: 0,
        tokensOut: 0,
        metadata: { terms: searchTerms.length, found: 0 },
      });
      return {
        success: true,
        reason: null as string | null,
        saved: 0,
        searched: searchTerms.length,
        catalogs: enabledCatalogs,
      };
    }

    const saveResult: { inserted: number; skippedDuplicates: number; total: number } = await ctx.runMutation(
      api.sourceDiscovery.saveRecommendations,
      {
        assignmentId: args.assignmentId,
        gapAnalysisRunId: args.gapAnalysisRunId,
        recommendations: deduped.map((r) => ({
          catalog: r.catalog,
          catalogId: r.catalogId,
          title: r.title,
          authors: r.authors,
          year: r.year,
          venue: r.venue,
          doi: r.doi,
          url: r.url,
          abstract: r.abstract,
          matchReason: r.matchReason,
          raw: r.raw,
        })),
      },
    );

    await ctx.runMutation(internal.ai_keys.internalLogUsage, {
      tokenIdentifier: identity.tokenIdentifier,
      provider: "source_discovery",
      type: "source_discovery",
      tokensIn: 0,
      tokensOut: 0,
      metadata: {
        terms: searchTerms.length,
        found: deduped.length,
        saved: saveResult.inserted,
      },
    });

    return {
      success: true,
      reason: null as string | null,
      saved: saveResult.inserted,
      duplicates: saveResult.skippedDuplicates,
      searched: searchTerms.length,
      catalogs: enabledCatalogs,
    };
  },
});
