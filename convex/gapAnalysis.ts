import { query, mutation, internalMutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";
import { gapRunStatus } from "./lib/validators";

async function getOwnedAssignment(
  ctx: QueryCtx,
  assignmentId: Id<"assignments">,
  tokenIdentifier: string,
): Promise<Doc<"assignments"> | null> {
  const assignment = await ctx.db.get(assignmentId);
  if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) return null;
  return assignment;
}

export const listRuns = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) return [];

    return await ctx.db
      .query("gapAnalysisRuns")
      .withIndex("by_assignment_and_createdAt", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .take(20);
  },
});

export const getRun = query({
  args: { runId: v.id("gapAnalysisRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return null;
    return run;
  },
});

export const getLatestRun = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) return null;

    const run = await ctx.db
      .query("gapAnalysisRuns")
      .withIndex("by_assignment_and_createdAt", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .first();

    return run ?? null;
  },
});

export const listFindings = query({
  args: {
    runId: v.id("gapAnalysisRuns"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("gapAnalysisFindings")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .order("asc")
      .take(100);
  },
});

export const getRunWithFindings = query({
  args: { runId: v.id("gapAnalysisRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) return null;

    const findings = await ctx.db
      .query("gapAnalysisFindings")
      .withIndex("by_run", (q) => q.eq("runId", args.runId))
      .order("asc")
      .take(100);

    return { run, findings };
  },
});

export const getLatestRunWithFindings = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) return null;

    const run = await ctx.db
      .query("gapAnalysisRuns")
      .withIndex("by_assignment_and_createdAt", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .first();

    if (!run) return null;

    const findings = await ctx.db
      .query("gapAnalysisFindings")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .order("asc")
      .take(100);

    return { run, findings };
  },
});

export const listFindingsForAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) return [];

    return await ctx.db
      .query("gapAnalysisFindings")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .order("desc")
      .take(100);
  },
});

export interface GapAnalysisContextSource {
  source: Doc<"sources">;
  summary: string | null;
  mainArgument: string | null;
  limitations: string | null;
  concepts: Array<{ concept: string; definition?: string }>;
  claims: Array<{ claim: string; strength?: string }>;
  sampleChunks: Array<{ chunkId: Id<"sourceChunks">; text: string; pageStart?: number; pageEnd?: number }>;
}

export interface RequiredReadingLite {
  _id: Id<"requiredReadings">;
  title: string;
  authors?: string;
  year?: number;
  sourceId: Id<"sources"> | null;
}

export interface AssessmentSpecLite {
  _id: Id<"assessmentSpecs">;
  title: string;
  question?: string;
  wordLimit?: number;
  deadline?: string;
  weight?: number;
  assignmentId: Id<"assignments"> | null;
}

export const getGapAnalysisContext = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) return null;

    const moduleDoc = await ctx.db.get(assignment.moduleId);
    if (!moduleDoc || moduleDoc.tokenIdentifier !== tokenIdentifier) return null;

    const sourceLinks = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .take(100);

    const sources: GapAnalysisContextSource[] = [];
    let totalChunks = 0;

    for (const link of sourceLinks.slice(0, 20)) {
      const source = await ctx.db.get(link.sourceId);
      if (!source || source.tokenIdentifier !== tokenIdentifier) continue;

      const analyses = await ctx.db
        .query("sourceAnalyses")
        .withIndex("by_source", (q) => q.eq("sourceId", link.sourceId))
        .take(20);

      const summary =
        analyses.find((a) => a.analysisType === "summary")?.content ?? null;
      const mainArgument =
        analyses.find((a) => a.analysisType === "main_argument")?.content ?? null;
      const limitations =
        analyses.find((a) => a.analysisType === "limitations")?.content ?? null;

      const conceptDocs = await ctx.db
        .query("sourceConcepts")
        .withIndex("by_source", (q) => q.eq("sourceId", link.sourceId))
        .take(15);
      const concepts = conceptDocs.map((c) => ({
        concept: c.concept,
        definition: c.definition,
      }));

      const claimDocs = await ctx.db
        .query("sourceClaims")
        .withIndex("by_source", (q) => q.eq("sourceId", link.sourceId))
        .take(15);
      const claims = claimDocs.map((c) => ({
        claim: c.claim,
        strength: c.strength,
      }));

      const chunkDocs = await ctx.db
        .query("sourceChunks")
        .withIndex("by_source_and_chunkIndex", (q) =>
          q.eq("sourceId", link.sourceId),
        )
        .order("asc")
        .take(8);
      totalChunks += chunkDocs.length;
      const sampleChunks = chunkDocs.map((c) => ({
        chunkId: c._id,
        text: c.text,
        pageStart: c.pageStart,
        pageEnd: c.pageEnd,
      }));

      sources.push({
        source,
        summary,
        mainArgument,
        limitations,
        concepts,
        claims,
        sampleChunks,
      });
    }

    const assessmentSpecs: AssessmentSpecLite[] = [];
    try {
      const specs = await ctx.db
        .query("assessmentSpecs")
        .withIndex("by_module", (q) => q.eq("moduleId", assignment.moduleId))
        .take(10);
      for (const spec of specs) {
        if (spec.tokenIdentifier !== tokenIdentifier) continue;
        assessmentSpecs.push({
          _id: spec._id,
          title: spec.title,
          question: spec.question,
          wordLimit: spec.wordLimit,
          deadline: spec.deadline,
          weight: spec.weight,
          assignmentId: spec.assignmentId ?? null,
        });
      }
    } catch {
      // assessmentSpecs table may be absent in some deployments
    }

    const requiredReadings: RequiredReadingLite[] = [];
    try {
      const readings = await ctx.db
        .query("requiredReadings")
        .withIndex("by_module", (q) => q.eq("moduleId", assignment.moduleId))
        .take(50);
      for (const r of readings) {
        if (r.tokenIdentifier !== tokenIdentifier) continue;
        requiredReadings.push({
          _id: r._id,
          title: r.title,
          authors: r.authors,
          year: r.year,
          sourceId: r.sourceId ?? null,
        });
      }
    } catch {
      // requiredReadings table may be absent in some deployments
    }

    const argumentsList = await ctx.db
      .query("arguments")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .order("asc")
      .take(30);

    let evidenceCount = 0;
    for (const arg of argumentsList.slice(0, 20)) {
      const links = await ctx.db
        .query("evidenceLinks")
        .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
        .take(30);
      evidenceCount += links.length;
    }

    return {
      module: moduleDoc,
      assignment,
      assessmentSpecs,
      requiredReadings,
      sources,
      arguments: argumentsList,
      argumentCount: argumentsList.length,
      evidenceCount,
      sourceCount: sources.length,
      chunkCount: totalChunks,
    };
  },
});

