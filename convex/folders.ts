import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

export const list = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("folders")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("asc")
      .take(100);
  },
});

export const create = mutation({
  args: {
    moduleId: v.id("modules"),
    parentFolderId: v.optional(v.id("folders")),
    name: v.string(),
    type: v.string(),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.parentFolderId) {
      const parent = await ctx.db.get(args.parentFolderId);
      if (
        !parent ||
        parent.tokenIdentifier !== tokenIdentifier ||
        parent.moduleId !== args.moduleId
      ) {
        throw new Error("Not found");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("folders", {
      tokenIdentifier,
      moduleId: args.moduleId,
      parentFolderId: args.parentFolderId,
      name: args.name,
      type: args.type,
      sortOrder: args.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    folderId: v.id("folders"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    parentFolderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { folderId, ...updates } = args;
    const folder = await ctx.db.get(folderId);
    if (!folder || folder.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(folderId, { ...updates, updatedAt: Date.now() });
    return folderId;
  },
});

export const remove = mutation({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const folder = await ctx.db.get(args.folderId);
    if (!folder || folder.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.folderId);
    return args.folderId;
  },
});
