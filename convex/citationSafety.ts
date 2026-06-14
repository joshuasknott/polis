import { query, action } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";
import { api } from "./_generated/api";
import type {
  ProvenanceWarning,
  ProvenanceLabel,
} from "../src/lib/integrity/provenance";
import {
  summarizeProvenance,
  renderProvenanceSummary,
  validateProvenanceClaim,
  type ClaimProvenanceInput,
  type ProvenanceValidationContext,
} from "../src/lib/integrity/provenance";

export const getCitationContext = query({
  args: {
    assignmentId: v.id("assignments"),
    draftId: v.id("drafts"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier)
      return null;

    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) return null;
    if (draft.assignmentId !== args.assignmentId) return null;

    const argsList = await ctx.db
      .query("arguments")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("asc")
      .take(100);

    const evidence: Doc<"evidenceLinks">[] = [];
    for (const arg of argsList) {
      const links = await ctx.db
        .query("evidenceLinks")
        .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
        .take(100);
      evidence.push(...links);
    }

    const sourceIds = new Set(evidence.map((ev) => ev.sourceId));
    const chunks: Doc<"sourceChunks">[] = [];
    for (const sourceId of sourceIds) {
      const sourceChunks = await ctx.db
        .query("sourceChunks")
        .withIndex("by_source", (q) => q.eq("sourceId", sourceId))
        .order("asc")
        .take(500);
      chunks.push(...sourceChunks);
    }

    const sourceLinks = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(200);

    const sources: Doc<"sources">[] = [];
    for (const link of sourceLinks) {
      const source = await ctx.db.get(link.sourceId);
      if (source) sources.push(source);
    }

    const provenanceRecords = await ctx.db
      .query("claimProvenance")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .take(500);

    return {
      draft,
      evidence,
      chunks,
      sources,
      assignmentSourceIds: sources.map((s) => s._id as string),
      assignmentModuleId: assignment.moduleId,
      provenanceRecords,
    };
  },
});

interface CitationFinding {
  category: string;
  content: string;
  severity: string;
}

