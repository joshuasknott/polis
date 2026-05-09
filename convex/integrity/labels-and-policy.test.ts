import { describe, it, expect } from "vitest";
import {
  CLAIM_LABELS,
  LABEL_META,
  isValidClaimLabel,
  labelRequiresCitation,
} from "../../src/lib/integrity/labels";
import {
  classifyUnsupportedClaim,
  buildUnsupportedClaimWarnings,
  UNSUPPORTED_CLAIM_POLICY,
} from "../../src/lib/integrity/unsupported-claim";

describe("CLAIM_LABELS taxonomy", () => {
  it("contains exactly the five required labels", () => {
    const required = [
      "source_supported",
      "interpretation",
      "user_idea",
      "general_context",
      "unsupported",
    ];
    required.forEach((l) => expect(CLAIM_LABELS).toContain(l));
    expect(CLAIM_LABELS).toHaveLength(5);
  });

  it("marks source_supported as requiring citation", () => {
    expect(labelRequiresCitation("source_supported")).toBe(true);
  });

  it("marks interpretation as requiring citation", () => {
    expect(labelRequiresCitation("interpretation")).toBe(true);
  });

  it("does not require citation for user_idea, general_context, unsupported", () => {
    expect(labelRequiresCitation("user_idea")).toBe(false);
    expect(labelRequiresCitation("general_context")).toBe(false);
    expect(labelRequiresCitation("unsupported")).toBe(false);
  });

  it("validates known labels", () => {
    expect(isValidClaimLabel("source_supported")).toBe(true);
    expect(isValidClaimLabel("made_up_label")).toBe(false);
  });

  it("has LABEL_META entry for every label", () => {
    CLAIM_LABELS.forEach((l) => {
      expect(LABEL_META[l]).toBeDefined();
      expect(LABEL_META[l].display).toBeTruthy();
    });
  });
});

describe("unsupported claim policy", () => {
  it("classifyUnsupportedClaim returns isUnsupported=true for unsupported label", () => {
    const result = classifyUnsupportedClaim("unsupported");
    expect(result.isUnsupported).toBe(true);
    expect(result.warningMessage).toBe(UNSUPPORTED_CLAIM_POLICY.cannotFindMessage);
  });

  it("classifyUnsupportedClaim returns a reminder for interpretation", () => {
    const result = classifyUnsupportedClaim("interpretation");
    expect(result.isUnsupported).toBe(false);
    expect(result.warningMessage).toBe(UNSUPPORTED_CLAIM_POLICY.interpretationReminder);
  });

  it("classifyUnsupportedClaim returns no warning for source_supported", () => {
    const result = classifyUnsupportedClaim("source_supported");
    expect(result.isUnsupported).toBe(false);
    expect(result.warningMessage).toBeNull();
  });

  it("buildUnsupportedClaimWarnings emits cannot-find message when unsupported label is present", () => {
    const warnings = buildUnsupportedClaimWarnings(["unsupported", "general_context"]);
    expect(warnings.some((w) => w.includes("could not find"))).toBe(true);
  });

  it("buildUnsupportedClaimWarnings emits interpretation reminder when all claims are interpretations", () => {
    const warnings = buildUnsupportedClaimWarnings(["interpretation", "user_idea"]);
    expect(warnings.some((w) => w.includes("interpretation"))).toBe(true);
  });

  it("buildUnsupportedClaimWarnings emits no warnings for well-supported claims", () => {
    const warnings = buildUnsupportedClaimWarnings(["source_supported"]);
    expect(warnings).toHaveLength(0);
  });
});
