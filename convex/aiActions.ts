import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { getAuthIdentifier } from "./lib/auth";
import {
  aiActionOperation,
  aiActionStatus,
  extractionProvenance,
} from "./lib/validators";

async function assertModuleOwnership(
  ctx: QueryCtx,
  tokenIdentifier: string,
  moduleId: Id<"modules">,
) {
  const mod = await ctx.db.get(moduleId);
  if (!mod || mod.tokenIdentifier !== tokenIdentifier) {
    throw new Error("Not found");
  }
  return mod;
}

async function assertActionOwnership(
  ctx: QueryCtx,
  tokenIdentifier: string,
  actionId: Id<"aiActions">,
): Promise<Doc<"aiActions">> {
  const action = await ctx.db.get(actionId);
  if (!action || action.tokenIdentifier !== tokenIdentifier) {
    throw new Error("Not found");
  }
  return action;
}

export const listForModule = query({
  args: {
    moduleId: v.id("modules"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    await assertModuleOwnership(ctx, tokenIdentifier, args.moduleId);

    return await ctx.db
      .query("aiActions")
      .withIndex("by_module_and_createdAt", (q) =>
        q.eq("moduleId", args.moduleId),
      )
      .order("desc")
      .take(Math.min(args.limit ?? 50, 100));
  },
});

export const listForBatch = query({
  args: {
    batchId: v.id("importBatches"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const batch = await ctx.db.get(args.batchId);
    if (!batch || batch.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("aiActions")
      .withIndex("by_batch", (q) => q.eq("batchId", args.batchId))
      .order("desc")
      .take(Math.min(args.limit ?? 50, 100));
  },
});

export const listForSource = query({
  args: {
    sourceId: v.id("sources"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("aiActions")
      .withIndex("by_source", (q) => q.eq("sourceId", args.sourceId))
      .order("desc")
      .take(Math.min(args.limit ?? 50, 100));
  },
});

export const revertAction = mutation({
  args: { actionId: v.id("aiActions") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const action = await assertActionOwnership(
      ctx,
      tokenIdentifier,
      args.actionId,
    );

    if (action.status === "reverted" || action.revertedAt) {
      return args.actionId;
    }
    if (!action.reversible) {
      throw new Error("This action cannot be reverted");
    }

    const now = Date.now();

    if (action.operation === "classification" && action.importedFileId) {
      const file = await ctx.db.get(action.importedFileId);
      if (file && file.tokenIdentifier === tokenIdentifier) {
        await ctx.db.patch(action.importedFileId, {
          labels: undefined,
          primaryLabel: undefined,
          confidence: undefined,
          rationale: undefined,
          classificationStatus: "pending",
          classificationError: undefined,
          modelUsed: undefined,
          providerUsed: undefined,
          reviewedLabel: undefined,
          reviewedAt: undefined,
          updatedAt: now,
        });
      }
    }

    if (action.operation === "context_extraction" && action.importedFileId) {
      await ctx.runMutation(internal.extraction._rejectAllForImportedFile, {
        importedFileId: action.importedFileId,
      });
    }

    if (action.operation === "source_context_analysis") {
      await deleteCreatedAnalysisOutputs(ctx, action);
    }

    if (
      (action.operation === "relevance_signal" ||
        action.operation === "gap_signal") &&
      action.targetTable &&
      action.targetId
    ) {
      await deleteTarget(ctx, action.targetTable, action.targetId);
    }

    const revertActionId = await ctx.db.insert("aiActions", {
      tokenIdentifier,
      moduleId: action.moduleId,
      batchId: action.batchId,
      importedFileId: action.importedFileId,
      sourceId: action.sourceId,
      operation: "revert",
      status: "completed",
      title: `Reverted: ${action.title}`,
      summary: "The user reverted this AI action.",
      reversible: false,
      targetTable: "aiActions",
      targetId: action._id,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.actionId, {
      status: "reverted",
      revertedAt: now,
      revertedByActionId: revertActionId,
      updatedAt: now,
    });

    return args.actionId;
  },
});

export const record = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    sourceId: v.optional(v.id("sources")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    operation: aiActionOperation,
    status: aiActionStatus,
    title: v.string(),
    summary: v.optional(v.string()),
    providerUsed: v.optional(v.string()),
    modelUsed: v.optional(v.string()),
    confidence: v.optional(v.number()),
    autoApplied: v.optional(v.boolean()),
    reversible: v.optional(v.boolean()),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    targetIds: v.optional(v.array(v.string())),
    input: v.optional(v.any()),
    output: v.optional(v.any()),
    before: v.optional(v.any()),
    after: v.optional(v.any()),
    provenance: v.optional(extractionProvenance),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("aiActions", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

async function deleteCreatedAnalysisOutputs(
  ctx: MutationCtx,
  action: Doc<"aiActions">,
) {
  const output = action.output as
    | {
        created?: {
          analysisIds?: string[];
          claimIds?: string[];
          conceptIds?: string[];
          relevanceSignalIds?: string[];
          gapSignalIds?: string[];
        };
      }
    | undefined;
  const created = output?.created;
  if (!created) return;

  for (const id of created.analysisIds ?? []) {
    await deleteTarget(ctx, "sourceAnalyses", id);
  }
  for (const id of created.claimIds ?? []) {
    await deleteTarget(ctx, "sourceClaims", id);
  }
  for (const id of created.conceptIds ?? []) {
    await deleteTarget(ctx, "sourceConcepts", id);
  }
  for (const id of created.relevanceSignalIds ?? []) {
    await deleteTarget(ctx, "sourceRelevanceSignals", id);
  }
  for (const id of created.gapSignalIds ?? []) {
    await deleteTarget(ctx, "sourceGapSignals", id);
  }
}

async function deleteTarget(
  ctx: MutationCtx,
  targetTable: string,
  targetId: string,
) {
  const allowed = new Set([
    "sourceAnalyses",
    "sourceClaims",
    "sourceConcepts",
    "sourceRelevanceSignals",
    "sourceGapSignals",
  ]);
  if (!allowed.has(targetTable)) return;
  const db = ctx.db as unknown as {
    get: (id: string) => Promise<unknown>;
    delete: (id: string) => Promise<void>;
  };
  const existing = await db.get(targetId);
  if (existing) {
    await db.delete(targetId);
  }
}
