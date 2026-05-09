import { describe, it, expect } from "vitest";
import {
  validateCitationOwnership,
  validateNoFabricatedPages,
  crossModuleChunkRejection,
  noSourceQueryWarning,
} from "../../src/lib/integrity/citation-validator";
import type { SourceMeta, ChunkMeta, CitationInput } from "../../src/lib/integrity/citation-validator";

const USER_A = "clerk|user_a";
const USER_B = "clerk|user_b";

const MODULE_1 = "module1";
const MODULE_2 = "module2";
const SOURCE_1 = "source1";
const SOURCE_2 = "source2";
const CHUNK_1 = "chunk1";

const mockSource: SourceMeta = {
  _id: SOURCE_1,
  tokenIdentifier: USER_A,
  moduleId: MODULE_1,
  authors: "Smith, John",
  year: 2020,
  title: "Test Source",
};

const mockChunk: ChunkMeta = {
  _id: CHUNK_1,
  sourceId: SOURCE_1,
  pageStart: 40,
  pageEnd: 45,
  text: "Some relevant text.",
};

const validCitation: CitationInput = {
  chunkId: CHUNK_1,
  sourceId: SOURCE_1,
  claimedPageStart: 42,
};

describe("validateCitationOwnership", () => {
  it("returns valid for a fully correct citation", () => {
    const result = validateCitationOwnership(
      validCitation,
      mockChunk,
      mockSource,
      USER_A,
      [SOURCE_1],
    );
    expect(result.valid).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it("rejects when cited chunk does not exist (fake citation)", () => {
    const result = validateCitationOwnership(
      validCitation,
      null,
      mockSource,
      USER_A,
      [SOURCE_1],
    );
    expect(result.valid).toBe(false);
    expect(result.findings.some((f) => f.code === "CHUNK_NOT_FOUND")).toBe(true);
  });

  it("rejects when chunk belongs to a different source (source mismatch)", () => {
    const mismatchedChunk: ChunkMeta = { ...mockChunk, sourceId: SOURCE_2 };
    const result = validateCitationOwnership(
      validCitation,
      mismatchedChunk,
      mockSource,
      USER_A,
      [SOURCE_1],
    );
    expect(result.valid).toBe(false);
    expect(result.findings.some((f) => f.code === "CHUNK_SOURCE_MISMATCH")).toBe(true);
  });

  it("rejects when source belongs to a different user", () => {
    const otherUserSource: SourceMeta = { ...mockSource, tokenIdentifier: USER_B };
    const result = validateCitationOwnership(
      validCitation,
      mockChunk,
      otherUserSource,
      USER_A,
      [SOURCE_1],
    );
    expect(result.valid).toBe(false);
    expect(result.findings.some((f) => f.code === "SOURCE_OWNERSHIP_VIOLATION")).toBe(true);
  });

  it("warns (not errors) when source is not in assignment scope", () => {
    const result = validateCitationOwnership(
      validCitation,
      mockChunk,
      mockSource,
      USER_A,
      [SOURCE_2],
    );
    expect(result.valid).toBe(true);
    expect(
      result.findings.some(
        (f) => f.code === "SOURCE_NOT_IN_ASSIGNMENT_SCOPE" && f.severity === "warning",
      ),
    ).toBe(true);
  });

  it("warns when claimed page is outside chunk range", () => {
    const outsidePageCitation: CitationInput = { ...validCitation, claimedPageStart: 99 };
    const result = validateCitationOwnership(
      outsidePageCitation,
      mockChunk,
      mockSource,
      USER_A,
      [SOURCE_1],
    );
    expect(result.findings.some((f) => f.code === "PAGE_OUTSIDE_CHUNK_RANGE")).toBe(true);
  });

  it("warns when page claimed but chunk has no page metadata", () => {
    const noPageChunk: ChunkMeta = { ...mockChunk, pageStart: undefined, pageEnd: undefined };
    const result = validateCitationOwnership(
      validCitation,
      noPageChunk,
      mockSource,
      USER_A,
      [SOURCE_1],
    );
    expect(result.findings.some((f) => f.code === "PAGE_UNVERIFIABLE")).toBe(true);
  });
});

describe("crossModuleChunkRejection", () => {
  it("returns null when chunk is in the same module", () => {
    const result = crossModuleChunkRejection(MODULE_1, MODULE_1);
    expect(result).toBeNull();
  });

  it("returns an error finding when chunk is from a different module", () => {
    const result = crossModuleChunkRejection(MODULE_2, MODULE_1);
    expect(result).not.toBeNull();
    expect(result!.code).toBe("CROSS_MODULE_CHUNK");
    expect(result!.severity).toBe("error");
  });

  it("returns null when no session module is set", () => {
    const result = crossModuleChunkRejection(MODULE_1, null);
    expect(result).toBeNull();
  });
});

describe("noSourceQueryWarning", () => {
  it("returns an error finding when no sources are available", () => {
    const result = noSourceQueryWarning(0);
    expect(result).not.toBeNull();
    expect(result!.code).toBe("NO_SOURCES_AVAILABLE");
  });

  it("returns a sparse warning when fewer than 3 chunks are available", () => {
    const result = noSourceQueryWarning(2);
    expect(result).not.toBeNull();
    expect(result!.code).toBe("SPARSE_SOURCES");
  });

  it("returns null when sufficient sources are available", () => {
    const result = noSourceQueryWarning(5);
    expect(result).toBeNull();
  });
});

describe("validateNoFabricatedPages", () => {
  it("warns when a page is claimed but source has no page metadata (invented page risk)", () => {
    const result = validateNoFabricatedPages(42, undefined);
    expect(result).not.toBeNull();
    expect(result!.code).toBe("INVENTED_PAGE_RISK");
  });

  it("returns null when no page is claimed", () => {
    const result = validateNoFabricatedPages(null, undefined);
    expect(result).toBeNull();
  });

  it("returns null when page is claimed and chunk has metadata", () => {
    const result = validateNoFabricatedPages(42, 40);
    expect(result).toBeNull();
  });
});
