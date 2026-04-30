# Phase 2 Implementation — SocialSciencr Intelligence Layer

## What Was Built

### Priority A: Real AI Provider Integration

**Status**: Complete

The provider abstraction layer now supports real LLM API calls:

- **OpenAI provider** (`src/lib/ai/openai-provider.ts`): Full chat completion + embedding generation via the OpenAI SDK. Supports gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano.
- **Anthropic provider** (`src/lib/ai/anthropic-provider.ts`): Chat completion via the Anthropic SDK. Supports claude-sonnet-4-20250514, claude-3-5-haiku-latest.
- **Provider registry** (`src/lib/ai/providers.ts`): Dispatches `chat()` calls to the active provider based on `AI_PROVIDER` env var. Falls back gracefully when no provider is configured.
- **App-level API keys**: Keys set via environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY). Per-user BYO keys are deferred to a future phase.
- **Graceful error handling**: Provider errors caught and surfaced to the user. Template fallback when no provider configured.

**New files**:
- `src/lib/ai/openai-provider.ts`
- `src/lib/ai/anthropic-provider.ts`

**Modified files**:
- `src/lib/ai/providers.ts` — replaced stub with real implementation
- `package.json` — added `openai`, `@anthropic-ai/sdk`
- `.env.example` — documented new env vars

### Priority B: Vector Embeddings and Semantic Search

**Status**: Complete

Source chunks are now embedded with OpenAI's text-embedding-3-small (1536 dimensions) and stored in PostgreSQL via pgvector:

- **Embedding service** (`src/lib/services/embedding-service.ts`): Generates embeddings for chunks during upload, provides batch embedding, query embedding.
- **Schema change**: Added `embedding Unsupported("vector(1536)")?` to SourceChunk model.
- **pgvector setup**: SQL script at `scripts/enable-pgvector.sql` must be run before `db:push`.
- **Upload integration**: After chunking, embeddings are generated automatically. Embedding failure is non-fatal.
- **Batch re-embedding**: `npm run db:embed` script at `scripts/embed-all.ts` embeds all chunks missing embeddings.

**New files**:
- `src/lib/services/embedding-service.ts`
- `scripts/enable-pgvector.sql`
- `scripts/embed-all.ts`

**Modified files**:
- `prisma/schema.prisma` — added embedding column
- `src/lib/services/chunking-service.ts` — wired embedding step
- `package.json` — added db:embed script

### Priority C: Hybrid Retrieval

**Status**: Complete

The retrieval service now supports three modes: hybrid (default), semantic, and keyword:

- **Semantic search**: Cosine similarity via pgvector `<=>` operator. Embeds the query, finds nearest chunk vectors.
- **Keyword search**: Original keyword scoring preserved as-is.
- **Hybrid**: Combines semantic (0.7 weight) and keyword (0.3 weight) scores. Normalizes each to 0-1 range before combining.
- **Fallback**: Falls back to keyword-only when embeddings are unavailable (no API key or no vector data).
- **Retrieval logging**: Mode (hybrid/semantic/keyword) logged in RetrievalLog for analytics.

**Modified files**:
- `src/lib/services/retrieval-service.ts` — major rewrite with three retrieval paths

### Priority D: LLM-Powered Source-Grounded Assistant

**Status**: Complete

The assistant now generates real LLM responses when an AI provider is configured:

- **Response processor** (`src/lib/ai/response-processor.ts`): Parses `[Source N]` citations from LLM output, validates against retrieved chunks, generates labels and warnings.
- **Enhanced prompts** (`src/lib/ai/prompts.ts`): Updated system prompts with citation format requirements and academic integrity constraints for all six modes.
- **Assistant route** (`src/app/api/assistant/route.ts`): Retrieves chunks via hybrid search → builds LLM prompt → calls chat() → processes response. Falls back to template responses when no provider configured.
- **Conversation memory**: Last 10 messages loaded as context for multi-turn conversations.

**New files**:
- `src/lib/ai/response-processor.ts`

