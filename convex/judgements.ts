import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

export const listOptions = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("judgementOptions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("asc")
      .take(50);
  },
});

export const listDecisions = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("judgementDecisions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .take(50);
  },
});

export const createOption = mutation({
  args: {
    assignmentId: v.id("assignments"),
    type: v.string(),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    return await ctx.db.insert("judgementOptions", {
      tokenIdentifier,
      assignmentId: args.assignmentId,
      type: args.type,
      question: args.question,
      createdAt: Date.now(),
    });
  },
});

export const recordDecision = mutation({
  args: {
    assignmentId: v.id("assignments"),
    judgementOptionId: v.optional(v.id("judgementOptions")),
    type: v.string(),
    content: v.string(),
    severity: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    return await ctx.db.insert("judgementDecisions", {
      tokenIdentifier,
      assignmentId: args.assignmentId,
      judgementOptionId: args.judgementOptionId,
      type: args.type,
      content: args.content,
      severity: args.severity,
      createdAt: Date.now(),
    });
  },
});

export const getLatestPositionDecision = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) return null;

    const decision = await ctx.db
      .query("judgementDecisions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .first();

    return decision ?? null;
  },
});
