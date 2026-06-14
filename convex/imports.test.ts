/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, describe, beforeEach } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";
import { parseClassificationResponse } from "./importClassification";
import { isValidLabel, labelToSourceType } from "./imports";

const modules = import.meta.glob("./**/*.ts", { eager: false });

const TEST_USER = {
  tokenIdentifier: "test_token_a",
  subject: "user_a",
  issuer: "https://clerk.test",
  email: "testa@test.com",
  name: "Test A",
};

function asUser(t: ReturnType<typeof convexTest>, user = TEST_USER) {
  return t.withIdentity({ ...user });
}

describe("classification helpers", () => {
  test("isValidLabel accepts known labels", () => {
    expect(isValidLabel("handbook")).toBe(true);
    expect(isValidLabel("assignment_brief")).toBe(true);
    expect(isValidLabel("integrity_guidance")).toBe(true);
    expect(isValidLabel("reading_list")).toBe(true);
    expect(isValidLabel("other")).toBe(true);
  });

  test("isValidLabel rejects unknown labels", () => {
    expect(isValidLabel("")).toBe(false);
    expect(isValidLabel("unknown")).toBe(false);
    expect(isValidLabel("module_handbook")).toBe(false);
    expect(isValidLabel("HANDBOOK")).toBe(false);
  });

  test("labelToSourceType maps correctly", () => {
    expect(labelToSourceType("handbook")).toBe("module_handbook");
    expect(labelToSourceType("rubric")).toBe("marking_rubric");
    expect(labelToSourceType("slides")).toBe("lecture_slides");
    expect(labelToSourceType("reading")).toBe("journal_article");
    expect(labelToSourceType("draft")).toBe("draft");
    expect(labelToSourceType("notes")).toBe("seminar_notes");
  });

  test("labelToSourceType falls back to report", () => {
    expect(labelToSourceType(undefined)).toBe("report");
    expect(labelToSourceType("bogus")).toBe("report");
  });
});

describe("parseClassificationResponse", () => {
  test("parses valid JSON response", () => {
    const json = JSON.stringify({
      labels: ["handbook"],
      primaryLabel: "handbook",
      confidence: 0.95,
      rationale: "Contains module policies and structure.",
    });
    const result = parseClassificationResponse(json);
    expect(result).not.toBeNull();
    expect(result!.primaryLabel).toBe("handbook");
    expect(result!.confidence).toBe(0.95);
    expect(result!.labels).toContain("handbook");
    expect(result!.rationale).toContain("module policies");
  });

  test("parses JSON wrapped in markdown fences", () => {
    const text =
      '```json\n{"labels": ["rubric"], "primaryLabel": "rubric", "confidence": 0.9, "rationale": "Grading grid."}\n```';
    const result = parseClassificationResponse(text);
    expect(result).not.toBeNull();
    expect(result!.primaryLabel).toBe("rubric");
  });

  test("parses JSON embedded in surrounding text", () => {
    const text =
      'Here is my classification:\n{"labels": ["slides"], "primaryLabel": "slides", "confidence": 0.8, "rationale": "Slide deck."}\nHope this helps!';
    const result = parseClassificationResponse(text);
    expect(result).not.toBeNull();
    expect(result!.primaryLabel).toBe("slides");
  });

  test("handles multi-label responses", () => {
    const json = JSON.stringify({
      labels: ["syllabus", "reading_list"],
      primaryLabel: "syllabus",
      confidence: 0.85,
      rationale: "Week-by-week schedule with readings.",
    });
    const result = parseClassificationResponse(json);
    expect(result).not.toBeNull();
    expect(result!.labels).toEqual(["syllabus", "reading_list"]);
  });

  test("ensures primaryLabel is included in labels", () => {
    const json = JSON.stringify({
      labels: ["reading"],
      primaryLabel: "draft",
      confidence: 0.7,
      rationale: "Looks like a draft.",
    });
    const result = parseClassificationResponse(json);
    expect(result).not.toBeNull();
    expect(result!.labels).toContain("draft");
    expect(result!.labels).toContain("reading");
    expect(result!.primaryLabel).toBe("draft");
  });

  test("clamps confidence to [0, 1]", () => {
    const high = parseClassificationResponse(
      JSON.stringify({
        labels: ["other"],
        primaryLabel: "other",
        confidence: 5,
        rationale: "x",
      }),
    );
    expect(high!.confidence).toBe(1);

    const low = parseClassificationResponse(
      JSON.stringify({
        labels: ["other"],
        primaryLabel: "other",
        confidence: -3,
        rationale: "x",
      }),
    );
    expect(low!.confidence).toBe(0);
  });

  test("provides fallback rationale when missing", () => {
    const json = JSON.stringify({
      labels: ["notes"],
      primaryLabel: "notes",
      confidence: 0.6,
    });
    const result = parseClassificationResponse(json);
    expect(result).not.toBeNull();
    expect(result!.rationale).toContain("notes");
  });

  test("returns null for invalid primaryLabel", () => {
    const json = JSON.stringify({
      labels: ["handbook"],
      primaryLabel: "not_a_real_label",
      confidence: 0.9,
      rationale: "x",
    });
    expect(parseClassificationResponse(json)).toBeNull();
  });

  test("returns null for unparseable text", () => {
    expect(parseClassificationResponse("")).toBeNull();
    expect(parseClassificationResponse("not json at all")).toBeNull();
    expect(parseClassificationResponse("```\nbroken\n```")).toBeNull();
  });

  test("returns null for non-object JSON", () => {
    expect(parseClassificationResponse("[1, 2, 3]")).toBeNull();
    expect(parseClassificationResponse('"string"')).toBeNull();
    expect(parseClassificationResponse("42")).toBeNull();
  });

  test("uses default confidence when missing", () => {
    const json = JSON.stringify({
      labels: ["other"],
      primaryLabel: "other",
      rationale: "Unclear.",
    });
    const result = parseClassificationResponse(json);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(0.5);
  });
});

