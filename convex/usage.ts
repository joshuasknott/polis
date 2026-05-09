import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import { paginationOptsValidator } from "convex/server";

const USAGE_TYPES = v.union(
  v.literal("chat"),
  v.literal("embedding"),
  v.literal("retrieval"),
  v.literal("source_analysis"),
  v.literal("draft_review"),
  v.literal("citation_check"),
  v.literal("ingestion"),
);

export const recordEvent = mutation({
  args: {
    type: USAGE_TYPES,
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    costEstimate: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await ctx.db.insert("usageEvents", {
      tokenIdentifier,
      type: args.type,
      provider: args.provider,
      model: args.model,
      tokensIn: args.tokensIn,
      tokensOut: args.tokensOut,
      costEstimate: args.costEstimate,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

export const recordEventInternal = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    type: USAGE_TYPES,
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    costEstimate: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("usageEvents", {
      tokenIdentifier: args.tokenIdentifier,
      type: args.type,
      provider: args.provider,
      model: args.model,
      tokensIn: args.tokensIn,
      tokensOut: args.tokensOut,
      costEstimate: args.costEstimate,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(100);
  },
});

export const listEventsPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getStatsAllTime = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    let tokensIn = 0;
    let tokensOut = 0;
    let costEstimate = 0;
    let count = 0;

    for await (const event of ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )) {
      tokensIn += event.tokensIn ?? 0;
      tokensOut += event.tokensOut ?? 0;
      costEstimate += event.costEstimate ?? 0;
      count++;
    }

    return { tokensIn, tokensOut, costEstimate, count };
  },
});

export const getStatsThisMonth = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let tokensIn = 0;
    let tokensOut = 0;
    let costEstimate = 0;
    let count = 0;

    for await (const event of ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )) {
      if (event.createdAt < monthStart) break;
      tokensIn += event.tokensIn ?? 0;
      tokensOut += event.tokensOut ?? 0;
      costEstimate += event.costEstimate ?? 0;
      count++;
    }

    return { tokensIn, tokensOut, costEstimate, count };
  },
});

export const getStatsByType = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const agg = new Map<string, { tokensIn: number; tokensOut: number; costEstimate: number; count: number }>();

    for await (const event of ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )) {
      const existing = agg.get(event.type) ?? { tokensIn: 0, tokensOut: 0, costEstimate: 0, count: 0 };
      existing.tokensIn += event.tokensIn ?? 0;
      existing.tokensOut += event.tokensOut ?? 0;
      existing.costEstimate += event.costEstimate ?? 0;
      existing.count++;
      agg.set(event.type, existing);
    }

    return Array.from(agg.entries()).map(([type, stats]) => ({ type, ...stats }));
  },
});

export const getStatsByModel = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const agg = new Map<string, { tokensIn: number; tokensOut: number; costEstimate: number; count: number }>();

    for await (const event of ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )) {
      const key = event.model ?? "unknown";
      const existing = agg.get(key) ?? { tokensIn: 0, tokensOut: 0, costEstimate: 0, count: 0 };
      existing.tokensIn += event.tokensIn ?? 0;
      existing.tokensOut += event.tokensOut ?? 0;
      existing.costEstimate += event.costEstimate ?? 0;
      existing.count++;
      agg.set(key, existing);
    }

    return Array.from(agg.entries()).map(([model, stats]) => ({ model, ...stats }));
  },
});

export const getStatsByProvider = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const agg = new Map<string, { tokensIn: number; tokensOut: number; costEstimate: number; count: number }>();

    for await (const event of ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )) {
      const key = event.provider ?? "unknown";
      const existing = agg.get(key) ?? { tokensIn: 0, tokensOut: 0, costEstimate: 0, count: 0 };
      existing.tokensIn += event.tokensIn ?? 0;
      existing.tokensOut += event.tokensOut ?? 0;
      existing.costEstimate += event.costEstimate ?? 0;
      existing.count++;
      agg.set(key, existing);
    }

    return Array.from(agg.entries()).map(([provider, stats]) => ({ provider, ...stats }));
  },
});

