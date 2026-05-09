import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export interface CitationValidation {
  valid: boolean;
  chunkId: Id<"sourceChunks">;
  sourceId: Id<"sources">;
  errors: string[];
  warnings: string[];
}

export interface RetrievedChunkSetValidation {
  allValid: boolean;
  validations: CitationValidation[];
  warnings: string[];
}

export function formatHarvardCitation(
  authors: string | null,
  year: number | null,
  pageStart: number | null,
  pageEnd: number | null | undefined,
): { citation: string; warnings: string[] } {
  const warnings: string[] = [];

  if (!authors) {
    warnings.push("Missing author information; citation will be incomplete.");
  }
  if (year === null) {
    warnings.push("Missing publication year; citation will be incomplete.");
  }

  const surname = authors
    ? authors.split(",")[0].trim()
    : null;

  if (!surname && year === null) {
    return { citation: "(Unknown)", warnings };
  }

  if (!surname) {
    return { citation: `(${year})`, warnings };
  }

  if (year === null) {
    return { citation: `${surname} (n.d.)`, warnings };
  }

  if (pageStart !== null && pageStart !== undefined) {
    if (pageEnd !== null && pageEnd !== undefined) {
      return {
        citation: `${surname} (${year}, pp. ${pageStart}\u2013${pageEnd})`,
        warnings,
      };
    }
    return {
      citation: `${surname} (${year}, p. ${pageStart})`,
      warnings,
    };
  }

  return {
    citation: `${surname} (${year})`,
    warnings,
  };
}

export async function validateChunkOwnership(
  ctx: QueryCtx,
  chunkId: Id<"sourceChunks">,
  expectedSourceId: Id<"sources">,
  tokenIdentifier: string,
): Promise<CitationValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const chunk = await ctx.db.get(chunkId);
  if (!chunk) {
    return {
      valid: false,
      chunkId,
      sourceId: expectedSourceId,
      errors: ["Chunk does not exist."],
      warnings,
    };
  }

  if (chunk.sourceId !== expectedSourceId) {
    errors.push(
      `Chunk belongs to source ${chunk.sourceId}, not ${expectedSourceId}.`,
    );
  }

  const source = await ctx.db.get(expectedSourceId);
  if (!source) {
    errors.push("Source does not exist.");
    return { valid: false, chunkId, sourceId: expectedSourceId, errors, warnings };
  }

  if (source.tokenIdentifier !== tokenIdentifier) {
    errors.push("Source does not belong to authenticated user.");
  }

  if (!chunk.pageStart && !chunk.pageEnd) {
    warnings.push("Chunk lacks page provenance.");
  }

  return {
    valid: errors.length === 0,
    chunkId,
    sourceId: expectedSourceId,
    errors,
    warnings,
  };
}

export async function validateChunkInModule(
  ctx: QueryCtx,
  chunkId: Id<"sourceChunks">,
  moduleId: Id<"modules">,
  tokenIdentifier: string,
): Promise<CitationValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const chunk = await ctx.db.get(chunkId);
  if (!chunk) {
    return {
      valid: false,
      chunkId,
      sourceId: "" as Id<"sources">,
      errors: ["Chunk does not exist."],
      warnings,
    };
  }

  const source = await ctx.db.get(chunk.sourceId);
  if (!source) {
    errors.push("Source for chunk does not exist.");
    return { valid: false, chunkId, sourceId: chunk.sourceId, errors, warnings };
  }

  if (source.tokenIdentifier !== tokenIdentifier) {
    errors.push("Source does not belong to authenticated user.");
  }

  if (source.moduleId !== moduleId) {
    errors.push("Source does not belong to the specified module.");
  }

  if (!chunk.pageStart && !chunk.pageEnd) {
    warnings.push("Chunk lacks page provenance.");
  }

  return {
    valid: errors.length === 0,
    chunkId,
    sourceId: chunk.sourceId,
    errors,
    warnings,
  };
}

