import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

function now() {
  return new Date().toISOString();
}

function normalizedStatus(status?: string, processingStatus?: string) {
  if (status === "ready" || status === "processed") return "processed";
  if (status === "error" || status === "failed" || processingStatus === "error") return "failed";
  if (status === "unprocessed") return "unprocessed";
  return "processing";
}

function tagsFromSource(src: any) {
  if (Array.isArray(src.tags)) return src.tags;
  if (src.concepts) return src.concepts.split(",").map((concept: string) => concept.trim()).filter(Boolean);
  return [];
}

function sourceView(src: any, mod?: any, linkedKnowledgeCount = 0) {
  const author = src.author || src.authors || "Unknown";
  return {
    id: src._id,
    userId: src.userId,
    moduleId: src.moduleId,
    folderId: src.folderId,
    title: src.title,
    author,
    authors: src.authors || author,
    year: src.year,
    type: src.type || "reading",
    status: normalizedStatus(src.status, src.processingStatus),
    rawStatus: src.status,
    processingStatus: src.processingStatus,
    relevance: src.relevance || "unknown",
    tags: tagsFromSource(src),
    citation: src.citation || (author && src.year ? `${author} (${src.year})` : ""),
    fileUrl: src.fileUrl,
    fileName: src.fileName,
    fileType: src.fileType,
    fileSize: src.fileSize,
    storagePath: src.storagePath,
    extractedText: src.extractedText || src.rawText || "",
    rawText: src.rawText,
    summary: src.summary || "",
    keyArguments: src.keyArguments || "",
    concepts: src.concepts || "",
    errorMessage: src.errorMessage || "",
    wordCount: src.wordCount || 0,
    linkedKnowledgeCount,
    createdAt: src.createdAt || new Date(src._creationTime).toISOString(),
    updatedAt: src.updatedAt || src.createdAt || new Date(src._creationTime).toISOString(),
    _creationTime: src._creationTime,
    module: mod ? { title: mod.name || mod.title, code: mod.moduleCode || mod.code } : null,
  };
}

async function linkedKnowledgeCounts(ctx: any, userId: string, moduleId: string) {
  const pages = await ctx.db
    .query("knowledgePages")
    .withIndex("by_userId_moduleId", (q: any) => q.eq("userId", userId).eq("moduleId", moduleId))
    .take(1000);
  const counts: Record<string, number> = {};
  for (const page of pages) {
    for (const sourceId of page.linkedSourceIds || []) {
      counts[sourceId] = (counts[sourceId] || 0) + 1;
    }
  }
  return counts;
}

export const getByUserId = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const sources = await ctx.db.query("sources").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(1000);

    const results = [];
    for (const src of sources) {
      const mod = await ctx.db.get(src.moduleId as any) as any;
      results.push(sourceView(src, mod));
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

    const counts = await linkedKnowledgeCounts(ctx, userId, moduleId);
    const sources = await ctx.db
      .query("sources")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .order("desc")
      .take(1000);

    return sources.map((src) => sourceView(src, mod, counts[src._id] || 0));
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
    const sources = await ctx.db.query("sources").withIndex("by_folderId", (q) => q.eq("folderId", folderId)).order("desc").take(1000);
    return sources.map((src) => sourceView(src, mod));
  },
});

export const getById = query({
  args: { userId: v.string(), sourceId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, sourceId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const source = await ctx.db.get(sourceId as any) as any;
    if (!source || source.userId !== userId) return null;

    const mod = await ctx.db.get(source.moduleId as any) as any;
    const chunks = await ctx.db.query("sourceChunks").withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId)).order("asc").take(500);
    const knowledgePages = await ctx.db
      .query("knowledgePages")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", source.moduleId))
      .take(1000);
    const linkedKnowledgePages = knowledgePages
      .filter((page) => page.linkedSourceIds.includes(sourceId))
      .map((page) => ({
        id: page._id,
        title: page.title,
        type: page.type,
        updatedAt: page.updatedAt,
      }));

    return {
      ...sourceView(source, mod, linkedKnowledgePages.length),
      chunks: chunks.map((c) => ({
        id: c._id,
        sourceId: c.sourceId,
        chunkIndex: c.chunkIndex,
        text: c.text,
        charCount: c.charCount,
        tokenEstimate: c.tokenEstimate,
        pageNumber: c.pageNumber,
      })),
      linkedKnowledgePages,
    };
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    folderId: v.optional(v.string()),
    title: v.string(),
    author: v.optional(v.string()),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.optional(v.string()),
    relevance: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    citation: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
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
    const timestamp = now();
    const author = args.author || args.authors || "Unknown";
    return ctx.db.insert("sources", {
      userId: args.userId,
      moduleId: args.moduleId,
      folderId: args.folderId,
      title: args.title,
      author,
      authors: author,
      year: args.year ?? new Date().getFullYear(),
      type: args.type || "reading",
      relevance: args.relevance || "unknown",
      tags: args.tags || [],
      citation: args.citation || "",
      fileUrl: args.fileUrl,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      storagePath: args.storagePath,
      status: args.status || "processing",
      processingStatus: args.processingStatus || "extracting",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const update = mutation({
  args: {
    sourceId: v.string(),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.optional(v.string()),
    relevance: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    citation: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    rawText: v.optional(v.string()),
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
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    if (data.author && !data.authors) patch.authors = data.author;
    if (data.authors && !data.author) patch.author = data.authors;
    await ctx.db.patch(sourceId as any, patch);
    const updated = await ctx.db.get(sourceId as any) as any;
    return sourceView(updated);
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
    await ctx.db.patch(sourceId as any, { ...data, updatedAt: now() });
    const updated = await ctx.db.get(sourceId as any) as any;
    return sourceView(updated);
  },
});
