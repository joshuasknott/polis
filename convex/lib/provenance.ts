import type { QueryCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import type {
  ClaimProvenanceInput,
  ProvenanceValidationContext,
  ProvenanceValidationResult,
} from "../../src/lib/integrity/provenance";
import {
  validateProvenanceClaim,
} from "../../src/lib/integrity/provenance";
import type { ChunkMeta, SourceMeta } from "../../src/lib/integrity/citation-validator";

export interface ResolvedProvenanceContext {
  chunk: ChunkMeta | null;
  source: SourceMeta | null;
  moduleId: string | null;
  assignmentSourceIds: string[];
}

export async function resolveProvenanceContext(
  ctx: QueryCtx,
  claim: Pick<
    ClaimProvenanceInput,
    "sourceId" | "sourceChunkId"
  >,
  options: {
    assignmentId?: Id<"assignments"> | null;
    moduleId?: Id<"modules"> | null;
    currentUserId: string;
  },
): Promise<ResolvedProvenanceContext> {
  const chunk: ChunkMeta | null = claim.sourceChunkId
    ? await loadChunk(ctx, claim.sourceChunkId)
    : null;

  const sourceIdToLoad =
    claim.sourceId ?? chunk?.sourceId ?? null;
  const source: SourceMeta | null = sourceIdToLoad
    ? await loadSource(ctx, sourceIdToLoad, options.currentUserId)
    : null;

  let moduleId: string | null = options.moduleId ? (options.moduleId as string) : null;
  let assignmentSourceIds: string[] = [];

  if (options.assignmentId) {
    const assignment = await ctx.db.get(options.assignmentId);
    if (assignment && assignment.tokenIdentifier === options.currentUserId) {
      moduleId = moduleId ?? (assignment.moduleId as string);
      const links = await ctx.db
        .query("assignmentSources")
        .withIndex("by_assignment", (q) =>
          q.eq("assignmentId", options.assignmentId!),
        )
        .take(200);
      assignmentSourceIds = links.map((l) => l.sourceId as string);
    }
  }

  return { chunk, source, moduleId, assignmentSourceIds };
}

async function loadChunk(
  ctx: QueryCtx,
  chunkId: string,
): Promise<ChunkMeta | null> {
  const doc = (await ctx.db.get(chunkId as Id<"sourceChunks">)) as
    | Doc<"sourceChunks">
    | null;
  if (!doc) return null;
  return {
    _id: doc._id as string,
    sourceId: doc.sourceId as string,
    pageStart: doc.pageStart ?? null,
    pageEnd: doc.pageEnd ?? null,
    text: doc.text,
  };
}

async function loadSource(
  ctx: QueryCtx,
  sourceId: string,
  currentUserId: string,
): Promise<SourceMeta | null> {
  const doc = (await ctx.db.get(sourceId as Id<"sources">)) as
    | Doc<"sources">
    | null;
  if (!doc) return null;
  if (doc.tokenIdentifier !== currentUserId) {
    return {
      _id: doc._id as string,
      tokenIdentifier: doc.tokenIdentifier,
      moduleId: doc.moduleId as string,
      authors: doc.authors ?? null,
      year: doc.year ?? null,
      title: doc.title,
    };
  }
  return {
    _id: doc._id as string,
    tokenIdentifier: doc.tokenIdentifier,
    moduleId: doc.moduleId as string,
    authors: doc.authors ?? null,
    year: doc.year ?? null,
    title: doc.title,
  };
}

export async function validateProvenanceInContext(
  ctx: QueryCtx,
  claim: ClaimProvenanceInput,
  options: {
    assignmentId?: Id<"assignments"> | null;
    moduleId?: Id<"modules"> | null;
    currentUserId: string;
  },
): Promise<ProvenanceValidationResult> {
  const resolved = await resolveProvenanceContext(ctx, claim, options);
  const validationContext: ProvenanceValidationContext = {
    chunk: resolved.chunk,
    source: resolved.source,
    currentUserId: options.currentUserId,
    moduleId: resolved.moduleId,
    assignmentSourceIds: resolved.assignmentSourceIds,
  };
  return validateProvenanceClaim(claim, validationContext);
}

export async function isRequiredReadingCatalogOnly(
  ctx: QueryCtx,
  requiredReadingId: Id<"requiredReadings"> | null | undefined,
): Promise<boolean> {
  if (!requiredReadingId) return false;
  const reading = await ctx.db.get(requiredReadingId);
  if (!reading) return false;
  return reading.sourceId === undefined || reading.sourceId === null;
}
