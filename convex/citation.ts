import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import {
  validateChunkOwnership,
  validateChunkInModule,
  validateAssignmentScope,
  validateRetrievedChunkSet,
  formatHarvardCitation,
  enrichEvidenceFromChunk,
} from "./lib/citation";

export const validateCitation = query({
  args: {
    chunkId: v.id("sourceChunks"),
    sourceId: v.id("sources"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await validateChunkOwnership(
      ctx,
      args.chunkId,
      args.sourceId,
      tokenIdentifier,
    );
  },
});

export const validateCitationInModule = query({
  args: {
    chunkId: v.id("sourceChunks"),
    moduleId: v.id("modules"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await validateChunkInModule(
      ctx,
      args.chunkId,
      args.moduleId,
      tokenIdentifier,
    );
  },
});

export const validateAssignmentCitation = query({
  args: {
    chunkId: v.id("sourceChunks"),
    assignmentId: v.id("assignments"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await validateAssignmentScope(
      ctx,
      args.chunkId,
      args.assignmentId,
      tokenIdentifier,
    );
  },
});

export const validateCitedChunkSet = query({
  args: {
    citedChunkIds: v.array(v.id("sourceChunks")),
    claimedSourceIds: v.array(v.id("sources")),
    moduleId: v.id("modules"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await validateRetrievedChunkSet(
      ctx,
      args.citedChunkIds,
      args.claimedSourceIds,
      args.moduleId,
      tokenIdentifier,
    );
  },
});

export const formatCitation = query({
  args: {
    sourceId: v.id("sources"),
    chunkId: v.optional(v.id("sourceChunks")),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const source = await ctx.db.get(args.sourceId);
    if (!source || source.tokenIdentifier !== tokenIdentifier) {
      return { citation: "(Unknown)", warnings: ["Source not found or not owned."] };
    }

    let pageStart: number | null = null;
    let pageEnd: number | null = null;

    if (args.chunkId) {
      const chunk = await ctx.db.get(args.chunkId);
      if (chunk && chunk.sourceId === args.sourceId) {
        pageStart = chunk.pageStart ?? null;
        pageEnd = chunk.pageEnd ?? null;
      }
    }

    return formatHarvardCitation(
      source.authors ?? null,
      source.year ?? null,
      pageStart,
      pageEnd ?? undefined,
    );
  },
});

export const enrichEvidence = query({
  args: {
    chunkId: v.id("sourceChunks"),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    return await enrichEvidenceFromChunk(ctx, args.chunkId, tokenIdentifier);
  },
});
