import { describe, it, expect } from "vitest";
import { PRODUCTION_STAGES, type EvidenceStrength } from "../types";

describe("PRODUCTION_STAGES", () => {
  it("contains all expected stages in order", () => {
    expect(PRODUCTION_STAGES).toEqual([
      "ingest",
      "understand",
      "map",
      "judge",
      "build",
      "draft",
      "refine",
    ]);
  });

  it("has 7 stages", () => {
    expect(PRODUCTION_STAGES).toHaveLength(7);
  });

  it("starts with ingest", () => {
    expect(PRODUCTION_STAGES[0]).toBe("ingest");
  });

  it("ends with refine", () => {
    expect(PRODUCTION_STAGES[PRODUCTION_STAGES.length - 1]).toBe("refine");
  });
});

describe("ProductionStage type", () => {
  it("all stages are valid ProductionStage values", () => {
    for (const stage of PRODUCTION_STAGES) {
      expect(typeof stage).toBe("string");
      expect(stage.length).toBeGreaterThan(0);
    }
  });
});

describe("EvidenceStrength", () => {
  const validStrengths: EvidenceStrength[] = ["strong", "moderate", "weak"];

  it("has exactly 3 strength levels", () => {
    expect(validStrengths).toHaveLength(3);
  });

  it("each strength is a non-empty string", () => {
    for (const s of validStrengths) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    }
  });
});
