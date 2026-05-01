import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

const stageValidator = v.union(
  v.literal("setup"),
  v.literal("sources"),
  v.literal("knowledge"),
  v.literal("context"),
  v.literal("plan"),
  v.literal("draft"),
  v.literal("final"),
);

function now() {
  return new Date().toISOString();
}

function moduleView(mod: any) {
  return {
    id: mod._id,
    userId: mod.userId,
    code: mod.moduleCode || mod.code,
    title: mod.name || mod.title,
    name: mod.name || mod.title,
    moduleCode: mod.moduleCode || mod.code,
    description: mod.description || "",
    academicYear: mod.academicYear || "",
    semester: mod.semester || "",
    colour: mod.colour || "#1e3a5f",
    assessmentTitle: mod.assessmentTitle || "",
    assessmentQuestion: mod.assessmentQuestion || "",
    deadline: mod.deadline || "",
    targetGrade: mod.targetGrade || "",
    referencingStyle: mod.referencingStyle || "Harvard",
    currentStage: mod.currentStage || "setup",
    createdAt: mod.createdAt || new Date(mod._creationTime).toISOString(),
    updatedAt: mod.updatedAt || new Date(mod._creationTime).toISOString(),
    _creationTime: mod._creationTime,
  };
}

async function getModuleStats(ctx: any, userId: string, moduleId: string) {
  const sources = await ctx.db
    .query("sources")
    .withIndex("by_userId_moduleId", (q: any) => q.eq("userId", userId).eq("moduleId", moduleId))
    .take(1000);
  const processedSourceCount = sources.filter((source: any) => source.status === "ready" || source.status === "processed").length;
  const knowledgePages = await ctx.db
    .query("knowledgePages")
    .withIndex("by_userId_moduleId", (q: any) => q.eq("userId", userId).eq("moduleId", moduleId))
    .take(1000);
  const contextPacks = await ctx.db
    .query("contextPacks")
    .withIndex("by_userId_moduleId", (q: any) => q.eq("userId", userId).eq("moduleId", moduleId))
    .take(100);
  const plans = await ctx.db
    .query("plans")
    .withIndex("by_userId_moduleId", (q: any) => q.eq("userId", userId).eq("moduleId", moduleId))
    .take(100);
  const drafts = await ctx.db
    .query("drafts")
    .withIndex("by_userId_moduleId", (q: any) => q.eq("userId", userId).eq("moduleId", moduleId))
    .take(100);

  const latestPlan = plans.sort((a: any, b: any) => b._creationTime - a._creationTime)[0] || null;
  const latestDraft = drafts.sort((a: any, b: any) => b._creationTime - a._creationTime)[0] || null;
  const latestContextPack = contextPacks.sort((a: any, b: any) => b._creationTime - a._creationTime)[0] || null;

  return {
    sourceCount: sources.length,
    processedSourceCount,
    knowledgePageCount: knowledgePages.length,
    sourceBriefCount: knowledgePages.filter((page: any) => page.type === "source_brief").length,
    contextPackCount: contextPacks.length,
    hasContextPack: !!latestContextPack,
    activeContextPackId: latestContextPack?._id || null,
    hasPlan: !!latestPlan,
    activePlanId: latestPlan?._id || null,
    planTitle: latestPlan?.title || "",
    hasDraft: !!latestDraft,
    activeDraftId: latestDraft?._id || null,
    draftStatus: latestDraft?.status || "",
  };
}

export const getByUserId = query({
  args: { userId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const modules = await ctx.db.query("modules").withIndex("by_userId", (q) => q.eq("userId", userId)).take(200);

    const results = [];
    for (const mod of modules) {
      const stats = await getModuleStats(ctx, userId, mod._id);
      results.push({
        ...moduleView(mod),
        _sourceCount: stats.sourceCount,
        _processedSourceCount: stats.processedSourceCount,
        _knowledgePageCount: stats.knowledgePageCount,
        _sourceBriefCount: stats.sourceBriefCount,
        _contextPackCount: stats.contextPackCount,
        _essayCount: 0,
        _hasContextPack: stats.hasContextPack,
        _hasPlan: stats.hasPlan,
        _planTitle: stats.planTitle,
        _hasDraft: stats.hasDraft,
        _draftStatus: stats.draftStatus,
      });
    }

    return results;
  },
});

