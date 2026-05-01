import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

const draftStatusValidator = v.union(v.literal("rough"), v.literal("revised"), v.literal("final"));

function now() {
  return new Date().toISOString();
}

function view(draft: any) {
  return {
    id: draft._id,
    userId: draft.userId,
    moduleId: draft.moduleId,
    assignmentId: draft.assignmentId || null,
    contextPackId: draft.contextPackId,
    planId: draft.planId,
    title: draft.title,
    content: draft.content,
    status: draft.status,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    _creationTime: draft._creationTime,
  };
}

async function requireModule(ctx: any, userId: string, moduleId: string) {
  const mod = await ctx.db.get(moduleId as any) as any;
  if (!mod || mod.userId !== userId) throw new Error("Module not found");
}

export const listByModule = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return [];
    const drafts = await ctx.db
      .query("drafts")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .order("desc")
      .take(100);
    return drafts.map(view);
  },
});

export const listByAssignment = query({
  args: { userId: v.string(), assignmentId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) return [];
    const drafts = await ctx.db
      .query("drafts")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", assignment.moduleId))
      .take(100);
    return drafts.filter((d: any) => d.assignmentId === assignmentId).map(view);
  },
});

export const getCurrent = query({
  args: { userId: v.string(), moduleId: v.string(), planId: v.optional(v.string()), assignmentId: v.optional(v.string()), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, planId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return null;
    let drafts = await ctx.db
      .query("drafts")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .take(100);
    if (assignmentId) {
      drafts = drafts.filter((d: any) => d.assignmentId === assignmentId);
    }
    if (planId) {
      const byPlan = drafts.filter((d: any) => d.planId === planId);
      if (byPlan.length > 0) drafts = byPlan;
    }
    const current = drafts.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "") || b._creationTime - a._creationTime)[0];
    return current ? view(current) : null;
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    assignmentId: v.optional(v.string()),
    contextPackId: v.string(),
    planId: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    status: v.optional(draftStatusValidator),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    await requireModule(ctx, args.userId, args.moduleId);
    const plan = await ctx.db.get(args.planId as any) as any;
    if (!plan || plan.userId !== args.userId || plan.moduleId !== args.moduleId) throw new Error("Plan not found");
    const pack = await ctx.db.get(args.contextPackId as any) as any;
    if (!pack || pack.userId !== args.userId || pack.moduleId !== args.moduleId) throw new Error("Context pack not found");
    const timestamp = now();
    const draftId = await ctx.db.insert("drafts", {
      userId: args.userId,
      moduleId: args.moduleId,
      assignmentId: args.assignmentId || undefined,
      contextPackId: args.contextPackId,
      planId: args.planId,
      title: args.title,
      content: args.content || "",
      status: args.status || "rough",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const draft = await ctx.db.get(draftId);
    return view(draft);
  },
});

export const update = mutation({
  args: {
    userId: v.string(),
    draftId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(draftStatusValidator),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, draftId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const draft = await ctx.db.get(draftId as any) as any;
    if (!draft || draft.userId !== userId) throw new Error("Draft not found");
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(draftId as any, patch);
    const updated = await ctx.db.get(draftId as any);
    return view(updated);
  },
});
