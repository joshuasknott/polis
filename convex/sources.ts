import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const getByUserId = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const sources = await ctx.db.query("sources").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").collect();

    const results = [];
    for (const src of sources) {
      const mod = await ctx.db.get(src.moduleId as any) as any;
      results.push({
        id: src._id,
        moduleId: src.moduleId,
        folderId: src.folderId,
        title: src.title,
        authors: src.authors,
        year: src.year,
        type: src.type,
        status: src.status,
        processingStatus: src.processingStatus,
        errorMessage: src.errorMessage,
        wordCount: src.wordCount,
        _creationTime: src._creationTime,
        module: mod ? { title: mod.title, code: mod.code } : null,
      });
    }
    return results;
  },
});

export const getByModuleId = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return [];
    return ctx.db.query("sources").withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId)).order("desc").collect();
  },
});

export const getByFolderId = query({
  args: { userId: v.string(), folderId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, folderId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const folder = await ctx.db.get(folderId as any) as any;
    if (!folder) return [];
    const mod = await ctx.db.get(folder.moduleId as any) as any;
    if (!mod || mod.userId !== userId) return [];
    return ctx.db.query("sources").withIndex("by_folderId", (q) => q.eq("folderId", folderId)).order("desc").collect();
  },
});

export const getById = query({
  args: { userId: v.string(), sourceId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, sourceId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const source = await ctx.db.get(sourceId as any) as any;
    if (!source || source.userId !== userId) return null;

    const mod = await ctx.db.get(source.moduleId as any) as any;
    const chunks = await ctx.db.query("sourceChunks").withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId)).order("asc").collect();

    return {
      id: source._id,
      userId: source.userId,
      moduleId: source.moduleId,
      folderId: source.folderId,
      title: source.title,
      authors: source.authors,
      year: source.year,
      type: source.type,
      fileName: source.fileName,
      fileType: source.fileType,
      fileSize: source.fileSize,
      storagePath: source.storagePath,
      extractedText: source.extractedText,
      summary: source.summary,
      keyArguments: source.keyArguments,
      concepts: source.concepts,
      status: source.status,
      processingStatus: source.processingStatus,
      errorMessage: source.errorMessage,
      wordCount: source.wordCount,
      _creationTime: source._creationTime,
      module: mod ? { title: mod.title, code: mod.code } : null,
      chunks: chunks.map((c) => ({
        id: c._id,
        sourceId: c.sourceId,
        chunkIndex: c.chunkIndex,
        text: c.text,
        charCount: c.charCount,
        tokenEstimate: c.tokenEstimate,
        pageNumber: c.pageNumber,
      })),
    };
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    folderId: v.optional(v.string()),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storagePath: v.optional(v.string()),
    status: v.optional(v.string()),
    processingStatus: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const mod = await ctx.db.get(args.moduleId as any) as any;
    if (!mod || mod.userId !== args.userId) {
      throw new Error("Module not found");
    }
    if (args.folderId) {
      const folder = await ctx.db.get(args.folderId as any) as any;
      if (!folder || folder.moduleId !== args.moduleId) {
        throw new Error("Folder not found");
      }
    }
    return ctx.db.insert("sources", {
      userId: args.userId,
      moduleId: args.moduleId,
      folderId: args.folderId,
      title: args.title,
      authors: args.authors || "Unknown",
      year: args.year ?? 2026,
      type: args.type || "journal_article",
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      storagePath: args.storagePath,
      status: args.status || "processing",
      processingStatus: args.processingStatus || "extracting",
    });
  },
});

export const update = mutation({
  args: {
    sourceId: v.string(),
    extractedText: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    processingStatus: v.optional(v.string()),
    status: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyArguments: v.optional(v.string()),
    concepts: v.optional(v.string()),
    userId: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { sourceId, userId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const source = await ctx.db.get(sourceId as any) as any;
    if (!source || (userId && source.userId !== userId)) throw new Error("Source not found");
    const patch: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(sourceId as any, patch);
  },
});

export const updateAnalysis = mutation({
  args: {
    sourceId: v.string(),
    summary: v.optional(v.string()),
    keyArguments: v.optional(v.string()),
    concepts: v.optional(v.string()),
    userId: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { sourceId, userId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const source = await ctx.db.get(sourceId as any) as any;
    if (!source || (userId && source.userId !== userId)) throw new Error("Source not found");
    await ctx.db.patch(sourceId as any, data);
  },
});
