# Polis — RAG Architecture

## Current Status

The RAG pipeline is **paused** during the Convex migration. The previous PostgreSQL/pgvector implementation has been removed. This document describes the intended product architecture for the Convex-based rebuild.

The Convex schema includes `sourceChunks`, `sourceAnalyses`, `sourceClaims`, `sourceConcepts`, and `processingJobs` tables ready for the pipeline.

## Overview

Retrieval-Augmented Generation (RAG) is the core technique that enables Polis to provide source-grounded answers with citations.

## Pipeline

```
Upload → Convex Storage → Extract Text → Split into Chunks → Store Chunks
                                                                        ↓
User Query → Retrieve Chunks → Construct Prompt → AI Generate → Parse Citations → Display
                                   ↓ (fallback)
                              Template Response → Display
```

## 1. File Ingestion

### Upload
- Accept: PDF, DOCX, TXT, MD
- Store original file via Convex storage (`ctx.storage.generateUploadUrl()`)
- Create `sources` record with metadata
- Create `processingJobs` record with status "pending"

### Text Extraction
- **PDF**: Text extraction on Convex action (Node.js environment)
- **DOCX**: Text extraction on Convex action
- **TXT/MD**: Direct text input
- Preserve page boundaries where possible
- Update `sources.status` → "processing"

### AI Analysis
- After text extraction and chunking, an AI analysis step generates:
  - Summary (stored in `sourceAnalyses`)
  - Key Claims (stored in `sourceClaims`)
  - Key Concepts (stored in `sourceConcepts`)
- Non-blocking: source marked "ready" before analysis completes

## 2. Chunking

### Strategy
- Split extracted text into semantically meaningful chunks
- Target chunk size: 1000 words with 150 word overlap
- Preserve metadata: source ID, chunk index, page boundaries

### Chunk Storage
- Stored in `sourceChunks` table in Convex
- Fields: sourceId, chunkIndex, text, pageStart, pageEnd, tokenEstimate
- Indexed by sourceId for efficient retrieval

## 3. Retrieval

### Hybrid Retrieval (target)
Will combine semantic search and keyword search:

1. **Semantic search** (weight: 0.7)
   - Embed query using embedding model
   - Search against chunk embeddings
   - Return chunks sorted by similarity

2. **Keyword search** (weight: 0.3)
   - Tokenise query into words
   - Match against chunk text
   - Title-boosted scoring

3. **Score combination**
   - Normalise both scores to 0-1 range
   - Combine: 0.7 × semantic + 0.3 × keyword
   - Return top-K sorted by combined score

### Fallback
- When semantic search unavailable: keyword-only retrieval
- When no AI provider configured: template-based responses

### Scope Filtering
- **Whole module**: Search all chunks in the module
- **Selected source**: Search chunks from a specific source
- **Assignment**: Search chunks from sources linked to the assignment

## 4. Answer Generation

### AI Integration (Convex Actions)
- **Primary**: z.ai/GLM (glm-4.5-air default)
- **Secondary**: Google Gemini (gemini-2.5-flash for bulk, gemini-2.5-pro for complex)

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
- AI instructed to use `[Source N]` in-line citations
- Example: "Lijphart argues that consensus democracies outperform majoritarian ones [Source 1]."

### Response Processing
1. Parse `[Source N]` citations from AI output
2. Validate each citation against the retrieved chunk set
3. Extract quoted text for each cited chunk
4. Label response as source_supported, interpretation, or general
5. Generate warnings for insufficient evidence
6. Generate follow-up suggestions

### Conversation Memory
- Last N messages from the current CoThinker session included as context
- Stored in `coThinkerMessages` table, queried by sessionId
- Scoped to the selected module/sources

## 5. Citation Display

### UI Requirements
- Source citations appear as expandable cards below responses
- Each cited chunk shows: source title, author/year, quoted text
- "Add to Evidence Bank" button on each cited chunk
- Warning badges for unsupported claims
- AI mode indicator: "AI Connected" vs "Template Mode"

## 6. Failure States

| Scenario | Response |
|----------|----------|
| No relevant chunks found | "I couldn't find relevant information in your uploaded sources." |
| Low confidence retrieval | Warning: "Limited source material found." |
| Provider unavailable | Falls back to template-based keyword response |
| No API key configured | Template mode: keyword retrieval + template responses |
| AI indicates insufficient evidence | Warning: "The AI indicated insufficient evidence." |
| No citations in AI response | Warning: "Response does not cite specific sources." |

## 7. Workbench Actions

### Citation Safety Check
- Input: draft text
- Process: retrieve relevant chunks → AI analyses each claim → categorise as supported/weakly/unsupported
- Output: structured JSON with claim categories
- Stored as `reviewFindings`

### Draft Review
- Input: draft text, optional question, rubric
- Process: retrieve relevant chunks → AI provides structured feedback
- Output: strengths, weaknesses, missing evidence, revision priorities, rubric alignment
- Stored as `reviewRuns` and `reviewFindings`
- Constraint: NEVER rewrites — only analyses and suggests

## Future Improvements

- Reranking retrieved chunks with a cross-encoder model
- Multi-query retrieval (reformulating the user's question for better results)
- Source deduplication (avoiding redundant chunks from the same source)
- Adaptive chunk size based on document type
- Embedding storage strategy on Convex (vector search API or external index)
