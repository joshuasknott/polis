import { internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

const BATCH = 100;

async function deleteAll(
  ctx: MutationCtx,
  table: string,
  indexName: string,
  key: string,
  value: string,
): Promise<number> {
  let deleted = 0;
  let hasMore = true;
  while (hasMore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs = await (ctx.db as any)
      .query(table)
      .withIndex(indexName, (q: { eq: (k: string, v: string) => unknown }) => q.eq(key, value))
      .take(BATCH);
    if (docs.length === 0) {
      hasMore = false;
      break;
    }
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
      deleted++;
    }
    hasMore = docs.length === BATCH;
  }
  return deleted;
}

export const deleteModuleData = internalMutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    await deleteAll(ctx, "folders", "by_module", "moduleId", args.moduleId);

    const sources = await ctx.db
      .query("sources")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .take(BATCH);
    for (const s of sources) {
      await deleteAll(ctx, "sourceChunks", "by_source", "sourceId", s._id);
      await deleteAll(ctx, "sourceNotes", "by_source", "sourceId", s._id);
      await deleteAll(ctx, "sourceAnalyses", "by_source", "sourceId", s._id);
      await deleteAll(ctx, "sourceClaims", "by_source", "sourceId", s._id);
      await deleteAll(ctx, "sourceConcepts", "by_source", "sourceId", s._id);
      await deleteAll(ctx, "processingJobs", "by_source", "sourceId", s._id);
      await deleteAll(ctx, "assignmentSources", "by_source", "sourceId", s._id);
      await deleteAll(ctx, "evidenceLinks", "by_source", "sourceId", s._id);
      await ctx.db.delete(s._id);
    }
    let hasMoreSources = sources.length === BATCH;
    while (hasMoreSources) {
      const more = await ctx.db
        .query("sources")
        .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
        .take(BATCH);
      if (more.length === 0) break;
      for (const s of more) {
        await deleteAll(ctx, "sourceChunks", "by_source", "sourceId", s._id);
        await deleteAll(ctx, "sourceNotes", "by_source", "sourceId", s._id);
        await deleteAll(ctx, "sourceAnalyses", "by_source", "sourceId", s._id);
        await deleteAll(ctx, "sourceClaims", "by_source", "sourceId", s._id);
        await deleteAll(ctx, "sourceConcepts", "by_source", "sourceId", s._id);
        await deleteAll(ctx, "processingJobs", "by_source", "sourceId", s._id);
        await deleteAll(ctx, "assignmentSources", "by_source", "sourceId", s._id);
        await deleteAll(ctx, "evidenceLinks", "by_source", "sourceId", s._id);
        await ctx.db.delete(s._id);
      }
      hasMoreSources = more.length === BATCH;
    }

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .take(BATCH);
    for (const a of assignments) {
      await deleteAssignmentChildren(ctx, a._id);
      await ctx.db.delete(a._id);
    }
    let hasMoreAssignments = assignments.length === BATCH;
    while (hasMoreAssignments) {
      const more = await ctx.db
        .query("assignments")
        .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
        .take(BATCH);
      if (more.length === 0) break;
      for (const a of more) {
        await deleteAssignmentChildren(ctx, a._id);
        await ctx.db.delete(a._id);
      }
      hasMoreAssignments = more.length === BATCH;
    }

    await deleteAll(ctx, "coThinkerSessions", "by_module", "moduleId", args.moduleId);

    await deleteAll(
      ctx,
      "coThinkerSessions",
      "by_module_and_createdAt",
      "moduleId",
      args.moduleId,
    );

    await deleteAll(ctx, "moduleFacts", "by_module", "moduleId", args.moduleId);
    await deleteAll(ctx, "weeklyTopics", "by_module", "moduleId", args.moduleId);
    await deleteAll(ctx, "requiredReadings", "by_module", "moduleId", args.moduleId);

    const moduleSpecs = await ctx.db
      .query("assessmentSpecs")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_module", (q: any) => q.eq("moduleId", args.moduleId))
      .take(BATCH);
    for (const spec of moduleSpecs) {
      await deleteAll(
        ctx,
        "extractedRubricCriteria",
        "by_assessmentSpec",
        "assessmentSpecId",
        spec._id,
      );
      await ctx.db.delete(spec._id);
    }

    const moduleBatches = await ctx.db
      .query("importBatches")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_module", (q: any) => q.eq("moduleId", args.moduleId))
      .take(BATCH);
    for (const batch of moduleBatches) {
      await deleteAll(
        ctx,
        "importedFiles",
        "by_batch",
        "batchId",
        batch._id,
      );
      await ctx.db.delete(batch._id);
    }
    let hasMoreBatches = moduleBatches.length === BATCH;
    while (hasMoreBatches) {
      const more = await ctx.db
        .query("importBatches")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .withIndex("by_module", (q: any) => q.eq("moduleId", args.moduleId))
        .take(BATCH);
      if (more.length === 0) break;
      for (const batch of more) {
        await deleteAll(
          ctx,
          "importedFiles",
          "by_batch",
          "batchId",
          batch._id,
        );
        await ctx.db.delete(batch._id);
      }
      hasMoreBatches = more.length === BATCH;
    }

    await ctx.db.delete(args.moduleId);
    return args.moduleId;
  },
});