describe("import batches", () => {
  let t: ReturnType<typeof convexTest>;
  let moduleId: Id<"modules">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    moduleId = await asA.mutation(api.modules.create, {
      title: "Test Module",
      code: "T101",
    });
  });

  test("create batch and list", async () => {
    const asA = asUser(t);
    const batchId = await asA.mutation(api.imports.createBatch, {
      moduleId,
      name: "Week 1 import",
      totalFiles: 3,
    });

    const batches = await asA.query(api.imports.listBatches, { moduleId });
    expect(batches).toHaveLength(1);
    expect(batches[0]._id).toBe(batchId);
    expect(batches[0].name).toBe("Week 1 import");
    expect(batches[0].status).toBe("pending");
    expect(batches[0].totalFiles).toBe(3);
  });

  test("getBatch returns batch", async () => {
    const asA = asUser(t);
    const batchId = await asA.mutation(api.imports.createBatch, {
      moduleId,
      totalFiles: 1,
    });

    const batch = await asA.query(api.imports.getBatch, { batchId });
    expect(batch).not.toBeNull();
    expect(batch!._id).toBe(batchId);
  });

  test("cannot access batch from another user", async () => {
    const asA = asUser(t);
    const batchId = await asA.mutation(api.imports.createBatch, {
      moduleId,
      totalFiles: 1,
    });

    const asB = asUser(t, {
      tokenIdentifier: "other_token",
      subject: "other",
      issuer: "https://clerk.test",
      email: "other@test.com",
      name: "Other User",
    });
    await expect(
      asB.query(api.imports.getBatch, { batchId }),
    ).rejects.toThrow();
  });

  test("register file and list files", async () => {
    const asA = asUser(t);
    const batchId = await asA.mutation(api.imports.createBatch, {
      moduleId,
      totalFiles: 1,
    });

    const storageId = await asA.run(async (ctx) => {
      return await ctx.storage.store(
        new Blob(["This is a test document about sociology."]),
      );
    });

    const fileId = await asA.mutation(api.imports.registerFile, {
      batchId,
      storageId,
      fileName: "lecture1.pdf",
      fileType: "application/pdf",
      fileSize: 100,
    });

    expect(typeof fileId).toBe("string");

    const files = await asA.query(api.imports.listFiles, { batchId });
    expect(files).toHaveLength(1);
    expect(files[0].fileName).toBe("lecture1.pdf");
    expect(files[0].extractionStatus).toBe("pending");
    expect(files[0].classificationStatus).toBe("pending");
  });

  test("getBatchWithFiles returns batch and files", async () => {
    const asA = asUser(t);
    const batchId = await asA.mutation(api.imports.createBatch, {
      moduleId,
      totalFiles: 1,
    });

    const storageId = await asA.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["test content"]));
    });

    await asA.mutation(api.imports.registerFile, {
      batchId,
      storageId,
      fileName: "test.txt",
    });

    const result = await asA.query(api.imports.getBatchWithFiles, { batchId });
    expect(result.batch._id).toBe(batchId);
    expect(result.files).toHaveLength(1);
  });

  test("removeBatch cascades to files", async () => {
    const asA = asUser(t);
    const batchId = await asA.mutation(api.imports.createBatch, {
      moduleId,
      totalFiles: 1,
    });

    const storageId = await asA.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["test"]));
    });

    await asA.mutation(api.imports.registerFile, {
      batchId,
      storageId,
      fileName: "test.txt",
    });

    await asA.mutation(api.imports.removeBatch, { batchId });

    const batches = await asA.query(api.imports.listBatches, { moduleId });
    expect(batches).toHaveLength(0);
  });
});

