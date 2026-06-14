import {
  query,
  mutation,
  internalMutation,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";
import { productionStage } from "./lib/validators";
import { internal } from "./_generated/api";

export const list = query({
  args: {
    moduleId: v.optional(v.id("modules")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    if (args.moduleId) {
      return await ctx.db
        .query("assignments")
        .withIndex("by_tokenIdentifier_and_module", (q) =>
          q
            .eq("tokenIdentifier", tokenIdentifier)
            .eq("moduleId", args.moduleId!),
        )
        .order("desc")
        .take(100);
    }

    return await ctx.db
      .query("assignments")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", tokenIdentifier),
      )
      .order("desc")
      .take(100);
  },
});

export const get = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return null;
    }
    return assignment;
  },
});

export const create = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.string(),
    question: v.optional(v.string()),
    wordLimit: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    rubric: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          weight: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const now = Date.now();
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    return await ctx.db.insert("assignments", {
      ...args,
      tokenIdentifier,
      stage: "ingest",
      contextVersion: mod.contextVersion ?? 1,
      contextUpdatedAt: mod.contextUpdatedAt ?? now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    assignmentId: v.id("assignments"),
    title: v.optional(v.string()),
    question: v.optional(v.string()),
    wordLimit: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    rubric: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          weight: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { assignmentId, ...updates } = args;
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(assignmentId, { ...updates, updatedAt: Date.now() });
    return assignmentId;
  },
});

export const updateStage = mutation({
  args: {
    assignmentId: v.id("assignments"),
    stage: productionStage,
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.assignmentId, {
      stage: args.stage,
      updatedAt: Date.now(),
    });
    return args.assignmentId;
  },
});

export const updateThesis = mutation({
  args: {
    assignmentId: v.id("assignments"),
    thesis: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(args.assignmentId, {
      thesis: args.thesis,
      updatedAt: Date.now(),
    });
    return args.assignmentId;
  },
});

export const listSectionPlans = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("sectionPlans")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("asc")
      .take(50);
  },
});

export const createSectionPlan = mutation({
  args: {
    assignmentId: v.id("assignments"),
    label: v.string(),
    wordBudget: v.number(),
    argumentIds: v.optional(v.array(v.id("arguments"))),
    counterargumentPlan: v.optional(v.string()),
    rebuttalPlan: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();
    return await ctx.db.insert("sectionPlans", {
      tokenIdentifier,
      assignmentId: args.assignmentId,
      label: args.label,
      wordBudget: args.wordBudget,
      argumentIds: args.argumentIds,
      counterargumentPlan: args.counterargumentPlan,
      rebuttalPlan: args.rebuttalPlan,
      sortOrder: args.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateSectionPlan = mutation({
  args: {
    sectionPlanId: v.id("sectionPlans"),
    label: v.optional(v.string()),
    wordBudget: v.optional(v.number()),
    argumentIds: v.optional(v.array(v.id("arguments"))),
    counterargumentPlan: v.optional(v.string()),
    rebuttalPlan: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { sectionPlanId, ...updates } = args;
    const plan = await ctx.db.get(sectionPlanId);
    if (!plan || plan.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.label !== undefined) patch.label = updates.label;
    if (updates.wordBudget !== undefined) patch.wordBudget = updates.wordBudget;
    if (updates.argumentIds !== undefined) patch.argumentIds = updates.argumentIds;
    if (updates.counterargumentPlan !== undefined) patch.counterargumentPlan = updates.counterargumentPlan;
    if (updates.rebuttalPlan !== undefined) patch.rebuttalPlan = updates.rebuttalPlan;
    if (updates.sortOrder !== undefined) patch.sortOrder = updates.sortOrder;

    await ctx.db.patch(sectionPlanId, patch);
    return sectionPlanId;
  },
});

export const removeSectionPlan = mutation({
  args: { sectionPlanId: v.id("sectionPlans") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const plan = await ctx.db.get(args.sectionPlanId);
    if (!plan || plan.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.sectionPlanId);
    return args.sectionPlanId;
  },
});

export const remove = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.runMutation(internal.cleanup.deleteAssignmentData, {
      assignmentId: args.assignmentId,
    });
    return args.assignmentId;
  },
});

export const listSources = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return [];
    }

    return await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(100);
  },
});

export const addSource = mutation({
  args: {
    assignmentId: v.id("assignments"),
    sourceId: v.id("sources"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }
    if (source.moduleId !== assignment.moduleId) {
      throw new Error("Source and assignment must be in the same module");
    }

    const existing = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment_and_source", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("sourceId", args.sourceId),
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("assignmentSources", {
      tokenIdentifier,
      assignmentId: args.assignmentId,
      sourceId: args.sourceId,
      addedAt: Date.now(),
    });
  },
});

export const removeSource = mutation({
  args: {
    assignmentId: v.id("assignments"),
    sourceId: v.id("sources"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const link = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment_and_source", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("sourceId", args.sourceId),
      )
      .unique();
    if (!link) throw new Error("Link not found");

    await ctx.db.delete(link._id);
    return link._id;
  },
});

