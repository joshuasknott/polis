import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireServerSecret } from "./serverAuth";

export const createSession = mutation({
  args: {
    userId: v.string(),
    token: v.string(),
    expiresAt: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, token, expiresAt, serverSecret }) => {
    requireServerSecret(serverSecret);
    const now = new Date().toISOString();
    return ctx.db.insert("sessions", { userId, token, expiresAt, createdAt: now, updatedAt: now });
  },
});

export const getSessionByToken = query({
  args: { token: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { token, serverSecret }) => {
    requireServerSecret(serverSecret);
    const session = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", token)).first();
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) return null;

    const user = await ctx.db.get(session.userId as any) as Doc<"users"> | null;
    if (!user) return null;

    return {
      session: { id: session._id, userId: session.userId, expiresAt: session.expiresAt },
      user: {
        id: user._id,
        name: user.name ?? "",
        email: user.email ?? "",
        image: user.image ?? null,
        role: user.role ?? "student",
      },
    };
  },
});

export const deleteSession = mutation({
  args: { token: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { token, serverSecret }) => {
    requireServerSecret(serverSecret);
    const session = await ctx.db.query("sessions").withIndex("by_token", (q) => q.eq("token", token)).first();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const deleteSessionsByUserId = mutation({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const sessions = await ctx.db.query("sessions").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
  },
});

export const createVerification = mutation({
  args: {
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { identifier, value, expiresAt, serverSecret }) => {
    requireServerSecret(serverSecret);
    const now = new Date().toISOString();
    return ctx.db.insert("verifications", { identifier, value, expiresAt, createdAt: now, updatedAt: now });
  },
});

export const getVerification = query({
  args: { identifier: v.string(), value: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { identifier, value, serverSecret }) => {
    requireServerSecret(serverSecret);
    const record = await ctx.db.query("verifications").withIndex("by_identifier_value", (q) => q.eq("identifier", identifier).eq("value", value)).first();
    if (!record) return null;
    if (new Date(record.expiresAt).getTime() < Date.now()) return null;
    return { id: record._id, identifier: record.identifier, value: record.value, expiresAt: record.expiresAt };
  },
});

export const deleteVerification = mutation({
  args: { id: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { id, serverSecret }) => {
    requireServerSecret(serverSecret);
    await ctx.db.delete(id as any);
  },
});

export const createAccount = mutation({
  args: {
    userId: v.string(),
    providerId: v.string(),
    accountId: v.string(),
    refreshToken: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.string()),
    scope: v.optional(v.string()),
    idToken: v.optional(v.string()),
    password: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const now = new Date().toISOString();
    const { serverSecret, ...data } = args;
    return ctx.db.insert("accounts", { ...data, createdAt: now, updatedAt: now });
  },
});

export const getAccountByProvider = query({
  args: { providerId: v.string(), accountId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { providerId, accountId, serverSecret }) => {
    requireServerSecret(serverSecret);
    return ctx.db.query("accounts").withIndex("by_providerId_and_accountId", (q) => q.eq("providerId", providerId).eq("accountId", accountId)).first();
  },
});
