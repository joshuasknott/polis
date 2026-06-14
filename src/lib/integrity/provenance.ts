import {
  crossModuleChunkRejection,
  type ChunkMeta,
  type SourceMeta,
} from "./citation-validator";

export const PROVENANCE_LABELS = [
  "quoted",
  "paraphrased",
  "source_supported",
  "interpretation",
  "generated",
  "unsupported",
] as const;

export type ProvenanceLabel = (typeof PROVENANCE_LABELS)[number];

export const SOURCE_BACKED_LABELS: ReadonlySet<ProvenanceLabel> = new Set([
  "quoted",
  "paraphrased",
  "source_supported",
  "interpretation",
]);

export const NON_SOURCE_LABELS: ReadonlySet<ProvenanceLabel> = new Set([
  "generated",
  "unsupported",
]);

export const PROVENANCE_LABEL_META: Record<
  ProvenanceLabel,
  {
    display: string;
    description: string;
    requiresSource: boolean;
    requiresChunk: boolean;
    requiresQuote: boolean;
    forbidsSource: boolean;
  }
> = {
  quoted: {
    display: "Quoted",
    description:
      "Verbatim text quoted directly from an uploaded source. Requires a source, chunk, and exact quote.",
    requiresSource: true,
    requiresChunk: true,
    requiresQuote: true,
    forbidsSource: false,
  },
  paraphrased: {
    display: "Paraphrased",
    description:
      "Source material restated in the student's words. Requires a source and a chunk reference.",
    requiresSource: true,
    requiresChunk: true,
    requiresQuote: false,
    forbidsSource: false,
  },
  source_supported: {
    display: "Source-Supported",
    description:
      "Backed by uploaded source material at a general level. Requires a source reference.",
    requiresSource: true,
    requiresChunk: false,
    requiresQuote: false,
    forbidsSource: false,
  },
  interpretation: {
    display: "Interpretation",
    description:
      "A reading of a source — plausible but not explicit. Must still reference the source.",
    requiresSource: true,
    requiresChunk: false,
    requiresQuote: false,
    forbidsSource: false,
  },
  generated: {
    display: "Generated",
    description:
      "AI-generated text not drawn from any uploaded source. Must not reference a source.",
    requiresSource: false,
    requiresChunk: false,
    requiresQuote: false,
    forbidsSource: true,
  },
  unsupported: {
    display: "Unsupported",
    description:
      "No evidence found in the current source base. Must not reference a source.",
    requiresSource: false,
    requiresChunk: false,
    requiresQuote: false,
    forbidsSource: true,
  },
};

export function isProvenanceLabel(value: string): value is ProvenanceLabel {
  return (PROVENANCE_LABELS as readonly string[]).includes(value);
}

export function labelRequiresSource(label: ProvenanceLabel): boolean {
  return PROVENANCE_LABEL_META[label].requiresSource;
}

export function labelRequiresChunk(label: ProvenanceLabel): boolean {
  return PROVENANCE_LABEL_META[label].requiresChunk;
}

export function labelForbidsSource(label: ProvenanceLabel): boolean {
  return PROVENANCE_LABEL_META[label].forbidsSource;
}

export type ProvenanceWarningSeverity = "info" | "warning" | "critical";

export type ProvenanceWarningCode =
  | "UNSUPPORTED_CLAIM"
  | "WEAK_EVIDENCE"
  | "CITATION_MISMATCH"
  | "POSSIBLE_MISATTRIBUTION"
  | "SOURCE_NOT_IN_ASSESSMENT"
  | "MISSING_PAGE_METADATA"
  | "CATALOG_RECOMMENDATION_AS_EVIDENCE"
  | "LABEL_REF_MISMATCH"
  | "MISSING_QUOTE_FOR_QUOTED_LABEL"
  | "PAGE_OUTSIDE_CHUNK_RANGE"
  | "FAKE_CITATION_REJECTED";

export interface ProvenanceWarning {
  code: ProvenanceWarningCode;
  severity: ProvenanceWarningSeverity;
  message: string;
}

export type EvidenceStrength = "strong" | "moderate" | "weak";

