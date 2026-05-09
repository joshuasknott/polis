import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteModuleData = internalMutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const BATCH = 50;

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .take(BATCH);
    for (const f of folders) {
      await ctx.db.delete(f._id);
    }

    const sources = await ctx.db
      .query("sources")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .take(BATCH);
    for (const s of sources) {
      const chunks = await ctx.db
        .query("sourceChunks")
        .withIndex("by_source", (q) => q.eq("sourceId", s._id))
        .take(BATCH);
      for (const c of chunks) {
        await ctx.db.delete(c._id);
      }

      const notes = await ctx.db
        .query("sourceNotes")
        .withIndex("by_source", (q) => q.eq("sourceId", s._id))
        .take(BATCH);
      for (const n of notes) {
        await ctx.db.delete(n._id);
      }

      const analyses = await ctx.db
        .query("sourceAnalyses")
        .withIndex("by_source", (q) => q.eq("sourceId", s._id))
        .take(BATCH);
      for (const a of analyses) {
        await ctx.db.delete(a._id);
      }

      const claims = await ctx.db
        .query("sourceClaims")
        .withIndex("by_source", (q) => q.eq("sourceId", s._id))
        .take(BATCH);
      for (const cl of claims) {
        await ctx.db.delete(cl._id);
      }

      const concepts = await ctx.db
        .query("sourceConcepts")
        .withIndex("by_source", (q) => q.eq("sourceId", s._id))
        .take(BATCH);
      for (const co of concepts) {
        await ctx.db.delete(co._id);
      }

      const jobs = await ctx.db
        .query("processingJobs")
        .withIndex("by_source", (q) => q.eq("sourceId", s._id))
        .take(BATCH);
      for (const j of jobs) {
        await ctx.db.delete(j._id);
      }

      await ctx.db.delete(s._id);
    }

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .take(BATCH);
    for (const a of assignments) {
      const assignmentSources = await ctx.db
        .query("assignmentSources")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .take(BATCH);
      for (const as2 of assignmentSources) {
        await ctx.db.delete(as2._id);
      }

      const arguments_ = await ctx.db
        .query("arguments")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .take(BATCH);
      for (const arg of arguments_) {
        const nodes = await ctx.db
          .query("argumentNodes")
          .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
          .take(BATCH);
        for (const n of nodes) {
          await ctx.db.delete(n._id);
        }

        const evidence = await ctx.db
          .query("evidenceLinks")
          .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
          .take(BATCH);
        for (const e of evidence) {
          await ctx.db.delete(e._id);
        }

        await ctx.db.delete(arg._id);
      }

      const judgementOpts = await ctx.db
        .query("judgementOptions")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .take(BATCH);
      for (const jo of judgementOpts) {
        await ctx.db.delete(jo._id);
      }

      const judgementDecs = await ctx.db
        .query("judgementDecisions")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .take(BATCH);
      for (const jd of judgementDecs) {
        await ctx.db.delete(jd._id);
      }

      const drafts = await ctx.db
        .query("drafts")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .take(BATCH);
      for (const d of drafts) {
        const blocks = await ctx.db
          .query("draftBlocks")
          .withIndex("by_draft", (q) => q.eq("draftId", d._id))
          .take(BATCH);
        for (const b of blocks) {
          await ctx.db.delete(b._id);
        }

        const reviews = await ctx.db
          .query("reviewRuns")
          .withIndex("by_draft", (q) => q.eq("draftId", d._id))
          .take(BATCH);
        for (const r of reviews) {
          const findings = await ctx.db
            .query("reviewFindings")
            .withIndex("by_reviewRun", (q) => q.eq("reviewRunId", r._id))
            .take(BATCH);
          for (const f of findings) {
            await ctx.db.delete(f._id);
          }
          await ctx.db.delete(r._id);
        }

        await ctx.db.delete(d._id);
      }

      await ctx.db.delete(a._id);
    }

    const coThinkerSessions = await ctx.db
      .query("coThinkerSessions")
      .withIndex("by_module", (q) => q.eq("moduleId", args.moduleId))
      .take(BATCH);
    for (const s of coThinkerSessions) {
      const messages = await ctx.db
        .query("coThinkerMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", s._id))
        .take(BATCH);
      for (const m of messages) {
        await ctx.db.delete(m._id);
      }

      const interventions = await ctx.db
        .query("coThinkerInterventions")
        .withIndex("by_session", (q) => q.eq("sessionId", s._id))
        .take(BATCH);
      for (const i of interventions) {
        await ctx.db.delete(i._id);
      }

      await ctx.db.delete(s._id);
    }

    await ctx.db.delete(args.moduleId);
    return args.moduleId;
  },
});

