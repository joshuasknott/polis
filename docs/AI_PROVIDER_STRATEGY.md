# Polis — AI Provider Strategy

## Migration Note

Runtime AI provider integrations from the old backend have been removed during the Convex migration. Development-time Copilot/Codex access is not a runtime integration target. Provider work will resume after the Convex foundation is stable, likely starting with z.ai/Zhipu.

## Approach: BYO API Key (Per-User) + App-Level Fallback

### User-Level Keys (Phase 3)

Users can connect their own API keys through the Settings page. Keys are:
- Encrypted at rest with AES-256-GCM (using ENCRYPTION_KEY env var)
- Validated before storage (test API call)
- Decrypted only at call time, never cached
- Scoped per-provider with optional model preference

### App-Level Keys (Fallback)

When no user key is configured, the system falls back to app-level environment variables:
- `OPENAI_API_KEY` — For OpenAI chat and embeddings
- `ANTHROPIC_API_KEY` — For Anthropic chat
- `GOOGLE_AI_API_KEY` — For Google Gemini chat
- `AI_PROVIDER` — Selects active provider ("openai", "anthropic", or "google")
- `AI_MODEL` — Overrides default model

### Resolution Order

```
1. User key for explicitly requested provider
2. User key for default provider
3. App-level env var for default provider
4. Template fallback (no API call)
```

## Provider Abstraction Layer

All AI interactions go through a provider abstraction layer:

```
User Query → Rate Limit Check → Scope Resolution → Hybrid Retrieval → Context Assembly → Prompt Construction → Provider Call (with user key resolution) → Response Processing → Usage Logging → Citation Injection → UI Display
```

### Provider Interface

```typescript
chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>
// options now includes userId for user-level key resolution
```

### Supported Providers

| Provider | Models | Status |
|----------|--------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano | **Active** |
| Anthropic | claude-sonnet-4-20250514, claude-3-5-haiku-latest | **Active** |
| Google Gemini | gemini-2.5-pro, gemini-2.5-flash | **Active** |
| Local/Open-source | Ollama models | Future |

### Default Configuration

- **Provider**: OpenAI (configurable via AI_PROVIDER)
- **Chat model**: gpt-4o-mini (cost-effective, good quality for academic Q&A)
- **Embedding model**: text-embedding-3-small (1536 dimensions)
- **Temperature**: 0.3 (0.7 for brainstorm mode)
- **Max tokens**: 2048

### Cost Estimates (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4.1 | $2.00 | $8.00 |
| claude-sonnet-4-20250514 | $3.00 | $15.00 |
| claude-3-5-haiku-latest | $0.80 | $4.00 |
| gemini-2.5-pro | $1.25 | $10.00 |
| gemini-2.5-flash | $0.15 | $0.60 |
| text-embedding-3-small | $0.02 | — |

## Security Rules

1. **Server-side only**: All API calls are made from server-side code (Next.js API routes)
2. **Encrypted at rest**: User API keys encrypted with AES-256-GCM before database storage
3. **Validated before storage**: Test API call confirms key validity before saving
4. **No client exposure**: API keys are NEVER included in client-side JavaScript bundles
5. **No localStorage**: API keys are never stored in browser storage
6. **Usage tracking**: All AI calls logged with token counts and cost estimates
7. **Rate limiting**: Per-user request and token limits enforced
8. **Error handling**: Provider errors handled gracefully without exposing internal details
9. **Fallback**: Template responses when no provider is configured

## Implementation Files

- `src/lib/ai/providers.ts` — Provider registry with user-level key resolution and usage logging
- `src/lib/ai/openai-provider.ts` — OpenAI SDK integration (chat + embeddings)
- `src/lib/ai/anthropic-provider.ts` — Anthropic SDK integration (chat)
- `src/lib/ai/gemini-provider.ts` — Google Gemini SDK integration (chat)
- `src/lib/ai/prompts.ts` — System prompts with academic integrity constraints
- `src/lib/ai/response-processor.ts` — Citation parsing, validation, labelling
- `src/lib/ai/tool-prompts.ts` — Prompts for citation check and draft review
- `src/lib/ai/grounded-provider.ts` — Template fallback (preserved from Phase 1)
- `src/lib/crypto.ts` — AES-256-GCM encryption for user API keys
- `src/lib/services/apikey-service.ts` — Encrypted API key CRUD operations
- `src/lib/services/usage-service.ts` — Usage tracking and cost estimation
- `src/lib/services/rate-limit-service.ts` — In-memory rate limiting

## Convex Usage Analytics & Rate Limiting

### Usage Events (`convex/usage.ts`)

All AI interactions are tracked via `usageEvents` table. Event types: `chat`, `embedding`, `retrieval`, `source_analysis`, `draft_review`, `citation_check`, `ingestion`.

**Writes**: `usage.recordEvent` (public mutation), `usage.recordEventInternal` (internal mutation for server-side use).

**Queries**: `usage.getDashboardStats` (single aggregated query for the Usage UI), `usage.getStatsAllTime`, `usage.getStatsThisMonth`, `usage.getStatsByType`, `usage.getStatsByModel`, `usage.getStatsByProvider`, `usage.getRetrievalBreakdown`, `usage.getRecentEvents`.

### Rate Limiting (`convex/rateLimits.ts`)

Server-side per-user rate limiting enforced in Convex, not client-side.

- **Window**: 60-second sliding window per provider.
- **Default**: 30 requests/min, 100k tokens/min.
- **Provider overrides**: OpenAI (30/150k), Anthropic (20/100k), Google (30/120k).
- **Check**: `rateLimits.checkRateLimit` mutation — atomically increments counters and returns `allowed`/`denied` with reset time.
- **Status**: `rateLimits.getRateLimitStatus` query — returns remaining limits for UI display.
- **Cleanup**: `rateLimits.cleanupOldWindows` internal mutation for stale window documents.

### Observability (`convex/observability.ts`)

Error tracking and processing job monitoring.

- **Error writes**: `observability.recordError` (public), `observability.recordErrorInternal` (internal).
- **Error queries**: `observability.listRecentErrors`, `observability.getErrorCounts` (24h aggregated by source/type).
- **Processing status**: `observability.getProcessingStatus` (24h job summary with pending/failed counts).

### Database Tables

- `usageEvents` — indexed by `tokenIdentifier`, `type`, `tokenIdentifier_and_type`, `tokenIdentifier_and_provider`, `tokenIdentifier_and_model`.
- `rateLimits` — indexed by `tokenIdentifier`, `tokenIdentifier_and_provider`.
- `errorEvents` — indexed by `tokenIdentifier`, `source`.
