import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import { internal } from "./_generated/api";
import { sourceType, sourceStatus } from "./lib/validators";
import { assertSupportedUpload, inferSourceType, normalizeFileType } from "./ingestion/lib";

export const list = query({
  args: {
    moduleId: v.optional(v.id("modules")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    if (args.moduleId) {
      return await ctx.db
        .query("sources")
        .withIndex("by_tokenIdentifier_and_module", (q) =>
          q
            .eq("tokenIdentifier", tokenIdentifier)
            .eq("moduleId", args.moduleId!),
        )
        .order("desc")
        .take(200);
    }

    return await ctx.db
      .query("sources")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(200);
  },
});

export const listByStatus = query({
  args: {
    moduleId: v.id("modules"),
    status: sourceStatus,
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("sources")
      .withIndex("by_module_and_status", (q) =>
        q.eq("moduleId", args.moduleId).eq("status", args.status),
      )
      .take(200);
  },
});

export const get = query({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) return null;
    return source;
  },
});

export const createForUpload = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.string(),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    folderType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = Date.now();

    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    let folderId: import("./_generated/dataModel").Id<"folders"> | undefined;
    if (args.folderType) {
      const folders = await ctx.db
        .query("folders")
        .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
        .take(20);
      const found = folders.find((f) => f.type === args.folderType);
      if (found) folderId = found._id;
    }

    const fileType = normalizeFileType(
      args.fileName ?? "",
      args.fileType,
    );

    if (args.fileName || args.fileSize != null) {
      assertSupportedUpload({
        fileName: args.fileName,
        fileType,
        fileSize: args.fileSize,
      });
    }

    return await ctx.db.insert("sources", {
      tokenIdentifier,
      moduleId: args.moduleId,
      folderId,
      title: args.title,
      type: args.fileName ? inferSourceType(args.fileName) : "report",
      status: "uploading",
      fileName: args.fileName,
      fileType,
      fileSize: args.fileSize,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createPlaceholder = mutation({
  args: {
    moduleId: v.id("modules"),
    folderId: v.optional(v.id("folders")),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.optional(sourceType),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = Date.now();
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId);
      if (
        !folder ||
        folder.tokenIdentifier !== tokenIdentifier ||
        folder.moduleId !== args.moduleId
      ) {
        throw new Error("Not found");
      }
    }

    return await ctx.db.insert("sources", {
      ...args,
      tokenIdentifier,
      type: args.type ?? "journal_article",
      status: "placeholder",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    sourceId: v.id("sources"),
    title: v.optional(v.string()),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.optional(sourceType),
    status: v.optional(sourceStatus),
    citation: v.optional(v.string()),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { sourceId, ...updates } = args;
    const source = await ctx.db.get(sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(sourceId, { ...updates, updatedAt: Date.now() });
    return sourceId;
  },
});

export const remove = mutation({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const chunks = await ctx.db
      .query("sourceChunks")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(500);
    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    const notes = await ctx.db
      .query("sourceNotes")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(200);
    for (const note of notes) {
      await ctx.db.delete(note._id);
    }

    if (source.storageId) {
      try {
        await ctx.storage.delete(source.storageId);
      } catch {}
    }

    const jobs = await ctx.db
      .query("processingJobs")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(50);
    for (const job of jobs) {
      await ctx.db.delete(job._id);
    }

    await ctx.db.delete(args.sourceId);
    return args.sourceId;
  },
});

export const attachStorage = mutation({
  args: {
    sourceId: v.id("sources"),
    storageId: v.id("_storage"),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();
    const metadata = await ctx.db.system.get("_storage", args.storageId);
    if (!metadata) {
      throw new Error("Uploaded file not found");
    }

    const fileName = args.fileName ?? source.fileName;
    let fileType: string;
    try {
      fileType = assertSupportedUpload({
        fileName,
        fileType: args.fileType ?? metadata.contentType,
        fileSize: metadata.size,
      });
    } catch (error) {
      try {
        await ctx.storage.delete(args.storageId);
      } catch {}
      throw error;
    }

    await ctx.db.patch(args.sourceId, {
      storageId: args.storageId,
      fileName,
      fileType,
      fileSize: metadata.size,
      status: "queued",
      errorMessage: undefined,
      updatedAt: now,
    });

    await ctx.db.insert("processingJobs", {
      tokenIdentifier,
      sourceId: args.sourceId,
      type: "ingestion",
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.ingestion.process.processSource,
      { sourceId: args.sourceId },
    );

    return args.sourceId;
  },
});

export const retryProcessing = mutation({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (!source.storageId) {
      throw new Error("No file attached to source");
    }

    const now = Date.now();

    const existingChunks = await ctx.db
      .query("sourceChunks")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(500);
    for (const chunk of existingChunks) {
      await ctx.db.delete(chunk._id);
    }

    await ctx.db.patch(args.sourceId, {
      status: "queued",
      errorMessage: undefined,
      updatedAt: now,
    });

    await ctx.db.insert("processingJobs", {
      tokenIdentifier,
      sourceId: args.sourceId,
      type: "ingestion",
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.ingestion.process.processSource,
      { sourceId: args.sourceId },
    );

    return args.sourceId;
  },
});

export const internalGet = internalQuery({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sourceId);
  },
});

export const updateStatus = internalMutation({
  args: {
    sourceId: v.id("sources"),
    status: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: {
      status: string;
      updatedAt: number;
      errorMessage?: string;
    } = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.errorMessage !== undefined) {
      patch.errorMessage = args.errorMessage;
    }
    await ctx.db.patch(args.sourceId, patch);

    const jobs = await ctx.db
      .query("processingJobs")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .order("desc")
      .take(1);
    if (jobs.length > 0) {
      await ctx.db.patch(jobs[0]._id, {
        status: args.status,
        errorMessage: args.errorMessage,
        updatedAt: Date.now(),
      });
    }
  },
});

export const saveChunks = internalMutation({
  args: {
    sourceId: v.id("sources"),
    chunks: v.array(
      v.object({
        chunkIndex: v.number(),
        text: v.string(),
        pageStart: v.optional(v.number()),
        pageEnd: v.optional(v.number()),
        tokenEstimate: v.number(),
        citationLabel: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const chunk of args.chunks) {
      await ctx.db.insert("sourceChunks", {
        sourceId: args.sourceId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        tokenEstimate: chunk.tokenEstimate,
        citationLabel: chunk.citationLabel,
        createdAt: now,
      });
    }

    await ctx.db.patch(args.sourceId, {
      status: "processed",
      errorMessage: undefined,
      updatedAt: now,
    });

    const jobs = await ctx.db
      .query("processingJobs")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .order("desc")
      .take(1);
    if (jobs.length > 0) {
      await ctx.db.patch(jobs[0]._id, {
        status: "processed",
        updatedAt: now,
      });
    }
  },
});

export const listAnalyses = query({
  args: {
    sourceId: v.id("sources"),
    analysisType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) return [];

    if (args.analysisType) {
      return await ctx.db
        .query("sourceAnalyses")
        .withIndex("by_source_and_type", (q) =>
          q.eq("sourceId", args.sourceId).eq("analysisType", args.analysisType!),
        )
        .take(50);
    }

    return await ctx.db
      .query("sourceAnalyses")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(100);
  },
});

export const listChunks = query({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("sourceChunks")
      .withIndex("by_source_and_chunkIndex", (q) =>
        q.eq("sourceId", args.sourceId),
      )
      .order("asc")
      .take(500);
  },
});
