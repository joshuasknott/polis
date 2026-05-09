# Phase 3 Implementation — Polis Production Platform (Historical)

> **Archived**: This document describes the pre-Convex production platform using Auth.js OAuth, Prisma, S3 storage, and per-user encrypted keys. The active backend is Convex + Clerk. Do not use these patterns for current development.

## What Was Built

### Per-User BYO API Key Management
- AES-256-GCM encryption for API keys at rest
- Per-user key storage with model preference per provider
- Key validation on save

### OAuth Providers (GitHub, Google)
- Auth.js v5 with GitHub and Google OAuth
- Account linking on email match

### Profile Editing and User Settings
- Editable profile fields
- User preferences (AI mode, citation style)

### Background File Processing
- Async upload with processing status polling
- Background: extract → chunk → embed → analyse

### Cloud File Storage
- Local filesystem + S3-compatible storage abstraction

### Usage Analytics
- UsageLog model with token counts and cost estimates
- Usage dashboard at `/settings/usage`

### Rate Limiting
- In-memory rate limiter (50 req/hr, 500K tokens/day)

### Enhanced Features
- Draft editor in assignment workspace
- Source notes
- Mobile-responsive design
- Google Gemini provider
- pgvector HNSW index

## What Carried Forward

The following concepts survive in the Convex implementation:
- BYO API key concept → `aiProviderConnections` table
- Usage tracking → `usageEvents` table
- Processing job tracking → `processingJobs` table
- Source notes → `sourceNotes` table
- Draft/review model → `drafts`, `reviewRuns`, `reviewFindings` tables
- Settings UI structure → settings components (adapted for Clerk + Convex)

## What Did Not Carry Forward

- Prisma schema → replaced by `convex/schema.ts`
- Auth.js config → replaced by Clerk
- API routes → replaced by Convex functions/actions
- S3 storage abstraction → replaced by Convex storage
- OpenAI/Anthropic providers → will be replaced by z.ai/GLM and Gemini
- pgvector embeddings → will be rebuilt with Convex-compatible vector approach
- In-memory rate limiting → will use Convex-based rate limiting
