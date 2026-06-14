# Polis — AI Provider Strategy

**Last updated**: 2026-06-14

## Overview

Polis supports runtime AI providers with a BYO (Bring Your Own) API key model and app-level fallback. The current implementation supports **z.ai / Zhipu GLM** (primary) and **Google Gemini** (secondary).

Polis provides powerful writing help — drafting, paraphrasing, critique, restructuring, revision — bounded by source-truth and labelling. Writing that claims to be source-backed must be source-backed. Fabricated citations, page numbers, authors, or catalog records are hard errors (never produced, never treated as valid). Insufficient evidence produces soft warnings, not user-blocking gates.

## Provider Resolution Order

```
1. User BYO key for explicitly requested provider
2. User BYO key for their default provider
3. App-level env var (Convex environment variable)
4. Safe no-provider fallback (returns message, no AI call)
```

## Supported Providers

| Provider | Models | Primary? | Embeddings |
|----------|--------|----------|------------|
| z.ai / GLM | glm-4-plus, glm-4-air, glm-4-airx, glm-4-flash, glm-4-long | Yes | No |
| Google Gemini | gemini-2.5-pro, gemini-2.5-flash, gemini-2.0-flash | Secondary | No |

### Default Configuration

- **Provider**: z.ai (configurable via `AI_PROVIDER` Convex env var)
- **Chat model**: glm-4-air (cost-effective, good quality)
- **Temperature**: 0.3 (0.7 for brainstorm mode, stage-dependent)
- **Max tokens**: 2048

### Cost Estimates (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| glm-4-air | ~$0.10 | ~$0.10 |
| glm-4-plus | ~$1.50 | ~$1.50 |
| gemini-2.5-flash | $0.15 | $0.60 |
| gemini-2.5-pro | $1.25 | $10.00 |

## Architecture

```
User Query → Provider Resolution → Key Decryption → Prompt Construction → Provider Call → Response Processing → Usage Logging → UI Display
```

### Convex Backend Files

- `convex/ai.ts` — Main AI actions: `chat`, `validateAndSaveKey`, `removeProviderKey`, `getProviderStatus`, `listProviders`
- `convex/ai_keys.ts` — Key management: `listConnections` (public query) + internal mutations for encrypted key storage
- `convex/ai_providers.ts` — Provider types, model configs, provider registry
- `convex/ai_prompts.ts` — Academic integrity prompt templates, stage-aware prompt builder
- `convex/ai_crypto.ts` — AES-256-GCM encryption/decryption using Web Crypto API
- `convex/ai_zai.ts` — z.ai/Zhipu GLM REST provider
- `convex/ai_gemini.ts` — Google Gemini REST provider

### Key Storage

- User BYO API keys are encrypted with AES-256-GCM before storage
- The encryption key (`ENCRYPTION_KEY`) is a Convex environment variable
- Keys are stored in the `aiProviderConnections` table's `encryptedCredentialRef` field
- Keys are decrypted only at call time, never cached, never returned to the client
- Key validation runs a test API call before saving

### Provider Resolution (in `convex/ai.ts`)

1. If user is authenticated and has an `ENCRYPTION_KEY` configured:
   - Look up `aiProviderConnections` for the requested provider
   - Decrypt and use the BYO key
2. Fall back to app-level Convex env var (`ZAI_API_KEY` or `GEMINI_API_KEY`)
3. If neither is available, return a safe no-provider message

## BYO API Key Management

### User Flow

1. User navigates to Settings → AI Keys tab
2. Enters API key and optional model preference
3. Clicks "Save & Validate"
4. Convex action validates the key with a test API call
5. If valid, key is encrypted and stored in `aiProviderConnections`
6. Status shown as "Connected" with model preference
7. User can remove the key at any time

### Security Rules

1. **Server-side only**: All API calls happen in Convex actions (server-side)
2. **Encrypted at rest**: User API keys encrypted with AES-256-GCM
3. **Validated before storage**: Test API call confirms key validity
4. **No client exposure**: API keys are NEVER included in client bundles
5. **No localStorage**: API keys are never stored in browser storage
6. **Usage tracking**: All AI calls logged with token counts
7. **Safe error handling**: Provider errors sanitized before reaching client
8. **Fallback**: Clear message when no provider is configured

## Prompt Foundation

### Academic Integrity (always included)

