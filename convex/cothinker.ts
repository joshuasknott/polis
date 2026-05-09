import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import {
  cothinkerScope,
  productionStage,
  messageRole,
  messageLabel,
  cothinkerInterventionType,
} from "./lib/validators";

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
        .withIndex("by_tokenIdentifier_and_assignment", (q) =>
          q
            .eq("tokenIdentifier", tokenIdentifier)
            .eq("assignmentId", args.assignmentId!),
        )
        .order("desc")
        .take(50);
    }

    if (args.moduleId) {
      return await ctx.db
        .query("coThinkerSessions")
        .withIndex("by_tokenIdentifier_and_module", (q) =>
          q
            .eq("tokenIdentifier", tokenIdentifier)
            .eq("moduleId", args.moduleId!),
        )
        .order("desc")
        .take(50);
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
    scope: cothinkerScope,
    moduleId: v.optional(v.id("modules")),
    assignmentId: v.optional(v.id("assignments")),
    sourceId: v.optional(v.id("sources")),
    stage: v.optional(productionStage),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = Date.now();

    if (!args.moduleId) {
      throw new Error("Module is required for CoThinker sessions");
    }

    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.assignmentId) {
      const assignment = await ctx.db.get(args.assignmentId);
      if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
        throw new Error("Not found");
      }
      if (assignment.moduleId !== args.moduleId) {
        throw new Error("Assignment does not belong to module");
      }
    }

    if (args.sourceId) {
      const source = await ctx.db.get(args.sourceId);
      if (!source || source.tokenIdentifier !== tokenIdentifier) {
        throw new Error("Not found");
      }
      if (source.moduleId !== args.moduleId) {
        throw new Error("Source does not belong to module");
      }
    }

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
    scope: v.optional(cothinkerScope),
    stage: v.optional(productionStage),
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
      .withIndex("by_session_and_createdAt", (q) =>
        q.eq("sessionId", args.sessionId),
      )
      .order("asc")
      .take(200);
  },
});

export const addMessage = mutation({
  args: {
    sessionId: v.id("coThinkerSessions"),
    role: messageRole,
    content: v.string(),
    citedChunkIds: v.optional(v.array(v.id("sourceChunks"))),
    labels: v.optional(v.array(messageLabel)),
    warnings: v.optional(v.array(v.string())),
    followUpSuggestions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.citedChunkIds && args.citedChunkIds.length > 0 && session.moduleId) {
      for (const chunkId of args.citedChunkIds) {
        const chunk = await ctx.db.get(chunkId);
        if (!chunk) continue;
        const source = await ctx.db.get(chunk.sourceId);
        if (!source || source.moduleId !== session.moduleId) {
          throw new Error("Cited chunk source must belong to session module");
        }
      }
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
      .withIndex("by_session_and_createdAt", (q) =>
        q.eq("sessionId", args.sessionId),
      )
      .order("asc")
      .take(50);
  },
});

export const addIntervention = mutation({
  args: {
    sessionId: v.id("coThinkerSessions"),
    type: cothinkerInterventionType,
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

export const updateIntervention = mutation({
  args: {
    interventionId: v.id("coThinkerInterventions"),
    resolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { interventionId, ...updates } = args;
    const intervention = await ctx.db.get(interventionId);
    if (!intervention || intervention.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(interventionId, {
      ...updates,
      ...(args.resolved ? { resolvedAt: Date.now() } : {}),
    });
    return interventionId;
  },
});

export const getMessageCount = query({
  args: { sessionId: v.id("coThinkerSessions") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tokenIdentifier !== tokenIdentifier) return 0;

    let count = 0;
    for await (
      const _row of ctx.db
        .query("coThinkerMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
    ) {
      void _row;
      count++;
    }
    return count;
  },
});

export const listSessionsWithCounts = query({
  args: {
    moduleId: v.optional(v.id("modules")),
    assignmentId: v.optional(v.id("assignments")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    let sessions;
    if (args.assignmentId) {
      sessions = await ctx.db
        .query("coThinkerSessions")
        .withIndex("by_tokenIdentifier_and_assignment", (q) =>
          q
            .eq("tokenIdentifier", tokenIdentifier)
            .eq("assignmentId", args.assignmentId!),
        )
        .order("desc")
        .take(50);
    } else if (args.moduleId) {
      sessions = await ctx.db
        .query("coThinkerSessions")
        .withIndex("by_tokenIdentifier_and_module", (q) =>
          q.eq("tokenIdentifier", tokenIdentifier).eq("moduleId", args.moduleId!),
        )
        .order("desc")
        .take(50);
    } else {
      sessions = await ctx.db
        .query("coThinkerSessions")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", tokenIdentifier),
        )
        .order("desc")
        .take(100);
    }

    const results = [];
    for (const session of sessions) {
      let messageCount = 0;
      for await (
        const _row of ctx.db
          .query("coThinkerMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      ) {
        void _row;
        messageCount++;
      }
      results.push({ ...session, messageCount });
    }
    return results;
  },
});
