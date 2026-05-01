import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const getById = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    return ctx.db.get(userId as any) as any;
  },
});

export const getByEmail = query({
  args: { email: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { email, serverSecret }) => {
    requireServerSecret(serverSecret);
    return ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first();
  },
});

export const getProfile = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const user = await ctx.db.get(userId as any) as any;
    if (!user) return null;
    const credentialAccount = await ctx.db
      .query("accounts")
      .withIndex("by_providerId_and_accountId", (q) =>
        q.eq("providerId", "credential").eq("accountId", userId)
      )
      .first();
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      university: user.university,
      course: user.course,
      yearOfStudy: user.yearOfStudy,
      preferences: user.preferences,
      hasPassword: !!credentialAccount?.password || !!user.passwordHash,
    };
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    university: v.optional(v.string()),
    course: v.optional(v.string()),
    yearOfStudy: v.optional(v.number()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    await ctx.db.patch(userId as any, { ...data, updatedAt: new Date().toISOString() });
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, preferences, serverSecret }) => {
    requireServerSecret(serverSecret);
    await ctx.db.patch(userId as any, { preferences, updatedAt: new Date().toISOString() });
  },
});

export const updatePassword = mutation({
  args: {
    userId: v.string(),
    passwordHash: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, passwordHash, serverSecret }) => {
    requireServerSecret(serverSecret);
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("accounts")
      .withIndex("by_providerId_and_accountId", (q) =>
        q.eq("providerId", "credential").eq("accountId", userId)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { password: passwordHash, updatedAt: now });
    } else {
      await ctx.db.insert("accounts", {
        userId,
        accountId: userId,
        providerId: "credential",
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });
    }
    await ctx.db.patch(userId as any, { passwordHash, updatedAt: now });
  },
});

export const createWithCredentials = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    university: v.optional(v.string()),
    course: v.optional(v.string()),
    yearOfStudy: v.optional(v.number()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (existing) return existing._id;
    const now = new Date().toISOString();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
      passwordHash: args.passwordHash,
      university: args.university,
      course: args.course,
      yearOfStudy: args.yearOfStudy,
      role: "student",
      preferences: "{}",
    });
    await ctx.db.insert("accounts", {
      userId,
      accountId: userId,
      providerId: "credential",
      password: args.passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    return userId;
  },
});

export const createOAuthUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    provider: v.string(),
    providerAccountId: v.string(),
    type: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const existing = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();

    if (existing) {
      const existingAccount = await ctx.db
        .query("accounts")
        .withIndex("by_providerId_and_accountId", (q) =>
          q.eq("providerId", args.provider).eq("accountId", args.providerAccountId)
        )
        .first();

      if (!existingAccount) {
        const now = new Date().toISOString();
        await ctx.db.insert("accounts", {
          userId: existing._id,
          providerId: args.provider,
          accountId: args.providerAccountId,
          createdAt: now,
          updatedAt: now,
        });
      }
      return existing._id;
    }

    const now = new Date().toISOString();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      emailVerified: true,
      image: args.image,
      createdAt: now,
      updatedAt: now,
      role: "student",
      preferences: "{}",
    });

    await ctx.db.insert("accounts", {
      userId,
      providerId: args.provider,
      accountId: args.providerAccountId,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

export const getLinkedProviders = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const accounts = await ctx.db.query("accounts").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    return accounts.map((a) => ({ provider: a.providerId, providerAccountId: a.accountId }));
  },
});

export const getCredentialAccount = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_providerId_and_accountId", (q) =>
        q.eq("providerId", "credential").eq("accountId", userId)
      )
      .first();
    return account ? { id: account._id, password: account.password } : null;
  },
});

export const fixEmailVerified = mutation({
  args: { serverSecret: v.optional(v.string()) },
  handler: async (ctx, { serverSecret }) => {
    requireServerSecret(serverSecret);
    const users = await ctx.db.query("users").collect();
    for (const u of users) {
      if (u.emailVerified === undefined) {
        await ctx.db.patch(u._id, { emailVerified: false, updatedAt: new Date().toISOString() });
      }
    }
    return `Updated ${users.length} users`;
  },
});
