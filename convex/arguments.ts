import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import { internal } from "./_generated/api";
import {
  argumentNodeType,
  argumentStatus,
} from "./lib/validators";

export const list = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return [];
    }

    return await ctx.db
      .query("arguments")
      .withIndex("by_assignment_and_sortOrder", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("asc")
      .take(100);
  },
});

export const get = query({
  args: { argumentId: v.id("arguments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const argument = await ctx.db.get(args.argumentId);
    if (!argument || argument.tokenIdentifier !== tokenIdentifier) return null;
    return argument;
  },
});

export const create = mutation({
  args: {
    assignmentId: v.id("assignments"),
    claim: v.string(),
    synthesis: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    status: v.optional(argumentStatus),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();
    return await ctx.db.insert("arguments", {
      ...args,
      tokenIdentifier,
      sortOrder: args.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    argumentId: v.id("arguments"),
    claim: v.optional(v.string()),
    synthesis: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    status: v.optional(argumentStatus),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { argumentId, ...updates } = args;
    const argument = await ctx.db.get(argumentId);
    if (!argument || argument.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(argumentId, { ...updates, updatedAt: Date.now() });
    return argumentId;
  },
});

export const remove = mutation({
  args: { argumentId: v.id("arguments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const argument = await ctx.db.get(args.argumentId);
    if (!argument || argument.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.runMutation(internal.cleanup.deleteArgumentData, {
      argumentId: args.argumentId,
    });
    return args.argumentId;
  },
});

export const listNodes = query({
  args: { argumentId: v.id("arguments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const argument = await ctx.db.get(args.argumentId);
    if (!argument || argument.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("argumentNodes")
      .withIndex("by_argument_and_sortOrder", (q) =>
        q.eq("argumentId", args.argumentId),
      )
      .order("asc")
      .take(100);
  },
});

export const listCounterarguments = query({
  args: { argumentId: v.id("arguments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const argument = await ctx.db.get(args.argumentId);
    if (!argument || argument.tokenIdentifier !== tokenIdentifier) return [];

    const nodes = await ctx.db
      .query("argumentNodes")
      .withIndex("by_argument", (q) => q.eq("argumentId", args.argumentId))
      .order("asc")
      .take(100);

    return nodes.filter((n) => n.type === "counterargument");
  },
});

export const addCounterargument = mutation({
  args: {
    argumentId: v.id("arguments"),
    content: v.string(),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const argument = await ctx.db.get(args.argumentId);
    if (!argument || argument.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();
    return await ctx.db.insert("argumentNodes", {
      argumentId: args.argumentId,
      tokenIdentifier,
      type: "counterargument",
      content: args.content,
      sortOrder: args.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCounterargument = mutation({
  args: {
    nodeId: v.id("argumentNodes"),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const node = await ctx.db.get(args.nodeId);
    if (!node || node.tokenIdentifier !== tokenIdentifier || node.type !== "counterargument") {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.nodeId, { ...args.content ? { content: args.content } : {}, updatedAt: Date.now() });
    return args.nodeId;
  },
});

export const removeCounterargument = mutation({
  args: { nodeId: v.id("argumentNodes") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const node = await ctx.db.get(args.nodeId);
    if (!node || node.tokenIdentifier !== tokenIdentifier || node.type !== "counterargument") {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.nodeId);
    return args.nodeId;
  },
});

export const createNode = mutation({
  args: {
    argumentId: v.id("arguments"),
    type: argumentNodeType,
    content: v.string(),
    parentId: v.optional(v.id("argumentNodes")),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const argument = await ctx.db.get(args.argumentId);
    if (!argument || argument.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (
        !parent ||
        parent.tokenIdentifier !== tokenIdentifier ||
        parent.argumentId !== args.argumentId
      ) {
        throw new Error("Parent node must belong to the same argument");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("argumentNodes", {
      ...args,
      tokenIdentifier,
      sortOrder: args.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateNode = mutation({
  args: {
    nodeId: v.id("argumentNodes"),
    type: v.optional(argumentNodeType),
    content: v.optional(v.string()),
    parentId: v.optional(v.id("argumentNodes")),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { nodeId, ...updates } = args;
    const node = await ctx.db.get(nodeId);
    if (!node || node.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (
        !parent ||
        parent.tokenIdentifier !== tokenIdentifier ||
        parent.argumentId !== node.argumentId
      ) {
        throw new Error("Parent node must belong to the same argument");
      }
    }

    await ctx.db.patch(nodeId, { ...updates, updatedAt: Date.now() });
    return nodeId;
  },
});

export const removeNode = mutation({
  args: { nodeId: v.id("argumentNodes") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const node = await ctx.db.get(args.nodeId);
    if (!node || node.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.nodeId);
    return args.nodeId;
  },
});
