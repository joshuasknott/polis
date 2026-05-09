import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

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
          q.eq("tokenIdentifier", tokenIdentifier).eq("moduleId", args.moduleId!),
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

export const get = query({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) return null;
    return source;
  },
});

export const createPlaceholder = mutation({
  args: {
    moduleId: v.id("modules"),
    folderId: v.optional(v.id("folders")),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.optional(v.string()),
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
      if (!folder || folder.tokenIdentifier !== tokenIdentifier || folder.moduleId !== args.moduleId) {
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
    type: v.optional(v.string()),
    status: v.optional(v.string()),
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

    await ctx.db.patch(args.sourceId, {
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      status: "processing",
      updatedAt: Date.now(),
    });
    return args.sourceId;
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
          q
            .eq("sourceId", args.sourceId)
            .eq("analysisType", args.analysisType!),
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
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .order("asc")
      .take(500);
  },
});
