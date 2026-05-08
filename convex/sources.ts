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
        .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId!))
        .order("desc")
        .take(200)
        .then((sources) =>
          sources.filter((s) => s.tokenIdentifier === tokenIdentifier),
        );
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
