import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import {
  validateCitationOwnership,
  crossModuleChunkRejection,
  noSourceQueryWarning,
} from "../../src/lib/integrity/citation-validator";
import type {
  CitationFinding,
  CitationValidationResult,
} from "../../src/lib/integrity/citation-validator";

export type { CitationFinding, CitationValidationResult };

export interface ConvexCitationInput {
  chunkId: Id<"sourceChunks">;
  sourceId: Id<"sources">;
  claimedPageStart?: number | null;
  claimedPageEnd?: number | null;
  quote?: string | null;
}

export async function validateCitationInContext(
  ctx: QueryCtx | MutationCtx,
  citation: ConvexCitationInput,
  currentUserIdentifier: string,
  moduleId: Id<"modules"> | null | undefined,
  allowedSourceIds: Id<"sources">[],
): Promise<CitationValidationResult> {
  const rawChunk = await ctx.db.get(citation.chunkId);
  const rawSource = await ctx.db.get(citation.sourceId);

  const chunkDoc = rawChunk as Doc<"sourceChunks"> | null;
  const sourceDoc = rawSource as Doc<"sources"> | null;

  const chunk = chunkDoc
    ? {
        _id: chunkDoc._id as string,
        sourceId: chunkDoc.sourceId as string,
        pageStart: chunkDoc.pageStart ?? null,
        pageEnd: chunkDoc.pageEnd ?? null,
        text: chunkDoc.text,
      }
    : null;

  const source = sourceDoc
    ? {
        _id: sourceDoc._id as string,
        tokenIdentifier: sourceDoc.tokenIdentifier,
        moduleId: sourceDoc.moduleId as string,
        authors: sourceDoc.authors ?? null,
        year: sourceDoc.year ?? null,
        title: sourceDoc.title,
      }
    : null;

  const findings: CitationFinding[] = [];

  if (chunk && source && moduleId) {
    const crossModuleFinding = crossModuleChunkRejection(source.moduleId, moduleId as string);
    if (crossModuleFinding) findings.push(crossModuleFinding);
  }

  const ownershipResult = validateCitationOwnership(
    {
      chunkId: citation.chunkId as string,
      sourceId: citation.sourceId as string,
      claimedPageStart: citation.claimedPageStart,
      claimedPageEnd: citation.claimedPageEnd,
      quote: citation.quote,
    },
    chunk,
    source,
    currentUserIdentifier,
    allowedSourceIds.map((id) => id as string),
  );

  return {
    valid: ownershipResult.valid && !findings.some((f) => f.severity === "error"),
    findings: [...findings, ...ownershipResult.findings],
  };
}

export function checkSourceAvailability(chunkCount: number): CitationFinding | null {
  return noSourceQueryWarning(chunkCount);
}
