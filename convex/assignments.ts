import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";

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
          q.eq("tokenIdentifier", tokenIdentifier).eq("moduleId", args.moduleId!),
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
    stage: v.string(),
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

export const remove = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.assignmentId);
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
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
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
      .withIndex("by_assignment", (q) =>
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

    const latestDraft = await ctx.db
      .query("drafts")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .first();

    let latestReview: { run: Doc<"reviewRuns">; findings: Doc<"reviewFindings">[] } | null = null;
    if (latestDraft) {
      const reviewRun = await ctx.db
        .query("reviewRuns")
        .withIndex("by_draft", (q) => q.eq("draftId", latestDraft._id))
        .order("desc")
        .first();

      if (reviewRun) {
        const findings = await ctx.db
          .query("reviewFindings")
          .withIndex("by_reviewRun", (q) =>
            q.eq("reviewRunId", reviewRun._id),
          )
          .take(100);
        latestReview = { run: reviewRun, findings };
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
      latestDraft: latestDraft ?? null,
      latestReview,
    };
  },
});
