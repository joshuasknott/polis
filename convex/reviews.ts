import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

export const listForDraft = query({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("reviewRuns")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .order("desc")
      .take(20);
  },
});

export const get = query({
  args: { reviewRunId: v.id("reviewRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return null;
    return run;
  },
});

export const getWithFindings = query({
  args: { reviewRunId: v.id("reviewRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return null;

    const findings = await ctx.db
      .query("reviewFindings")
      .withIndex("by_reviewRun", (q) =>
        q.eq("reviewRunId", args.reviewRunId),
      )
      .take(100);

    return { ...run, findings };
  },
});

export const createRun = mutation({
  args: {
    draftId: v.id("drafts"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();
    return await ctx.db.insert("reviewRuns", {
      tokenIdentifier,
      draftId: args.draftId,
      status: args.status ?? "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateRun = mutation({
  args: {
    reviewRunId: v.id("reviewRuns"),
    status: v.optional(v.string()),
    overallFeedback: v.optional(v.string()),
    rubricAlignment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { reviewRunId, ...updates } = args;
    const run = await ctx.db.get(reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(reviewRunId, { ...updates, updatedAt: Date.now() });
    return reviewRunId;
  },
});

export const removeRun = mutation({
  args: { reviewRunId: v.id("reviewRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.reviewRunId);
    return args.reviewRunId;
  },
});

export const createFinding = mutation({
  args: {
    reviewRunId: v.id("reviewRuns"),
    category: v.string(),
    content: v.string(),
    severity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    return await ctx.db.insert("reviewFindings", {
      ...args,
      tokenIdentifier,
      createdAt: Date.now(),
    });
  },
});

export const listFindings = query({
  args: {
    reviewRunId: v.id("reviewRuns"),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.reviewRunId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return [];

    if (args.category) {
      return await ctx.db
        .query("reviewFindings")
        .withIndex("by_reviewRun_and_category", (q) =>
          q.eq("reviewRunId", args.reviewRunId).eq("category", args.category!),
        )
        .take(100);
    }

    return await ctx.db
      .query("reviewFindings")
      .withIndex("by_reviewRun", (q) =>
        q.eq("reviewRunId", args.reviewRunId),
      )
      .take(100);
  },
});

export const removeFinding = mutation({
  args: { findingId: v.id("reviewFindings") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const finding = await ctx.db.get(args.findingId);
    if (!finding || finding.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.findingId);
    return args.findingId;
  },
});

export const updateFinding = mutation({
  args: {
    findingId: v.id("reviewFindings"),
    category: v.optional(v.string()),
    content: v.optional(v.string()),
    severity: v.optional(v.string()),
    resolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { findingId, ...updates } = args;
    const finding = await ctx.db.get(findingId);
    if (!finding || finding.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(findingId, {
      ...updates,
      ...(args.resolved ? { resolvedAt: Date.now() } : {}),
    });
    return findingId;
  },
});
