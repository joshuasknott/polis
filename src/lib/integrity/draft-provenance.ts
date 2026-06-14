import type {
  ProvenanceLabel,
  ProvenanceWarning,
  ProvenanceWarningCode,
  DraftSegment,
} from "../types";

export interface ProvenanceLabelMeta {
  label: ProvenanceLabel;
  display: string;
  shortDisplay: string;
  description: string;
  requiresSource: boolean;
  requiresQuote: boolean;
  badgeClass: string;
  dotClass: string;
  textClass: string;
  borderClass: string;
  bgClass: string;
  severity: "info" | "warning" | "critical";
}

export const PROVENANCE_LABEL_META: Record<ProvenanceLabel, ProvenanceLabelMeta> = {
  quoted: {
    label: "quoted",
    display: "Direct quote",
    shortDisplay: "Quote",
    description:
      "Verbatim text from an uploaded source. Requires a real source and chunk reference.",
    requiresSource: true,
    requiresQuote: true,
    badgeClass:
      "bg-source/10 text-source border-source/30",
    dotClass: "bg-source",
    textClass: "text-source",
    borderClass: "border-source/40",
    bgClass: "bg-source/[0.04]",
    severity: "info",
  },
  paraphrased: {
    label: "paraphrased",
    display: "Paraphrased",
    shortDisplay: "Paraphrase",
    description:
      "A reworded passage drawn from an uploaded source. Requires a real source reference.",
    requiresSource: true,
    requiresQuote: false,
    badgeClass:
      "bg-interpretation/10 text-interpretation border-interpretation/30",
    dotClass: "bg-interpretation",
    textClass: "text-interpretation",
    borderClass: "border-interpretation/40",
    bgClass: "bg-interpretation/[0.04]",
    severity: "info",
  },
  source_supported: {
    label: "source_supported",
    display: "Source-supported",
    shortDisplay: "Supported",
    description:
      "A claim directly backed by text in an uploaded source. Requires a real source reference.",
    requiresSource: true,
    requiresQuote: false,
    badgeClass:
      "bg-success/10 text-success border-success/30",
    dotClass: "bg-success",
    textClass: "text-success",
    borderClass: "border-success/40",
    bgClass: "bg-success/[0.04]",
    severity: "info",
  },
  interpretation: {
    label: "interpretation",
    display: "Interpretation",
    shortDisplay: "Interpretation",
    description:
      "Your reading of a source. Plausible, but not directly stated. Should still reference the source.",
    requiresSource: false,
    requiresQuote: false,
    badgeClass:
      "bg-accent/10 text-accent border-accent/30",
    dotClass: "bg-accent",
    textClass: "text-accent",
    borderClass: "border-accent/40",
    bgClass: "bg-accent/[0.04]",
    severity: "info",
  },
  generated: {
    label: "generated",
    display: "AI-generated",
    shortDisplay: "AI",
    description:
      "Drafted by Polis and accepted into your work. Must be checked for accuracy before submission.",
    requiresSource: false,
    requiresQuote: false,
    badgeClass:
      "bg-warning/10 text-warning border-warning/30",
    dotClass: "bg-warning",
    textClass: "text-warning",
    borderClass: "border-warning/40",
    bgClass: "bg-warning/[0.04]",
    severity: "warning",
  },
  unsupported: {
    label: "unsupported",
    display: "Unsupported",
    shortDisplay: "Unsupported",
    description:
      "Not backed by any source in your current source base. Add evidence or rephrase as interpretation.",
    requiresSource: false,
    requiresQuote: false,
    badgeClass:
      "bg-danger/10 text-danger border-danger/30",
    dotClass: "bg-danger",
    textClass: "text-danger",
    borderClass: "border-danger/40",
    bgClass: "bg-danger/[0.04]",
    severity: "critical",
  },
};

export const PROVENANCE_LABEL_ORDER: ProvenanceLabel[] = [
  "quoted",
  "paraphrased",
  "source_supported",
  "interpretation",
  "generated",
  "unsupported",
];

export const HARD_TRUTH_RULES = [
  "Never generate fake citations, authors, page numbers, or source claims.",
  "Never present invented text as a direct quote from a source.",
  "Never label text source_supported unless it traces to a real retrieved chunk.",
  "Never treat a catalog recommendation as uploaded evidence.",
  "Never silently convert unsupported text into source_supported.",
] as const;

export interface WarningContext {
  selectedSourceIds: string[];
  sourceIdsInModule: string[];
  chunksBySourceId: Map<string, { pageStart: number | null; pageEnd: number | null }[]>;
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
      if (!Number.isNaN(num)) pages.push(num);
    }
  }
  return pages;
}

