import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const getBySourceId = query({
  args: { sourceId: v.string(), userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { sourceId, userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const source = await ctx.db.get(sourceId as any) as any;
    if (!source || source.userId !== userId) return [];
    const notes = await ctx.db.query("sourceNotes").withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId)).collect();
    return notes
      .filter((n) => n.userId === userId)
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((n) => ({
        id: n._id,
        sourceId: n.sourceId,
        userId: n.userId,
        content: n.content,
        tags: n.tags,
        _creationTime: n._creationTime,
      }));
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    sourceId: v.string(),
    content: v.string(),
    tags: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const source = await ctx.db.get(args.sourceId as any) as any;
    if (!source || source.userId !== args.userId) throw new Error("Source not found");
    const { serverSecret, ...data } = args;
    return ctx.db.insert("sourceNotes", data);
  },
});

export const update = mutation({
  args: {
    noteId: v.string(),
    userId: v.string(),
    content: v.optional(v.string()),
    tags: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { noteId, userId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const note = await ctx.db.get(noteId as any) as any;
    if (!note || note.userId !== userId) return null;
    const patch: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(noteId as any, patch);
    return ctx.db.get(noteId as any);
  },
});

export const remove = mutation({
  args: { noteId: v.string(), userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { noteId, userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const note = await ctx.db.get(noteId as any) as any;
    if (!note || note.userId !== userId) return false;
    await ctx.db.delete(noteId as any);
    return true;
  },
});
