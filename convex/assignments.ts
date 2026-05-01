import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

const assignmentTypeValidator = v.union(
  v.literal("essay"),
  v.literal("research_project"),
  v.literal("literature_review"),
  v.literal("briefing"),
  v.literal("exam"),
  v.literal("quiz"),
  v.literal("presentation"),
  v.literal("other"),
);

const assignmentStatusValidator = v.union(
  v.literal("detected"),
  v.literal("approved"),
  v.literal("active"),
  v.literal("archived"),
  v.literal("dismissed"),
);

function now() {
  return new Date().toISOString();
}

function view(assignment: any) {
  return {
    id: assignment._id,
    userId: assignment.userId,
    moduleId: assignment.moduleId,
    title: assignment.title,
    type: assignment.type,
    questionOrBrief: assignment.questionOrBrief || "",
    weighting: assignment.weighting || "",
    dueDate: assignment.dueDate || "",
    wordCount: assignment.wordCount || 0,
    status: assignment.status,
    markingCriteriaSummary: assignment.markingCriteriaSummary || "",
    detectedFromSourceIds: assignment.detectedFromSourceIds || [],
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    _creationTime: assignment._creationTime,
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
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .order("desc")
      .take(100);
    return assignments.map(view);
  },
});

export const getById = query({
  args: { userId: v.string(), assignmentId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) return null;
    return view(assignment);
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    title: v.string(),
    type: assignmentTypeValidator,
    questionOrBrief: v.optional(v.string()),
    weighting: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    status: v.optional(assignmentStatusValidator),
    markingCriteriaSummary: v.optional(v.string()),
    detectedFromSourceIds: v.optional(v.array(v.string())),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    await requireModule(ctx, args.userId, args.moduleId);
    const timestamp = now();
    const assignmentId = await ctx.db.insert("assignments", {
      userId: args.userId,
      moduleId: args.moduleId,
      title: args.title,
      type: args.type,
      questionOrBrief: args.questionOrBrief || "",
      weighting: args.weighting || "",
      dueDate: args.dueDate || "",
      wordCount: args.wordCount || 0,
      status: args.status || "approved",
      markingCriteriaSummary: args.markingCriteriaSummary || "",
      detectedFromSourceIds: args.detectedFromSourceIds || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const assignment = await ctx.db.get(assignmentId);
    return view(assignment);
  },
});

export const update = mutation({
  args: {
    userId: v.string(),
    assignmentId: v.string(),
    title: v.optional(v.string()),
    type: v.optional(assignmentTypeValidator),
    questionOrBrief: v.optional(v.string()),
    weighting: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    status: v.optional(assignmentStatusValidator),
    markingCriteriaSummary: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, assignmentId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) throw new Error("Assignment not found");
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(assignmentId as any, patch);
    const updated = await ctx.db.get(assignmentId as any);
    return view(updated);
  },
});

export const approve = mutation({
  args: { userId: v.string(), assignmentId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) throw new Error("Assignment not found");
    await ctx.db.patch(assignmentId as any, { status: "approved", updatedAt: now() });
    const updated = await ctx.db.get(assignmentId as any);
    return view(updated);
  },
});

export const dismiss = mutation({
  args: { userId: v.string(), assignmentId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) throw new Error("Assignment not found");
    await ctx.db.patch(assignmentId as any, { status: "dismissed", updatedAt: now() });
    const updated = await ctx.db.get(assignmentId as any);
    return view(updated);
  },
});

export const archive = mutation({
  args: { userId: v.string(), assignmentId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) throw new Error("Assignment not found");
    await ctx.db.patch(assignmentId as any, { status: "archived", updatedAt: now() });
    const updated = await ctx.db.get(assignmentId as any);
    return view(updated);
  },
});
