import {
  query,
  mutation,
  internalMutation,
  internalQuery,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";
import {
  importBatchStatus,
  classificationLabel,
  importFileClassificationStatus,
  importFileExtractionStatus,
} from "./lib/validators";
import { internal } from "./_generated/api";

export const CLASSIFICATION_LABELS = [
  "handbook",
  "syllabus",
  "assignment_brief",
  "rubric",
  "slides",
  "reading",
  "draft",
  "notes",
  "integrity_guidance",
  "reading_list",
  "other",
] as const;

export type ClassificationLabel = (typeof CLASSIFICATION_LABELS)[number];

export function isValidLabel(label: string): label is ClassificationLabel {
  return (CLASSIFICATION_LABELS as readonly string[]).includes(label);
}

const LABEL_TO_SOURCE_TYPE: Record<string, string> = {
  handbook: "module_handbook",
  syllabus: "module_handbook",
  assignment_brief: "assignment_brief",
  rubric: "marking_rubric",
  slides: "lecture_slides",
  reading: "journal_article",
  draft: "draft",
  notes: "seminar_notes",
  integrity_guidance: "report",
  reading_list: "report",
  other: "report",
};

const LABEL_TO_FOLDER_TYPE: Record<string, string> = {
  handbook: "module_info",
  syllabus: "module_info",
  assignment_brief: "briefs_rubrics",
  rubric: "briefs_rubrics",
  slides: "lecture_material",
  reading: "readings",
  notes: "lecture_material",
  integrity_guidance: "module_info",
  reading_list: "readings",
};

type BaselineSourceFolderType =
  | "module_info"
  | "readings"
  | "lecture_material"
  | "briefs_rubrics";

export function labelToSourceType(label: string | undefined): string {
  if (!label) return "report";
  return LABEL_TO_SOURCE_TYPE[label] ?? "report";
}

export function labelToFolderType(
  label: string | undefined,
): BaselineSourceFolderType | undefined {
  if (!label) return undefined;
  return LABEL_TO_FOLDER_TYPE[label] as BaselineSourceFolderType | undefined;
}

async function ensureSourceGroup(
  ctx: MutationCtx,
  tokenIdentifier: string,
  moduleId: Id<"modules">,
  folderTypeValue: BaselineSourceFolderType | undefined,
): Promise<Id<"folders"> | undefined> {
  if (!folderTypeValue) return undefined;

  const folders = await ctx.db
    .query("folders")
    .withIndex("by_module", (q) => q.eq("moduleId", moduleId))
    .take(100);
  const existing = folders.find((f) => f.type === folderTypeValue);
  if (existing) return existing._id;

  const names: Record<string, string> = {
    module_info: "Module Info",
    readings: "Readings",
    lecture_material: "Lecture Material",
    briefs_rubrics: "Briefs/Rubrics",
  };
  const sortOrders: Record<string, number> = {
    module_info: 0,
    readings: 1,
    lecture_material: 2,
    briefs_rubrics: 3,
  };
  const now = Date.now();
  return await ctx.db.insert("folders", {
    tokenIdentifier,
    moduleId,
    name: names[folderTypeValue] ?? "Sources",
    type: folderTypeValue,
    sortOrder: sortOrders[folderTypeValue] ?? 99,
    createdAt: now,
    updatedAt: now,
  });
}

async function assertBatchOwnership(
  ctx: QueryCtx,
  tokenIdentifier: string,
  batchId: Id<"importBatches">,
): Promise<Doc<"importBatches">> {
  const batch = await ctx.db.get(batchId);
  if (!batch || batch.tokenIdentifier !== tokenIdentifier) {
    throw new Error("Not found");
  }
  return batch;
}

async function assertModuleOwnership(
  ctx: QueryCtx,
  tokenIdentifier: string,
  moduleId: Id<"modules">,
): Promise<Doc<"modules">> {
  const mod = await ctx.db.get(moduleId);
  if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
    throw new Error("Not found");
  }
  return mod;
}

