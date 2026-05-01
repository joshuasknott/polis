import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

const revisionTaskValidator = v.object({
  id: v.string(),
  text: v.string(),
  completed: v.boolean(),
});

function now() {
  return new Date().toISOString();
}

function view(feedback: any) {
  return {
    id: feedback._id,
    userId: feedback.userId,
    moduleId: feedback.moduleId,
    draftId: feedback.draftId,
    assignmentId: feedback.assignmentId || null,
    content: feedback.content,
    revisionTasks: feedback.revisionTasks || [],
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
    _creationTime: feedback._creationTime,
  };
}

export const listByModule = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return [];
    const rows = await ctx.db
      .query("feedback")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .order("desc")
      .take(100);
    return rows.map(view);
  },
});

export const listByAssignment = query({
  args: { userId: v.string(), assignmentId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) return [];
    const rows = await ctx.db
      .query("feedback")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", assignment.moduleId))
      .take(100);
    return rows.filter((r: any) => r.assignmentId === assignmentId).map(view);
  },
});

export const listByDraft = query({
  args: { userId: v.string(), draftId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, draftId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const draft = await ctx.db.get(draftId as any) as any;
    if (!draft || draft.userId !== userId) return [];
    const rows = await ctx.db.query("feedback").withIndex("by_draftId", (q) => q.eq("draftId", draftId)).order("desc").take(100);
    return rows.filter((row) => row.userId === userId).map(view);
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    draftId: v.string(),
    assignmentId: v.optional(v.string()),
    content: v.optional(v.string()),
    revisionTasks: v.optional(v.array(revisionTaskValidator)),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const draft = await ctx.db.get(args.draftId as any) as any;
    if (!draft || draft.userId !== args.userId || draft.moduleId !== args.moduleId) throw new Error("Draft not found");
    const timestamp = now();
    const feedbackId = await ctx.db.insert("feedback", {
      userId: args.userId,
      moduleId: args.moduleId,
      draftId: args.draftId,
      assignmentId: args.assignmentId,
      content: args.content || "",
      revisionTasks: args.revisionTasks || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const row = await ctx.db.get(feedbackId);
    return view(row);
  },
});

export const update = mutation({
  args: {
    userId: v.string(),
    feedbackId: v.string(),
    content: v.optional(v.string()),
    revisionTasks: v.optional(v.array(revisionTaskValidator)),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, feedbackId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const feedback = await ctx.db.get(feedbackId as any) as any;
    if (!feedback || feedback.userId !== userId) throw new Error("Feedback not found");
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(feedbackId as any, patch);
    const updated = await ctx.db.get(feedbackId as any);
    return view(updated);
  },
});
