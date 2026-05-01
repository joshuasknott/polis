import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const getByUserId = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const conversations = await ctx.db.query("conversations").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").collect();

    const results = [];
    for (const conv of conversations) {
      const mod = conv.moduleId ? await ctx.db.get(conv.moduleId as any) as any : null;
      const messageCount = (await ctx.db.query("conversationMessages").withIndex("by_conversationId", (q) => q.eq("conversationId", conv._id)).collect()).length;
      results.push({
        id: conv._id,
        moduleId: conv.moduleId,
        title: conv.title,
        mode: conv.mode,
        _creationTime: conv._creationTime,
        module: mod ? { title: mod.title } : null,
        _messageCount: messageCount,
      });
    }
    return results;
  },
});

export const getById = query({
  args: { userId: v.string(), conversationId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, conversationId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const conv = await ctx.db.get(conversationId as any) as any;
    if (!conv || conv.userId !== userId) return null;

    const messages = await ctx.db.query("conversationMessages").withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId)).order("asc").collect();

    return {
      id: conv._id,
      userId: conv.userId,
      moduleId: conv.moduleId,
      title: conv.title,
      mode: conv.mode,
      _creationTime: conv._creationTime,
      messages: messages.map((m) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        citedChunkIds: m.citedChunkIds,
        _creationTime: m._creationTime,
      })),
    };
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    moduleId: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    essayId: v.optional(v.string()),
    mode: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    if (args.moduleId) {
      const mod = await ctx.db.get(args.moduleId as any) as any;
      if (!mod || mod.userId !== args.userId) throw new Error("Module not found");
    }
    if (args.sourceId) {
      const source = await ctx.db.get(args.sourceId as any) as any;
      if (!source || source.userId !== args.userId) throw new Error("Source not found");
    }
    if (args.essayId) {
      const essay = await ctx.db.get(args.essayId as any) as any;
      if (!essay || essay.userId !== args.userId) throw new Error("Essay not found");
    }
    return ctx.db.insert("conversations", {
      userId: args.userId,
      title: args.title,
      moduleId: args.moduleId,
      sourceId: args.sourceId,
      essayId: args.essayId,
      mode: args.mode || "source_grounded",
    });
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.string(),
    role: v.string(),
    content: v.string(),
    citedChunkIds: v.optional(v.string()),
    userId: v.string(),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const conv = await ctx.db.get(args.conversationId as any) as any;
    if (!conv || conv.userId !== args.userId) throw new Error("Conversation not found");
    return ctx.db.insert("conversationMessages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      citedChunkIds: args.citedChunkIds,
    });
  },
});