export const listWithSourceCounts = query({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.tokenIdentifier !== tokenIdentifier) return [];

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .take(100);

    const results = [];
    for (const assignment of assignments) {
      const sourceLinks = await ctx.db
        .query("assignmentSources")
        .withIndex("by_assignment", (q) =>
          q.eq("assignmentId", assignment._id),
        )
        .take(200);
      results.push({
        ...assignment,
        selectedSourceCount: sourceLinks.length,
      });
    }
    return results;
  },
});

async function getModuleAndAssignment(
  ctx: QueryCtx,
  tokenIdentifier: string,
  moduleId: Id<"modules">,
  assignmentId: Id<"assignments">,
) {
  const mod = await ctx.db.get(moduleId);
  if (!mod || mod.tokenIdentifier !== tokenIdentifier) return null;
  const assignment = await ctx.db.get(assignmentId);
  if (
    !assignment ||
    assignment.tokenIdentifier !== tokenIdentifier ||
    assignment.moduleId !== moduleId
  ) {
    return null;
  }
  return { mod, assignment };
}

export const getWorkspaceBundle = query({
  args: {
    moduleId: v.id("modules"),
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const pair = await getModuleAndAssignment(
      ctx,
      tokenIdentifier,
      args.moduleId,
      args.assignmentId,
    );
    if (!pair) return null;

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_module_and_sortOrder", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .order("asc")
      .take(100);

    const moduleSources = await ctx.db
      .query("sources")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .take(200);

    const assignmentSourceLinks = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(200);

    const selectedSourceIds = new Set(
      assignmentSourceLinks.map((l) => l.sourceId),
    );
    const selectedSources = moduleSources.filter((s) =>
      selectedSourceIds.has(s._id),
    );

    const selectedSourceNotes: Doc<"sourceNotes">[] = [];
    for (const source of selectedSources) {
      const notes = await ctx.db
        .query("sourceNotes")
        .withIndex("by_source", (q) => q.eq("sourceId", source._id))
        .take(100);
      selectedSourceNotes.push(...notes);
    }

    const argsList = await ctx.db
      .query("arguments")
      .withIndex("by_assignment_and_sortOrder", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("asc")
      .take(100);

    const evidence: Doc<"evidenceLinks">[] = [];
    for (const arg of argsList) {
      const links = await ctx.db
        .query("evidenceLinks")
        .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
        .take(100);
      evidence.push(...links);
    }

    const counterargumentNodes: Doc<"argumentNodes">[] = [];
    for (const arg of argsList) {
      const nodes = await ctx.db
        .query("argumentNodes")
        .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
        .take(100);
      counterargumentNodes.push(...nodes.filter((n) => n.type === "counterargument"));
    }

    const judgementOptions = await ctx.db
      .query("judgementOptions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(50);

    const judgementDecisions = await ctx.db
      .query("judgementDecisions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .take(50);

    const sectionPlans = await ctx.db
      .query("sectionPlans")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("asc")
      .take(50);

    const latestDraft = await ctx.db
      .query("drafts")
      .withIndex("by_assignment_and_version", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .first();

    const draftBlocks: Doc<"draftBlocks">[] = [];
    const reviewRuns: Doc<"reviewRuns">[] = [];
    const reviewFindings: Doc<"reviewFindings">[] = [];
    let latestReview: {
      run: Doc<"reviewRuns">;
      findings: Doc<"reviewFindings">[];
    } | null = null;
    if (latestDraft) {
      const blocks = await ctx.db
        .query("draftBlocks")
        .withIndex("by_draft_and_sortOrder", (q) =>
          q.eq("draftId", latestDraft._id),
        )
        .order("asc")
        .take(100);
      draftBlocks.push(...blocks);

      const runs = await ctx.db
        .query("reviewRuns")
        .withIndex("by_draft", (q) => q.eq("draftId", latestDraft._id))
        .order("desc")
        .take(5);
      reviewRuns.push(...runs);

      for (const run of reviewRuns) {
        const findings = await ctx.db
          .query("reviewFindings")
          .withIndex("by_reviewRun", (q) =>
            q.eq("reviewRunId", run._id),
          )
          .take(100);
        reviewFindings.push(...findings);
      }

      const latestReviewRun = reviewRuns[0];
      if (latestReviewRun) {
        latestReview = {
          run: latestReviewRun,
          findings: reviewFindings.filter(
            (finding) => finding.reviewRunId === latestReviewRun._id,
          ),
        };
      }
    }

    return {
      module: pair.mod,
      assignment: pair.assignment,
      folders,
      moduleSources,
      assignmentSourceLinks,
      selectedSources,
      selectedSourceNotes,
      arguments: argsList,
      evidence,
      counterargumentNodes,
      judgementOptions,
      judgementDecisions,
      sectionPlans,
      latestDraft: latestDraft ?? null,
      draftBlocks,
      reviewRuns,
      reviewFindings,
      latestReview,
    };
  },
});

export const getFullContext = query({
  args: {
    moduleId: v.id("modules"),
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const pair = await getModuleAndAssignment(
      ctx,
      tokenIdentifier,
      args.moduleId,
      args.assignmentId,
    );
    if (!pair) return null;

    const { mod, assignment } = pair;

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_module_and_sortOrder", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .order("asc")
      .take(100);

    const moduleSources = await ctx.db
      .query("sources")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .take(200);

    const assignmentSourceLinks = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(100);

    const selectedSourceIds = new Set(
      assignmentSourceLinks.map((l) => l.sourceId),
    );
    const selectedSources = moduleSources.filter((s) =>
      selectedSourceIds.has(s._id),
    );

    const sourceNotes: Doc<"sourceNotes">[] = [];
    for (const source of selectedSources.slice(0, 30)) {
      const notes = await ctx.db
        .query("sourceNotes")
        .withIndex("by_source", (q) => q.eq("sourceId", source._id))
        .take(20);
      sourceNotes.push(...notes);
    }

    const sourceAnalyses: Doc<"sourceAnalyses">[] = [];
    for (const source of selectedSources.slice(0, 30)) {
      const analyses = await ctx.db
        .query("sourceAnalyses")
        .withIndex("by_source", (q) => q.eq("sourceId", source._id))
        .take(10);
      sourceAnalyses.push(...analyses);
    }

    const sourceClaims: Doc<"sourceClaims">[] = [];
    for (const source of selectedSources.slice(0, 20)) {
      const claims = await ctx.db
        .query("sourceClaims")
        .withIndex("by_source", (q) => q.eq("sourceId", source._id))
        .take(20);
      sourceClaims.push(...claims);
    }

    const sourceConcepts: Doc<"sourceConcepts">[] = [];
    for (const source of selectedSources.slice(0, 20)) {
      const concepts = await ctx.db
        .query("sourceConcepts")
        .withIndex("by_source", (q) => q.eq("sourceId", source._id))
        .take(20);
      sourceConcepts.push(...concepts);
    }

    const argsList = await ctx.db
      .query("arguments")
      .withIndex("by_assignment_and_sortOrder", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("asc")
      .take(50);

    const argumentNodes: Doc<"argumentNodes">[] = [];
    for (const arg of argsList.slice(0, 20)) {
      const nodes = await ctx.db
        .query("argumentNodes")
        .withIndex("by_argument_and_sortOrder", (q) =>
          q.eq("argumentId", arg._id),
        )
        .order("asc")
        .take(30);
      argumentNodes.push(...nodes);
    }

    const evidence: Doc<"evidenceLinks">[] = [];
    for (const arg of argsList.slice(0, 20)) {
      const links = await ctx.db
        .query("evidenceLinks")
        .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
        .take(30);
      evidence.push(...links);
    }

    const allDrafts = await ctx.db
      .query("drafts")
      .withIndex("by_assignment_and_version", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .take(20);

    const latestDraft = allDrafts[0] ?? null;

    const draftBlocks: Doc<"draftBlocks">[] = [];
    if (latestDraft) {
      const blocks = await ctx.db
        .query("draftBlocks")
        .withIndex("by_draft_and_sortOrder", (q) =>
          q.eq("draftId", latestDraft._id),
        )
        .order("asc")
        .take(100);
      draftBlocks.push(...blocks);
    }

    const reviewRuns: Doc<"reviewRuns">[] = [];
    const reviewFindings: Doc<"reviewFindings">[] = [];
    if (latestDraft) {
      const runs = await ctx.db
        .query("reviewRuns")
        .withIndex("by_draft", (q) => q.eq("draftId", latestDraft._id))
        .order("desc")
        .take(5);
      reviewRuns.push(...runs);

      for (const run of reviewRuns) {
        const findings = await ctx.db
          .query("reviewFindings")
          .withIndex("by_reviewRun", (q) =>
            q.eq("reviewRunId", run._id),
          )
          .take(50);
        reviewFindings.push(...findings);
      }
    }

    const judgementOptions = await ctx.db
      .query("judgementOptions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(30);

    const judgementDecisions = await ctx.db
      .query("judgementDecisions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(50);

    const coThinkerSessions = await ctx.db
      .query("coThinkerSessions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .take(10);

    return {
      module: mod,
      assignment,
      folders,
      moduleSources,
      assignmentSourceLinks,
      selectedSources,
      sourceNotes,
      sourceAnalyses,
      sourceClaims,
      sourceConcepts,
      arguments: argsList,
      argumentNodes,
      evidence,
      allDrafts,
      latestDraft,
      draftBlocks,
      reviewRuns,
      reviewFindings,
      judgementOptions,
      judgementDecisions,
      coThinkerSessions,
    };
  },
});

export const bumpModuleContextVersion = internalMutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const mod = await ctx.db.get(args.moduleId);
    if (!mod) return;

    const now = Date.now();
    await ctx.db.patch(args.moduleId, {
      contextVersion: (mod.contextVersion ?? 0) + 1,
      contextUpdatedAt: now,
      updatedAt: now,
    });
  },
});
