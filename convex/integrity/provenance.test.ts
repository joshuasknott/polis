import { describe, it, expect } from "vitest";
import {
  PROVENANCE_LABELS,
  SOURCE_BACKED_LABELS,
  NON_SOURCE_LABELS,
  PROVENANCE_LABEL_META,
  isProvenanceLabel,
  labelRequiresSource,
  labelRequiresChunk,
  labelForbidsSource,
  validateProvenanceClaim,
  summarizeProvenance,
  renderProvenanceSummary,
  type ClaimProvenanceInput,
  type ProvenanceValidationContext,
  type ProvenanceLabel,
} from "../../src/lib/integrity/provenance";
import type { ChunkMeta, SourceMeta } from "../../src/lib/integrity/citation-validator";

const USER_A = "clerk|user_a";
const USER_B = "clerk|user_b";
const MODULE_1 = "module_1";
const MODULE_2 = "module_2";
const SOURCE_1 = "source_1";
const SOURCE_2 = "source_2";
const CHUNK_1 = "chunk_1";

const source: SourceMeta = {
  _id: SOURCE_1,
  tokenIdentifier: USER_A,
  moduleId: MODULE_1,
  authors: "Smith, John",
  year: 2020,
  title: "Test Source",
};

const chunk: ChunkMeta = {
  _id: CHUNK_1,
  sourceId: SOURCE_1,
  pageStart: 40,
  pageEnd: 45,
  text: "The defendant acted with reasonable care in all circumstances.",
};

function baseContext(
  overrides: Partial<ProvenanceValidationContext> = {},
): ProvenanceValidationContext {
  return {
    chunk,
    source,
    currentUserId: USER_A,
    moduleId: MODULE_1,
    assignmentSourceIds: [SOURCE_1],
    ...overrides,
  };
}

describe("PROVENANCE_LABELS taxonomy", () => {
  it("contains exactly the six required labels", () => {
    expect(PROVENANCE_LABELS).toEqual([
      "quoted",
      "paraphrased",
      "source_supported",
      "interpretation",
      "generated",
      "unsupported",
    ]);
  });

  it("exposes meta for every label", () => {
    for (const label of PROVENANCE_LABELS) {
      expect(PROVENANCE_LABEL_META[label]).toBeDefined();
      expect(PROVENANCE_LABEL_META[label].display).toBeTruthy();
    }
  });

  it("classifies source-backed vs non-source labels", () => {
    expect(SOURCE_BACKED_LABELS.has("quoted")).toBe(true);
    expect(SOURCE_BACKED_LABELS.has("paraphrased")).toBe(true);
    expect(SOURCE_BACKED_LABELS.has("source_supported")).toBe(true);
    expect(SOURCE_BACKED_LABELS.has("interpretation")).toBe(true);
    expect(SOURCE_BACKED_LABELS.has("generated")).toBe(false);
    expect(SOURCE_BACKED_LABELS.has("unsupported")).toBe(false);
    expect(NON_SOURCE_LABELS.has("generated")).toBe(true);
    expect(NON_SOURCE_LABELS.has("unsupported")).toBe(true);
  });

  it("isProvenanceLabel accepts known labels only", () => {
    expect(isProvenanceLabel("quoted")).toBe(true);
    expect(isProvenanceLabel("bogus")).toBe(false);
  });

  it("labelRequiresSource is true for source-backed labels", () => {
    expect(labelRequiresSource("quoted")).toBe(true);
    expect(labelRequiresSource("source_supported")).toBe(true);
    expect(labelRequiresSource("generated")).toBe(false);
  });

  it("labelRequiresChunk is true only for quoted and paraphrased", () => {
    expect(labelRequiresChunk("quoted")).toBe(true);
    expect(labelRequiresChunk("paraphrased")).toBe(true);
    expect(labelRequiresChunk("source_supported")).toBe(false);
  });

  it("labelForbidsSource is true only for generated and unsupported", () => {
    expect(labelForbidsSource("generated")).toBe(true);
    expect(labelForbidsSource("unsupported")).toBe(true);
    expect(labelForbidsSource("quoted")).toBe(false);
  });
});

