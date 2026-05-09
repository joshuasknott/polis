import { describe, it, expect } from "vitest";
import { renderHarvardInText, renderHarvardReference } from "../../src/lib/integrity/harvard";

describe("renderHarvardInText", () => {
  it("renders Author (Year, p. X) when all fields present", () => {
    const { citation, warnings } = renderHarvardInText({
      authors: "Smith, John",
      year: 2020,
      pageStart: 45,
    });
    expect(citation).toBe("Smith (2020, p. 45)");
    expect(warnings).toHaveLength(0);
  });

  it("renders Author (Year, pp. X–Y) for page ranges", () => {
    const { citation } = renderHarvardInText({
      authors: "Jones, Alice",
      year: 2018,
      pageStart: 100,
      pageEnd: 105,
    });
    expect(citation).toBe("Jones (2018, pp. 100–105)");
  });

  it("renders Author (Year) when page is unavailable — never invents a page number", () => {
    const { citation, warnings } = renderHarvardInText({
      authors: "Brown, Sarah",
      year: 2015,
      pageStart: null,
    });
    expect(citation).toBe("Brown (2015)");
    expect(warnings).toHaveLength(0);
  });

  it("emits a warning and uses Unknown Author when author is missing", () => {
    const { citation, warnings } = renderHarvardInText({
      authors: null,
      year: 2022,
    });
    expect(citation).toContain("Unknown Author");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toMatch(/author/i);
  });

  it("emits a warning and uses n.d. when year is missing", () => {
    const { citation, warnings } = renderHarvardInText({
      authors: "Taylor, James",
      year: null,
    });
    expect(citation).toBe("Taylor (n.d.)");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toMatch(/year/i);
  });

  it("handles two authors with 'and'", () => {
    const { citation } = renderHarvardInText({
      authors: "Smith, John; Jones, Alice",
      year: 2019,
    });
    expect(citation).toMatch(/Smith.*and.*Jones/);
  });

  it("handles three or more authors with et al.", () => {
    const { citation } = renderHarvardInText({
      authors: "Smith, J; Jones, A; Brown, B",
      year: 2021,
    });
    expect(citation).toMatch(/et al\./);
  });
});

describe("renderHarvardReference", () => {
  it("renders a complete reference entry", () => {
    const { citation, warnings } = renderHarvardReference({
      authors: "Lijphart, Arend",
      year: 1999,
      title: "Patterns of Democracy",
      publisher: "Yale University Press",
      placeOfPublication: "New Haven",
    });
    expect(citation).toContain("Lijphart");
    expect(citation).toContain("1999");
    expect(citation).toContain("Patterns of Democracy");
    expect(warnings).toHaveLength(0);
  });

  it("warns when title is missing", () => {
    const { warnings } = renderHarvardReference({
      authors: "Someone",
      year: 2020,
      title: null,
    });
    expect(warnings.some((w) => /title/i.test(w))).toBe(true);
  });
});