describe("classification review flow", () => {
  let t: ReturnType<typeof convexTest>;
  let moduleId: Id<"modules">;
  let batchId: Id<"importBatches">;
  let fileId: Id<"importedFiles">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    moduleId = await asA.mutation(api.modules.create, {
      title: "Test Module",
      code: "T101",
    });
    batchId = await asA.mutation(api.imports.createBatch, {
      moduleId,
      totalFiles: 1,
    });

    const storageId = await asA.run(async (ctx) => {
      return await ctx.storage.store(new Blob(["test content"]));
    });

    fileId = await asA.mutation(api.imports.registerFile, {
      batchId,
      storageId,
      fileName: "syllabus.pdf",
    });

    await asA.mutation(internal.imports.internalUpdateFileClassification, {
      fileId,
      classificationStatus: "needs_review",
      primaryLabel: "syllabus",
      confidence: 0.6,
      rationale: "Contains weekly schedule.",
      labels: ["syllabus"],
    });
  });

  test("confirmClassification accepts the AI suggestion", async () => {
    const asA = asUser(t);
    await asA.mutation(api.imports.confirmClassification, { importedFileId: fileId });

    const file = await asA.query(api.imports.getFile, {
      importedFileId: fileId,
    });
    expect(file!.classificationStatus).toBe("accepted");
    expect(file!.reviewedLabel).toBe("syllabus");
  });

  test("rejectClassification rejects the suggestion", async () => {
    const asA = asUser(t);
    await asA.mutation(api.imports.rejectClassification, {
      importedFileId: fileId,
    });

    const file = await asA.query(api.imports.getFile, {
      importedFileId: fileId,
    });
    expect(file!.classificationStatus).toBe("rejected");
  });

  test("editClassification overrides the label", async () => {
    const asA = asUser(t);
    await asA.mutation(api.imports.editClassification, {
      importedFileId: fileId,
      primaryLabel: "handbook",
    });

    const file = await asA.query(api.imports.getFile, {
      importedFileId: fileId,
    });
    expect(file!.classificationStatus).toBe("accepted");
    expect(file!.primaryLabel).toBe("handbook");
    expect(file!.reviewedLabel).toBe("handbook");
  });

  test("listNeedsReview returns files pending review", async () => {
    const asA = asUser(t);
    const reviewQueue = await asA.query(api.imports.listNeedsReview, {
      moduleId,
    });
    expect(reviewQueue).toHaveLength(1);
    expect(reviewQueue[0]._id).toBe(fileId);
  });

  test("listNeedsReview excludes accepted files", async () => {
    const asA = asUser(t);
    await asA.mutation(api.imports.confirmClassification, {
      importedFileId: fileId,
    });

    const reviewQueue = await asA.query(api.imports.listNeedsReview, {
      moduleId,
    });
    expect(reviewQueue).toHaveLength(0);
  });

  test("retryFile resets to pending", async () => {
    const asA = asUser(t);
    await asA.mutation(api.imports.retryFile, { importedFileId: fileId });

    const file = await asA.query(api.imports.getFile, {
      importedFileId: fileId,
    });
    expect(file!.classificationStatus).toBe("pending");
    expect(file!.extractionStatus).toBe("pending");
  });
});

describe("batch progress recompute", () => {
  let t: ReturnType<typeof convexTest>;
  let moduleId: Id<"modules">;
  let batchId: Id<"importBatches">;

  beforeEach(async () => {
    t = convexTest(schema, modules);
    const asA = asUser(t);
    moduleId = await asA.mutation(api.modules.create, {
      title: "Test Module",
      code: "T101",
    });
    batchId = await asA.mutation(api.imports.createBatch, {
      moduleId,
      totalFiles: 2,
    });

    for (let i = 0; i < 2; i++) {
      const storageId = await asA.run(async (ctx) => {
        return await ctx.storage.store(new Blob([`file ${i}`]));
      });
      await asA.mutation(api.imports.registerFile, {
        batchId,
        storageId,
        fileName: `file${i}.txt`,
      });
    }
  });

  test("recomputes counts from file states", async () => {
    const asA = asUser(t);
    const files = await asA.query(api.imports.listFiles, { batchId });
    expect(files).toHaveLength(2);

    await asA.mutation(internal.imports.internalUpdateFileExtraction, {
      fileId: files[0]._id,
      extractionStatus: "extracted",
    });
    await asA.mutation(internal.imports.internalUpdateFileClassification, {
      fileId: files[0]._id,
      classificationStatus: "auto_accepted",
      primaryLabel: "handbook",
      confidence: 0.9,
    });

    await asA.mutation(internal.imports.internalUpdateFileExtraction, {
      fileId: files[1]._id,
      extractionStatus: "extracted",
    });
    await asA.mutation(internal.imports.internalUpdateFileClassification, {
      fileId: files[1]._id,
      classificationStatus: "needs_review",
      primaryLabel: "other",
      confidence: 0.4,
    });

    const result = await asA.mutation(
      internal.imports._recomputeBatchProgress,
      { batchId },
    );

    expect(result!.processed).toBe(2);
    expect(result!.autoAccepted).toBe(1);
    expect(result!.needsReview).toBe(1);
    expect(result!.failed).toBe(0);
    expect(result!.status).toBe("completed");
  });
});