**Modified files**:
- `src/lib/ai/prompts.ts` — enhanced with citation formatting instructions
- `src/app/api/assistant/route.ts` — LLM integration with fallback
- `src/lib/ai/grounded-provider.ts` — preserved as fallback (unchanged)

### Priority E: Auto-Generated Source Summaries

**Status**: Complete

Sources can now have AI-generated summaries, key arguments, and concepts:

- **Analyse endpoint**: `POST /api/sources/[sourceId]/analyse` generates summary using LLM.
- **Upload integration**: After upload → extract → chunk → embed, an AI analysis step runs in the background (non-blocking).
- **Source viewer**: Shows "AI-generated" label on summaries. "Regenerate" button to re-run analysis.
- **Data service**: New `updateSourceAnalysis()` function.

**New files**:
- `src/app/api/sources/[sourceId]/analyse/route.ts`

**Modified files**:
- `src/lib/services/upload-service.ts` — background AI analysis step
- `src/lib/services/data-service.ts` — updateSourceAnalysis function
- `src/components/sources/source-viewer-content.tsx` — AI label, regenerate button

### Priority F: Citation Safety Check and Draft Review

**Status**: Complete

Two new AI-powered tool endpoints:

- **Citation Safety Check** (`POST /api/tools/citation-check`): Analyses draft text against source material. Returns supported, weakly supported, and unsupported claims.
- **Draft Review** (`POST /api/tools/draft-review`): Structured feedback including strengths, weaknesses, missing evidence, revision priorities, estimated band range. Never rewrites.

Both tools use dedicated prompts (`src/lib/ai/tool-prompts.ts`) with academic integrity constraints. Neither generates replacement text.

**New files**:
- `src/app/api/tools/citation-check/route.ts`
- `src/app/api/tools/draft-review/route.ts`
- `src/lib/ai/tool-prompts.ts`

### Priority G: Conversation Memory

**Status**: Complete

Multi-turn conversations now maintain context:

- When `conversationId` is provided, the last 10 messages are loaded and included as LLM context.
- New conversations start fresh.
- The assistant UI now shows a "New Conversation" button and supports continuing existing conversations.
- Conversation selection from previous conversations list available.

### Priority H: UI Enhancements

**Status**: Complete

- **Assistant**: AI Connected/Template Mode badge, provider name display, "Add to Evidence Bank" button on cited chunks, "New Conversation" button, additional modes (brainstorm, draft feedback, citation safety).
- **Settings**: Updated Phase 2 feature status, AI provider connection status, vector embedding status, model info.
- **Source Viewer**: AI-generated label, "Regenerate Summary" button.
- **Tools**: Tool cards now have inline text input and run buttons for reading summary, concept extractor, essay plan builder, citation safety check, draft review, research gap finder.
- **Essay Workspace**: New "AI Tools" tab with citation check and draft review cards.

## What Remains from Phase 2 Scope

- **Google Gemini provider**: Provider config listed but not implemented. Would need `@google/generative-ai` SDK.
- **Per-user BYO API keys**: AIProviderConnection model exists but encrypted key management not implemented.
- **Background job queue**: File processing is synchronous within the upload request.
- **OAuth providers**: GitHub/Google login not yet configured.
- **pgvector index**: IVFFlat/HNSW index for large-scale search not yet added. Suitable when chunk count exceeds ~10,000.
- **Cross-encoder reranking**: Retrieved chunks are not reranked by a cross-encoder model.

## Database Setup

### Prerequisites
- PostgreSQL 14+ with pgvector extension

### Steps

