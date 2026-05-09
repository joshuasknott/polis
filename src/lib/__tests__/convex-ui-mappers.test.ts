/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  mapModule,
  mapFolder,
  mapSource,
  mapAssignment,
  mapFullAssignment,
  mapEvidenceLink,
  mapArgument,
  mapDraft,
  mapReview,
} from "../convex-ui-mappers";

describe("mapModule", () => {
  it("maps Convex module doc to UI shape", () => {
    const result = mapModule({
      _id: "mod1" as any,
      _creationTime: 1000,
      tokenIdentifier: "ti1",
      title: "Test Module",
      code: "SO101",
      description: "A module",
      academicYear: "2024/25",
      semester: "1",
      colour: "#ff0000",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceCount: 3,
      assignmentCount: 2,
    });

    expect(result.id).toBe("mod1");
    expect(result.title).toBe("Test Module");
    expect(result.code).toBe("SO101");
    expect(result.sourceCount).toBe(3);
    expect(result.assignmentCount).toBe(2);
  });

  it("uses defaults for optional fields", () => {
    const result = mapModule({
      _id: "mod1" as any,
      _creationTime: 1000,
      tokenIdentifier: "ti1",
      title: "Test",
      code: "SO101",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    expect(result.description).toBe("");
    expect(result.sourceCount).toBe(0);
    expect(result.assignmentCount).toBe(0);
  });
});

describe("mapFolder", () => {
  it("maps folder with source count", () => {
    const result = mapFolder(
      {
        _id: "f1" as any,
        _creationTime: 1000,
        tokenIdentifier: "ti1",
        moduleId: "m1" as any,
        name: "Readings",
        type: "readings",
        sortOrder: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      5,
    );

    expect(result.id).toBe("f1");
    expect(result.name).toBe("Readings");
    expect(result.sourceCount).toBe(5);
    expect(result.sortOrder).toBe(1);
  });
});

describe("mapSource", () => {
  it("maps source with all optional fields", () => {
    const result = mapSource({
      _id: "s1" as any,
      _creationTime: 1000,
      tokenIdentifier: "ti1",
      moduleId: "m1" as any,
      title: "Paper",
      authors: "Smith",
      year: 2024,
      type: "journal_article",
      status: "processed",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    expect(result.id).toBe("s1");
    expect(result.author).toBe("Smith");
    expect(result.year).toBe(2024);
  });

  it("uses defaults for missing optional fields", () => {
    const result = mapSource({
      _id: "s1" as any,
      _creationTime: 1000,
      tokenIdentifier: "ti1",
      moduleId: "m1" as any,
      title: "Paper",
      type: "book",
      status: "placeholder",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    expect(result.author).toBe("Author unknown");
    expect(result.year).toBe(0);
    expect(result.citation).toBe("");
  });
});

describe("mapFullAssignment", () => {
  it("maps assignment with selected source IDs", () => {
    const result = mapFullAssignment(
      {
        _id: "a1" as any,
        _creationTime: 1000,
        tokenIdentifier: "ti1",
        moduleId: "m1" as any,
        title: "Essay 1",
        question: "Discuss",
        wordLimit: 2000,
        dueDate: "2025-06-01",
        rubric: [{ name: "Analysis", description: "Depth", weight: 0.5 }],
        stage: "draft",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      ["s1", "s2"],
    );

    expect(result.id).toBe("a1");
    expect(result.title).toBe("Essay 1");
    expect(result.selectedSourceIds).toEqual(["s1", "s2"]);
    expect(result.stage).toBe("draft");
    expect(result.rubric).toHaveLength(1);
  });

  it("uses defaults for missing optional fields", () => {
    const result = mapFullAssignment(
      {
        _id: "a1" as any,
        _creationTime: 1000,
        tokenIdentifier: "ti1",
        moduleId: "m1" as any,
        title: "Essay",
        stage: "ingest",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      [],
    );

    expect(result.question).toBe("");
    expect(result.wordLimit).toBe(2000);
    expect(result.rubric).toEqual([]);
  });
});

describe("mapAssignment", () => {
  it("maps to lightweight assignment shape", () => {
    const result = mapAssignment({
      _id: "a1" as any,
      _creationTime: 1000,
      tokenIdentifier: "ti1",
      moduleId: "m1" as any,
      title: "Essay",
      stage: "ingest",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    expect(result.id).toBe("a1");
    expect(result.title).toBe("Essay");
    expect(result.status).toBe("ingest");
  });
});

describe("mapEvidenceLink", () => {
  it("maps evidence link with source title", () => {
    const result = mapEvidenceLink(
      {
        _id: "el1" as any,
        _creationTime: 1000,
        tokenIdentifier: "ti1",
        argumentId: "arg1" as any,
        sourceId: "s1" as any,
        quote: "text",
        pageRange: "1-3",
        usage: "supporting",
        strength: "strong",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      "My Source",
    );

    expect(result.id).toBe("el1");
    expect(result.sourceTitle).toBe("My Source");
    expect(result.strength).toBe("strong");
    expect(result.quote).toBe("text");
  });

  it("defaults strength to moderate when missing", () => {
    const result = mapEvidenceLink(
      {
        _id: "el1" as any,
        _creationTime: 1000,
        tokenIdentifier: "ti1",
        argumentId: "arg1" as any,
        sourceId: "s1" as any,
        strength: "moderate",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      "Source",
    );

    expect(result.strength).toBe("moderate");
  });
});

describe("mapArgument", () => {
  it("maps argument with evidence links", () => {
    const result = mapArgument(
      {
        _id: "arg1" as any,
        _creationTime: 1000,
        tokenIdentifier: "ti1",
        assignmentId: "a1" as any,
        claim: "Main claim",
        synthesis: "synthesis text",
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      [],
    );

    expect(result.id).toBe("arg1");
    expect(result.claim).toBe("Main claim");
    expect(result.synthesis).toBe("synthesis text");
    expect(result.evidenceLinks).toEqual([]);
    expect(result.counterarguments).toEqual([]);
  });
});

describe("mapDraft", () => {
  it("maps draft to UI shape", () => {
    const now = Date.now();
    const result = mapDraft({
      _id: "d1" as any,
      _creationTime: 1000,
      tokenIdentifier: "ti1",
      assignmentId: "a1" as any,
      version: 3,
      content: "Some text",
      wordCount: 500,
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    });

    expect(result.id).toBe("d1");
    expect(result.version).toBe(3);
    expect(result.content).toBe("Some text");
    expect(result.wordCount).toBe(500);
  });
});

describe("mapReview", () => {
  it("maps review run with findings by category", () => {
    const now = Date.now();
    const result = mapReview(
      {
        _id: "r1" as any,
        _creationTime: 1000,
        tokenIdentifier: "ti1",
        draftId: "d1" as any,
        status: "completed",
        overallFeedback: "Good work",
        rubricAlignment: "aligned",
        createdAt: now,
        updatedAt: now,
      },
      [
        {
          _id: "f1" as any,
          _creationTime: 1000,
          tokenIdentifier: "ti1",
          reviewRunId: "r1" as any,
          category: "strength",
          content: "Strong argument",
          createdAt: now,
        },
        {
          _id: "f2" as any,
          _creationTime: 1000,
          tokenIdentifier: "ti1",
          reviewRunId: "r1" as any,
          category: "weakness",
          content: "Needs more evidence",
          createdAt: now,
        },
        {
          _id: "f3" as any,
          _creationTime: 1000,
          tokenIdentifier: "ti1",
          reviewRunId: "r1" as any,
          category: "strength",
          content: "Good structure",
          createdAt: now,
        },
      ],
    );

    expect(result.id).toBe("r1");
    expect(result.strengths).toEqual(["Strong argument", "Good structure"]);
    expect(result.weaknesses).toEqual(["Needs more evidence"]);
    expect(result.overallFeedback).toBe("Good work");
    expect(result.rubricAlignment).toBe("aligned");
  });
});
