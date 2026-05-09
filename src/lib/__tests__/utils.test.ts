import { describe, it, expect } from "vitest";
import {
  cn,
  formatDate,
  formatRelativeTime,
  truncate,
  getSourceTypeLabel,
  getStatusColor,
  getStatusLabel,
  getProductionStageLabel,
  daysUntil,
  wordCount,
} from "../utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters falsy values", () => {
    expect(cn("a", undefined, null, false, "b")).toBe("a b");
  });

  it("returns empty string for all falsy", () => {
    expect(cn(undefined, null, false)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a date string in en-GB", () => {
    const result = formatDate("2025-01-15");
    expect(result).toContain("Jan");
    expect(result).toContain("2025");
  });
});

describe("formatRelativeTime", () => {
  it('returns "just now" for current time', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe("just now");
  });

  it("returns minutes ago for recent past", () => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatRelativeTime(fiveMinsAgo)).toBe("5m ago");
  });

  it("returns hours ago for hours past", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days ago for days past", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
  });
});

describe("truncate", () => {
  it("returns string unchanged when shorter than max", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and adds ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello wo...");
  });

  it("trims trailing spaces before ellipsis", () => {
    expect(truncate("hello   world", 8)).toBe("hello...");
  });
});

describe("getSourceTypeLabel", () => {
  it("returns human-readable label for known types", () => {
    expect(getSourceTypeLabel("journal_article")).toBe("Journal Article");
    expect(getSourceTypeLabel("book")).toBe("Book");
    expect(getSourceTypeLabel("lecture_slides")).toBe("Lecture Slides");
  });

  it("returns raw type for unknown", () => {
    expect(getSourceTypeLabel("unknown_type")).toBe("unknown_type");
  });
});

describe("getStatusColor", () => {
  it("returns colour classes for known statuses", () => {
    expect(getStatusColor("processed")).toContain("success");
    expect(getStatusColor("processing")).toContain("accent");
    expect(getStatusColor("failed")).toContain("danger");
  });

  it("returns default for unknown status", () => {
    expect(getStatusColor("unknown")).toContain("muted");
  });
});

describe("getStatusLabel", () => {
  it("returns label for known statuses", () => {
    expect(getStatusLabel("processed")).toBe("Processed");
    expect(getStatusLabel("needs_review")).toBe("Needs Review");
  });

  it("returns raw for unknown", () => {
    expect(getStatusLabel("unknown")).toBe("unknown");
  });
});

describe("getProductionStageLabel", () => {
  it("returns label for all production stages", () => {
    expect(getProductionStageLabel("ingest")).toBe("Ingest");
    expect(getProductionStageLabel("understand")).toBe("Understand");
    expect(getProductionStageLabel("refine")).toBe("Refine");
  });
});

describe("daysUntil", () => {
  it("returns positive days for future date", () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString();
    expect(daysUntil(future)).toBeGreaterThanOrEqual(4);
  });

  it("returns negative days for past date", () => {
    const past = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(daysUntil(past)).toBeLessThan(0);
  });
});

describe("wordCount", () => {
  it("counts words in a string", () => {
    expect(wordCount("hello world")).toBe(2);
  });

  it("handles leading/trailing whitespace", () => {
    expect(wordCount("  hello  world  ")).toBe(2);
  });

  it("returns 1 for empty string", () => {
    expect(wordCount("")).toBe(1);
  });

  it("returns 1 for whitespace-only string", () => {
    expect(wordCount("   ")).toBe(1);
  });
});