export interface ClaimProvenanceInput {
  claimText: string;
  label: ProvenanceLabel;
  sourceId?: string | null;
  sourceChunkId?: string | null;
  quote?: string | null;
  claimedPageStart?: number | null;
  claimedPageEnd?: number | null;
  isCatalogRecommendation?: boolean;
  evidenceStrength?: EvidenceStrength | null;
}

export interface ProvenanceValidationContext {
  chunk: ChunkMeta | null;
  source: SourceMeta | null;
  currentUserId: string;
  moduleId: string | null;
  assignmentSourceIds: string[];
}

export interface ProvenanceValidationResult {
  valid: boolean;
  warnings: ProvenanceWarning[];
  effectiveLabel: ProvenanceLabel;
  rejectedCitation: boolean;
}

function downgradeToUnsupported(label: ProvenanceLabel): ProvenanceLabel {
  if (SOURCE_BACKED_LABELS.has(label)) return "unsupported";
  return label;
}

function includesVerbatim(haystack: string, needle: string): boolean {
  if (needle.length === 0) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase().trim());
}

export function validateProvenanceClaim(
  claim: ClaimProvenanceInput,
  context: ProvenanceValidationContext,
): ProvenanceValidationResult {
  const warnings: ProvenanceWarning[] = [];
  let effectiveLabel = claim.label;
  let rejectedCitation = false;

  if (claim.isCatalogRecommendation && SOURCE_BACKED_LABELS.has(effectiveLabel)) {
    warnings.push({
      code: "CATALOG_RECOMMENDATION_AS_EVIDENCE",
      severity: "critical",
      message:
        "This source is a catalog recommendation, not an uploaded file with extracted text. Catalog recommendations cannot serve as evidence. The claim has been downgraded to 'unsupported'.",
    });
    effectiveLabel = "unsupported";
  }

  if (labelRequiresSource(effectiveLabel) && !claim.sourceId) {
    warnings.push({
      code: "LABEL_REF_MISMATCH",
      severity: "critical",
      message: `Label '${effectiveLabel}' requires a source reference but no sourceId was supplied. Claim downgraded to 'unsupported'.`,
    });
    effectiveLabel = "unsupported";
  }

  if (
    labelForbidsSource(effectiveLabel) &&
    claim.sourceId
  ) {
    warnings.push({
      code: "LABEL_REF_MISMATCH",
      severity: "warning",
      message: `Label '${effectiveLabel}' must not reference a source. The source reference will be ignored.`,
    });
  }

  if (
    labelRequiresChunk(effectiveLabel) &&
    claim.sourceId &&
    !claim.sourceChunkId
  ) {
    warnings.push({
      code: "LABEL_REF_MISMATCH",
      severity: "warning",
      message: `Label '${effectiveLabel}' should reference a specific source chunk for traceability.`,
    });
  }

  if (effectiveLabel === "quoted" && !claim.quote) {
    warnings.push({
      code: "MISSING_QUOTE_FOR_QUOTED_LABEL",
      severity: "warning",
      message: `Label 'quoted' requires a verbatim quote string but none was supplied.`,
    });
  }

  const sourceClaimed = !!claim.sourceId;
  const sourceLoaded = !!context.source;
  const chunkClaimed = !!claim.sourceChunkId;
  const chunkLoaded = !!context.chunk;

  if (sourceClaimed && !sourceLoaded) {
    warnings.push({
      code: "FAKE_CITATION_REJECTED",
      severity: "critical",
      message:
        "The cited source does not exist in the database. This citation cannot be verified and has been rejected. The claim has been downgraded to 'unsupported'.",
    });
    effectiveLabel = downgradeToUnsupported(effectiveLabel);
    rejectedCitation = true;
  }

  if (chunkClaimed && !chunkLoaded) {
    warnings.push({
      code: "FAKE_CITATION_REJECTED",
      severity: "critical",
      message:
        "The cited source chunk does not exist in the database. This citation cannot be verified and has been rejected. The claim has been downgraded to 'unsupported'.",
    });
    effectiveLabel = downgradeToUnsupported(effectiveLabel);
    rejectedCitation = true;
  }

  if (
    sourceLoaded &&
    chunkLoaded &&
    claim.sourceId &&
    claim.sourceChunkId &&
    context.chunk!.sourceId !== claim.sourceId
  ) {
    warnings.push({
      code: "CITATION_MISMATCH",
      severity: "critical",
      message: `The cited chunk does not belong to the claimed source. The claim cannot be treated as source-backed and has been downgraded to 'unsupported'.`,
    });
    effectiveLabel = downgradeToUnsupported(effectiveLabel);
    rejectedCitation = true;
  }

  if (
    sourceLoaded &&
    claim.sourceId &&
    context.source!.tokenIdentifier !== context.currentUserId
  ) {
    warnings.push({
      code: "CITATION_MISMATCH",
      severity: "critical",
      message: `The cited source does not belong to the current user. Cross-user citation is not permitted.`,
    });
    effectiveLabel = downgradeToUnsupported(effectiveLabel);
    rejectedCitation = true;
  }

  if (sourceLoaded && context.moduleId && claim.sourceId) {
    const cross = crossModuleChunkRejection(
      context.source!.moduleId,
      context.moduleId,
    );
    if (cross && cross.severity === "error") {
      warnings.push({
        code: "CITATION_MISMATCH",
        severity: "critical",
        message: cross.message,
      });
      effectiveLabel = downgradeToUnsupported(effectiveLabel);
      rejectedCitation = true;
    }
  }

  if (
    sourceLoaded &&
    claim.sourceId &&
    context.assignmentSourceIds.length > 0 &&
    !context.assignmentSourceIds.includes(claim.sourceId)
  ) {
    warnings.push({
      code: "SOURCE_NOT_IN_ASSESSMENT",
      severity: "warning",
      message: `The cited source is not in the assignment's selected sources. Consider adding it to the assessment source list.`,
    });
  }

  const claimedPageStart = claim.claimedPageStart ?? null;
  const claimedPageEnd = claim.claimedPageEnd ?? null;
  const chunkHasPages =
    !!context.chunk && (context.chunk.pageStart != null || context.chunk.pageEnd != null);

  if (claimedPageStart != null && !chunkHasPages) {
    warnings.push({
      code: "MISSING_PAGE_METADATA",
      severity: "warning",
      message: `Page ${claimedPageStart} was claimed but the source chunk has no page metadata. Page references must not be invented.`,
    });
  }

  if (
    claimedPageStart != null &&
    chunkHasPages &&
    context.chunk &&
    context.chunk.pageStart != null
  ) {
    const start = context.chunk.pageStart;
    const end = context.chunk.pageEnd ?? start;
    if (claimedPageStart < start || claimedPageStart > end) {
      warnings.push({
        code: "PAGE_OUTSIDE_CHUNK_RANGE",
        severity: "warning",
        message: `Claimed page ${claimedPageStart} falls outside the chunk's page range (${start}–${end}). Verify the page reference.`,
      });
    }
    if (claimedPageEnd != null && claimedPageEnd < claimedPageStart) {
      warnings.push({
        code: "PAGE_OUTSIDE_CHUNK_RANGE",
        severity: "warning",
        message: `Claimed page range ${claimedPageStart}–${claimedPageEnd} is invalid (end before start).`,
      });
    }
  }

  if (
    SOURCE_BACKED_LABELS.has(effectiveLabel) &&
    effectiveLabel === "quoted" &&
    claim.quote &&
    context.chunk
  ) {
    if (!includesVerbatim(context.chunk.text, claim.quote)) {
      warnings.push({
        code: "POSSIBLE_MISATTRIBUTION",
        severity: "warning",
        message: `The quoted text could not be located verbatim in the cited chunk. Verify the attribution or relabel as 'paraphrased' or 'interpretation'.`,
      });
    }
  }

  if (
    SOURCE_BACKED_LABELS.has(effectiveLabel) &&
    claim.evidenceStrength === "weak"
  ) {
    warnings.push({
      code: "WEAK_EVIDENCE",
      severity: "info",
      message: `The linked evidence is marked as 'weak'. Consider finding stronger source support or acknowledge the limitation.`,
    });
  }

  if (effectiveLabel === "unsupported") {
    warnings.push({
      code: "UNSUPPORTED_CLAIM",
      severity: "warning",
      message: `This claim is unsupported by uploaded sources. Add evidence or label it explicitly as the student's own idea.`,
    });
  }

  const valid =
    !rejectedCitation &&
    effectiveLabel === claim.label;

  return {
    valid,
    warnings,
    effectiveLabel,
    rejectedCitation,
  };
}