export const deleteSourceData = internalMutation({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId);
    if (!source) return args.sourceId;

    await deleteAll(ctx, "assignmentSources", "by_source", "sourceId", args.sourceId);
    await deleteAll(ctx, "evidenceLinks", "by_source", "sourceId", args.sourceId);
    await deleteAll(ctx, "sourceChunks", "by_source", "sourceId", args.sourceId);
    await deleteAll(ctx, "sourceNotes", "by_source", "sourceId", args.sourceId);
    await deleteAll(ctx, "sourceAnalyses", "by_source", "sourceId", args.sourceId);
    await deleteAll(ctx, "sourceClaims", "by_source", "sourceId", args.sourceId);
    await deleteAll(ctx, "sourceConcepts", "by_source", "sourceId", args.sourceId);
    await deleteAll(ctx, "processingJobs", "by_source", "sourceId", args.sourceId);

    const linkedImportedFiles = await ctx.db
      .query("importedFiles")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const f of linkedImportedFiles) {
      await ctx.db.patch(f._id, { sourceId: undefined });
    }

    const linkedReadings = await ctx.db
      .query("requiredReadings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_source", (q: any) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const r of linkedReadings) {
      await ctx.db.patch(r._id, { sourceId: undefined });
    }

    if (source.storageId) {
      try {
        await ctx.storage.delete(source.storageId);
      } catch {}
    }

    await ctx.db.delete(args.sourceId);
    return args.sourceId;
  },
});

export const deleteAssignmentData = internalMutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) return args.assignmentId;

    await deleteAssignmentChildren(ctx, args.assignmentId);
    await ctx.db.delete(args.assignmentId);
    return args.assignmentId;
  },
});

export const deleteArgumentData = internalMutation({
  args: { argumentId: v.id("arguments") },
  handler: async (ctx, args) => {
    await deleteAll(ctx, "argumentNodes", "by_argument", "argumentId", args.argumentId);
    await deleteAll(ctx, "evidenceLinks", "by_argument", "argumentId", args.argumentId);
    await ctx.db.delete(args.argumentId);
    return args.argumentId;
  },
});

export const deleteImportBatchData = internalMutation({
  args: { batchId: v.id("importBatches") },
  handler: async (ctx, args) => {
    const batch = await ctx.db.get(args.batchId);
    if (!batch) return args.batchId;

    const specs = await ctx.db
      .query("assessmentSpecs")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .take(BATCH);
    for (const spec of specs) {
      await deleteAll(
        ctx,
        "extractedRubricCriteria",
        "by_assessmentSpec",
        "assessmentSpecId",
        spec._id,
      );
      await ctx.db.delete(spec._id);
    }

    const files = await ctx.db
      .query("importedFiles")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .take(BATCH);
    for (const f of files) {
      if (
        f.storageId &&
        !f.sourceId
      ) {
        try {
          await ctx.storage.delete(f.storageId);
        } catch {}
      }
      await ctx.db.delete(f._id);
    }

    await deleteAll(ctx, "moduleFacts", "by_batch", "batchId", args.batchId);
    await deleteAll(ctx, "weeklyTopics", "by_batch", "batchId", args.batchId);
    await deleteAll(ctx, "requiredReadings", "by_batch", "batchId", args.batchId);

    await ctx.db.delete(args.batchId);
    return args.batchId;
  },
});

export const deleteDraftData = internalMutation({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    await deleteAll(ctx, "draftBlocks", "by_draft", "draftId", args.draftId);

    const reviews = await ctx.db
      .query("reviewRuns")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .take(BATCH);
    for (const r of reviews) {
      await deleteAll(ctx, "reviewFindings", "by_reviewRun", "reviewRunId", r._id);
      await ctx.db.delete(r._id);
    }

    await ctx.db.delete(args.draftId);
    return args.draftId;
  },
});

async function deleteAssignmentChildren(ctx: MutationCtx, assignmentId: string) {
  await deleteAll(ctx, "assignmentSources", "by_assignment", "assignmentId", assignmentId);
  await deleteAll(ctx, "sectionPlans", "by_assignment", "assignmentId", assignmentId);
  await deleteAll(ctx, "judgementOptions", "by_assignment", "assignmentId", assignmentId);
  await deleteAll(ctx, "judgementDecisions", "by_assignment", "assignmentId", assignmentId);

  const linkedSpecs = await ctx.db
    .query("assessmentSpecs")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_assignment", (q: any) => q.eq("assignmentId", assignmentId))
    .take(BATCH);
  for (const spec of linkedSpecs) {
    await ctx.db.patch(spec._id, { assignmentId: undefined });
  }

  const arguments_ = await ctx.db
    .query("arguments")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_assignment", (q: any) => q.eq("assignmentId", assignmentId))
    .take(BATCH);
  for (const arg of arguments_) {
    await deleteAll(ctx, "argumentNodes", "by_argument", "argumentId", arg._id);
    await deleteAll(ctx, "evidenceLinks", "by_argument", "argumentId", arg._id);
    await ctx.db.delete(arg._id);
  }

  const drafts = await ctx.db
    .query("drafts")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_assignment", (q: any) => q.eq("assignmentId", assignmentId))
    .take(BATCH);
  for (const d of drafts) {
    await deleteAll(ctx, "draftBlocks", "by_draft", "draftId", d._id);

    const reviews = await ctx.db
      .query("reviewRuns")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withIndex("by_draft", (q: any) => q.eq("draftId", d._id))
      .take(BATCH);
    for (const r of reviews) {
      await deleteAll(ctx, "reviewFindings", "by_reviewRun", "reviewRunId", r._id);
      await ctx.db.delete(r._id);
    }

    await ctx.db.delete(d._id);
  }

  await deleteAll(
    ctx,
    "coThinkerSessions",
    "by_assignment",
    "assignmentId",
    assignmentId,
  );
}