describe("validateProvenanceClaim — happy paths", () => {
  it("accepts a fully-correct quoted claim", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "The defendant acted with reasonable care.",
      label: "quoted",
      sourceId: SOURCE_1,
      sourceChunkId: CHUNK_1,
      quote: "acted with reasonable care",
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(result.effectiveLabel).toBe("quoted");
    expect(result.rejectedCitation).toBe(false);
  });

  it("accepts a source_supported claim with valid source", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Smith argues that care matters.",
      label: "source_supported",
      sourceId: SOURCE_1,
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(result.effectiveLabel).toBe("source_supported");
  });

  it("accepts an interpretation label that still references the source", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Smith's framing implies negligence.",
      label: "interpretation",
      sourceId: SOURCE_1,
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(result.effectiveLabel).toBe("interpretation");
  });

  it("accepts a generated label with no source reference", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Drafted paragraph bridging sections.",
      label: "generated",
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(result.effectiveLabel).toBe("generated");
  });

  it("accepts an unsupported label", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "An ungrounded assertion.",
      label: "unsupported",
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(result.effectiveLabel).toBe("unsupported");
    expect(
      result.warnings.some((w) => w.code === "UNSUPPORTED_CLAIM"),
    ).toBe(true);
  });
});

describe("validateProvenanceClaim — hard truth rules", () => {
  it("rejects a fake chunk reference and downgrades to unsupported", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "quoted",
      sourceId: SOURCE_1,
      sourceChunkId: "chunk_does_not_exist",
      quote: "anything",
    };
    const result = validateProvenanceClaim(
      claim,
      baseContext({ chunk: null }),
    );
    expect(result.rejectedCitation).toBe(true);
    expect(result.effectiveLabel).toBe("unsupported");
    expect(
      result.warnings.some((w) => w.code === "FAKE_CITATION_REJECTED"),
    ).toBe(true);
  });

  it("rejects a fake source reference and downgrades to unsupported", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "source_supported",
      sourceId: "source_does_not_exist",
    };
    const result = validateProvenanceClaim(
      claim,
      baseContext({ source: null }),
    );
    expect(result.rejectedCitation).toBe(true);
    expect(result.effectiveLabel).toBe("unsupported");
  });

  it("detects chunk-source mismatch and downgrades to unsupported", () => {
    const mismatchedChunk: ChunkMeta = {
      ...chunk,
      sourceId: SOURCE_2,
    };
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "quoted",
      sourceId: SOURCE_1,
      sourceChunkId: CHUNK_1,
      quote: "reasonable care",
    };
    const result = validateProvenanceClaim(
      claim,
      baseContext({ chunk: mismatchedChunk }),
    );
    expect(result.effectiveLabel).toBe("unsupported");
    expect(
      result.warnings.some((w) => w.code === "CITATION_MISMATCH"),
    ).toBe(true);
  });

  it("never silently treats unsupported text as source_supported", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Made up content.",
      label: "source_supported",
      sourceId: null,
      sourceChunkId: null,
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(result.effectiveLabel).toBe("unsupported");
    expect(
      result.warnings.some((w) => w.code === "LABEL_REF_MISMATCH"),
    ).toBe(true);
  });

  it("rejects cross-module citations", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "source_supported",
      sourceId: SOURCE_1,
    };
    const result = validateProvenanceClaim(
      claim,
      baseContext({ moduleId: MODULE_2 }),
    );
    expect(result.effectiveLabel).toBe("unsupported");
    expect(
      result.warnings.some((w) => w.code === "CITATION_MISMATCH"),
    ).toBe(true);
  });

  it("rejects sources owned by a different user", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "source_supported",
      sourceId: SOURCE_1,
    };
    const result = validateProvenanceClaim(
      claim,
      baseContext({ currentUserId: USER_B }),
    );
    expect(result.effectiveLabel).toBe("unsupported");
  });
});

describe("validateProvenanceClaim — page metadata rules", () => {
  it("never invents page numbers; warns when chunk has no page metadata", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "source_supported",
      sourceId: SOURCE_1,
      claimedPageStart: 99,
    };
    const chunkNoPages: ChunkMeta = {
      ...chunk,
      pageStart: undefined,
      pageEnd: undefined,
    };
    const result = validateProvenanceClaim(
      claim,
      baseContext({ chunk: chunkNoPages }),
    );
    expect(
      result.warnings.some((w) => w.code === "MISSING_PAGE_METADATA"),
    ).toBe(true);
  });

  it("warns when claimed page is outside chunk range", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "source_supported",
      sourceId: SOURCE_1,
      sourceChunkId: CHUNK_1,
      claimedPageStart: 999,
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(
      result.warnings.some((w) => w.code === "PAGE_OUTSIDE_CHUNK_RANGE"),
    ).toBe(true);
  });

  it("accepts claimed pages inside chunk range without warnings", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "quoted",
      sourceId: SOURCE_1,
      sourceChunkId: CHUNK_1,
      quote: "reasonable care",
      claimedPageStart: 42,
      claimedPageEnd: 43,
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(
      result.warnings.some(
        (w) =>
          w.code === "PAGE_OUTSIDE_CHUNK_RANGE" ||
          w.code === "MISSING_PAGE_METADATA",
      ),
    ).toBe(false);
  });
});