async function syncLinkedSourceClassification(
  ctx: MutationCtx,
  tokenIdentifier: string,
  file: Doc<"importedFiles">,
  label: ClassificationLabel | undefined,
  accepted: boolean,
) {
  if (!file.sourceId || !label) return;
  const source = await ctx.db.get(file.sourceId);
  if (!source || source.tokenIdentifier !== tokenIdentifier) return;

  const folderId = await ensureSourceGroup(
    ctx,
    tokenIdentifier,
    file.moduleId,
    labelToFolderType(label),
  );

  await ctx.db.patch(file.sourceId, {
    type: labelToSourceType(label),
    folderId,
    ...(accepted && source.status === "needs_review"
      ? { status: "processed" }
      : {}),
    updatedAt: Date.now(),
  });
}

export const listBatches = query({
  args: {
    moduleId: v.optional(v.id("modules")),
    status: v.optional(importBatchStatus),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    if (args.moduleId && args.status) {
      const mod = await ctx.db.get(args.moduleId);
      if (!mod || mod.tokenIdentifier !== tokenIdentifier) return [];
      return await ctx.db
        .query("importBatches")
        .withIndex("by_module_and_status", (q) =>
          q.eq("moduleId", args.moduleId!).eq("status", args.status!),
        )
        .order("desc")
        .take(100);
    }

    if (args.moduleId) {
      return await ctx.db
        .query("importBatches")
        .withIndex("by_tokenIdentifier_and_module", (q) =>
          q
            .eq("tokenIdentifier", tokenIdentifier)
            .eq("moduleId", args.moduleId!),
        )
        .order("desc")
        .take(100);
    }

    return await ctx.db
      .query("importBatches")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(100);
  },
});

export const getBatch = query({
  args: { batchId: v.id("importBatches") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await assertBatchOwnership(ctx, tokenIdentifier, args.batchId);
  },
});

export const getBatchWithFiles = query({
  args: { batchId: v.id("importBatches") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const batch = await assertBatchOwnership(ctx, tokenIdentifier, args.batchId);

    const files = await ctx.db
      .query("importedFiles")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .order("asc")
      .take(200);

    return { batch, files };
  },
});

export const listFiles = query({
  args: {
    batchId: v.id("importBatches"),
    extractionStatus: v.optional(importFileExtractionStatus),
    classificationStatus: v.optional(importFileClassificationStatus),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertBatchOwnership(ctx, tokenIdentifier, args.batchId);

    if (args.classificationStatus) {
      return await ctx.db
        .query("importedFiles")
        .withIndex("by_batch_and_classificationStatus", (q) =>
          q
            .eq("batchId", args.batchId)
            .eq("classificationStatus", args.classificationStatus!),
        )
        .order("asc")
        .take(200);
    }

    if (args.extractionStatus) {
      return await ctx.db
        .query("importedFiles")
        .withIndex("by_batch_and_extractionStatus", (q) =>
          q
            .eq("batchId", args.batchId)
            .eq("extractionStatus", args.extractionStatus!),
        )
        .order("asc")
        .take(200);
    }

    return await ctx.db
      .query("importedFiles")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .order("asc")
      .take(200);
  },
});

export const getFile = query({
  args: { importedFileId: v.id("importedFiles") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) return null;
    return file;
  },
});

export const listFilesByModule = query({
  args: {
    moduleId: v.id("modules"),
    classificationStatus: v.optional(importFileClassificationStatus),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertModuleOwnership(ctx, tokenIdentifier, args.moduleId);

    if (args.classificationStatus) {
      return await ctx.db
        .query("importedFiles")
        .withIndex("by_module_and_classificationStatus", (q) =>
          q
            .eq("moduleId", args.moduleId)
            .eq("classificationStatus", args.classificationStatus!),
        )
        .order("asc")
        .take(200);
    }

    return await ctx.db
      .query("importedFiles")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .take(200);
  },
});