- NEVER fabricate citations, authors, page numbers, source claims, or catalog records
- Source-backed claims must trace to a real retrieved chunk; otherwise relabel as `interpretation`, `general_context`, or `unsupported`
- ALWAYS label outputs: `[Source-supported]`, `[Interpretation]`, `[General]`, `[Unsupported]`
- ALWAYS warn (soft) when evidence is insufficient — never block the user except via validation truth
- Harvard referencing as default citation format
- `[Source N]` notation for in-text source citations
- Writing help is permitted: drafting, paraphrasing, critique, restructuring, and revision are allowed in Plan / Write / Review
- Student responsibility for the submitted work is explicit

### Stage-Aware Prompts

The internal stage enum drives prompt selection. User-facing phases map onto it.

| Internal stage | User-facing phase | Purpose |
|----------------|-------------------|---------|
| ingest | Workspace setup | Understand imported sources; classify; extract assessments |
| understand | Plan | Deep comprehension of source material |
| map | Plan | Argument identification and structuring; Evidence Map |
| judge | Plan | Critical evaluation of arguments; gap and counterargument checks |
| build | Plan | Argument construction guidance; outline and evidence allocation |
| draft | Write | Drafting, paraphrasing, restructuring, citation insertion; critique |
| refine | Review | Revision suggestions; rubric alignment; citation safety |

In **Write** and **Review**, prompts explicitly permit drafting, paraphrasing, restructuring, and revision while enforcing source-truth for any `source_supported` claim.

## Environment Variables (Convex)

Set via `npx convex env set` or the Convex dashboard:

| Variable | Required | Description |
|----------|----------|-------------|
| `ZAI_API_KEY` | Optional | App-level z.ai API key |
| `GEMINI_API_KEY` | Optional | App-level Gemini API key |
| `AI_PROVIDER` | Optional | Default provider: "zai" or "gemini" |
| `AI_MODEL` | Optional | Override default model |
| `ZAI_API_ENDPOINT` | Optional | Override z.ai endpoint URL |
| `ENCRYPTION_KEY` | For BYO keys | Encryption key for user API keys |

## Settings UI

- **AI Keys tab**: z.ai and Gemini provider cards with save/validate/remove
- **AI Layer tab**: Provider status, model info, usage analytics link
- **Features tab**: Feature status grid (updates based on provider availability)
- All provider data fetched live via Convex subscriptions
- No secrets ever reach the client

## Convex Usage Analytics & Rate Limiting

### Usage Events (`convex/usage.ts`)

All AI interactions are tracked via `usageEvents` table. Event types: `chat`, `embedding`, `retrieval`, `source_analysis`, `draft_review`, `citation_check`, `ingestion`.

**Writes**: `usage.recordEvent` (public mutation), `usage.recordEventInternal` (internal mutation for server-side use).

**Queries**: `usage.getDashboardStats` (single aggregated query for the Usage UI), `usage.getStatsAllTime`, `usage.getStatsThisMonth`, `usage.getStatsByType`, `usage.getStatsByModel`, `usage.getStatsByProvider`, `usage.getRetrievalBreakdown`, `usage.getRecentEvents`.

### Rate Limiting (`convex/rateLimits.ts`)

Server-side per-user rate limiting is enforced in Convex, not client-side.

- **Window**: 60-second sliding window per provider.
- **Default**: 30 requests/min, 100k tokens/min.
- **Provider overrides**: z.ai (30/120k), Gemini (30/120k).
- **Check**: `rateLimits.checkRateLimit` mutation atomically increments counters and returns `allowed`/`denied` with reset time.
- **Status**: `rateLimits.getRateLimitStatus` query returns remaining limits for UI display.
- **Cleanup**: `rateLimits.cleanupOldWindows` internal mutation removes stale window documents.

### Observability (`convex/observability.ts`)

Error tracking and processing job monitoring.

- **Error writes**: `observability.recordError` (public), `observability.recordErrorInternal` (internal).
- **Error queries**: `observability.listRecentErrors`, `observability.getErrorCounts` (24h aggregated by source/type).
- **Processing status**: `observability.getProcessingStatus` (24h job summary with pending/failed counts).

### Database Tables

- `usageEvents` — indexed by `tokenIdentifier`, `type`, `tokenIdentifier_and_createdAt`, `tokenIdentifier_and_type`, `tokenIdentifier_and_provider`, `tokenIdentifier_and_model`.
- `rateLimits` — indexed by `tokenIdentifier`, `tokenIdentifier_and_provider`.
- `errorEvents` — indexed by `tokenIdentifier`, `source`.

## Limitations

- No embedding support yet (future: will require a dedicated embedding provider)
- No streaming responses yet
- No conversation memory management in the AI action (handled at the cothinker layer)
- z.ai JWT token generation not implemented (uses direct API key auth)
