# Polis — RAG Architecture

## Overview

Retrieval-Augmented Generation (RAG) is the core technique that enables Polis to provide source-grounded answers with citations. This document describes the Convex-based retrieval pipeline with scoped keyword retrieval and citation provenance.

## Pipeline

```
Upload → Store File → Extract Text → Split into Chunks → Store Chunks (Convex)
                                                                        ↓
User Query → Resolve Scope → Keyword Retrieval → Rank & Score → Construct Prompt → LLM Generate → Validate Citations → Display
```

## 1. Retrieval Scopes

Retrieval is always scoped to control which sources are searched:

| Scope | Description | Sources |
|-------|-------------|---------|
| `whole_module` | All sources in a module | All sources owned by user in module |
| `current_folder` | Sources in a specific folder | Sources in folder, owned by user |
| `selected_sources` | Explicitly chosen sources | Only the listed source IDs |
| `assignment` | Sources selected for an assignment | Via `assignmentSources` table |
| `source` | Single source | One specific source |

Assignment scope defaults to selected sources only. This prevents accidental retrieval from unrelated module materials.

## 2. Keyword Retrieval

### Algorithm

1. **Tokenise** the query into words (>2 characters)
2. **Resolve** source IDs based on scope, module ownership, and user identity
3. **Fetch** all chunks for the resolved sources
4. **Score** each chunk:
   - Count keyword occurrences in chunk text
   - Boost title matches by 3x
   - Boost author matches by 2x
   - Normalise by `sqrt(text_length)` to prevent long chunks dominating
5. **Sort** by descending score
6. **Bound** results (default 20 max)

### Convex Search Index

The `sourceChunks` table has a `search_text` search index on the `text` field, filtered by `sourceId`. This enables Convex full-text search as an alternative retrieval path for large source collections.

### Result Shape

Each retrieval result contains:

```typescript
{
  chunkId: string         // sourceChunks document ID
  sourceId: string        // sources document ID
  sourceTitle: string     // source title
  authors: string | null  // author string
  year: number | null     // publication year
  pageStart: number | null
  pageEnd: number | null
  quote: string           // excerpt (max 300 chars)
  citationLabel: string   // Harvard format label
  score: number           // normalised keyword score
  scope: RetrievalScope   // which scope produced this result
  warnings: string[]      // e.g. "missing_page_provenance"
}
```

## 3. Harvard Citation Format

The citation helper generates Harvard-style in-text citations:

| Scenario | Format |
|----------|--------|
| Author + year + page | `Author (Year, p. X)` |
| Author + year + page range | `Author (Year, pp. X–Y)` |
| Author + year, no page | `Author (Year)` |
| Author, no year | `Author (n.d.)` |
| No author, has year | `(Year)` |
| Neither | `(Unknown)` |

**Rules:**
- Never invent page numbers; only use `pageStart`/`pageEnd` from the chunk
- Warn when author or year is missing
- Use first author surname only (before first comma)

## 4. Citation Validation

### Single Citation Validation

For each cited chunk, the system validates:

1. **Chunk exists** — the `sourceChunks` document exists
2. **Chunk belongs to source** — `chunk.sourceId` matches the claimed source
3. **Source belongs to user** — `source.tokenIdentifier` matches authenticated identity
4. **Source belongs to module** — `source.moduleId` matches the expected module

### Assignment-Scoped Validation

For citations within an assignment context:

1. All base validations above
2. **Source is in assignment scope** — the source is linked via `assignmentSources`
3. If not in scope, a warning is generated (not an error) — the citation is valid but outside the assignment's selected sources

### Chunk Set Validation

For validating an entire AI output's cited chunks:

1. Validate each chunk individually
2. Verify at least one valid source citation exists
3. Return aggregated warnings

## 5. Evidence Integration

Evidence links (`evidenceLinks` table) can optionally reference a `sourceChunkId`:

- When `sourceChunkId` is provided, the system validates the chunk belongs to the claimed source
- Quote and page range can be auto-populated from the chunk via the `enrichEvidence` query
- The `listForChunk` query finds all evidence links referencing a specific chunk

## 6. Insufficient Evidence Warnings

The retrieval engine generates warnings when evidence quality is low:

| Warning | Trigger | Severity |
|---------|---------|----------|
| `no_chunks_found` | Zero results returned | Critical |
| `no_selected_sources` | Assignment has no sources selected | Critical |
| `low_score` | Best score < 0.15 threshold | Warning |
| `too_few_sources` | Results from < 2 distinct sources | Info |
| `missing_page_provenance` | Any chunk lacks page numbers | Info |

## 7. Vector Readiness

The architecture is designed for future vector search:

- The `sourceChunks` table has a `search_text` Convex search index for full-text search
- Embedding fields can be added to `sourceChunks` when Convex vector search is available
- The retrieval pipeline in `convex/lib/retrieval.ts` is structured so vector scoring can be added alongside keyword scoring
- A hybrid scoring layer (0.7 semantic + 0.3 keyword) can be added without changing the result shape

### Convex Vector Search

Convex supports vector search via `vectorIndex` on tables. When embeddings are available:
1. Add a `vectorIndex` to `sourceChunks` with the embedding field
2. Query with `.withVectorIndex()` for similarity search
3. Combine vector scores with keyword scores in the ranking step

## 8. API Functions

### Retrieval (`convex/retrieval.ts`)

| Function | Scope | Description |
|----------|-------|-------------|
| `searchKeyword` | Any | Generic scoped keyword search |
| `searchModule` | `whole_module` | Search all sources in a module |
| `searchFolder` | `current_folder` | Search sources in a folder |
| `searchSources` | `selected_sources` | Search explicitly listed sources |
| `searchAssignment` | `assignment` | Search assignment's selected sources |
| `searchSource` | `source` | Search within one source |

### Citation (`convex/citation.ts`)

| Function | Description |
|----------|-------------|
| `validateCitation` | Validate chunk ownership (chunk → source → user) |
| `validateCitationInModule` | Validate chunk is in a module |
| `validateAssignmentCitation` | Validate chunk in assignment scope |
| `validateCitedChunkSet` | Validate an entire set of cited chunks |
| `formatCitation` | Generate Harvard citation for a source/chunk |
| `enrichEvidence` | Get quote, page range, and citation from a chunk |

## 9. Failure States

| Scenario | Response |
|----------|----------|
| No relevant chunks found | Warning: "No relevant chunks found" |
| Low confidence retrieval | Warning: "Limited source material found" |
| No sources in scope | Critical: "No sources found in scope" |
| Missing page provenance | Info: "Some chunks lack page information" |
| Too few distinct sources | Info: "Consider broadening scope" |
| Citation validation failure | Error with specific validation message |

## 10. Academic Integrity Guarantees

1. **No fabricated citations** — every citation validates against actual stored chunks
2. **No invented page numbers** — page data comes exclusively from chunk metadata
3. **User ownership enforced** — all queries verify `tokenIdentifier` ownership
4. **Scope boundaries respected** — assignment scope only searches selected sources
5. **Warnings, not silence** — insufficient evidence always produces explicit warnings