function verifyCitations(context: {
  draft: Doc<"drafts">;
  evidence: Doc<"evidenceLinks">[];
  chunks: Doc<"sourceChunks">[];
  sources: Doc<"sources">[];
  assignmentSourceIds?: string[];
  assignmentModuleId?: string;
  provenanceRecords?: Doc<"claimProvenance">[];
}): {
  findings: CitationFinding[];
  summary: string;
  provenanceSummary: string;
} {
  const { evidence, chunks, sources } = context;
  const findings: CitationFinding[] = [];
  const chunksBySource = new Map<string, Doc<"sourceChunks">[]>();
  for (const chunk of chunks) {
    const key = chunk.sourceId as string;
    if (!chunksBySource.has(key)) chunksBySource.set(key, []);
    chunksBySource.get(key)!.push(chunk);
  }

  const sourceTitles = new Map(
    sources.map((s) => [s._id as string, s.title]),
  );

  const verifiedQuotes: string[] = [];
  const unverifiedQuotes: string[] = [];

  for (const link of evidence) {
    if (!link.quote || link.quote.trim().length === 0) continue;

    const sourceChunks = chunksBySource.get(link.sourceId as string) ?? [];
    const quoteText = link.quote.trim().toLowerCase();
    const sourceTitle =
      sourceTitles.get(link.sourceId as string) ?? "Unknown source";

    if (sourceChunks.length === 0) {
      findings.push({
        category: "unsupported_claim",
        content: `Quote from "${sourceTitle}" cannot be verified \u2014 no extracted text chunks available for this source. Verify manually against the original.`,
        severity: "info",
      });
      unverifiedQuotes.push(link._id as string);
      continue;
    }

    const found = sourceChunks.some(
      (chunk) => chunk.text.toLowerCase().includes(quoteText),
    );

    if (found) {
      verifiedQuotes.push(link._id as string);
    } else {
      const partialMatch = sourceChunks.some((chunk) => {
        const chunkWords = chunk.text.toLowerCase().split(/\s+/);
        const quoteWords = quoteText.split(/\s+/);
        if (quoteWords.length < 4) return false;
        const overlap = quoteWords.filter((w) => chunkWords.includes(w));
        return overlap.length / quoteWords.length >= 0.7;
      });

      if (partialMatch) {
        findings.push({
          category: "unsupported_claim",
          content: `Quote from "${sourceTitle}" may be a paraphrase rather than an exact match. Verify the wording against the original source. This is labelled as [Interpretation].`,
          severity: "info",
        });
      } else {
        findings.push({
          category: "unsupported_claim",
          content: `Quote from "${sourceTitle}" could not be located in the extracted source text: "${link.quote.substring(0, 80)}${link.quote.length > 80 ? "\u2026" : ""}". Verify this reference manually.`,
          severity: "warning",
        });
        unverifiedQuotes.push(link._id as string);
      }
    }
  }

  for (const link of evidence) {
    if (!link.pageRange || link.pageRange.trim().length === 0) continue;

    const sourceChunks = chunksBySource.get(link.sourceId as string) ?? [];
    const sourceTitle =
      sourceTitles.get(link.sourceId as string) ?? "Unknown source";

    if (sourceChunks.length === 0) continue;

    const pages = parsePageRange(link.pageRange);
    if (pages.length === 0) continue;

    const pageFound = sourceChunks.some(
      (chunk) =>
        chunk.pageStart !== undefined &&
        chunk.pageEnd !== undefined &&
        pages.some((p) => p >= chunk.pageStart! && p <= chunk.pageEnd!),
    );

    if (!pageFound) {
      findings.push({
        category: "unsupported_claim",
        content: `Page reference "${link.pageRange}" for "${sourceTitle}" could not be confirmed in the extracted text. The source may not have page-level extraction. Verify manually.`,
        severity: "info",
      });
    }
  }

  const usedSourceIds = new Set(evidence.map((ev) => ev.sourceId as string));
  for (const source of sources) {
    if (!usedSourceIds.has(source._id as string)) {
      findings.push({
        category: "missing_evidence",
        content: `"${source.title}" is selected but has no evidence links. Either cite this source or remove it from the assignment.`,
        severity: "info",
      });
    }
  }

  const evidenceWithoutSource = evidence.filter(
    (ev) => !sources.some((s) => s._id === ev.sourceId),
  );
  for (let i = 0; i < evidenceWithoutSource.length; i++) {
    findings.push({
      category: "unsupported_claim",
      content: `Evidence link references a source not in the assignment selection. This citation may be invalid.`,
      severity: "warning",
    });
  }

  const totalChecked = verifiedQuotes.length + unverifiedQuotes.length;
  const summary =
    totalChecked === 0
      ? "No quoted evidence to verify. Ensure all direct quotes are linked through the evidence bank."
      : `Citation safety check: ${verifiedQuotes.length} of ${totalChecked} quote${totalChecked !== 1 ? "s" : ""} verified${unverifiedQuotes.length > 0 ? `, ${unverifiedQuotes.length} require manual verification` : ""}.`;

  const provenance = summariseProvenanceRecords(context);

  return {
    findings: [...findings, ...provenance.findings],
    summary,
    provenanceSummary: provenance.summary,
  };
}

interface ProvenanceSummaryResult {
  findings: CitationFinding[];
  summary: string;
}