export const deleteSourceData = internalMutation({
  args: { sourceId: v.id("sources") },
  handler: async (ctx, args) => {
    const BATCH = 50;

    const source = await ctx.db.get(args.sourceId);
    if (!source) return args.sourceId;

    const assignmentSources = await ctx.db
      .query("assignmentSources")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const as2 of assignmentSources) {
      await ctx.db.delete(as2._id);
    }

    const evidenceLinks = await ctx.db
      .query("evidenceLinks")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const e of evidenceLinks) {
      await ctx.db.delete(e._id);
    }

    const chunks = await ctx.db
      .query("sourceChunks")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const c of chunks) {
      await ctx.db.delete(c._id);
    }

    const notes = await ctx.db
      .query("sourceNotes")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const n of notes) {
      await ctx.db.delete(n._id);
    }

    const analyses = await ctx.db
      .query("sourceAnalyses")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const a of analyses) {
      await ctx.db.delete(a._id);
    }

    const claims = await ctx.db
      .query("sourceClaims")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const cl of claims) {
      await ctx.db.delete(cl._id);
    }

    const concepts = await ctx.db
      .query("sourceConcepts")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const co of concepts) {
      await ctx.db.delete(co._id);
    }

    const jobs = await ctx.db
      .query("processingJobs")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .take(BATCH);
    for (const j of jobs) {
      await ctx.db.delete(j._id);
    }

    await ctx.db.delete(args.sourceId);
    return args.sourceId;
  },
});

export const deleteAssignmentData = internalMutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const BATCH = 50;

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) return args.assignmentId;

    const assignmentSources = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(BATCH);
    for (const as2 of assignmentSources) {
      await ctx.db.delete(as2._id);
    }

    const arguments_ = await ctx.db
      .query("arguments")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(BATCH);
    for (const arg of arguments_) {
      const nodes = await ctx.db
        .query("argumentNodes")
        .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
        .take(BATCH);
      for (const n of nodes) {
        await ctx.db.delete(n._id);
      }

      const evidence = await ctx.db
        .query("evidenceLinks")
        .withIndex("by_argument", (q) => q.eq("argumentId", arg._id))
        .take(BATCH);
      for (const e of evidence) {
        await ctx.db.delete(e._id);
      }

      await ctx.db.delete(arg._id);
    }

    const judgementOpts = await ctx.db
      .query("judgementOptions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(BATCH);
    for (const jo of judgementOpts) {
      await ctx.db.delete(jo._id);
    }

    const judgementDecs = await ctx.db
      .query("judgementDecisions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(BATCH);
    for (const jd of judgementDecs) {
      await ctx.db.delete(jd._id);
    }

    const drafts = await ctx.db
      .query("drafts")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(BATCH);
    for (const d of drafts) {
      const blocks = await ctx.db
        .query("draftBlocks")
        .withIndex("by_draft", (q) => q.eq("draftId", d._id))
        .take(BATCH);
      for (const b of blocks) {
        await ctx.db.delete(b._id);
      }

      const reviews = await ctx.db
        .query("reviewRuns")
        .withIndex("by_draft", (q) => q.eq("draftId", d._id))
        .take(BATCH);
      for (const r of reviews) {
        const findings = await ctx.db
          .query("reviewFindings")
          .withIndex("by_reviewRun", (q) => q.eq("reviewRunId", r._id))
          .take(BATCH);
        for (const f of findings) {
          await ctx.db.delete(f._id);
        }
        await ctx.db.delete(r._id);
      }

      await ctx.db.delete(d._id);
    }

    const coThinkerSessions = await ctx.db
      .query("coThinkerSessions")
      .withIndex("by_assignment", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .take(BATCH);
    for (const s of coThinkerSessions) {
      const messages = await ctx.db
        .query("coThinkerMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", s._id))
        .take(BATCH);
      for (const m of messages) {
        await ctx.db.delete(m._id);
      }

      const interventions = await ctx.db
        .query("coThinkerInterventions")
        .withIndex("by_session", (q) => q.eq("sessionId", s._id))
        .take(BATCH);
      for (const i of interventions) {
        await ctx.db.delete(i._id);
      }

      await ctx.db.delete(s._id);
    }

    await ctx.db.delete(args.assignmentId);
    return args.assignmentId;
  },
});
