import { describe, it, expect } from "vitest";
import {
  ASSESSMENT_TABS,
  DEFAULT_ASSESSMENT_TAB,
  DEFAULT_WORKSPACE_TAB,
  PRODUCTION_STAGES,
  WORKSPACE_TABS,
  normalizeAssessmentTab,
  normalizeWorkspaceTab,
  type EvidenceStrength,
} from "../types";

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

describe("Workspace tabs", () => {
  it("uses Module Info as the default workspace tab", () => {
    expect(DEFAULT_WORKSPACE_TAB).toBe("module-info");
    expect(WORKSPACE_TABS).toEqual([
      "module-info",
      "sources",
      "assignments",
      "settings",
    ]);
  });

  it("normalizes legacy workspace tab URLs", () => {
    expect(normalizeWorkspaceTab("home")).toBe("module-info");
    expect(normalizeWorkspaceTab("imports")).toBe("sources");
    expect(normalizeWorkspaceTab("knowledge-base")).toBe("sources");
    expect(normalizeWorkspaceTab("assessments")).toBe("assignments");
    expect(normalizeWorkspaceTab("sources")).toBe("sources");
    expect(normalizeWorkspaceTab("missing")).toBe("module-info");
  });
});

describe("Assessment tabs", () => {
  it("uses Plan, Write, and Review as the only local assessment navigation", () => {
    expect(DEFAULT_ASSESSMENT_TAB).toBe("plan");
    expect(ASSESSMENT_TABS).toEqual(["plan", "write", "review"]);
  });

  it("normalizes legacy assessment URLs into the new local flow", () => {
    expect(normalizeAssessmentTab("brief")).toBe("plan");
    expect(normalizeAssessmentTab("sources")).toBe("plan");
    expect(normalizeAssessmentTab("evidence")).toBe("plan");
    expect(normalizeAssessmentTab("draft")).toBe("write");
    expect(normalizeAssessmentTab("refine")).toBe("review");
    expect(normalizeAssessmentTab("missing")).toBe("plan");
  });
});
