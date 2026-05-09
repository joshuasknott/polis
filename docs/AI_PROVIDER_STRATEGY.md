# Polis — AI Provider Strategy

## Overview

Polis supports runtime AI providers with a BYO (Bring Your Own) API key model and app-level fallback. The current implementation supports **z.ai / Zhipu GLM** (primary) and **Google Gemini** (secondary).

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

- NEVER generate fake citations, authors, or page numbers
- NEVER write content that could be submitted as a student's own work
- ALWAYS label outputs: [Source-supported], [Interpretation], [General]
- ALWAYS warn when evidence is insufficient
- Harvard referencing as default citation format
- [Source N] notation for in-text source citations

### Stage-Aware Prompts

| Stage | Purpose |
|-------|---------|
| ingest | Understand uploaded sources |
| understand | Deep comprehension of source material |
| map | Argument identification and structuring |
| judge | Critical evaluation of arguments |
| build | Argument construction guidance |
| draft | Draft review and feedback |
| refine | Writing refinement suggestions |

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

## Limitations

- No embedding support yet (future: will require a dedicated embedding provider)
- No streaming responses yet
- No rate limiting on the Convex side (relies on provider limits)
- No conversation memory management in the AI action (handled at the cothinker layer)
- z.ai JWT token generation not implemented (uses direct API key auth)