function summariseProvenanceRecords(context: {
  draft: Doc<"drafts">;
  evidence: Doc<"evidenceLinks">[];
  chunks: Doc<"sourceChunks">[];
  sources: Doc<"sources">[];
  assignmentSourceIds?: string[];
  assignmentModuleId?: string;
  provenanceRecords?: Doc<"claimProvenance">[];
}): ProvenanceSummaryResult {
  const records = context.provenanceRecords ?? [];
  if (records.length === 0) {
    return {
      findings: [],
      summary: "No provenance records attached to this draft.",
    };
  }

  const chunksById = new Map<string, Doc<"sourceChunks">>(
    context.chunks.map((c) => [c._id as string, c]),
  );
  const sourcesById = new Map<string, Doc<"sources">>(
    context.sources.map((s) => [s._id as string, s]),
  );

  const validationResults = records.map((r) => {
    const chunkId = r.sourceChunkId ?? null;
    const sourceId = r.sourceId ?? null;
    const chunk = chunkId ? (chunksById.get(chunkId as string) ?? null) : null;
    const source = sourceId
      ? (sourcesById.get(sourceId as string) ?? null)
      : null;

    const claim: ClaimProvenanceInput = {
      claimText: r.claimText,
      label: r.label as ProvenanceLabel,
      sourceId: sourceId ?? null,
      sourceChunkId: chunkId ?? null,
      quote: r.quote ?? null,
      claimedPageStart: r.claimedPageStart ?? null,
      claimedPageEnd: r.claimedPageEnd ?? null,
      isCatalogRecommendation: r.isCatalogRecommendation ?? false,
      evidenceStrength: (r.evidenceStrength ?? null) as
        | "strong"
        | "moderate"
        | "weak"
        | null,
    };

    const validationContext: ProvenanceValidationContext = {
      chunk: chunk
        ? {
            _id: chunk._id as string,
            sourceId: chunk.sourceId as string,
            pageStart: chunk.pageStart ?? null,
            pageEnd: chunk.pageEnd ?? null,
            text: chunk.text,
          }
        : null,
      source: source
        ? {
            _id: source._id as string,
            tokenIdentifier: source.tokenIdentifier,
            moduleId: source.moduleId as string,
            authors: source.authors ?? null,
            year: source.year ?? null,
            title: source.title,
          }
        : null,
      currentUserId: context.draft.tokenIdentifier,
      moduleId: context.assignmentModuleId ?? null,
      assignmentSourceIds: context.assignmentSourceIds ?? [],
    };

    return validateProvenanceClaim(claim, validationContext);
  });

  const originalLabels = records.map((r) => r.label as ProvenanceLabel);
  const summaryObj = summarizeProvenance(validationResults, originalLabels);
  const summary = renderProvenanceSummary(summaryObj);

  const findings: CitationFinding[] = [];
  const seenCodes = new Set<string>();
  for (const record of records) {
    const stored = (record.validationWarnings ?? []) as ProvenanceWarning[];
    for (const w of stored) {
      if (w.severity === "critical") {
        const key = `${w.code}:${record._id}`;
        if (seenCodes.has(key)) continue;
        seenCodes.add(key);
        const preview =
          record.claimText.length > 80
            ? record.claimText.slice(0, 77) + "\u2026"
            : record.claimText;
        findings.push({
          category: "citation_safety",
          content: `[${w.code}] ${w.message} (claim: "${preview}")`,
          severity: "warning",
        });
      }
    }
  }

  for (const code of [
    "FAKE_CITATION_REJECTED",
    "CITATION_MISMATCH",
    "POSSIBLE_MISATTRIBUTION",
    "CATALOG_RECOMMENDATION_AS_EVIDENCE",
    "MISSING_PAGE_METADATA",
    "SOURCE_NOT_IN_ASSESSMENT",
    "WEAK_EVIDENCE",
    "UNSUPPORTED_CLAIM",
  ] as const) {
    const count = summaryObj.warningCountsByCode[code] ?? 0;
    if (count === 0) continue;
    if (findings.some((f) => f.content.startsWith(`[${code}]`))) continue;
    findings.push({
      category: "citation_safety",
      content: `${count} "${code}" warning${count === 1 ? "" : "s"} across provenance records.`,
      severity: code === "FAKE_CITATION_REJECTED" ? "warning" : "info",
    });
  }

  return { findings, summary };
}

function parsePageRange(pageRange: string): number[] {
  const pages: number[] = [];
  const parts = pageRange.split(/[,\s]+/);
  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i++) pages.push(i);
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num)) pages.push(num);
    }
  }
  return pages;
}

export const runCitationSafetyCheck = action({
  args: {
    assignmentId: v.id("assignments"),
    draftId: v.id("drafts"),
  },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery(api.citationSafety.getCitationContext, {
      assignmentId: args.assignmentId,
      draftId: args.draftId,
    });
    if (!context) throw new Error("Citation context not found");

    const result = verifyCitations(context);

    const overallFeedback = result.provenanceSummary
      ? `${result.summary} ${result.provenanceSummary}`
      : result.summary;

    const runId: Id<"reviewRuns"> = await ctx.runMutation(
      api.reviews.createRunWithFindings,
      {
        draftId: args.draftId,
        overallFeedback,
        rubricAlignment: "",
        findings: result.findings,
      },
    );

    return {
      runId,
      summary: overallFeedback,
      provenanceSummary: result.provenanceSummary,
    };
  },
});
