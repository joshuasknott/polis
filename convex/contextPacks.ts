import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

function now() {
  return new Date().toISOString();
}

function view(pack: any) {
  return {
    id: pack._id,
    userId: pack.userId,
    moduleId: pack.moduleId,
    assignmentId: pack.assignmentId || null,
    title: pack.title,
    assessmentQuestion: pack.assessmentQuestion || "",
    selectedSourceIds: pack.selectedSourceIds || [],
    selectedKnowledgePageIds: pack.selectedKnowledgePageIds || [],
    markingCriteria: pack.markingCriteria || "",
    workingThesis: pack.workingThesis || "",
    keyClaims: pack.keyClaims || [],
    keyQuotes: pack.keyQuotes || [],
    caseStudies: pack.caseStudies || [],
    missingEvidence: pack.missingEvidence || [],
    draftingInstructions: pack.draftingInstructions || "",
    createdAt: pack.createdAt,
    updatedAt: pack.updatedAt,
    _creationTime: pack._creationTime,
  };
}

async function requireModule(ctx: any, userId: string, moduleId: string) {
  const mod = await ctx.db.get(moduleId as any) as any;
  if (!mod || mod.userId !== userId) throw new Error("Module not found");
}

const contextPackFields = {
  title: v.optional(v.string()),
  assessmentQuestion: v.optional(v.string()),
  selectedSourceIds: v.optional(v.array(v.string())),
  selectedKnowledgePageIds: v.optional(v.array(v.string())),
  markingCriteria: v.optional(v.string()),
  workingThesis: v.optional(v.string()),
  keyClaims: v.optional(v.array(v.string())),
  keyQuotes: v.optional(v.array(v.string())),
  caseStudies: v.optional(v.array(v.string())),
  missingEvidence: v.optional(v.array(v.string())),
  draftingInstructions: v.optional(v.string()),
};

export const listByModule = query({
  args: { userId: v.string(), moduleId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return [];
    const packs = await ctx.db
      .query("contextPacks")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .order("desc")
      .take(100);
    return packs.map(view);
  },
});

export const listByAssignment = query({
  args: { userId: v.string(), assignmentId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const assignment = await ctx.db.get(assignmentId as any) as any;
    if (!assignment || assignment.userId !== userId) return [];
    const packs = await ctx.db
      .query("contextPacks")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", assignment.moduleId))
      .take(100);
    return packs.filter((p: any) => p.assignmentId === assignmentId).map(view);
  },
});

export const getActive = query({
  args: { userId: v.string(), moduleId: v.string(), assignmentId: v.optional(v.string()), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, moduleId, assignmentId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const mod = await ctx.db.get(moduleId as any) as any;
    if (!mod || mod.userId !== userId) return null;
    const packs = await ctx.db
      .query("contextPacks")
      .withIndex("by_userId_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .take(100);
    const filtered = assignmentId
      ? packs.filter((p: any) => p.assignmentId === assignmentId)
      : packs;
    const active = filtered.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "") || b._creationTime - a._creationTime)[0];
    return active ? view(active) : null;
  },
});

export const create = mutation({
  args: {
    userId: v.string(),
    moduleId: v.string(),
    assignmentId: v.optional(v.string()),
    title: v.string(),
    assessmentQuestion: v.optional(v.string()),
    selectedSourceIds: v.optional(v.array(v.string())),
    selectedKnowledgePageIds: v.optional(v.array(v.string())),
    markingCriteria: v.optional(v.string()),
    workingThesis: v.optional(v.string()),
    keyClaims: v.optional(v.array(v.string())),
    keyQuotes: v.optional(v.array(v.string())),
    caseStudies: v.optional(v.array(v.string())),
    missingEvidence: v.optional(v.array(v.string())),
    draftingInstructions: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireServerSecret(args.serverSecret);
    await requireModule(ctx, args.userId, args.moduleId);
    const timestamp = now();
    const packId = await ctx.db.insert("contextPacks", {
      userId: args.userId,
      moduleId: args.moduleId,
      assignmentId: args.assignmentId || undefined,
      title: args.title,
      assessmentQuestion: args.assessmentQuestion || "",
      selectedSourceIds: args.selectedSourceIds || [],
      selectedKnowledgePageIds: args.selectedKnowledgePageIds || [],
      markingCriteria: args.markingCriteria || "",
      workingThesis: args.workingThesis || "",
      keyClaims: args.keyClaims || [],
      keyQuotes: args.keyQuotes || [],
      caseStudies: args.caseStudies || [],
      missingEvidence: args.missingEvidence || [],
      draftingInstructions: args.draftingInstructions || "",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const pack = await ctx.db.get(packId);
    return view(pack);
  },
});

export const update = mutation({
  args: {
    userId: v.string(),
    contextPackId: v.string(),
    ...contextPackFields,
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, contextPackId, serverSecret, ...data }) => {
    requireServerSecret(serverSecret);
    const pack = await ctx.db.get(contextPackId as any) as any;
    if (!pack || pack.userId !== userId) throw new Error("Context pack not found");
    const patch: Record<string, unknown> = { updatedAt: now() };
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) patch[key] = val;
    }
    await ctx.db.patch(contextPackId as any, patch);
    const updated = await ctx.db.get(contextPackId as any);
    return view(updated);
  },
});
