import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

const WINDOW_MS = 60 * 1000;
const DEFAULT_REQUEST_LIMIT = 30;
const DEFAULT_TOKEN_LIMIT = 100000;
const PROVIDER_OVERRIDES: Record<string, { requestLimit: number; tokenLimit: number }> = {
  openai: { requestLimit: 30, tokenLimit: 150000 },
  anthropic: { requestLimit: 20, tokenLimit: 100000 },
  google: { requestLimit: 30, tokenLimit: 120000 },
};

export const checkRateLimit = mutation({
  args: {
    provider: v.optional(v.string()),
    estimatedTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = Date.now();
    const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
    const provider = args.provider ?? "default";
    const limits = PROVIDER_OVERRIDES[provider] ?? { requestLimit: DEFAULT_REQUEST_LIMIT, tokenLimit: DEFAULT_TOKEN_LIMIT };

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_tokenIdentifier_and_provider", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("provider", provider),
      )
      .first();

    if (existing && existing.windowStart === windowStart) {
      const newRequestCount = existing.requestCount + 1;
      const newTokenCount = existing.tokenCount + (args.estimatedTokens ?? 0);

      if (newRequestCount > limits.requestLimit) {
        return {
          allowed: false as const,
          reason: "request_limit" as const,
          limit: limits.requestLimit,
          remaining: 0,
          resetAt: windowStart + WINDOW_MS,
        };
      }

      if (args.estimatedTokens && newTokenCount > limits.tokenLimit) {
        return {
          allowed: false as const,
          reason: "token_limit" as const,
          limit: limits.tokenLimit,
          remaining: Math.max(0, limits.tokenLimit - existing.tokenCount),
          resetAt: windowStart + WINDOW_MS,
        };
      }

      await ctx.db.patch(existing._id, {
        requestCount: newRequestCount,
        tokenCount: newTokenCount,
      });

      return {
        allowed: true as const,
        reason: null as string | null,
        limit: limits.requestLimit,
        remaining: limits.requestLimit - newRequestCount,
        resetAt: windowStart + WINDOW_MS,
      };
    }

    await ctx.db.insert("rateLimits", {
      tokenIdentifier,
      windowStart,
      requestCount: 1,
      tokenCount: args.estimatedTokens ?? 0,
      provider,
    });

    return {
      allowed: true as const,
      reason: null as string | null,
      limit: limits.requestLimit,
      remaining: limits.requestLimit - 1,
      resetAt: windowStart + WINDOW_MS,
    };
  },
});

export const getRateLimitStatus = query({
  args: {
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = Date.now();
    const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
    const provider = args.provider ?? "default";
    const limits = PROVIDER_OVERRIDES[provider] ?? { requestLimit: DEFAULT_REQUEST_LIMIT, tokenLimit: DEFAULT_TOKEN_LIMIT };

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_tokenIdentifier_and_provider", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier).eq("provider", provider),
      )
      .first();

    if (!existing || existing.windowStart !== windowStart) {
      return {
        requestsRemaining: limits.requestLimit,
        tokensRemaining: limits.tokenLimit,
        resetAt: windowStart + WINDOW_MS,
        limit: limits.requestLimit,
        tokenLimit: limits.tokenLimit,
      };
    }

    return {
      requestsRemaining: Math.max(0, limits.requestLimit - existing.requestCount),
      tokensRemaining: Math.max(0, limits.tokenLimit - existing.tokenCount),
      resetAt: windowStart + WINDOW_MS,
      limit: limits.requestLimit,
      tokenLimit: limits.tokenLimit,
    };
  },
});

export const cleanupOldWindows = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 5 * 60 * 1000;
    let deleted = 0;
    const stale = await ctx.db
      .query("rateLimits")
      .order("asc")
      .take(200);

    for (const doc of stale) {
      if (doc.windowStart < cutoff) {
        await ctx.db.delete(doc._id);
        deleted++;
      }
    }
    return { deleted };
  },
});
