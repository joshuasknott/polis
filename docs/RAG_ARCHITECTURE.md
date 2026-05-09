# Polis — RAG Architecture

**Last updated**: 2026-05-09
**Status**: Contract — describes the intended production architecture on Convex. The previous PostgreSQL/pgvector implementation has been fully removed.

## Overview

Retrieval-Augmented Generation (RAG) is the core technique that enables Polis to provide source-grounded answers with citations. All retrieval and generation will be built on Convex.

## Pipeline

```
Upload → Convex Storage → Extract Text (action) → Split into Chunks (action) → Generate Embeddings (action) → Store Chunks with Vectors
                                                                                                         ↓
User Query → Embed Query (action) → Convex Vector Search → Construct Prompt → LLM Generate (action) → Parse Citations → Write Message → Display
                                              ↓ (fallback)
                                    Keyword Search (Convex search index) → Template Response → Display
```

## 1. File Ingestion

### Upload Flow (Convex Storage)

1. Client calls `files.generateUploadUrl` mutation.
2. Client uploads file directly to Convex storage.
3. Client calls `sources.attachStorage` mutation with the storage ID.
4. Source status transitions: `placeholder` → `processing`.
5. A processing action is scheduled.

### Text Extraction (Action — Planned)

- **PDF**: Server-side extraction using a Node.js library.
- **DOCX**: Server-side extraction.
- **TXT/MD**: Direct text input.
- Preserve page boundaries where possible.
- Action writes extracted text to a processing job record, then triggers chunking.

### AI Analysis (Planned)

After text extraction and chunking, an AI analysis action generates:
- **Summary** (2-3 paragraphs) → `sourceAnalyses` (type: `"summary"`)
- **Main argument** (1-2 sentences) → `sourceAnalyses` (type: `"main_argument"`)
- **Concepts** (key concepts with definitions) → `sourceConcepts`
- **Claims** (source claims with page ranges) → `sourceClaims`
- **Limitations** → `sourceAnalyses` (type: `"limitations"`)

Non-blocking: runs in background after extraction completes. Source is marked `processed` before analysis completes.

## 2. Chunking

### Strategy

- Split extracted text into semantically meaningful chunks.
- Target chunk size: 1000 words with 150 word overlap.
- Preserve metadata: source ID, chunk index, page boundaries.

### Chunk Schema (Live)

```
sourceChunks {
  sourceId: Id<"sources">
  chunkIndex: number
  text: string
  pageStart?: number
  pageEnd?: number
  tokenEstimate?: number
  createdAt: number
}
```

Index: `by_source`

## 3. Embeddings (Planned)

### Storage

- Embeddings stored on the `sourceChunks` table using Convex vector columns.
- Schema will be updated with `vectorDimension` when Convex vector search is configured.

### Generation

- Generated automatically after chunking during the processing pipeline.
- Batch embedding for efficiency.
- Non-fatal: chunks without embeddings are still searchable by keyword (Convex search index).

## 4. Retrieval (Planned)

### Vector Search (Primary)

- Convex vector search on `sourceChunks` table.
- Cosine similarity search returning top-K chunks.
- Filterable by source (scope filtering).

### Keyword Search (Fallback + Supplementary)

- Convex full-text search index on `sourceChunks.text`.
- Available when embeddings are not generated.

### Hybrid Retrieval

Combines vector search and keyword search:
1. **Vector search** (primary): Embed query, search by vector similarity.
2. **Keyword search** (supplementary): Full-text search on chunk text.
3. **Score combination**: Merge and deduplicate results.

### Scope Filtering

- **Whole module**: Search all chunks in the module's sources.
- **Selected sources**: Search chunks from sources selected for the assignment.
- **Single source**: Search chunks from a specific source.
- **Assignment**: Search chunks from sources linked to the assignment.

## 5. Answer Generation (Planned)

### LLM Integration

- **Primary**: z.ai / GLM
- **Secondary**: Google Gemini (free API key)
- Configurable per-user via `aiProviderConnections`.

### Prompt Construction

```
System: Academic research assistant + integrity rules + Harvard citation format requirement
System: [Source 1]: chunk text from "Title" by Author (Year, pp. X-Y)
        [Source 2]: chunk text from "Title" by Author (Year, pp. X-Y)
        ...
User: [conversation history]
User: the actual query
```

### Citation Format

- LLM instructed to use `[Source N]` in-line citations.
- Example: "Lijphart argues that consensus democracies outperform majoritarian ones [Source 1]."
- Mapped to `(Author, Year, p. X)` Harvard format for display.

### Response Processing

1. Parse `[Source N]` citations from LLM output.
2. Validate each citation against the retrieved chunk set.
3. Extract quoted text for each cited chunk.
4. Label response: `source_supported`, `interpretation`, `general_context`, `unsupported`.
5. Generate warnings for:
   - No citations when sources were available.
   - LLM indicating insufficient evidence.
   - Limited source material (<3 chunks).
6. Generate follow-up suggestions.

### Conversation Memory

- Last 10 messages from the current CoThinker session included as context.
- Maintains multi-turn coherence.
- Scoped to the selected module/sources/assignment.

## 6. Citation Display

### UI Requirements

- Source citations appear as expandable cards below responses.
- Each cited chunk shows: source title, author/year, quoted text, page range.
- "Add to Evidence Bank" button on each cited chunk.
- Warning badges for unsupported claims.
- Label badges: "Source-supported", "Interpretation", "General", "Unsupported".

## 7. Failure States

| Scenario | Response |
|----------|----------|
| No relevant chunks found | "I couldn't find relevant information in your uploaded sources." |
| Low confidence retrieval | Warning: "Limited source material found." |
| Provider unavailable | Falls back to keyword-only retrieval + template response |
| No AI provider configured | Template mode: keyword retrieval + template responses |
| Embedding failure | Falls back to keyword-only retrieval |
| LLM indicates insufficient evidence | Warning: "The AI indicated insufficient evidence." |
| No citations in LLM response | Warning: "Response does not cite specific sources." |

## 8. Workbench Actions (Planned)

### Citation Safety Check

- Input: draft text + source chunks from assignment.
- Process: retrieve relevant chunks → LLM analyses each claim → categorise as supported/weakly/unsupported.
- Output: review findings in `reviewFindings` (category: `"citation_safety"`).
- Constraint: NEVER rewrites — only analyses and flags.

### Draft Review

- Input: draft text + question + rubric.
- Process: retrieve relevant chunks → LLM provides structured feedback.
- Output: review run + findings (strengths, weaknesses, missing_evidence, unsupported_claims, revision_priorities).
- Constraint: NEVER rewrites — only analyses and suggests.

## Future Improvements

- Reranking retrieved chunks with a cross-encoder model.
- Multi-query retrieval (reformulating the user's question for better results).
- Convex vector index tuning for large-scale search.
- Source deduplication (avoiding redundant chunks from the same source).
- Adaptive chunk size based on document type.
- Per-user BYO API key management via `aiProviderConnections`.
- Rate limiting on AI API calls via `usageEvents`.
