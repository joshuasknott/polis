# Polis — AI Provider Strategy

## Current Status

Runtime AI provider integration is **paused** during the Convex migration. The pre-Convex OpenAI/Anthropic/pgvector implementation has been removed. AI features will be rebuilt on Convex using the providers below.

The Convex schema includes `aiProviderConnections` and `usageEvents` tables ready for the AI layer. The `convex/ai.ts` file currently has a placeholder query.

## Planned Providers

| Provider | Models | Role |
|----------|--------|------|
| **z.ai / Zhipu GLM** | glm-4.5, glm-4.5-air | Primary AI provider (chat, analysis) |
| **Google Gemini** | gemini-2.5-pro, gemini-2.5-flash | Secondary AI provider (chat, analysis) |

### Why z.ai / GLM

- Cost-effective for academic workloads
- Strong multilingual support relevant for social science students
- BYO API key model aligns with student budget constraints

### Why Gemini

- High-quality academic reasoning
- Flash model for cost-effective bulk operations (summaries, concept extraction)
- Pro model for complex reasoning (draft review, argument evaluation)

## Approach: BYO API Key (Per-User) + App-Level Fallback

### User-Level Keys

Users will connect their own API keys through the Settings page. Keys are:
- Encrypted at rest (AES-256-GCM, using `ENCRYPTION_SECRET` env var)
- Validated before storage (test API call)
- Decrypted only at call time, never cached
- Scoped per-provider with optional model preference
- Stored via `aiProviderConnections` table in Convex

### App-Level Keys (Fallback)

When no user key is configured, the system falls back to app-level environment variables:
- `ZAI_API_KEY` — For z.ai/GLM chat and analysis
- `GOOGLE_AI_API_KEY` — For Google Gemini chat and analysis

### Resolution Order

```
1. User key for explicitly requested provider
2. User key for default provider
3. App-level env var for default provider
4. Template fallback (no API call)
```

## Provider Abstraction Layer

All AI interactions will go through a provider abstraction layer implemented as Convex actions:

```
User Query → Rate Limit Check → Scope Resolution → Hybrid Retrieval → Context Assembly → Prompt Construction → Provider Call (with user key resolution) → Response Processing → Usage Logging → Citation Injection → UI Display
```

### Provider Interface (Convex Actions)

```typescript
// Convex action (runs in Node.js environment)
chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>
```

### Default Configuration

- **Provider**: z.ai/GLM (configurable)
- **Chat model**: glm-4.5-air (cost-effective, good quality for academic Q&A)
- **Temperature**: 0.3 (0.7 for brainstorm mode)
- **Max tokens**: 2048

### Cost Estimates (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| glm-4.5 | TBD | TBD |
| glm-4.5-air | TBD | TBD |
| gemini-2.5-pro | $1.25 | $10.00 |
| gemini-2.5-flash | $0.15 | $0.60 |

## Security Rules

1. **Server-side only**: All API calls made from Convex actions (Node.js environment) or server-side Next.js routes
2. **Encrypted at rest**: User API keys encrypted with AES-256-GCM before Convex storage
3. **Validated before storage**: Test API call confirms key validity before saving
4. **No client exposure**: API keys are NEVER included in client-side JavaScript bundles
5. **No localStorage**: API keys are never stored in browser storage
6. **Usage tracking**: All AI calls logged to `usageEvents` table with token counts and cost estimates
7. **Rate limiting**: Per-user request and token limits enforced
8. **Fallback**: Template responses when no provider is configured

## Implementation Plan

1. **Convex actions** for AI provider calls (z.ai, Gemini)
2. **Key management** via `aiProviderConnections` table with encrypted storage
3. **Usage logging** via `usageEvents` table
4. **Rate limiting** via Convex or middleware
5. **Prompt templates** for 7 production stages + academic integrity constraints
6. **Response processor** for citation parsing, validation, and labelling
