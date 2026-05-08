import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
      .unique();
  },
});

export const getProfile = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
  },
});

export const upsertCurrentUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
      .unique();

    const profileData = {
      externalId: identity.subject,
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
      image: identity.pictureUrl ?? undefined,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, profileData);
      return existing._id;
    }

    return await ctx.db.insert("userProfiles", {
      ...profileData,
      createdAt: now,
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    university: v.optional(v.string()),
    course: v.optional(v.string()),
    yearOfStudy: v.optional(v.number()),
    preferences: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (!existing) throw new Error("Profile not found");

    await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
    return existing._id;
  },
});

export const ensureUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
      .unique();

    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("userProfiles", {
      externalId: identity.subject,
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
      image: identity.pictureUrl ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});