export const getById = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return null;

    const folders = await ctx.db.query("folders").withIndex("by_moduleId", (q) => q.eq("moduleId", moduleId)).order("asc").take(100);
    const stats = await getModuleStats(ctx, userId, moduleId);

    return {
      ...moduleView(mod),
      _sourceCount: stats.sourceCount,
      _processedSourceCount: stats.processedSourceCount,
      _knowledgePageCount: stats.knowledgePageCount,
      _sourceBriefCount: stats.sourceBriefCount,
      _contextPackCount: stats.contextPackCount,
      _essayCount: 0,
      _hasContextPack: stats.hasContextPack,
      _hasPlan: stats.hasPlan,
      _hasDraft: stats.hasDraft,
      _draftStatus: stats.draftStatus,
      folders: folders.map((f) => ({
        id: f._id,
        name: f.name,
        type: f.type,
        displayOrder: f.displayOrder,
      })),
    };
  },
});

export const getOverviewStats = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return null;
    return getModuleStats(ctx, userId, moduleId);
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    assessmentTitle: v.optional(v.string()),
    assessmentQuestion: v.optional(v.string()),
    deadline: v.optional(v.string()),
    targetGrade: v.optional(v.string()),
    referencingStyle: v.optional(v.string()),
    currentStage: v.optional(stageValidator),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const timestamp = now();
    return ctx.db.insert("modules", {
      userId: args.userId,
      code: args.code,
      title: args.title,
      name: args.title,
      moduleCode: args.code,
      description: args.description || "",
      academicYear: args.academicYear || "",
      semester: args.semester || "",
      colour: args.colour || "#1e3a5f",
      assessmentTitle: args.assessmentTitle || "",
      assessmentQuestion: args.assessmentQuestion || "",
      deadline: args.deadline || "",
      targetGrade: args.targetGrade || "",
      referencingStyle: args.referencingStyle || "Harvard",
      currentStage: args.currentStage || "setup",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const update = mutation({
  args: {
    moduleId: v.string(),
    userId: v.optional(v.string()),
    code: v.optional(v.string()),
    title: v.optional(v.string()),
    name: v.optional(v.string()),
    moduleCode: v.optional(v.string()),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    assessmentTitle: v.optional(v.string()),
    assessmentQuestion: v.optional(v.string()),
    deadline: v.optional(v.string()),
    targetGrade: v.optional(v.string()),
    referencingStyle: v.optional(v.string()),
    currentStage: v.optional(stageValidator),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { moduleId, userId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || (userId && mod.userId !== userId)) throw new Error("Module not found");

    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    if (data.name && !data.title) patch.title = data.name;
    if (data.title && !data.name) patch.name = data.title;
    if (data.moduleCode && !data.code) patch.code = data.moduleCode;
    if (data.code && !data.moduleCode) patch.moduleCode = data.code;

    await ctx.db.patch(moduleId as any, patch);
    const updated = await ctx.db.get(moduleId as any) as any;
    return moduleView(updated);
  },
});

export const createWithFolders = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    assessmentTitle: v.optional(v.string()),
    assessmentQuestion: v.optional(v.string()),
    deadline: v.optional(v.string()),
    targetGrade: v.optional(v.string()),
    referencingStyle: v.optional(v.string()),
    currentStage: v.optional(stageValidator),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    const timestamp = now();
    const moduleId = await ctx.db.insert("modules", {
      userId: args.userId,
      code: args.code,
      title: args.title,
      name: args.title,
      moduleCode: args.code,
      description: args.description || "",
      academicYear: args.academicYear || "",
      semester: args.semester || "",
      colour: args.colour || "#1e3a5f",
      assessmentTitle: args.assessmentTitle || "",
      assessmentQuestion: args.assessmentQuestion || "",
      deadline: args.deadline || "",
      targetGrade: args.targetGrade || "",
      referencingStyle: args.referencingStyle || "Harvard",
      currentStage: args.currentStage || "setup",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const folderDefs = [
      { name: "Module Info", type: "module_info", displayOrder: 0 },
      { name: "Readings", type: "readings", displayOrder: 1 },
      { name: "Lecture and Seminar Material", type: "lectures", displayOrder: 2 },
      { name: "Source Notes", type: "source_notes", displayOrder: 3 },
      { name: "Essay Plans", type: "essay_plans", displayOrder: 4 },
      { name: "Drafts and Feedback", type: "drafts", displayOrder: 5 },
      { name: "Final Submission", type: "final_submission", displayOrder: 6 },
    ];

    for (const fd of folderDefs) {
      await ctx.db.insert("folders", {
        moduleId,
        name: fd.name,
        type: fd.type,
        displayOrder: fd.displayOrder,
      });
    }

    return moduleId;
  },
});