export async function validateAssignmentScope(
  ctx: QueryCtx,
  chunkId: Id<"sourceChunks">,
  assignmentId: Id<"assignments">,
  tokenIdentifier: string,
): Promise<{
  valid: boolean;
  inScope: boolean;
  validation: CitationValidation;
}> {
  const chunk = await ctx.db.get(chunkId);
  if (!chunk) {
    return {
      valid: false,
      inScope: false,
      validation: {
        valid: false,
        chunkId,
        sourceId: "" as Id<"sources">,
        errors: ["Chunk does not exist."],
        warnings: [],
      },
    };
  }

  const moduleValidation = await (async () => {
    const assignment = await ctx.db.get(assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return {
        valid: false,
        inScope: false,
        validation: {
          valid: false,
          chunkId,
          sourceId: chunk.sourceId,
          errors: ["Assignment not found or not owned by user."],
          warnings: [],
        },
      };
    }

    const moduleVal = await validateChunkInModule(
      ctx,
      chunkId,
      assignment.moduleId,
      tokenIdentifier,
    );

    const links = await ctx.db
      .query("assignmentSources")
      .withIndex("by_assignment_and_source", (q) =>
        q.eq("assignmentId", assignmentId).eq("sourceId", chunk.sourceId),
      )
      .unique();

    const inScope = links !== null;

    if (!inScope && moduleVal.valid) {
      moduleVal.warnings.push(
        "Chunk source is not in the assignment's selected sources. Citation is outside assignment scope.",
      );
    }

    return { valid: moduleVal.valid, inScope, validation: moduleVal };
  })();

  return moduleValidation;
}

export async function validateRetrievedChunkSet(
  ctx: QueryCtx,
  citedChunkIds: Id<"sourceChunks">[],
  claimedSourceIds: Id<"sources">[],
  moduleId: Id<"modules">,
  tokenIdentifier: string,
): Promise<RetrievedChunkSetValidation> {
  const validations: CitationValidation[] = [];
  const warnings: string[] = [];
  let allValid = true;

  for (let i = 0; i < citedChunkIds.length; i++) {
    const chunkId = citedChunkIds[i];
    const claimedSourceId = claimedSourceIds[i];

    if (claimedSourceId) {
      const val = await validateChunkOwnership(
        ctx,
        chunkId,
        claimedSourceId,
        tokenIdentifier,
      );
      validations.push(val);
      if (!val.valid) allValid = false;
    } else {
      const moduleVal = await validateChunkInModule(
        ctx,
        chunkId,
        moduleId,
        tokenIdentifier,
      );
      validations.push(moduleVal);
      if (!moduleVal.valid) allValid = false;
    }
  }

  const distinctSources = new Set(
    validations.filter((v) => v.valid).map((v) => v.sourceId),
  );
  if (distinctSources.size === 0 && citedChunkIds.length > 0) {
    warnings.push("No valid source citations found in the output.");
    allValid = false;
  }

  return { allValid, validations, warnings };
}

export async function enrichEvidenceFromChunk(
  ctx: QueryCtx,
  chunkId: Id<"sourceChunks">,
  tokenIdentifier: string,
): Promise<{
  quote: string | null;
  pageRange: string | null;
  citationLabel: string | null;
} | null> {
  const chunk = await ctx.db.get(chunkId);
  if (!chunk) return null;

  const source = await ctx.db.get(chunk.sourceId);
  if (!source || source.tokenIdentifier !== tokenIdentifier) return null;

  const quote = chunk.text.length > 300
    ? chunk.text.slice(0, 299) + "\u2026"
    : chunk.text;

  let pageRange: string | null = null;
  if (chunk.pageStart != null && chunk.pageEnd != null) {
    pageRange = `pp. ${chunk.pageStart}\u2013${chunk.pageEnd}`;
  } else if (chunk.pageStart != null) {
    pageRange = `p. ${chunk.pageStart}`;
  }

  const { citation } = formatHarvardCitation(
    source.authors ?? null,
    source.year ?? null,
    chunk.pageStart ?? null,
    chunk.pageEnd ?? null,
  );

  return { quote, pageRange, citationLabel: citation };
}