export interface ProvenanceSummary {
  total: number;
  byLabel: Record<ProvenanceLabel, number>;
  byEffectiveLabel: Record<ProvenanceLabel, number>;
  rejectedCitations: number;
  totalWarnings: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  warningCountsByCode: Record<string, number>;
  topIssues: ProvenanceWarning[];
}

export function emptyLabelCounts(): Record<ProvenanceLabel, number> {
  return {
    quoted: 0,
    paraphrased: 0,
    source_supported: 0,
    interpretation: 0,
    generated: 0,
    unsupported: 0,
  };
}

export function summarizeProvenance(
  results: ProvenanceValidationResult[],
  originalLabels: ProvenanceLabel[] = [],
): ProvenanceSummary {
  const byLabel = emptyLabelCounts();
  const byEffectiveLabel = emptyLabelCounts();
  const warningCountsByCode: Record<string, number> = {};
  let rejectedCitations = 0;
  let totalWarnings = 0;
  let criticalCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  const topIssues: ProvenanceWarning[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const original = originalLabels[i] ?? r.effectiveLabel;
    byLabel[original]++;
    byEffectiveLabel[r.effectiveLabel]++;
    if (r.rejectedCitation) rejectedCitations++;
    for (const w of r.warnings) {
      totalWarnings++;
      warningCountsByCode[w.code] = (warningCountsByCode[w.code] ?? 0) + 1;
      if (w.severity === "critical") criticalCount++;
      else if (w.severity === "warning") warningCount++;
      else infoCount++;
      topIssues.push(w);
    }
  }

  return {
    total: results.length,
    byLabel,
    byEffectiveLabel,
    rejectedCitations,
    totalWarnings,
    criticalCount,
    warningCount,
    infoCount,
    warningCountsByCode,
    topIssues,
  };
}

