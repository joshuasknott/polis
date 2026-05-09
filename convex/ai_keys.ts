import {
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const connections = await ctx.db
      .query("aiProviderConnections")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .take(10);

    return connections.map((c) => ({
      provider: c.provider,
      status: c.status,
      modelPreference: c.modelPreference ?? null,
      hasKey: !!c.encryptedCredentialRef,
    }));
  },
});

export const internalStoreConnection = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    provider: v.string(),
    status: v.string(),
    modelPreference: v.optional(v.string()),
    encryptedCredentialRef: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiProviderConnections")
      .withIndex("by_tokenIdentifier_and_provider", (q) =>
        q
          .eq("tokenIdentifier", args.tokenIdentifier)
          .eq("provider", args.provider),
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        modelPreference: args.modelPreference,
        encryptedCredentialRef: args.encryptedCredentialRef,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("aiProviderConnections", {
      tokenIdentifier: args.tokenIdentifier,
      provider: args.provider,
      status: args.status,
      modelPreference: args.modelPreference,
      encryptedCredentialRef: args.encryptedCredentialRef,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const internalRemoveConnection = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("aiProviderConnections")
      .withIndex("by_tokenIdentifier_and_provider", (q) =>
        q
          .eq("tokenIdentifier", args.tokenIdentifier)
          .eq("provider", args.provider),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const internalGetEncryptedKey = internalQuery({
  args: {
    tokenIdentifier: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const conn = await ctx.db
      .query("aiProviderConnections")
      .withIndex("by_tokenIdentifier_and_provider", (q) =>
        q
          .eq("tokenIdentifier", args.tokenIdentifier)
          .eq("provider", args.provider),
      )
      .unique();

    if (!conn?.encryptedCredentialRef) return null;
    return {
      encryptedKey: conn.encryptedCredentialRef,
      modelPreference: conn.modelPreference,
      status: conn.status,
    };
  },
});

export const internalLogUsage = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    type: v.string(),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    costEstimate: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("usageEvents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
