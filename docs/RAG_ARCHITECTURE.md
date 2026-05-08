# Polis — RAG Architecture

## Migration Note

The previous PostgreSQL/pgvector implementation has been removed while Polis migrates to Convex. This document describes the intended product architecture, not the current runtime implementation. Retrieval, embeddings, ingestion, and AI chat will be rebuilt after the Convex data foundation is established.

## Overview

Retrieval-Augmented Generation (RAG) is the core technique that enables Polis to provide source-grounded answers with citations.

## Pipeline

```
Upload → Store File → Extract Text → Split into Chunks → Generate Embeddings → Store with Vectors
                                                                                  ↓
User Query → Embed Query → Hybrid Retrieval → Construct Prompt → LLM Generate → Parse Citations → Display
                                         ↓ (fallback)
                                    Keyword Retrieval → Template Response → Display
```

## 1. File Ingestion

### Upload
- Accept: PDF, DOCX, TXT, MD
- Maximum file size: 50MB
- Store original file in local uploads directory
- Create Source record with metadata

### Text Extraction
- **PDF**: Extract text using pdf-parse
- **DOCX**: Extract using mammoth.js
- **TXT/MD**: Direct text input
- Preserve page boundaries where possible

### AI Analysis (Phase 2)
- After text extraction and chunking, an AI analysis step generates:
  - Summary (2-3 paragraphs)
  - Key Arguments (1-2 sentences)
  - Concepts (comma-separated list)
- Non-blocking: runs in background, source is marked ready before analysis completes
- Endpoint: `POST /api/sources/[sourceId]/analyse` for manual regeneration

## 2. Chunking

### Strategy
- Split extracted text into semantically meaningful chunks
- Target chunk size: 1000 words with 150 word overlap
- Preserve metadata: source ID, chunk index

### Chunk Structure
```typescript
{
  id: string
  sourceId: string
  text: string
  charCount: number
  tokenEstimate: number
  pageNumber: number | null
  embedding: number[] | null  // 1536-dimensional vector (Phase 2)
}
```

## 3. Embeddings (Phase 2)

### Model
- OpenAI text-embedding-3-small (1536 dimensions)
- Cost: ~$0.02 per 1M tokens

### Generation
- Generated automatically after chunking during file upload
- Batch embedding for efficiency (20 chunks per API call)
- Non-fatal: chunks without embeddings are still searchable by keyword

### Storage
- pgvector extension in PostgreSQL
- Column: `embedding Unsupported("vector(1536)")` on `source_chunks` table
- Cosine similarity via `<=>` operator

### Batch Processing
- `npm run db:embed` embeds all chunks missing embeddings
- Suitable for initial setup or after adding API key

## 4. Retrieval (Phase 2)

### Hybrid Retrieval (default)
Combines semantic search and keyword search:

1. **Semantic search** (weight: 0.7)
   - Embed query using text-embedding-3-small
   - Cosine similarity search via pgvector `<=>` operator
   - Returns chunks sorted by vector similarity

2. **Keyword search** (weight: 0.3)
   - Tokenise query into words (>2 chars)
   - Count keyword matches in chunk text
   - Title-boosted scoring (+3 for title matches)
   - Length-normalised scores

3. **Score combination**
   - Normalise both scores to 0-1 range
   - Combine: 0.7 × semantic + 0.3 × keyword
   - Return top-K sorted by combined score

### Fallback
- When embeddings unavailable (no API key or no vector data): keyword-only retrieval
- When no AI provider configured: template-based responses

### Retrieval Modes
- `hybrid` (default): semantic + keyword combined
- `semantic`: vector similarity only
- `keyword`: keyword matching only

### Scope Filtering
- **Whole module**: Search all chunks in the module
- **Selected source**: Search chunks from a specific source
- **Essay project**: Search chunks from sources linked to the essay evidence

## 5. Answer Generation (Phase 2)

### LLM Integration
- **Primary**: OpenAI (gpt-4o-mini default)
- **Secondary**: Anthropic (claude-sonnet-4-20250514)
- Configurable via `AI_PROVIDER` and `AI_MODEL` environment variables

### Prompt Construction
```
System: Academic research assistant + integrity rules + citation format requirement
System: [Source 1]: chunk text from "Title" by Author (Year)
        [Source 2]: chunk text from "Title" by Author (Year)
        ...
User: [conversation history]
User: the actual query
```

### Citation Format
- LLM instructed to use `[Source N]` in-line citations
- Example: "Lijphart argues that consensus democracies outperform majoritarian ones [Source 1]."

### Response Processing
1. Parse `[Source N]` citations from LLM output
2. Validate each citation against the retrieved chunk set
3. Extract quoted text for each cited chunk
4. Label response as source_supported, interpretation, or general
5. Generate warnings for:
   - No citations when sources were available
   - LLM indicating insufficient evidence
   - Limited source material (<3 chunks)
6. Generate follow-up suggestions

### Conversation Memory
- Last 10 messages from the current conversation included as context
- Maintains multi-turn coherence
- Scoped to the selected module/sources

## 6. Citation Display

### UI Requirements
- Source citations appear as expandable cards below responses
- Each cited chunk shows: source title, author/year, quoted text
- "Add to Evidence Bank" button on each cited chunk
- Warning badges for unsupported claims
- AI mode indicator: "AI Connected" vs "Template Mode"

## 7. Failure States

| Scenario | Response |
|----------|----------|
| No relevant chunks found | "I couldn't find relevant information in your uploaded sources." |
| Low confidence retrieval | Warning: "Limited source material found." |
| Provider unavailable | Falls back to template-based keyword response |
| No API key configured | Template mode: keyword retrieval + template responses |
| Embedding failure | Falls back to keyword-only retrieval |
| LLM indicates insufficient evidence | Warning: "The AI indicated insufficient evidence." |
| No citations in LLM response | Warning: "Response does not cite specific sources." |

## 8. Academic Tools (Phase 2)

### Citation Safety Check
- Input: draft text
- Process: retrieve relevant chunks → LLM analyses each claim → categorise as supported/weakly/unsupported
- Output: structured JSON with claim categories
- Endpoint: `POST /api/tools/citation-check`

### Draft Review
- Input: draft text, optional question, rubric
- Process: retrieve relevant chunks → LLM provides structured feedback
- Output: strengths, weaknesses, missing evidence, revision priorities, estimated band
- Constraint: NEVER rewrites — only analyses and suggests
- Endpoint: `POST /api/tools/draft-review`

## Future Improvements

- Reranking retrieved chunks with a cross-encoder model
- Multi-query retrieval (reformulating the user's question for better results)
- pgvector index (IVFFlat or HNSW) for large-scale search (>10K chunks)
- Source deduplication (avoiding redundant chunks from the same source)
- Adaptive chunk size based on document type
- Per-user BYO API key management with encrypted storage
- Google Gemini provider support
- Rate limiting on AI API calls
