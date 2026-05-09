import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

export const list = query({
  args: {
    moduleId: v.optional(v.id("modules")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    if (args.moduleId) {
      return await ctx.db
        .query("assignments")
        .withIndex("by_tokenIdentifier_and_module", (q) =>
          q.eq("tokenIdentifier", tokenIdentifier).eq("moduleId", args.moduleId!),
        )
        .order("desc")
        .take(100);
    }

    return await ctx.db
      .query("assignments")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(100);
  },
});

export const get = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return null;
    }
    return assignment;
  },
});

export const create = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.string(),
    question: v.optional(v.string()),
    wordLimit: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    rubric: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          weight: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = Date.now();
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    return await ctx.db.insert("assignments", {
      ...args,
      tokenIdentifier,
      stage: "ingest",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    assignmentId: v.id("assignments"),
    title: v.optional(v.string()),
    question: v.optional(v.string()),
    wordLimit: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    rubric: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          weight: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { assignmentId, ...updates } = args;
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(assignmentId, { ...updates, updatedAt: Date.now() });
    return assignmentId;
  },
});

export const updateStage = mutation({
  args: {
    assignmentId: v.id("assignments"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.assignmentId, {
      stage: args.stage,
      updatedAt: Date.now(),
    });
    return args.assignmentId;
  },
});

export const remove = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.assignmentId);
    return args.assignmentId;
  },
});

export const listSources = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return [];
    }

    return await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(100);
  },
});

export const addSource = mutation({
  args: {
    assignmentId: v.id("assignments"),
    sourceId: v.id("sources"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const existing = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment_and_source", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("sourceId", args.sourceId),
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("assignmentSources", {
      tokenIdentifier,
      assignmentId: args.assignmentId,
      sourceId: args.sourceId,
      addedAt: Date.now(),
    });
  },
});

export const removeSource = mutation({
  args: {
    assignmentId: v.id("assignments"),
    sourceId: v.id("sources"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const link = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment_and_source", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("sourceId", args.sourceId),
      )
      .unique();
    if (!link) throw new Error("Link not found");

    await ctx.db.delete(link._id);
    return link._id;
  },
});