export function renderProvenanceSummary(summary: ProvenanceSummary): string {
  if (summary.total === 0) {
    return "No provenance records to review.";
  }
  const eff = summary.byEffectiveLabel;
  const parts: string[] = [];
  if (eff.quoted > 0) parts.push(`${eff.quoted} quoted`);
  if (eff.paraphrased > 0) parts.push(`${eff.paraphrased} paraphrased`);
  if (eff.source_supported > 0) parts.push(`${eff.source_supported} source-supported`);
  if (eff.interpretation > 0) parts.push(`${eff.interpretation} interpretation`);
  if (eff.generated > 0) parts.push(`${eff.generated} generated`);
  if (eff.unsupported > 0) parts.push(`${eff.unsupported} unsupported`);

  const lines: string[] = [];
  lines.push(
    `Provenance review: ${summary.total} claim${summary.total === 1 ? "" : "s"} checked — ${parts.join(", ")}.`,
  );
  if (summary.rejectedCitations > 0) {
    lines.push(
      `${summary.rejectedCitations} citation${summary.rejectedCitations === 1 ? "" : "s"} rejected as unverifiable.`,
    );
  }
  if (summary.criticalCount > 0) {
    lines.push(`${summary.criticalCount} critical issue${summary.criticalCount === 1 ? "" : "s"}.`);
  }
  if (summary.warningCount > 0) {
    lines.push(`${summary.warningCount} warning${summary.warningCount === 1 ? "" : "s"}.`);
  }
  if (summary.infoCount > 0) {
    lines.push(`${summary.infoCount} informational note${summary.infoCount === 1 ? "" : "s"}.`);
  }
  if (
    summary.rejectedCitations === 0 &&
    summary.criticalCount === 0 &&
    summary.warningCount === 0 &&
    summary.infoCount === 0
  ) {
    lines.push("All claims validated cleanly.");
  }
  return lines.join(" ");
}
