import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

export const recordError = mutation({
  args: {
    source: v.string(),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    errorType: v.string(),
    errorMessage: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await ctx.db.insert("errorEvents", {
      tokenIdentifier,
      source: args.source,
      provider: args.provider,
      model: args.model,
      errorType: args.errorType,
      errorMessage: args.errorMessage,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

export const recordErrorInternal = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    source: v.string(),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    errorType: v.string(),
    errorMessage: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("errorEvents", {
      tokenIdentifier: args.tokenIdentifier,
      source: args.source,
      provider: args.provider,
      model: args.model,
      errorType: args.errorType,
      errorMessage: args.errorMessage,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

export const listRecentErrors = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await ctx.db
      .query("errorEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getErrorCounts = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const bySource = new Map<string, number>();
    const byType = new Map<string, number>();
    let total = 0;

    const events = await ctx.db
      .query("errorEvents")
      .withIndex("by_tokenIdentifier_and_createdAt", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(500);

    for (const event of events) {
      if (event.createdAt < twentyFourHoursAgo) break;
      bySource.set(event.source, (bySource.get(event.source) ?? 0) + 1);
      byType.set(event.errorType, (byType.get(event.errorType) ?? 0) + 1);
      total++;
    }

    return {
      total,
      bySource: Array.from(bySource.entries()).map(([source, count]) => ({ source, count })),
      byType: Array.from(byType.entries()).map(([errorType, count]) => ({ errorType, count })),
    };
  },
});

export const getProcessingStatus = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const jobs: Array<{
      id: string;
      type: string;
      status: string;
      errorMessage: string | null;
      sourceId: string | null;
      createdAt: number;
    }> = [];

    const recent = await ctx.db
      .query("processingJobs")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(20);

    for (const job of recent) {
      if (job.createdAt < twentyFourHoursAgo) break;
      jobs.push({
        id: job._id,
        type: job.type,
        status: job.status,
        errorMessage: job.errorMessage ?? null,
        sourceId: job.sourceId ?? null,
        createdAt: job.createdAt,
      });
    }

    const failed = jobs.filter((j) => j.status === "failed").length;
    const pending = jobs.filter((j) => j.status === "pending" || j.status === "processing").length;

    return {
      recentJobs: jobs,
      failedCount: failed,
      pendingCount: pending,
    };
  },
});