export const createRunWithFindings = mutation({
  args: {
    assignmentId: v.id("assignments"),
    status: gapRunStatus,
    summary: v.string(),
    overallConfidence: v.optional(v.number()),
    providerUsed: v.optional(v.string()),
    modelUsed: v.optional(v.string()),
    warnings: v.optional(v.array(v.string())),
    sourceCount: v.optional(v.number()),
    chunkCount: v.optional(v.number()),
    findings: v.array(
      v.object({
        gapCategory: v.string(),
        title: v.string(),
        content: v.string(),
        severity: v.string(),
        confidence: v.number(),
        rationale: v.string(),
        label: v.optional(v.string()),
        citedChunkIds: v.optional(v.array(v.id("sourceChunks"))),
        relatedRubricCriterion: v.optional(v.string()),
        suggestedSearchTerms: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) throw new Error("Not found");

    const now = Date.now();
    const runId = await ctx.db.insert("gapAnalysisRuns", {
      tokenIdentifier,
      assignmentId: args.assignmentId,
      status: args.status,
      summary: args.summary,
      overallConfidence: args.overallConfidence,
      providerUsed: args.providerUsed,
      modelUsed: args.modelUsed,
      warnings: args.warnings,
      sourceCount: args.sourceCount,
      chunkCount: args.chunkCount,
      createdAt: now,
    });

    for (const finding of args.findings) {
      await ctx.db.insert("gapAnalysisFindings", {
        tokenIdentifier,
        runId,
        assignmentId: args.assignmentId,
        gapCategory: finding.gapCategory as Doc<"gapAnalysisFindings">["gapCategory"],
        title: finding.title,
        content: finding.content,
        severity: finding.severity,
        confidence: finding.confidence,
        rationale: finding.rationale,
        label: finding.label,
        citedChunkIds: finding.citedChunkIds,
        relatedRubricCriterion: finding.relatedRubricCriterion,
        suggestedSearchTerms: finding.suggestedSearchTerms,
        createdAt: now,
      });
    }

    return runId as Id<"gapAnalysisRuns">;
  },
});

export const createFailedRun = mutation({
  args: {
    assignmentId: v.id("assignments"),
    errorMessage: v.string(),
    providerUsed: v.optional(v.string()),
    modelUsed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await getOwnedAssignment(ctx, args.assignmentId, tokenIdentifier);
    if (!assignment) throw new Error("Not found");

    return await ctx.db.insert("gapAnalysisRuns", {
      tokenIdentifier,
      assignmentId: args.assignmentId,
      status: "failed",
      summary: `Gap analysis failed: ${args.errorMessage}`,
      providerUsed: args.providerUsed,
      modelUsed: args.modelUsed,
      errorMessage: args.errorMessage,
      warnings: ["gap_analysis_failed"],
      createdAt: Date.now(),
    }) as Id<"gapAnalysisRuns">;
  },
});

export const dismissFinding = mutation({
  args: { findingId: v.id("gapAnalysisFindings") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const finding = await ctx.db.get(args.findingId);
    if (!finding || finding.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }
    await ctx.db.patch(args.findingId, { severity: "info" });
    return args.findingId;
  },
});

export const removeRun = mutation({
  args: { runId: v.id("gapAnalysisRuns") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run || run.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const BATCH = 100;
    let hasMore = true;
    while (hasMore) {
      const findings = await ctx.db
        .query("gapAnalysisFindings")
        .withIndex("by_run", (q) => q.eq("runId", args.runId))
        .take(BATCH);
      if (findings.length === 0) break;
      for (const f of findings) {
        await ctx.db.delete(f._id);
      }
      hasMore = findings.length === BATCH;
    }

    await ctx.db.delete(args.runId);
    return args.runId;
  },
});

export const deleteForAssignmentInternal = internalMutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const BATCH = 100;

    let hasFindings = true;
    while (hasFindings) {
      const findings = await ctx.db
        .query("gapAnalysisFindings")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
        .take(BATCH);
      if (findings.length === 0) break;
      for (const f of findings) {
        await ctx.db.delete(f._id);
      }
      hasFindings = findings.length === BATCH;
    }

    let hasRuns = true;
    while (hasRuns) {
      const runs = await ctx.db
        .query("gapAnalysisRuns")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
        .take(BATCH);
      if (runs.length === 0) break;
      for (const r of runs) {
        await ctx.db.delete(r._id);
      }
      hasRuns = runs.length === BATCH;
    }

    return { assignmentId: args.assignmentId };
  },
});
