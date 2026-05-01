import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

const planSectionValidator = v.object({
  id: v.string(),
  title: v.string(),
  purpose: v.optional(v.string()),
  claim: v.optional(v.string()),
  evidenceSourceIds: v.array(v.string()),
  knowledgePageIds: v.array(v.string()),
  counterargument: v.optional(v.string()),
  evaluation: v.optional(v.string()),
  wordCount: v.optional(v.number()),
  notes: v.optional(v.string()),
});

function now() {
  return new Date().toISOString();
}

function view(plan: any) {
  return {
    id: plan._id,
    userId: plan.userId,
    moduleId: plan.moduleId,
    assignmentId: plan.assignmentId || null,
    contextPackId: plan.contextPackId,
    title: plan.title,
    thesis: plan.thesis || "",
    sections: plan.sections || [],
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    _creationTime: plan._creationTime,
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
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .order("desc")
      .take(100);
    return plans.map(view);
  },
});

export const listByAssignment = query({
  args: { userId: v.string(), assignmentId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) return [];
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", assignment.moduleId))
      .take(100);
    return plans.filter((p: any) => p.assignmentId === assignmentId).map(view);
  },
});

export const getCurrent = query({
  args: { userId: v.string(), moduleId: v.string(), contextPackId: v.optional(v.string()), assignmentId: v.optional(v.string()), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, contextPackId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return null;
    let plans = await ctx.db
      .query("plans")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .take(100);
    if (assignmentId) {
      plans = plans.filter((p: any) => p.assignmentId === assignmentId);
    }
    if (contextPackId) {
      const byPack = plans.filter((p: any) => p.contextPackId === contextPackId);
      if (byPack.length > 0) plans = byPack;
    }
    const current = plans.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "") || b._creationTime - a._creationTime)[0];
    return current ? view(current) : null;
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    assignmentId: v.optional(v.string()),
    contextPackId: v.string(),
    title: v.string(),
    thesis: v.optional(v.string()),
    sections: v.optional(v.array(planSectionValidator)),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    await requireModule(ctx, args.userId, args.moduleId);
    const pack = await ctx.db.get(args.contextPackId as any) as any;
    if (!pack || pack.userId !== args.userId || pack.moduleId !== args.moduleId) throw new Error("Context pack not found");
    const timestamp = now();
    const planId = await ctx.db.insert("plans", {
      userId: args.userId,
      moduleId: args.moduleId,
      assignmentId: args.assignmentId || undefined,
      contextPackId: args.contextPackId,
      title: args.title,
      thesis: args.thesis || "",
      sections: args.sections || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const plan = await ctx.db.get(planId);
    return view(plan);
  },
});

export const update = mutation({
  args: {
    userId: v.string(),
    planId: v.string(),
    title: v.optional(v.string()),
    thesis: v.optional(v.string()),
    sections: v.optional(v.array(planSectionValidator)),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, planId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const plan = await ctx.db.get(planId as any) as any;
    if (!plan || plan.userId !== userId) throw new Error("Plan not found");
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(planId as any, patch);
    const updated = await ctx.db.get(planId as any);
    return view(updated);
  },
});
