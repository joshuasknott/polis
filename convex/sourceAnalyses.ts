import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import {
  extractionProvenance,
  gapCategory,
  sourceSignalSeverity,
} from "./lib/validators";

export const getForSource = query({
  args: {
    sourceId: v.id("sources"),
    assignmentId: v.optional(v.id("assignments")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) return null;

    const analyses = await ctx.db
      .query("sourceAnalyses")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(50);

    const filtered = args.assignmentId
      ? analyses.filter(
          (a) =>
            a.assignmentId === args.assignmentId ||
            a.assignmentId === undefined,
        )
      : analyses;

    const claims = await ctx.db
      .query("sourceClaims")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(100);

    const concepts = await ctx.db
      .query("sourceConcepts")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(100);

    const notes = await ctx.db
      .query("sourceNotes")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .order("desc")
      .take(50);

    return {
      analyses: filtered,
      claims,
      concepts,
      notes,
    };
  },
});

export const listForAssignment = query({
  args: {
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return [];
    }

    const sourceLinks = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(100);

    const results = [];
    for (const link of sourceLinks) {
      const source = await ctx.db.get(link.sourceId);
      if (!source) continue;

      const analyses = await ctx.db
        .query("sourceAnalyses")
        .withIndex("by_source", (q) => q.eq("sourceId", link.sourceId))
        .take(50);

      const assignmentAnalyses = analyses.filter(
        (a) =>
          a.assignmentId === args.assignmentId ||
          a.assignmentId === undefined,
      );

      const claims = await ctx.db
        .query("sourceClaims")
        .withIndex("by_source", (q) => q.eq("sourceId", link.sourceId))
        .take(100);

      const concepts = await ctx.db
        .query("sourceConcepts")
        .withIndex("by_source", (q) => q.eq("sourceId", link.sourceId))
        .take(100);

      results.push({
        source,
        analyses: assignmentAnalyses,
        claims,
        concepts,
      });
    }

    return results;
  },
});

export const getReadiness = query({
  args: {
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return null;
    }

    const sourceLinks = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(100);

    let allProcessed = true;
    const totalSources = sourceLinks.length;
    let processedCount = 0;
    let analysedCount = 0;

    for (const link of sourceLinks) {
      const source = await ctx.db.get(link.sourceId);
      if (!source) continue;

      const isProcessed =
        source.status === "processed" || source.status === "needs_review";
      if (isProcessed) {
        processedCount++;
      } else {
        allProcessed = false;
      }

      const analyses = await ctx.db
        .query("sourceAnalyses")
        .withIndex("by_source", (q) => q.eq("sourceId", link.sourceId))
        .take(1);

      if (analyses.length > 0) {
        analysedCount++;
      }
    }

    const hasBrief = Boolean(assignment.question && assignment.question.trim().length > 0);
    const hasRubric = Boolean(assignment.rubric && assignment.rubric.length > 0);

    return {
      totalSources,
      processedCount,
      analysedCount,
      allProcessed,
      hasBrief,
      hasRubric,
      readyToAdvance:
        totalSources > 0 &&
        allProcessed &&
        (hasBrief || hasRubric) &&
        analysedCount === totalSources,
    };
  },
});

export const createAnalysis = mutation({
  args: {
    sourceId: v.id("sources"),
    assignmentId: v.optional(v.id("assignments")),
    analysisType: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.assignmentId) {
      const assignment = await ctx.db.get(args.assignmentId);
      if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
        throw new Error("Not found");
      }
    }

    const existing = await ctx.db
      .query("sourceAnalyses")
      .withIndex("by_source_and_type", (q) =>
        q
          .eq("sourceId", args.sourceId)
          .eq("analysisType", args.analysisType),
      )
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        assignmentId: args.assignmentId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("sourceAnalyses", {
      tokenIdentifier,
      sourceId: args.sourceId,
      assignmentId: args.assignmentId,
      analysisType: args.analysisType,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const internalCreateAnalysis = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    sourceId: v.id("sources"),
    assignmentId: v.optional(v.id("assignments")),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    analysisType: v.string(),
    content: v.string(),
    confidence: v.optional(v.number()),
    provenance: v.optional(extractionProvenance),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("sourceAnalyses", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteAnalysis = mutation({
  args: {
    analysisId: v.id("sourceAnalyses"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const analysis = await ctx.db.get(args.analysisId);
    if (!analysis || analysis.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.analysisId);
    return args.analysisId;
  },
});

export const createClaim = mutation({
  args: {
    sourceId: v.id("sources"),
    claim: v.string(),
    context: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    strength: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    return await ctx.db.insert("sourceClaims", {
      tokenIdentifier,
      sourceId: args.sourceId,
      claim: args.claim,
      context: args.context,
      pageRange: args.pageRange,
      strength: args.strength ?? "moderate",
      createdAt: Date.now(),
    });
  },
});

export const internalCreateClaim = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    sourceId: v.id("sources"),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    claim: v.string(),
    context: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    strength: v.optional(v.string()),
    confidence: v.optional(v.number()),
    provenance: v.optional(extractionProvenance),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sourceClaims", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const removeClaim = mutation({
  args: {
    claimId: v.id("sourceClaims"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const claim = await ctx.db.get(args.claimId);
    if (!claim || claim.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.claimId);
    return args.claimId;
  },
});

export const createConcept = mutation({
  args: {
    sourceId: v.id("sources"),
    concept: v.string(),
    definition: v.optional(v.string()),
    relevance: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    return await ctx.db.insert("sourceConcepts", {
      tokenIdentifier,
      sourceId: args.sourceId,
      concept: args.concept,
      definition: args.definition,
      relevance: args.relevance,
      createdAt: Date.now(),
    });
  },
});

export const internalCreateConcept = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    sourceId: v.id("sources"),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    concept: v.string(),
    definition: v.optional(v.string()),
    relevance: v.optional(v.string()),
    confidence: v.optional(v.number()),
    provenance: v.optional(extractionProvenance),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sourceConcepts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const internalCreateRelevanceSignal = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    sourceId: v.id("sources"),
    assignmentId: v.optional(v.id("assignments")),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    signalType: v.string(),
    title: v.string(),
    rationale: v.string(),
    confidence: v.number(),
    provenance: v.optional(extractionProvenance),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("sourceRelevanceSignals", {
      ...args,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const internalCreateGapSignal = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    sourceId: v.optional(v.id("sources")),
    assignmentId: v.optional(v.id("assignments")),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    gapCategory: v.optional(gapCategory),
    title: v.string(),
    content: v.string(),
    severity: sourceSignalSeverity,
    confidence: v.number(),
    suggestedAction: v.optional(v.string()),
    provenance: v.optional(extractionProvenance),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("sourceGapSignals", {
      ...args,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeConcept = mutation({
  args: {
    conceptId: v.id("sourceConcepts"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const concept = await ctx.db.get(args.conceptId);
    if (!concept || concept.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.conceptId);
    return args.conceptId;
  },
});

export const markSourceAnalysed = mutation({
  args: {
    sourceId: v.id("sources"),
    assignmentId: v.id("assignments"),
    skipped: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();

    if (args.skipped) {
      const existing = await ctx.db
        .query("sourceAnalyses")
        .withIndex("by_source_and_type", (q) =>
          q.eq("sourceId", args.sourceId).eq("analysisType", "skip"),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          updatedAt: now,
        });
        return existing._id;
      }

      return await ctx.db.insert("sourceAnalyses", {
        tokenIdentifier,
        sourceId: args.sourceId,
        assignmentId: args.assignmentId,
        analysisType: "skip",
        content: "User skipped analysis for this source.",
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});
