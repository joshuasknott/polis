import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

export const listForArgument = query({
  args: { argumentId: v.id("arguments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const argument = await ctx.db.get(args.argumentId);
    if (!argument || argument.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("evidenceLinks")
      .withIndex("by_argument", (q) => q.eq("argumentId", args.argumentId))
      .take(100);
  },
});

export const listForSource = query({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("evidenceLinks")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(100);
  },
});

export const create = mutation({
  args: {
    argumentId: v.id("arguments"),
    sourceId: v.id("sources"),
    argumentNodeId: v.optional(v.id("argumentNodes")),
    sourceClaimId: v.optional(v.id("sourceClaims")),
    quote: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    usage: v.optional(v.string()),
    strength: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const argument = await ctx.db.get(args.argumentId);
    if (!argument || argument.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();
    return await ctx.db.insert("evidenceLinks", {
      ...args,
      tokenIdentifier,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    evidenceLinkId: v.id("evidenceLinks"),
    quote: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    usage: v.optional(v.string()),
    strength: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { evidenceLinkId, ...updates } = args;
    const link = await ctx.db.get(evidenceLinkId);
    if (!link || link.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(evidenceLinkId, { ...updates, updatedAt: Date.now() });
    return evidenceLinkId;
  },
});

export const remove = mutation({
  args: { evidenceLinkId: v.id("evidenceLinks") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const link = await ctx.db.get(args.evidenceLinkId);
    if (!link || link.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.evidenceLinkId);
    return args.evidenceLinkId;
  },
});

export const listForAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) return [];

    const argumentDocs = await ctx.db
      .query("arguments")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(100);

    const allEvidence = [];
    for (const arg of argumentDocs) {
      const links = await ctx.db
        .query("evidenceLinks")
        .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
        .take(100);
      allEvidence.push(...links);
    }
    return allEvidence;
  },
});

export const listForNode = query({
  args: { argumentNodeId: v.id("argumentNodes") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const node = await ctx.db.get(args.argumentNodeId);
    if (!node || node.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("evidenceLinks")
      .withIndex("by_argumentNodeId", (q) =>
        q.eq("argumentNodeId", args.argumentNodeId),
      )
      .take(100);
  },
});
