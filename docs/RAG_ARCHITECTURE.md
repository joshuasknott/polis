# SocialSciencr — RAG Architecture

## Overview

Retrieval-Augmented Generation (RAG) is the core technique that enables SocialSciencr to provide source-grounded answers with citations.

## Pipeline

```
Upload → Store File → Extract Text → Split into Chunks → Create Embeddings → Store Chunks
                                                                              ↓
User Query → Embed Query → Retrieve Relevant Chunks → Construct Prompt → Generate Answer → Inject Citations → Display
```

## 1. File Ingestion

### Upload
- Accept: PDF, DOCX, PPTX, TXT, MD
- Maximum file size: 50MB
- Store original file in object storage (S3-compatible)
- Create SourceFile record with metadata

### Text Extraction
- **PDF**: Extract text using pdf-parse or similar; handle multi-column layouts
- **DOCX**: Extract using mammoth.js; preserve heading structure
- **PPTX**: Extract slide text with slide numbers
- **TXT/MD**: Direct text input
- Preserve page boundaries where possible

## 2. Chunking

### Strategy
- Split extracted text into semantically meaningful chunks
- Target chunk size: 500-1000 tokens with 100-200 token overlap
- Respect page boundaries (don't split across pages)
- Preserve metadata: source ID, page range, section heading

### Chunk Structure
```typescript
{
  id: string
  sourceId: string
  text: string
  pageStart: number
  pageEnd: number
  citationLabel: string  // e.g., "Lijphart (1999, pp. 2-3)"
}
```

## 3. Embeddings

### Model
- Use the embedding model matching the chosen provider
- OpenAI: text-embedding-3-small
- Anthropic: Use Voyage AI or fall back to OpenAI embeddings
- Store embeddings alongside chunks

### Storage
- pgvector extension in PostgreSQL, or
- Dedicated vector store (Pinecone, Weaviate, Chroma)

## 4. Retrieval

### Query Process
1. Embed the user's query
2. Perform semantic similarity search against chunk embeddings
3. Optionally combine with keyword search (hybrid retrieval)
4. Rank results by relevance score
5. Select top K chunks (typically 5-10)
6. Filter by scope (module, folder, selected sources)

### Scope Filtering
- **Whole module**: Search all chunks in the module
- **Current folder**: Search chunks from sources in the selected folder
- **Selected sources**: Search only chunks from explicitly selected sources
- **Essay project**: Search chunks from sources linked to the essay

## 5. Answer Generation

### Prompt Construction
```
System: You are an academic research assistant. Answer using ONLY the
provided source material. Cite sources using the provided citation labels.
If the sources don't contain enough information, say so explicitly.

Sources:
[Chunk 1 - Lijphart (1999, pp. 2-3)]: "Consensus democracy is..."
[Chunk 2 - Tsebelis (2002, p. 19)]: "The more veto players..."

User: What is the difference between Lijphart's consensus model and
Tsebelis's veto player theory?
```

### Response Processing
1. Parse AI response for citation references
2. Validate that cited chunks exist in the retrieved set
3. Label claims as source-supported, interpretation, or general
4. Generate warnings for insufficient evidence
5. Attach follow-up suggestions

## 6. Citation Display

### UI Requirements
- Source citations appear as inline badges
- Hovering a citation shows the original source text
- Clicking a citation navigates to the source viewer
- Warning badges appear for unsupported claims
- Interpretation labels appear where the model infers beyond source text

## 7. Failure States

| Scenario | Response |
|----------|----------|
| No relevant chunks found | "I couldn't find relevant information in your uploaded sources for this question." |
| Low confidence retrieval | "I found some partially relevant material, but the evidence is limited. Consider adding more sources on this topic." |
| Contradictory sources | "Your sources present conflicting views on this point. Source A says X, while Source B says Y." |
| Query outside source scope | "This question goes beyond the scope of your uploaded materials. I can provide general context, but it won't be source-grounded." |
| Provider unavailable | "AI provider is not connected. Please configure an API key in Settings." |

## Future Improvements

- Reranking retrieved chunks with a cross-encoder model
- Multi-query retrieval (reformulating the user's question for better results)
- Conversation memory (maintaining context across messages)
- Source deduplication (avoiding redundant chunks from the same source)
- Adaptive chunk size based on document type