export function computeSegmentWarnings(
  segment: DraftSegment,
  context: WarningContext,
): ProvenanceWarning[] {
  const warnings: ProvenanceWarning[] = [];
  const label = segment.label;
  const hasContent = segment.content.trim().length > 0;
  if (!hasContent || !label) return warnings;

  const meta = PROVENANCE_LABEL_META[label];

  if (label === "unsupported") {
    warnings.push({
      code: "UNSUPPORTED_CLAIM",
      severity: "warning",
      message:
        "This claim is not backed by any source in your current source base. Add supporting evidence or rephrase as acknowledged interpretation.",
    });
    return warnings;
  }

  if (label === "generated") {
    warnings.push({
      code: "UNSUPPORTED_CLAIM",
      severity: "info",
      message:
        "This passage was drafted by Polis. Verify it against your sources before submitting and rewrite in your own voice.",
    });
  }

  if (meta.requiresSource && !segment.sourceId) {
    warnings.push({
      code: "LABEL_REF_MISMATCH",
      severity: "warning",
      message: `Labelled as ${meta.display.toLowerCase()} but no source is attached. Attach a real uploaded source or change the label.`,
    });
    return warnings;
  }

  if (
    segment.sourceId &&
    !context.sourceIdsInModule.includes(segment.sourceId)
  ) {
    warnings.push({
      code: "POSSIBLE_MISATTRIBUTION",
      severity: "critical",
      message:
        "The attached source could not be found in this module. The reference may be invalid.",
    });
  }

  if (
    segment.sourceId &&
    context.selectedSourceIds.length > 0 &&
    !context.selectedSourceIds.includes(segment.sourceId)
  ) {
    warnings.push({
      code: "SOURCE_NOT_IN_ASSESSMENT",
      severity: "warning",
      message:
        "This source is part of your module but not selected for this assessment. Add it to the assignment source base, or remove the citation.",
    });
  }

  if (label === "quoted" && (!segment.quote || segment.quote.trim().length === 0)) {
    warnings.push({
      code: "MISSING_QUOTE_FOR_QUOTED_LABEL",
      severity: "warning",
      message:
        "Quoted passages must include the verbatim source text. Add the exact wording or relabel as paraphrased.",
    });
  }

  if (meta.requiresSource && segment.sourceChunkId && segment.sourceId) {
    const chunks = context.chunksBySourceId.get(segment.sourceId) ?? [];
    if (chunks.length === 0) {
      warnings.push({
        code: "MISSING_PAGE_METADATA",
        severity: "info",
        message:
          "This source has no extracted page metadata. Page references cannot be verified and should be omitted unless you confirm them manually.",
      });
    } else if (segment.pageRange && segment.pageRange.trim().length > 0) {
      const pages = parsePageRange(segment.pageRange);
      const inRange = pages.some((p) =>
        chunks.some(
          (c) =>
            c.pageStart !== null &&
            p >= (c.pageStart as number) &&
            p <= ((c.pageEnd as number | null) ?? (c.pageStart as number)),
        ),
      );
      if (pages.length > 0 && !inRange) {
        warnings.push({
          code: "PAGE_OUTSIDE_CHUNK_RANGE",
          severity: "warning",
          message: `Page reference "${segment.pageRange}" could not be confirmed against the extracted source text. Verify it manually or remove it.`,
        });
      }
    }
  }

  return warnings;
}

export function summarizeWarnings(
  segments: DraftSegment[],
  context: WarningContext,
): {
  bySeverity: { info: number; warning: number; critical: number };
  topWarnings: ProvenanceWarning[];
  labelCounts: Record<ProvenanceLabel, number>;
} {
  const bySeverity = { info: 0, warning: 0, critical: 0 };
  const labelCounts: Record<ProvenanceLabel, number> = {
    quoted: 0,
    paraphrased: 0,
    source_supported: 0,
    interpretation: 0,
    generated: 0,
    unsupported: 0,
  };
  const allWarnings: ProvenanceWarning[] = [];

  for (const segment of segments) {
    if (segment.label) {
      labelCounts[segment.label] += 1;
    }
    const segmentWarnings = computeSegmentWarnings(segment, context);
    for (const w of segmentWarnings) {
      bySeverity[w.severity] += 1;
      allWarnings.push(w);
    }
  }

  const priorityRank: Record<ProvenanceWarningCode, number> = {
    FAKE_CITATION_REJECTED: 0,
    POSSIBLE_MISATTRIBUTION: 1,
    LABEL_REF_MISMATCH: 2,
    MISSING_QUOTE_FOR_QUOTED_LABEL: 3,
    SOURCE_NOT_IN_ASSESSMENT: 4,
    PAGE_OUTSIDE_CHUNK_RANGE: 5,
    UNSUPPORTED_CLAIM: 6,
    WEAK_EVIDENCE: 7,
    CITATION_MISMATCH: 8,
    MISSING_PAGE_METADATA: 9,
    CATALOG_RECOMMENDATION_AS_EVIDENCE: 10,
  };

  const deduped = new Map<string, ProvenanceWarning>();
  for (const w of allWarnings) {
    const existing = deduped.get(w.code);
    if (!existing || priorityRank[w.code] < priorityRank[existing.code]) {
      deduped.set(w.code, w);
    }
  }

  const topWarnings = Array.from(deduped.values())
    .sort((a, b) => priorityRank[a.code] - priorityRank[b.code])
    .slice(0, 6);

  return { bySeverity, topWarnings, labelCounts };
}

export function isLabelAvailableForSource(
  label: ProvenanceLabel,
  hasSource: boolean,
): boolean {
  const meta = PROVENANCE_LABEL_META[label];
  if (meta.requiresSource && !hasSource) return false;
  return true;
}

export function studentResponsibilityNote(): string {
  return "You remain fully responsible for your submitted work. Polis supports your thinking and surfaces risks — it does not write the submission for you.";
}
