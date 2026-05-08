import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

export const list = query({
  args: {
    userId: v.string(),
    moduleId: v.optional(v.id("modules")),
  },
  handler: async (ctx, args) => {
    if (args.moduleId) {
      const sources = await ctx.db
        .query("sources")
        .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId!))
        .order("desc")
        .collect();

      return sources.filter((source) => source.userId === args.userId);
    }

    return await ctx.db
      .query("sources")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const createPlaceholder = mutation({
  args: {
    userId: v.string(),
    moduleId: v.id("modules"),
    folderId: v.optional(v.id("folders")),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("sources", {
      ...args,
      type: args.type ?? "journal_article",
      status: "placeholder",
      createdAt: now,
      updatedAt: now,
    });
  },
});
