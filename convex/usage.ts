import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const log = mutation({
  args: {
    userId: v.string(),
    provider: v.string(),
    model: v.string(),
    type: v.string(),
    tokensIn: v.number(),
    tokensOut: v.number(),
    costEstimate: v.number(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const { serverSecret, ...data } = args;
    return ctx.db.insert("usageLogs", data);
  },
});

export const logRetrieval = mutation({
  args: {
    userId: v.string(),
    query: v.string(),
    moduleId: v.optional(v.string()),
    sourceIds: v.optional(v.string()),
    selectedChunkIds: v.optional(v.string()),
    mode: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const { serverSecret, ...data } = args;
    return ctx.db.insert("retrievalLogs", data);
  },
});

export const getStats = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - thirtyDaysMs;

    const allLogs = await ctx.db.query("usageLogs").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();

    const allTime = { tokensIn: 0, tokensOut: 0, costEstimate: 0, count: allLogs.length };
    const thisMonthLogs = [];
    const recentLogs = [];

    const startOfMonth = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();

    for (const log of allLogs) {
      allTime.tokensIn += log.tokensIn;
      allTime.tokensOut += log.tokensOut;
      allTime.costEstimate += log.costEstimate;

      if (log._creationTime >= startOfMonth) {
        thisMonthLogs.push(log);
      }
      if (log._creationTime >= thirtyDaysAgo) {
        recentLogs.push(log);
      }
    }

    const thisMonth = { tokensIn: 0, tokensOut: 0, costEstimate: 0, count: thisMonthLogs.length };
    for (const log of thisMonthLogs) {
      thisMonth.tokensIn += log.tokensIn;
      thisMonth.tokensOut += log.tokensOut;
      thisMonth.costEstimate += log.costEstimate;
    }

    const byType = new Map<string, { tokensIn: number; tokensOut: number; costEstimate: number; count: number }>();
    for (const log of thisMonthLogs) {
      const existing = byType.get(log.type) || { tokensIn: 0, tokensOut: 0, costEstimate: 0, count: 0 };
      existing.tokensIn += log.tokensIn;
      existing.tokensOut += log.tokensOut;
      existing.costEstimate += log.costEstimate;
      existing.count++;
      byType.set(log.type, existing);
    }

    const byModel = new Map<string, { tokensIn: number; tokensOut: number; costEstimate: number; count: number }>();
    for (const log of thisMonthLogs) {
      const existing = byModel.get(log.model) || { tokensIn: 0, tokensOut: 0, costEstimate: 0, count: 0 };
      existing.tokensIn += log.tokensIn;
      existing.tokensOut += log.tokensOut;
      existing.costEstimate += log.costEstimate;
      existing.count++;
      byModel.set(log.model, existing);
    }

    const retrievalLogs = await ctx.db.query("retrievalLogs").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    const recentRetrievalLogs = retrievalLogs.filter((r) => r._creationTime >= thirtyDaysAgo);
    const retrievalByMode = new Map<string, number>();
    for (const r of recentRetrievalLogs) {
      const mode = r.mode || "keyword";
      retrievalByMode.set(mode, (retrievalByMode.get(mode) || 0) + 1);
    }

    return {
      allTime,
      thisMonth,
      byType: [...byType.entries()].map(([type, data]) => ({ type, ...data })),
      byModel: [...byModel.entries()].map(([model, data]) => ({ model, ...data })),
      retrievalBreakdown: [...retrievalByMode.entries()].map(([mode, count]) => ({ mode, count })),
      recentLogs: recentLogs
        .sort((a, b) => b._creationTime - a._creationTime)
        .slice(0, 50)
        .map((l) => ({
          id: l._id,
          provider: l.provider,
          model: l.model,
          type: l.type,
          tokensIn: l.tokensIn,
          tokensOut: l.tokensOut,
          costEstimate: l.costEstimate,
          createdAt: new Date(l._creationTime).toISOString(),
        })),
    };
  },
});