export const listNeedsReview = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertModuleOwnership(ctx, tokenIdentifier, args.moduleId);

    return await ctx.db
      .query("importedFiles")
      .withIndex("by_module_and_classificationStatus", (q) =>
        q
          .eq("moduleId", args.moduleId)
          .eq("classificationStatus", "needs_review"),
      )
      .order("asc")
      .take(100);
  },
});

export const createBatch = mutation({
  args: {
    moduleId: v.id("modules"),
    name: v.optional(v.string()),
    totalFiles: v.number(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertModuleOwnership(ctx, tokenIdentifier, args.moduleId);

    const now = Date.now();
    return await ctx.db.insert("importBatches", {
      tokenIdentifier,
      moduleId: args.moduleId,
      name: args.name,
      status: "pending",
      totalFiles: args.totalFiles,
      processedFiles: 0,
      autoAcceptedFiles: 0,
      needsReviewFiles: 0,
      failedFiles: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBatch = mutation({
  args: {
    batchId: v.id("importBatches"),
    name: v.optional(v.string()),
    status: v.optional(importBatchStatus),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { batchId, ...updates } = args;
    await assertBatchOwnership(ctx, tokenIdentifier, batchId);

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.status !== undefined) patch.status = updates.status;

    await ctx.db.patch(batchId, patch);
    return batchId;
  },
});

export const removeBatch = mutation({
  args: { batchId: v.id("importBatches") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertBatchOwnership(ctx, tokenIdentifier, args.batchId);

    await ctx.runMutation(internal.cleanup.deleteImportBatchData, {
      batchId: args.batchId,
    });
    return args.batchId;
  },
});

export const registerFile = mutation({
  args: {
    batchId: v.id("importBatches"),
    storageId: v.id("_storage"),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const batch = await assertBatchOwnership(ctx, tokenIdentifier, args.batchId);

    const now = Date.now();
    const importedFileId = await ctx.db.insert("importedFiles", {
      tokenIdentifier,
      batchId: args.batchId,
      moduleId: batch.moduleId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      extractionStatus: "pending",
      classificationStatus: "pending",
      rawRetainedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return importedFileId;
  },
});

export const updateFileClassification = mutation({
  args: {
    importedFileId: v.id("importedFiles"),
    primaryLabel: v.optional(classificationLabel),
    confidence: v.optional(v.number()),
    classificationStatus: v.optional(importFileClassificationStatus),
    rationale: v.optional(v.string()),
    reviewedLabel: v.optional(classificationLabel),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { importedFileId, ...updates } = args;
    const file = await ctx.db.get(importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.primaryLabel !== undefined)
      patch.primaryLabel = updates.primaryLabel;
    if (updates.confidence !== undefined)
      patch.confidence = updates.confidence;
    if (updates.classificationStatus !== undefined)
      patch.classificationStatus = updates.classificationStatus;
    if (updates.rationale !== undefined) patch.rationale = updates.rationale;
    if (updates.reviewedLabel !== undefined) {
      patch.reviewedLabel = updates.reviewedLabel;
      patch.reviewedAt = Date.now();
    }

    await ctx.db.patch(importedFileId, patch);
    return importedFileId;
  },
});

export const confirmClassification = mutation({
  args: { importedFileId: v.id("importedFiles") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.importedFileId, {
      classificationStatus: "accepted",
      reviewedLabel: file.primaryLabel,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await syncLinkedSourceClassification(
      ctx,
      tokenIdentifier,
      file,
      file.primaryLabel,
      true,
    );
    return args.importedFileId;
  },
});

export const rejectClassification = mutation({
  args: { importedFileId: v.id("importedFiles") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.importedFileId, {
      classificationStatus: "rejected",
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });
    if (file.sourceId) {
      await ctx.db.patch(file.sourceId, {
        status: "needs_review",
        updatedAt: Date.now(),
      });
    }
    return args.importedFileId;
  },
});

export const editClassification = mutation({
  args: {
    importedFileId: v.id("importedFiles"),
    primaryLabel: classificationLabel,
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.importedFileId, {
      primaryLabel: args.primaryLabel,
      confidence: 1,
      classificationStatus: "accepted",
      reviewedLabel: args.primaryLabel,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });
    await syncLinkedSourceClassification(
      ctx,
      tokenIdentifier,
      file,
      args.primaryLabel,
      true,
    );
    return args.importedFileId;
  },
});

export const retryFile = mutation({
  args: { importedFileId: v.id("importedFiles") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.importedFileId, {
      extractionStatus: "pending",
      extractionError: undefined,
      classificationStatus: "pending",
      classificationError: undefined,
      updatedAt: Date.now(),
    });
    return args.importedFileId;
  },
});

export const removeFile = mutation({
  args: { importedFileId: v.id("importedFiles") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.importedFileId, {
      classificationStatus: "rejected",
      reviewedAt: Date.now(),
      removedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return args.importedFileId;
  },
});

export const applyFileToModule = mutation({
  args: {
    importedFileId: v.id("importedFiles"),
    folderId: v.optional(v.id("folders")),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const sourceId: Id<"sources"> = await ctx.runMutation(
      internal.imports.internalCreateSourceForFile,
      {
        importedFileId: args.importedFileId,
        tokenIdentifier,
        folderId: args.folderId,
        title: args.title,
      },
    );

    if (file.storageId) {
      await ctx.db.insert("processingJobs", {
        tokenIdentifier,
        sourceId,
        type: "ingestion",
        status: "queued",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.scheduler.runAfter(
        0,
        internal.ingestion.process.processSource,
        { sourceId },
      );
    }

    return sourceId;
  },
});

export const internalCreateSourceForFile = internalMutation({
  args: {
    importedFileId: v.id("importedFiles"),
    tokenIdentifier: v.string(),
    folderId: v.optional(v.id("folders")),
    title: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.importedFileId);
    if (!file || file.tokenIdentifier !== args.tokenIdentifier) {
      throw new Error("Not found");
    }

    if (file.sourceId) return file.sourceId;

    const mod = await ctx.db.get(file.moduleId);
    if (!mod || mod.tokenIdentifier !== args.tokenIdentifier) {
      throw new Error("Not found");
    }

    let folderId = args.folderId;
    if (folderId) {
      const folder = await ctx.db.get(folderId);
      if (
        !folder ||
        folder.tokenIdentifier !== args.tokenIdentifier ||
        folder.moduleId !== file.moduleId
      ) {
        throw new Error("Not found");
      }
    } else {
      folderId = await ensureSourceGroup(
        ctx,
        args.tokenIdentifier,
        file.moduleId,
        labelToFolderType(file.reviewedLabel ?? file.primaryLabel),
      );
    }

    const now = Date.now();
    const sourceType = labelToSourceType(file.reviewedLabel ?? file.primaryLabel);
    const title = args.title ?? file.fileName ?? "Imported source";

    const sourceId = await ctx.db.insert("sources", {
      tokenIdentifier: args.tokenIdentifier,
      moduleId: file.moduleId,
      folderId,
      batchId: file.batchId,
      importedFileId: args.importedFileId,
      title,
      type: sourceType,
      status: args.status ?? "queued",
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      storageId: file.storageId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.importedFileId, {
      sourceId,
      sourceCreatedAt: now,
      updatedAt: now,
    });

    return sourceId;
  },
});

export const internalGetBatchForProcessing = internalQuery({
  args: {
    batchId: v.id("importBatches"),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.tokenIdentifier !== args.tokenIdentifier) {
      return null;
    }

    const files = await ctx.db
      .query("importedFiles")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .take(200);

    return {
      batch: {
        _id: batch._id,
        moduleId: batch.moduleId,
        totalFiles: batch.totalFiles,
      },
      files: files
        .filter((f) => !f.removedAt && !f.sourceId)
        .map((f) => ({
          _id: f._id,
          storageId: f.storageId,
          fileName: f.fileName,
          fileType: f.fileType,
        })),
    };
  },
});

export const internalUpdateBatch = internalMutation({
  args: {
    batchId: v.id("importBatches"),
    status: v.optional(importBatchStatus),
    processedFiles: v.optional(v.number()),
    autoAcceptedFiles: v.optional(v.number()),
    needsReviewFiles: v.optional(v.number()),
    failedFiles: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.status !== undefined) patch.status = args.status;
    if (args.processedFiles !== undefined)
      patch.processedFiles = args.processedFiles;
    if (args.autoAcceptedFiles !== undefined)
      patch.autoAcceptedFiles = args.autoAcceptedFiles;
    if (args.needsReviewFiles !== undefined)
      patch.needsReviewFiles = args.needsReviewFiles;
    if (args.failedFiles !== undefined)
      patch.failedFiles = args.failedFiles;
    await ctx.db.patch(args.batchId, patch);
    return args.batchId;
  },
});

export const internalUpdateFileExtraction = internalMutation({
  args: {
    fileId: v.id("importedFiles"),
    extractionStatus: v.optional(importFileExtractionStatus),
    extractionError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.extractionStatus !== undefined)
      patch.extractionStatus = args.extractionStatus;
    if (args.extractionError !== undefined)
      patch.extractionError = args.extractionError;
    await ctx.db.patch(args.fileId, patch);
    return args.fileId;
  },
});

export const internalUpdateFileClassification = internalMutation({
  args: {
    fileId: v.id("importedFiles"),
    classificationStatus: v.optional(importFileClassificationStatus),
    labels: v.optional(v.array(classificationLabel)),
    primaryLabel: v.optional(classificationLabel),
    confidence: v.optional(v.number()),
    rationale: v.optional(v.string()),
    classificationError: v.optional(v.string()),
    modelUsed: v.optional(v.string()),
    providerUsed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.classificationStatus !== undefined)
      patch.classificationStatus = args.classificationStatus;
    if (args.labels !== undefined) patch.labels = args.labels;
    if (args.primaryLabel !== undefined)
      patch.primaryLabel = args.primaryLabel;
    if (args.confidence !== undefined) patch.confidence = args.confidence;
    if (args.rationale !== undefined) patch.rationale = args.rationale;
    if (args.classificationError !== undefined)
      patch.classificationError = args.classificationError;
    if (args.modelUsed !== undefined) patch.modelUsed = args.modelUsed;
    if (args.providerUsed !== undefined)
      patch.providerUsed = args.providerUsed;
    await ctx.db.patch(args.fileId, patch);
    return args.fileId;
  },
});

const TERMINAL_EXTRACTION = new Set([
  "extracted",
  "unsupported",
  "skipped",
  "failed",
]);

export const _recomputeBatchProgress = internalMutation({
  args: { batchId: v.id("importBatches") },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) return null;

    const files = await ctx.db
      .query("importedFiles")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .take(500);

    let processed = 0;
    let autoAccepted = 0;
    let needsReview = 0;
    let failed = 0;

    for (const f of files) {
      if (TERMINAL_EXTRACTION.has(f.extractionStatus)) processed++;
      if (f.classificationStatus === "auto_accepted") autoAccepted++;
      if (f.classificationStatus === "needs_review") needsReview++;
      if (
        f.extractionStatus === "failed" ||
        f.classificationStatus === "failed"
      )
        failed++;
    }

    let status = batch.status;
    if (processed >= batch.totalFiles && batch.totalFiles > 0) {
      status =
        failed >= batch.totalFiles
          ? "failed"
          : failed > 0
            ? "partial"
            : "completed";
    } else if (processed > 0) {
      status = "processing";
    }

    await ctx.db.patch(args.batchId, {
      processedFiles: processed,
      autoAcceptedFiles: autoAccepted,
      needsReviewFiles: needsReview,
      failedFiles: failed,
      status,
      updatedAt: Date.now(),
    });

    return { processed, autoAccepted, needsReview, failed, status };
  },
});