export const getRetrievalBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const counts = new Map<string, number>();

    for await (const event of ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier_and_type", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("type", "retrieval"),
      )) {
      if (event.createdAt < thirtyDaysAgo) break;
      const mode = (event.metadata as Record<string, string> | null)?.mode ?? "hybrid";
      counts.set(mode, (counts.get(mode) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([mode, count]) => ({ mode, count }));
  },
});

export const getRecentEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let allTokensIn = 0;
    let allTokensOut = 0;
    let allCost = 0;
    let allCount = 0;
    let monthTokensIn = 0;
    let monthTokensOut = 0;
    let monthCost = 0;
    let monthCount = 0;
    const byType = new Map<string, { tokensIn: number; tokensOut: number; costEstimate: number; count: number }>();
    const byModel = new Map<string, { tokensIn: number; tokensOut: number; costEstimate: number; count: number }>();
    const retrievalModes = new Map<string, number>();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    for await (const event of ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )) {
      const ti = event.tokensIn ?? 0;
      const to = event.tokensOut ?? 0;
      const ce = event.costEstimate ?? 0;

      allTokensIn += ti;
      allTokensOut += to;
      allCost += ce;
      allCount++;

      if (event.createdAt >= monthStart) {
        monthTokensIn += ti;
        monthTokensOut += to;
        monthCost += ce;
        monthCount++;
      }

      const typeKey = event.type;
      const typeExisting = byType.get(typeKey) ?? { tokensIn: 0, tokensOut: 0, costEstimate: 0, count: 0 };
      typeExisting.tokensIn += ti;
      typeExisting.tokensOut += to;
      typeExisting.costEstimate += ce;
      typeExisting.count++;
      byType.set(typeKey, typeExisting);

      const modelKey = event.model ?? "unknown";
      const modelExisting = byModel.get(modelKey) ?? { tokensIn: 0, tokensOut: 0, costEstimate: 0, count: 0 };
      modelExisting.tokensIn += ti;
      modelExisting.tokensOut += to;
      modelExisting.costEstimate += ce;
      modelExisting.count++;
      byModel.set(modelKey, modelExisting);

      if (event.type === "retrieval" && event.createdAt >= thirtyDaysAgo) {
        const mode = (event.metadata as Record<string, string> | null)?.mode ?? "hybrid";
        retrievalModes.set(mode, (retrievalModes.get(mode) ?? 0) + 1);
      }
    }

    const recentLogs: Array<{
      id: string;
      provider: string;
      model: string;
      type: string;
      tokensIn: number;
      tokensOut: number;
      costEstimate: number;
      createdAt: number;
    }> = [];

    const recent = await ctx.db
      .query("usageEvents")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(20);

    for (const e of recent) {
      recentLogs.push({
        id: e._id,
        provider: e.provider ?? "",
        model: e.model ?? "",
        type: e.type,
        tokensIn: e.tokensIn ?? 0,
        tokensOut: e.tokensOut ?? 0,
        costEstimate: e.costEstimate ?? 0,
        createdAt: e.createdAt,
      });
    }

    return {
      allTime: { tokensIn: allTokensIn, tokensOut: allTokensOut, costEstimate: allCost, count: allCount },
      thisMonth: { tokensIn: monthTokensIn, tokensOut: monthTokensOut, costEstimate: monthCost, count: monthCount },
      byType: Array.from(byType.entries()).map(([type, stats]) => ({ type, ...stats })),
      byModel: Array.from(byModel.entries()).map(([model, stats]) => ({ model, ...stats })),
      retrievalBreakdown: Array.from(retrievalModes.entries()).map(([mode, count]) => ({ mode, count })),
      recentLogs,
    };
  },
});