```bash
# 1. Install pgvector extension (run SQL against your database)
psql -d socialsciencr -f scripts/enable-pgvector.sql
# Or manually: CREATE EXTENSION IF NOT EXISTS vector;

# 2. Push schema changes (adds embedding column to source_chunks)
npm run db:push

# 3. Seed with demo data
npm run db:seed

# 4. Embed demo chunks (requires OPENAI_API_KEY)
npm run db:embed
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Secret for Auth.js session encryption |
| `AI_PROVIDER` | No | "openai" (default) or "anthropic" |
| `AI_MODEL` | No | Default model for chat (default: gpt-4o-mini) |
| `EMBEDDING_MODEL` | No | Embedding model (default: text-embedding-3-small) |
| `OPENAI_API_KEY` | Recommended | Required for AI features and embeddings |
| `ANTHROPIC_API_KEY` | Optional | Required if AI_PROVIDER=anthropic |
| `UPLOAD_DIR` | No | File upload directory (default: ./uploads) |
| `MAX_FILE_SIZE_MB` | No | Max upload size in MB (default: 50) |

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Enable pgvector in PostgreSQL
psql -d socialsciencr -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 3. Push schema
npm run db:push

# 4. Seed demo data
npm run db:seed

# 5. Set OPENAI_API_KEY in .env for AI features

# 6. Optionally embed demo chunks
npm run db:embed

# 7. Start dev server
npm run dev

# 8. Open http://localhost:3000
#    Sign in: alex.chen@university.ac.uk / password123
```

## Files Changed/Created

### New Files
- `src/lib/ai/openai-provider.ts`
- `src/lib/ai/anthropic-provider.ts`
- `src/lib/ai/response-processor.ts`
- `src/lib/ai/tool-prompts.ts`
- `src/lib/services/embedding-service.ts`
- `src/app/api/sources/[sourceId]/analyse/route.ts`
- `src/app/api/tools/citation-check/route.ts`
- `src/app/api/tools/draft-review/route.ts`
- `scripts/enable-pgvector.sql`
- `scripts/embed-all.ts`

### Modified Files
- `prisma/schema.prisma` — embedding column
- `src/lib/ai/providers.ts` — real provider implementation
- `src/lib/ai/prompts.ts` — citation formatting instructions
- `src/lib/services/retrieval-service.ts` — hybrid retrieval
- `src/lib/services/chunking-service.ts` — embedding integration
- `src/lib/services/upload-service.ts` — AI analysis pipeline
- `src/lib/services/data-service.ts` — updateSourceAnalysis
- `src/app/api/assistant/route.ts` — LLM integration with fallback
- `src/app/assistant/page.tsx` — AI config props
- `src/app/settings/page.tsx` — provider status props
- `src/components/assistant/assistant-content.tsx` — AI badge, evidence button, conversation memory
- `src/components/settings/settings-content.tsx` — Phase 2 status
- `src/components/sources/source-viewer-content.tsx` — AI summary, regenerate
- `src/components/tools/tools-content.tsx` — wired tool cards
- `src/components/essays/essay-workspace-content.tsx` — AI tools tab
- `package.json` — new dependencies and scripts
- `.env.example` — new environment variables

## Known Limitations

1. **pgvector requires manual setup**: The `CREATE EXTENSION IF NOT EXISTS vector` SQL must be run before `db:push`. Prisma cannot create extensions.
2. **Synchronous file processing**: Upload processing (including embedding and AI analysis) happens within the request. Large files may timeout.
3. **App-level API keys only**: Per-user BYO keys not yet implemented. All users share the app-level key.
4. **No Google Gemini**: Provider listed but not implemented.
5. **No embedding index**: Vector search uses sequential scan. Suitable up to ~10K chunks. Add IVFFlat/HNSW index for larger datasets.
6. **Template fallback quality**: When no AI provider is configured, template responses are functional but lack LLM nuance.
7. **No rate limiting**: No rate limiting on AI API calls yet. Monitor usage via your provider dashboard.
8. **Context window**: Conversation history limited to last 10 messages. Very long conversations may lose earlier context.

## Recommended Next Phase (Phase 3)

1. **Per-user BYO API keys**: Encrypted key storage with the AIProviderConnection model
2. **Background job queue**: Move file processing to a background worker
3. **pgvector index**: Add IVFFlat or HNSW index for large-scale semantic search
4. **Google Gemini provider**: Add support via `@google/generative-ai` SDK
5. **Cross-encoder reranking**: Improve retrieval quality with a reranking step
6. **OAuth providers**: GitHub/Google login
7. **Cloud file storage**: S3/Supabase Storage for production deployment
8. **Rate limiting**: Per-user rate limits on AI API usage
9. **Usage analytics dashboard**: Show token usage, cost estimates, retrieval quality metrics
