import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";
import {
  provenanceLabel,
  provenanceWarning,
  evidenceStrength,
} from "./lib/validators";
import { validateProvenanceInContext } from "./lib/provenance";
import type { ProvenanceWarning } from "../src/lib/integrity/provenance";

export const listForDraft = query({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("claimProvenance")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .order("asc")
      .take(500);
  },
});

export const listForDraftBlock = query({
  args: { draftBlockId: v.id("draftBlocks") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const block = await ctx.db.get(args.draftBlockId);
    if (!block || block.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("claimProvenance")
      .withIndex("by_draftBlock", (q) => q.eq("draftBlockId", args.draftBlockId))
      .order("asc")
      .take(200);
  },
});

export const validate = query({
  args: {
    claimText: v.string(),
    label: provenanceLabel,
    sourceId: v.optional(v.id("sources")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    quote: v.optional(v.string()),
    claimedPageStart: v.optional(v.number()),
    claimedPageEnd: v.optional(v.number()),
    isCatalogRecommendation: v.optional(v.boolean()),
    evidenceStrength: v.optional(evidenceStrength),
    assignmentId: v.optional(v.id("assignments")),
    moduleId: v.optional(v.id("modules")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);

    let assignmentModuleId: Id<"modules"> | null = null;
    if (args.assignmentId) {
      const assignment = await ctx.db.get(args.assignmentId);
      if (assignment && assignment.tokenIdentifier === tokenIdentifier) {
        assignmentModuleId = assignment.moduleId;
      }
    }

    return await validateProvenanceInContext(
      ctx,
      {
        claimText: args.claimText,
        label: args.label,
        sourceId: args.sourceId ?? null,
        sourceChunkId: args.sourceChunkId ?? null,
        quote: args.quote ?? null,
        claimedPageStart: args.claimedPageStart ?? null,
        claimedPageEnd: args.claimedPageEnd ?? null,
        isCatalogRecommendation: args.isCatalogRecommendation ?? false,
        evidenceStrength: args.evidenceStrength ?? null,
      },
      {
        assignmentId: args.assignmentId ?? null,
        moduleId: args.moduleId ?? assignmentModuleId,
        currentUserId: tokenIdentifier,
      },
    );
  },
});

export const create = mutation({
  args: {
    draftId: v.id("drafts"),
    draftBlockId: v.optional(v.id("draftBlocks")),
    claimText: v.string(),
    label: provenanceLabel,
    sourceId: v.optional(v.id("sources")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    evidenceLinkId: v.optional(v.id("evidenceLinks")),
    requiredReadingId: v.optional(v.id("requiredReadings")),
    quote: v.optional(v.string()),
    claimedPageStart: v.optional(v.number()),
    claimedPageEnd: v.optional(v.number()),
    isCatalogRecommendation: v.optional(v.boolean()),
    evidenceStrength: v.optional(evidenceStrength),
    notes: v.optional(v.string()),
    skipValidation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.draftBlockId) {
      const block = await ctx.db.get(args.draftBlockId);
      if (!block || block.draftId !== args.draftId) {
        throw new Error("Draft block must belong to the specified draft");
      }
    }

    if (args.evidenceLinkId) {
      const link = await ctx.db.get(args.evidenceLinkId);
      if (!link || link.tokenIdentifier !== tokenIdentifier) {
        throw new Error("Evidence link not found or not owned");
      }
    }

    let isCatalogRecommendation = args.isCatalogRecommendation ?? false;
    if (args.requiredReadingId && !args.sourceId) {
      const reading = await ctx.db.get(args.requiredReadingId);
      if (reading && (!reading.sourceId || reading.sourceId === undefined)) {
        isCatalogRecommendation = true;
      }
    }

    const result = args.skipValidation
      ? null
      : await validateProvenanceInContext(
          ctx,
          {
            claimText: args.claimText,
            label: args.label,
            sourceId: args.sourceId ?? null,
            sourceChunkId: args.sourceChunkId ?? null,
            quote: args.quote ?? null,
            claimedPageStart: args.claimedPageStart ?? null,
            claimedPageEnd: args.claimedPageEnd ?? null,
            isCatalogRecommendation,
            evidenceStrength: args.evidenceStrength ?? null,
          },
          {
            assignmentId: draft.assignmentId,
            moduleId: null,
            currentUserId: tokenIdentifier,
          },
        );

    const validationWarnings = (result?.warnings ?? []) as ProvenanceWarning[];

    const now = Date.now();
    return await ctx.db.insert("claimProvenance", {
      tokenIdentifier,
      draftId: args.draftId,
      draftBlockId: args.draftBlockId,
      claimText: args.claimText,
      label: args.label,
      effectiveLabel: result?.effectiveLabel ?? args.label,
      sourceId: args.sourceId,
      sourceChunkId: args.sourceChunkId,
      evidenceLinkId: args.evidenceLinkId,
      requiredReadingId: args.requiredReadingId,
      quote: args.quote,
      claimedPageStart: args.claimedPageStart,
      claimedPageEnd: args.claimedPageEnd,
      isCatalogRecommendation,
      evidenceStrength: args.evidenceStrength,
      validationWarnings,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    provenanceId: v.id("claimProvenance"),
    claimText: v.optional(v.string()),
    label: v.optional(provenanceLabel),
    sourceId: v.optional(v.id("sources")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    evidenceLinkId: v.optional(v.id("evidenceLinks")),
    quote: v.optional(v.string()),
    claimedPageStart: v.optional(v.number()),
    claimedPageEnd: v.optional(v.number()),
    isCatalogRecommendation: v.optional(v.boolean()),
    evidenceStrength: v.optional(evidenceStrength),
    notes: v.optional(v.string()),
    revalidate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { provenanceId, revalidate, ...updates } = args;
    const record = await ctx.db.get(provenanceId);
    if (!record || record.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const merged = {
      claimText: updates.claimText ?? record.claimText,
      label: updates.label ?? record.label,
      sourceId: updates.sourceId ?? record.sourceId ?? null,
      sourceChunkId: updates.sourceChunkId ?? record.sourceChunkId ?? null,
      quote: updates.quote ?? record.quote ?? null,
      claimedPageStart: updates.claimedPageStart ?? record.claimedPageStart ?? null,
      claimedPageEnd: updates.claimedPageEnd ?? record.claimedPageEnd ?? null,
      isCatalogRecommendation:
        updates.isCatalogRecommendation ?? record.isCatalogRecommendation ?? false,
      evidenceStrength: updates.evidenceStrength ?? record.evidenceStrength ?? null,
    };

    let validationWarnings = record.validationWarnings;
    let effectiveLabel = record.effectiveLabel;

    if (revalidate ?? false) {
      const draft = await ctx.db.get(record.draftId);
      const result = await validateProvenanceInContext(
        ctx,
        merged,
        {
          assignmentId: draft?.assignmentId ?? null,
          moduleId: null,
          currentUserId: tokenIdentifier,
        },
      );
      validationWarnings = result.warnings;
      effectiveLabel = result.effectiveLabel;
    }

    await ctx.db.patch(provenanceId, {
      ...updates,
      ...(validationWarnings !== undefined
        ? { validationWarnings }
        : {}),
      ...(effectiveLabel !== undefined ? { effectiveLabel } : {}),
      updatedAt: Date.now(),
    });
    return provenanceId;
  },
});

export const remove = mutation({
  args: { provenanceId: v.id("claimProvenance") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const record = await ctx.db.get(args.provenanceId);
    if (!record || record.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }
    await ctx.db.delete(args.provenanceId);
    return args.provenanceId;
  },
});

export const getProvenanceSummary = query({
  args: {
    draftId: v.id("drafts"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) return null;

    const records = await ctx.db
      .query("claimProvenance")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .take(500);

    const emptyLabelCounts = () => ({
      quoted: 0,
      paraphrased: 0,
      source_supported: 0,
      interpretation: 0,
      generated: 0,
      unsupported: 0,
    });
    const byLabel = emptyLabelCounts();
    const byEffectiveLabel = emptyLabelCounts();
    const warningCountsByCode: Record<string, number> = {};
    let rejectedCitations = 0;
    let totalWarnings = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const r of records) {
      byLabel[r.label]++;
      const eff = r.effectiveLabel ?? r.label;
      byEffectiveLabel[eff]++;

      if (
        r.validationWarnings?.some(
          (w: { code: string }) => w.code === "FAKE_CITATION_REJECTED",
        )
      ) {
        rejectedCitations++;
      }
      for (const w of r.validationWarnings ?? []) {
        totalWarnings++;
        warningCountsByCode[w.code] = (warningCountsByCode[w.code] ?? 0) + 1;
        if (w.severity === "critical") criticalCount++;
        else if (w.severity === "warning") warningCount++;
        else infoCount++;
      }
    }

    return {
      total: records.length,
      byLabel,
      byEffectiveLabel,
      rejectedCitations,
      totalWarnings,
      criticalCount,
      warningCount,
      infoCount,
      warningCountsByCode,
    };
  },
});

export const provenanceWarningValidator = provenanceWarning;
