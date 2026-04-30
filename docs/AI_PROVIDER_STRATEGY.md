# SocialSciencr — AI Provider Strategy

## Approach: App-Level API Keys (Phase 2) → BYO User Keys (Future)

### Phase 2: App-Level Keys

API keys are configured via environment variables:
- `OPENAI_API_KEY` — Required for AI features and embeddings
- `ANTHROPIC_API_KEY` — Optional, for Anthropic as provider
- `AI_PROVIDER` — Selects active provider ("openai" or "anthropic")
- `AI_MODEL` — Overrides default model

All API calls are server-side only. Keys are never exposed to the client.

### Future: BYO API Key (Per-User)

The `AIProviderConnection` model exists in the database schema for per-user encrypted API key storage. Implementation planned for Phase 3.

## Provider Abstraction Layer

All AI interactions go through a provider abstraction layer:

```
User Query → Scope Resolution → Hybrid Retrieval → Context Assembly → Prompt Construction → Provider Call → Response Processing → Citation Injection → UI Display
```

### Provider Interface

```typescript
// Each provider implements this via the providers.ts registry
chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>
```

### Supported Providers

| Provider | Models | Status |
|----------|--------|--------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano | **Active** |
| Anthropic | claude-sonnet-4-20250514, claude-3-5-haiku-latest | **Active** |
| Google Gemini | gemini-2.5-pro, gemini-2.5-flash | Planned |
| Local/Open-source | Ollama models | Future |

### Default Configuration

- **Provider**: OpenAI (configurable via AI_PROVIDER)
- **Chat model**: gpt-4o-mini (cost-effective, good quality for academic Q&A)
- **Embedding model**: text-embedding-3-small (1536 dimensions)
- **Temperature**: 0.3 (0.7 for brainstorm mode)
- **Max tokens**: 2048

### Cost Estimates

**OpenAI gpt-4o-mini**:
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- Typical conversation: ~2,000 tokens input, ~1,000 tokens output ≈ $0.0009 per message

**OpenAI text-embedding-3-small**:
- $0.02 per 1M tokens
- 100 chunks × ~800 tokens each ≈ $0.0016 for a full source

**Anthropic claude-sonnet-4-20250514**:
- Input: $3.00 per 1M tokens
- Output: $15.00 per 1M tokens
- Significantly more expensive than gpt-4o-mini

## Security Rules

1. **Server-side only**: All API calls are made from server-side code (Next.js API routes)
2. **Environment variables**: API keys stored in .env, never committed to git
3. **No client exposure**: API keys are NEVER included in client-side JavaScript bundles
4. **No localStorage**: API keys are never stored in browser storage
5. **Usage tracking**: Retrieval logs record every query and mode
6. **Error handling**: Provider errors handled gracefully without exposing internal details
7. **Fallback**: Template responses when no provider is configured

## Implementation Files

- `src/lib/ai/providers.ts` — Provider registry and main chat/embedding exports
- `src/lib/ai/openai-provider.ts` — OpenAI SDK integration (chat + embeddings)
- `src/lib/ai/anthropic-provider.ts` — Anthropic SDK integration (chat)
- `src/lib/ai/prompts.ts` — System prompts with academic integrity constraints
- `src/lib/ai/response-processor.ts` — Citation parsing, validation, labelling
- `src/lib/ai/tool-prompts.ts` — Prompts for citation check and draft review
- `src/lib/ai/grounded-provider.ts` — Template fallback (preserved from Phase 1)