describe("validateProvenanceClaim — soft warnings", () => {
  it("warns when source is not in assignment selection", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "source_supported",
      sourceId: SOURCE_1,
    };
    const result = validateProvenanceClaim(
      claim,
      baseContext({ assignmentSourceIds: [SOURCE_2] }),
    );
    expect(
      result.warnings.some((w) => w.code === "SOURCE_NOT_IN_ASSESSMENT"),
    ).toBe(true);
  });

  it("warns when quoted text cannot be located verbatim", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "quoted",
      sourceId: SOURCE_1,
      sourceChunkId: CHUNK_1,
      quote: "this exact phrase does not appear in the chunk",
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(
      result.warnings.some((w) => w.code === "POSSIBLE_MISATTRIBUTION"),
    ).toBe(true);
  });

  it("warns when evidence strength is weak", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "source_supported",
      sourceId: SOURCE_1,
      evidenceStrength: "weak",
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(result.warnings.some((w) => w.code === "WEAK_EVIDENCE")).toBe(true);
  });

  it("downgrades and warns when catalog recommendation is used as evidence", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim from a recommended reading.",
      label: "quoted",
      sourceId: SOURCE_1,
      sourceChunkId: CHUNK_1,
      quote: "recommended",
      isCatalogRecommendation: true,
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(result.effectiveLabel).toBe("unsupported");
    expect(
      result.warnings.some(
        (w) => w.code === "CATALOG_RECOMMENDATION_AS_EVIDENCE",
      ),
    ).toBe(true);
  });

  it("warns when a quoted label has no quote string", () => {
    const claim: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "quoted",
      sourceId: SOURCE_1,
      sourceChunkId: CHUNK_1,
    };
    const result = validateProvenanceClaim(claim, baseContext());
    expect(
      result.warnings.some(
        (w) => w.code === "MISSING_QUOTE_FOR_QUOTED_LABEL",
      ),
    ).toBe(true);
  });
});

describe("summarizeProvenance and renderProvenanceSummary", () => {
  it("counts labels and warnings correctly", () => {
    const validQuoted: ClaimProvenanceInput = {
      claimText: "Reasonable care was exercised.",
      label: "quoted",
      sourceId: SOURCE_1,
      sourceChunkId: CHUNK_1,
      quote: "reasonable care",
    };
    const fakeSource: ClaimProvenanceInput = {
      claimText: "Some claim",
      label: "source_supported",
      sourceId: "source_does_not_exist",
    };
    const generated: ClaimProvenanceInput = {
      claimText: "Bridge text.",
      label: "generated",
    };
    const results = [
      validateProvenanceClaim(validQuoted, baseContext()),
      validateProvenanceClaim(fakeSource, baseContext({ source: null })),
      validateProvenanceClaim(generated, baseContext()),
    ];
    const summary = summarizeProvenance(
      results,
      results.map((r) => r.effectiveLabel).map((_, i) => {
        const originals: ProvenanceLabel[] = [
          "quoted",
          "source_supported",
          "generated",
        ];
        return originals[i];
      }),
    );
    expect(summary.total).toBe(3);
    expect(summary.byLabel.quoted).toBe(1);
    expect(summary.byLabel.source_supported).toBe(1);
    expect(summary.byLabel.generated).toBe(1);
    expect(summary.byEffectiveLabel.unsupported).toBeGreaterThanOrEqual(1);
    expect(summary.rejectedCitations).toBeGreaterThanOrEqual(1);
  });

  it("renders a human-readable summary string", () => {
    const validQuoted: ClaimProvenanceInput = {
      claimText: "Reasonable care was exercised.",
      label: "quoted",
      sourceId: SOURCE_1,
      sourceChunkId: CHUNK_1,
      quote: "reasonable care",
    };
    const result = validateProvenanceClaim(validQuoted, baseContext());
    const summary = summarizeProvenance(
      [result],
      ["quoted"],
    );
    const text = renderProvenanceSummary(summary);
    expect(text).toMatch(/1 claim/);
    expect(text).toMatch(/quoted/);
  });

  it("handles an empty provenance set", () => {
    const summary = summarizeProvenance([]);
    const text = renderProvenanceSummary(summary);
    expect(text).toMatch(/No provenance records/);
    expect(summary.total).toBe(0);
  });
});
