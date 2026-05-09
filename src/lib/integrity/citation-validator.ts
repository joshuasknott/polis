export interface SourceMeta {
  _id: string;
  tokenIdentifier: string;
  moduleId: string;
  authors?: string | null;
  year?: number | null;
  title: string;
}

export interface ChunkMeta {
  _id: string;
  sourceId: string;
  pageStart?: number | null;
  pageEnd?: number | null;
  text: string;
}

export interface CitationInput {
  chunkId: string;
  sourceId: string;
  claimedPageStart?: number | null;
  claimedPageEnd?: number | null;
  quote?: string | null;
}

export type CitationSeverity = "error" | "warning" | "ok";

export interface CitationFinding {
  severity: CitationSeverity;
  code: string;
  message: string;
}

export interface CitationValidationResult {
  valid: boolean;
  findings: CitationFinding[];
}

export function validateCitationOwnership(
  citation: CitationInput,
  chunk: ChunkMeta | null | undefined,
  source: SourceMeta | null | undefined,
  currentUserIdentifier: string,
  allowedSourceIds: string[],
): CitationValidationResult {
  const findings: CitationFinding[] = [];

  if (!chunk) {
    findings.push({
      severity: "error",
      code: "CHUNK_NOT_FOUND",
      message: `The cited chunk does not exist in the database. This citation cannot be verified and must not be used.`,
    });
    return { valid: false, findings };
  }

  if (chunk.sourceId !== citation.sourceId) {
    findings.push({
      severity: "error",
      code: "CHUNK_SOURCE_MISMATCH",
      message: `The cited chunk belongs to a different source than claimed. This citation is invalid.`,
    });
    return { valid: false, findings };
  }

  if (!source) {
    findings.push({
      severity: "error",
      code: "SOURCE_NOT_FOUND",
      message: `The cited source does not exist. This citation cannot be used.`,
    });
    return { valid: false, findings };
  }

  if (source.tokenIdentifier !== currentUserIdentifier) {
    findings.push({
      severity: "error",
      code: "SOURCE_OWNERSHIP_VIOLATION",
      message: `The cited source belongs to a different user. Cross-user citation is not permitted.`,
    });
    return { valid: false, findings };
  }

  const sourceAllowed =
    allowedSourceIds.length === 0 ||
    allowedSourceIds.some((id) => id === citation.sourceId);

  if (!sourceAllowed) {
    findings.push({
      severity: "warning",
      code: "SOURCE_NOT_IN_ASSIGNMENT_SCOPE",
      message: `The cited source is not in the selected sources for this assignment. Consider adding it to your source list.`,
    });
  }

  const pageWarning = validatePageRef(
    citation.claimedPageStart ?? null,
    citation.claimedPageEnd ?? null,
    chunk.pageStart ?? null,
    chunk.pageEnd ?? null,
  );

  if (pageWarning) findings.push(pageWarning);

  const valid = !findings.some((f) => f.severity === "error");
  return { valid, findings };
}

function validatePageRef(
  claimedStart: number | null,
  claimedEnd: number | null,
  chunkStart: number | null,
  chunkEnd: number | null,
): CitationFinding | null {
  if (claimedStart === null) return null;

  if (chunkStart === null) {
    return {
      severity: "warning",
      code: "PAGE_UNVERIFIABLE",
      message: `Page number p. ${claimedStart} was cited but the source chunk has no page metadata. This page reference cannot be verified.`,
    };
  }

  const effectiveChunkEnd = chunkEnd ?? chunkStart;
  if (claimedStart < chunkStart || claimedStart > effectiveChunkEnd) {
    return {
      severity: "warning",
      code: "PAGE_OUTSIDE_CHUNK_RANGE",
      message: `Page ${claimedStart} falls outside the chunk's page range (${chunkStart}–${effectiveChunkEnd}). This page number may be inaccurate.`,
    };
  }

  if (claimedEnd !== null) {
    if (claimedEnd < claimedStart) {
      return {
        severity: "error",
        code: "PAGE_RANGE_INVALID",
        message: `Page range pp. ${claimedStart}–${claimedEnd} is invalid (end before start).`,
      };
    }
  }

  return null;
}

export function validateNoFabricatedPages(
  claimedPageStart: number | null | undefined,
  chunkPageStart: number | null | undefined,
): CitationFinding | null {
  if (claimedPageStart == null) return null;
  if (chunkPageStart == null) {
    return {
      severity: "warning",
      code: "INVENTED_PAGE_RISK",
      message: `Page ${claimedPageStart} was referenced but the source has no page metadata. Do not invent page numbers — omit the page reference if unavailable.`,
    };
  }
  return null;
}

export function crossModuleChunkRejection(
  chunkSourceModuleId: string,
  sessionModuleId: string | null | undefined,
): CitationFinding | null {
  if (!sessionModuleId) return null;
  if (chunkSourceModuleId !== sessionModuleId) {
    return {
      severity: "error",
      code: "CROSS_MODULE_CHUNK",
      message: `This source belongs to a different module. Only sources from the current module may be cited.`,
    };
  }
  return null;
}

export function noSourceQueryWarning(availableChunkCount: number): CitationFinding | null {
  if (availableChunkCount === 0) {
    return {
      severity: "warning",
      code: "NO_SOURCES_AVAILABLE",
      message: `No source material is available for this query. The response cannot be grounded in your uploaded sources.`,
    };
  }
  if (availableChunkCount < 3) {
    return {
      severity: "warning",
      code: "SPARSE_SOURCES",
      message: `Only ${availableChunkCount} chunk(s) of source material were found. Consider uploading additional sources for a more grounded response.`,
    };
  }
  return null;
}
