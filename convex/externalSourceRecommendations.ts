import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

export const listByModule = query({
  args: { userId: v.string(), moduleId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("externalSourceRecommendations")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", args.userId).eq("moduleId", args.moduleId))
      .order("desc")
      .collect();
  },
});

export const listByAssignment = query({
  args: { userId: v.string(), assignmentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("externalSourceRecommendations")
      .withIndex("by_userId_assignmentId", (q) => q.eq("userId", args.userId).eq("assignmentId", args.assignmentId))
      .order("desc")
      .collect();
  },
});

export const listSavedByModule = query({
  args: { userId: v.string(), moduleId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("externalSourceRecommendations")
      .withIndex("by_userId_moduleId_status", (q) => q.eq("userId", args.userId).eq("moduleId", args.moduleId).eq("status", "saved"))
      .order("desc")
      .collect();
  },
});

export const listSavedByAssignment = query({
  args: { userId: v.string(), assignmentId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("externalSourceRecommendations")
      .withIndex("by_userId_assignmentId", (q) => q.eq("userId", args.userId).eq("assignmentId", args.assignmentId))
      .order("desc")
      .collect();
    return all.filter((r) => r.status === "saved" || r.status === "imported");
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    assignmentId: v.optional(v.string()),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    sourceType: v.union(
      v.literal("book"),
      v.literal("journal_article"),
      v.literal("report"),
      v.literal("dataset"),
      v.literal("lecture_resource"),
      v.literal("website"),
      v.literal("other"),
    ),
    whyUseful: v.optional(v.string()),
    recommendedUse: v.union(
      v.literal("core"),
      v.literal("supporting"),
      v.literal("opposing"),
      v.literal("theoretical"),
      v.literal("empirical_case"),
      v.literal("methodological"),
      v.literal("background"),
    ),
    searchQuery: v.optional(v.string()),
    possibleCitation: v.optional(v.string()),
    url: v.optional(v.string()),
    publisherOrJournal: v.optional(v.string()),
    confidence: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("externalSourceRecommendations", {
      ...args,
      status: "suggested",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const bulkCreate = mutation({
  args: {
    recommendations: v.array(v.object({
      userId: v.string(),
      moduleId: v.string(),
      assignmentId: v.optional(v.string()),
      title: v.string(),
      authors: v.optional(v.string()),
      year: v.optional(v.number()),
      sourceType: v.union(
        v.literal("book"),
        v.literal("journal_article"),
        v.literal("report"),
        v.literal("dataset"),
        v.literal("lecture_resource"),
        v.literal("website"),
        v.literal("other"),
      ),
      whyUseful: v.optional(v.string()),
      recommendedUse: v.union(
        v.literal("core"),
        v.literal("supporting"),
        v.literal("opposing"),
        v.literal("theoretical"),
        v.literal("empirical_case"),
        v.literal("methodological"),
        v.literal("background"),
      ),
      searchQuery: v.optional(v.string()),
      possibleCitation: v.optional(v.string()),
      url: v.optional(v.string()),
      publisherOrJournal: v.optional(v.string()),
      confidence: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const ids: string[] = [];
    for (const rec of args.recommendations) {
      const id = await ctx.db.insert("externalSourceRecommendations", {
        ...rec,
        status: "suggested",
        createdAt: now,
        updatedAt: now,
      });
      ids.push(id);
    }
    return ids;
  },
});

export const updateStatus = mutation({
  args: {
    userId: v.string(),
    recommendationId: v.id("externalSourceRecommendations"),
    status: v.union(
      v.literal("suggested"),
      v.literal("saved"),
      v.literal("dismissed"),
      v.literal("imported"),
    ),
  },
  handler: async (ctx, args) => {
    const doc: Doc<"externalSourceRecommendations"> | null = await ctx.db.get(args.recommendationId);
    if (!doc || doc.userId !== args.userId) throw new Error("Not found");
    await ctx.db.patch(args.recommendationId, {
      status: args.status,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const remove = mutation({
  args: { userId: v.string(), recommendationId: v.id("externalSourceRecommendations") },
  handler: async (ctx, args) => {
    const doc: Doc<"externalSourceRecommendations"> | null = await ctx.db.get(args.recommendationId);
    if (!doc || doc.userId !== args.userId) throw new Error("Not found");
    await ctx.db.delete(args.recommendationId);
  },
});
