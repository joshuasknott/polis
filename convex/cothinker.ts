import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";

export const listSessions = query({
  args: {
    moduleId: v.optional(v.id("modules")),
    assignmentId: v.optional(v.id("assignments")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    if (args.assignmentId) {
      return await ctx.db
        .query("coThinkerSessions")
        .withIndex("by_assignment", (q) =>
          q.eq("assignmentId", args.assignmentId!),
        )
        .order("desc")
        .take(50)
        .then((items) =>
          items.filter((s) => s.tokenIdentifier === tokenIdentifier),
        );
    }

    if (args.moduleId) {
      return await ctx.db
        .query("coThinkerSessions")
        .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId!))
        .order("desc")
        .take(50)
        .then((items) =>
          items.filter((s) => s.tokenIdentifier === tokenIdentifier),
        );
    }

    return await ctx.db
      .query("coThinkerSessions")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(100);
  },
});

export const getSession = query({
  args: { sessionId: v.id("coThinkerSessions") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tokenIdentifier !== tokenIdentifier) return null;
    return session;
  },
});

export const createSession = mutation({
  args: {
    title: v.string(),
    scope: v.string(),
    moduleId: v.optional(v.id("modules")),
    assignmentId: v.optional(v.id("assignments")),
    sourceId: v.optional(v.id("sources")),
    stage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = Date.now();

    return await ctx.db.insert("coThinkerSessions", {
      ...args,
      tokenIdentifier,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSession = mutation({
  args: {
    sessionId: v.id("coThinkerSessions"),
    title: v.optional(v.string()),
    scope: v.optional(v.string()),
    stage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { sessionId, ...updates } = args;
    const session = await ctx.db.get(sessionId);
    if (!session || session.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(sessionId, { ...updates, updatedAt: Date.now() });
    return sessionId;
  },
});

export const removeSession = mutation({
  args: { sessionId: v.id("coThinkerSessions") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.sessionId);
    return args.sessionId;
  },
});

export const listMessages = query({
  args: {
    sessionId: v.id("coThinkerSessions"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("coThinkerMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .take(200);
  },
});

export const addMessage = mutation({
  args: {
    sessionId: v.id("coThinkerSessions"),
    role: v.string(),
    content: v.string(),
    citedChunkIds: v.optional(v.array(v.id("sourceChunks"))),
    labels: v.optional(v.array(v.string())),
    warnings: v.optional(v.array(v.string())),
    followUpSuggestions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const messageId = await ctx.db.insert("coThinkerMessages", {
      ...args,
      tokenIdentifier,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.sessionId, { updatedAt: Date.now() });
    return messageId;
  },
});

export const listInterventions = query({
  args: { sessionId: v.id("coThinkerSessions") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("coThinkerInterventions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .take(50);
  },
});

export const addIntervention = mutation({
  args: {
    sessionId: v.id("coThinkerSessions"),
    type: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    return await ctx.db.insert("coThinkerInterventions", {
      ...args,
      tokenIdentifier,
      createdAt: Date.now(),
    });
  },
});
