import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const getByUserId = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    return ctx.db.query("aiProviderConnections").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
  },
});

export const getByProvider = query({
  args: { userId: v.string(), provider: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, provider, serverSecret }) => {
    requireServerSecret(serverSecret);
    return ctx.db.query("aiProviderConnections").withIndex("by_userId_provider", (q) => q.eq("userId", userId).eq("provider", provider)).first();
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    provider: v.string(),
    encryptedApiKey: v.optional(v.string()),
    status: v.optional(v.string()),
    modelPreference: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const existing = await ctx.db.query("aiProviderConnections").withIndex("by_userId_provider", (q) => q.eq("userId", args.userId).eq("provider", args.provider)).first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedApiKey: args.encryptedApiKey,
        status: args.status,
        modelPreference: args.modelPreference,
      });
      return existing._id;
    }

    return ctx.db.insert("aiProviderConnections", {
      userId: args.userId,
      provider: args.provider,
      encryptedApiKey: args.encryptedApiKey,
      status: args.status || "disconnected",
      modelPreference: args.modelPreference,
    });
  },
});

export const removeByProvider = mutation({
  args: { userId: v.string(), provider: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, provider, serverSecret }) => {
    requireServerSecret(serverSecret);
    const existing = await ctx.db.query("aiProviderConnections").withIndex("by_userId_provider", (q) => q.eq("userId", userId).eq("provider", provider)).first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const updateStatus = mutation({
  args: { userId: v.string(), provider: v.string(), status: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, provider, status, serverSecret }) => {
    requireServerSecret(serverSecret);
    const existing = await ctx.db.query("aiProviderConnections").withIndex("by_userId_provider", (q) => q.eq("userId", userId).eq("provider", provider)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { status });
    }
  },
});
