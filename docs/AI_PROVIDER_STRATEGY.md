# Polis — AI Provider Strategy

**Last updated**: 2026-05-09
**Status**: Contract — describes the intended production provider architecture on Convex. References to OpenAI/Anthropic as "Active" providers and `src/lib/ai/*` implementation files are historical.

## Runtime Provider Stack

| Provider | Role | Models | Status |
|----------|------|--------|--------|
| z.ai / GLM (ZhipuAI) | Primary runtime | GLM-4, embedding models | Planned — primary target |
| Google Gemini | Secondary runtime | gemini-2.5-flash, gemini-2.5-pro | Planned — free-tier fallback |
| OpenAI | Historical only | gpt-4o, gpt-4o-mini | Not a runtime target |
| Anthropic | Historical only | claude-sonnet-4, claude-3.5-haiku | Not a runtime target |

### Development Tools (Not Runtime)

- GPT Plus Codex: Development productivity tool. Not a runtime provider.
- GitHub Copilot Student: Development productivity tool. Not a runtime provider.

These are not integrated into the app runtime. No server-side API credentials/endpoints exist for them.

## Approach: App-Level Provider + User-Level Override

### App-Level Keys (Default)

The application provides default API keys for z.ai and Gemini via Convex environment variables:
- `ZAI_API_KEY` — For z.ai / GLM chat and embeddings
- `GEMINI_API_KEY` — For Google Gemini chat
- `AI_PROVIDER` — Selects default provider ("zai" or "gemini")
- `AI_MODEL` — Overrides default model

### User-Level Keys (Override)

Users can connect their own API keys through the Settings page via `aiProviderConnections`:
- Stored with encrypted credential references.
- Scoped per-provider with optional model preference.
- Take precedence over app-level keys when configured.

### Resolution Order

```
1. User key for explicitly requested provider
2. User key for default provider
3. App-level env var for default provider
4. Template fallback (no API call)
```

## Provider Interface (Planned)

All AI interactions will go through Convex actions:

```
User Query → Rate Limit Check → Scope Resolution → Retrieval → Context Assembly → Prompt Construction → Provider Action → Response Processing → Usage Logging → Citation Injection → Message Write → UI Display
```

### Chat Interface

```typescript
// Planned: convex/ai/providers/zai.ts
chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>

// Planned: convex/ai/providers/gemini.ts
chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>
```

### Embedding Interface

```typescript
// Planned: convex/ai/providers/zai.ts
embed(texts: string[]): Promise<number[][]>

// Planned: convex/ai/providers/gemini.ts
embed(texts: string[]): Promise<number[][]>
```

### Default Configuration

- **Provider**: z.ai (configurable via AI_PROVIDER)
- **Chat model**: GLM-4 (or equivalent)
- **Embedding model**: z.ai embedding model
- **Temperature**: 0.3 (0.7 for brainstorm mode)
- **Max tokens**: 2048

## Planned Implementation Files

All AI provider code lives under `convex/ai/`:

```
convex/ai/
  providers/
    zai.ts          # z.ai / GLM provider (chat + embeddings)
    gemini.ts       # Google Gemini provider (chat + embeddings)
    registry.ts     # Provider resolution (user key → app key → fallback)
  chat.ts           # CoThinker chat action
  analysis.ts       # Source analysis action
  review.ts         # Draft review action
  judgements.ts     # Judgement generation actions
  prompts.ts        # System prompts with academic integrity constraints
  response.ts       # Citation parsing, validation, labelling
```

## Security Rules

1. **Server-side only**: All API calls are made from Convex actions (Node.js runtime). Never from client code.
2. **Encrypted at rest**: User API keys referenced via `encryptedCredentialRef` in `aiProviderConnections`.
3. **Validated before storage**: Test API call confirms key validity before saving.
4. **No client exposure**: API keys are NEVER included in client-side JavaScript bundles.
5. **No localStorage**: API keys are never stored in browser storage.
6. **Usage tracking**: All AI calls logged to `usageEvents` with token counts and cost estimates.
7. **Rate limiting**: Per-user request and token limits enforced via usage event tracking.
8. **Error handling**: Provider errors handled gracefully without exposing internal details.
9. **Fallback**: Template responses when no provider is configured.

## Cost Estimates (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| GLM-4 | $0.15 | $0.60 |
| gemini-2.5-flash | $0.15 | $0.60 |
| gemini-2.5-pro | $1.25 | $10.00 |

## Historical References (Superseded)

The following are from the old Prisma/Auth.js backend and do not reflect current reality:
- `src/lib/ai/providers.ts` — Old provider registry (not active)
- `src/lib/ai/openai-provider.ts` — Old OpenAI provider (not active)
- `src/lib/ai/anthropic-provider.ts` — Old Anthropic provider (not active)
- `src/lib/ai/gemini-provider.ts` — Old Gemini provider (not active)
- `src/lib/ai/grounded-provider.ts` — Old template fallback (not active)
- `src/lib/ai/prompts.ts` — Old prompts (not active)
- `src/lib/ai/response-processor.ts` — Old response processor (not active)
- `src/lib/ai/tool-prompts.ts` — Old tool prompts (not active)
- `src/lib/crypto.ts` — Old AES-256-GCM encryption (not active)
- `src/lib/services/apikey-service.ts` — Old key service (not active)
- `src/lib/services/usage-service.ts` — Old usage service (not active)
- `src/lib/services/rate-limit-service.ts` — Old rate limiter (not active)
