# Phase 3: Production Platform Features

**Status**: Implemented
**Date**: April 2026
**Build**: Clean (0 errors, 9 pre-existing warnings)
**Lint**: Clean (0 errors)

## Overview

Phase 3 upgrades Polis from a single-user intelligence workspace to a production-ready platform with per-user AI configuration, background processing, cloud file storage, OAuth authentication, usage analytics, and enhanced academic workflows.

## What Was Built

### Priority A: Per-User BYO API Key Management ✅
- AES-256-GCM encryption for API keys at rest (`src/lib/crypto.ts`)
- Per-user API key storage with model preference per provider
- Key validation on save (test API call before storing)
- Provider resolution: user key > app-level env var > template fallback
- Settings UI with connect/disconnect per provider
- API routes: `GET/POST/DELETE /api/settings/api-keys`

**Files**: `src/lib/crypto.ts`, `src/lib/services/apikey-service.ts`, `src/app/api/settings/api-keys/route.ts`, `src/lib/ai/providers.ts` (updated), `src/components/settings/settings-content.tsx` (updated)

### Priority B: OAuth Providers (GitHub, Google) ✅
- Auth.js v5 configured with GitHub and Google OAuth providers
- Conditional provider loading (only if env vars are set)
- Account linking: OAuth sign-in with existing email links to existing account
- New user creation on first OAuth sign-in
- Sign-in page updated with OAuth buttons and divider
- Connected accounts section in settings

**Files**: `src/lib/auth.ts` (updated), `src/app/auth/signin/page.tsx` (updated), `src/components/settings/settings-content.tsx` (updated)

### Priority C: Profile Editing and User Settings ✅
- Editable profile fields: name, university, course, year of study
- Password change for credentials users (current + new + confirm)
- User preferences: default AI mode, citation style (Harvard/APA/Chicago/MLA)
- Preferences stored in `User.preferences` JSON field
- API routes: `GET/PUT /api/settings/profile`

**Files**: `src/app/api/settings/profile/route.ts`, `src/components/settings/settings-content.tsx` (updated), `src/app/settings/page.tsx` (updated)

### Priority D: Background File Processing ✅
- Upload returns immediately with `sourceId` and status "processing"
- Background processing: extract → chunk → embed → AI analyse
- Processing status tracked via `Source.processingStatus` field
- Status transitions: extracting → chunking → analysing → ready (or error)
- Status polling API: `GET /api/sources/[sourceId]/status`

**Files**: `src/lib/services/upload-service.ts` (rewritten), `src/app/api/sources/[sourceId]/status/route.ts`

### Priority E: Cloud File Storage ✅
- Storage abstraction at `src/lib/services/storage-service.ts`
- Supports: local filesystem (default), S3-compatible (AWS, Supabase)
- Selected via `STORAGE_PROVIDER` env var (`local` or `s3`)
- S3 configuration via standard env vars
- Dynamic imports for S3 SDK (no bundle cost if using local)

**Files**: `src/lib/services/storage-service.ts`

### Priority F: Usage Analytics Dashboard ✅
- `UsageLog` model tracks: provider, model, type, tokens in/out, cost estimate
- Per-model pricing tables for cost estimation
- Usage analytics API: `GET /api/settings/usage`
- Usage dashboard at `/settings/usage` with:
  - Monthly/all-time token counts and costs
  - Usage by model and type breakdown
  - Retrieval mode breakdown
  - Recent activity log
- Usage logging integrated into provider `chat()` function

**Files**: `src/lib/services/usage-service.ts`, `src/app/api/settings/usage/route.ts`, `src/app/settings/usage/page.tsx`, `src/components/settings/usage-content.tsx`

### Priority G: Rate Limiting on AI API Calls ✅
- In-memory rate limiter with configurable limits
- Default: 50 requests/hour, 500,000 tokens/day
- Configurable via `AI_RATE_LIMIT_REQUESTS` and `AI_RATE_LIMIT_TOKENS` env vars
- Returns 429 with retry info when exceeded
- Rate limit status included in assistant API responses
- Auto-cleanup of stale entries

**Files**: `src/lib/services/rate-limit-service.ts`, `src/app/api/assistant/route.ts` (updated)

### Priority H: Enhanced Essay Workspace (Inline Draft Editing) ✅
- New "Draft" tab in essay workspace
- Textarea-based draft editor with word count display
- Manual save button for draft persistence
- "Run Citation Check" and "Run Draft Review" buttons inline
- Essay question and thesis shown for reference
- Academic integrity notice (AI only analyses, never generates text)
- `draftContent` field on Essay model
- API route: `POST /api/essays` with action `updateDraft`

**Files**: `src/components/essays/essay-workspace-content.tsx` (rewritten), `src/app/api/essays/route.ts` (updated), `src/app/essays/[essayId]/page.tsx` (updated)

### Priority I: Source Notes ✅
- `SourceNote` model: per-user notes on sources with optional tags
- API routes: `GET/POST /api/sources/[sourceId]/notes`, `PUT/DELETE /api/notes/[noteId]`
- Notes section in source viewer with add/delete UI
- Notes scoped to the user

**Files**: `src/app/api/sources/[sourceId]/notes/route.ts`, `src/app/api/notes/[noteId]/route.ts`, `src/components/sources/source-viewer-content.tsx` (updated)

### Priority J: Mobile-Responsive Design Refinements ✅
- Fixed mobile nav bar with hamburger menu (replaces floating button)
- Sidebar slides in from left on mobile with backdrop overlay
- Proper spacing: `pt-20 lg:pt-6` for content below mobile nav
- All tab bars use `overflow-x-auto` and `whitespace-nowrap`
- Responsive grid adjustments across components

**Files**: `src/components/layout/shell.tsx` (updated), `src/components/layout/sidebar.tsx` (updated), `src/components/layout/topbar.tsx` (updated)

### Priority K: pgvector Index and Google Gemini Provider ✅
- HNSW index SQL script at `scripts/create-vector-index.sql`
- Google Gemini provider with `@google/generative-ai` SDK
- Supports `gemini-2.5-pro` and `gemini-2.5-flash` models
- Dynamic import pattern (only loaded when needed)
- Registered in provider registry with `geminiChat` function

**Files**: `src/lib/ai/gemini-provider.ts`, `scripts/create-vector-index.sql`, `src/lib/ai/providers.ts` (updated)

### Priority L: Real-Time Processing Status ✅
- `processingStatus` field on Source model tracks each stage
- Status polling via `GET /api/sources/[sourceId]/status`
- Polling approach chosen (simpler than SSE, works on all hosting)
- Status values: extracting, chunking, analysing, ready, error

**Files**: `src/app/api/sources/[sourceId]/status/route.ts`, `src/lib/services/upload-service.ts` (updated)

## Database Schema Changes

### New Models
- **UsageLog**: `id, userId, provider, model, type, tokensIn, tokensOut, costEstimate, createdAt`
- **SourceNote**: `id, userId, sourceId, content, tags, createdAt, updatedAt`

### Modified Models
- **User**: Added `preferences Json @default("{}")`, relations to `usageLogs`, `sourceNotes`
- **Source**: Added `processingStatus String?`, relation to `notes`
- **Essay**: Added `draftContent String?`
- **AIProviderConnection**: Added `modelPreference String?`, unique constraint on `[userId, provider]`

## New Environment Variables

```
# Google Gemini
GOOGLE_AI_API_KEY=""

# Storage
STORAGE_PROVIDER="local"
S3_BUCKET="polis"
S3_REGION="us-east-1"
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
S3_ENDPOINT=""

# Rate Limiting
AI_RATE_LIMIT_REQUESTS=50
AI_RATE_LIMIT_TOKENS=500000
```

## New API Routes

- `GET/POST/DELETE /api/settings/api-keys` — BYO API key management
- `GET/PUT /api/settings/profile` — Profile and preferences
- `GET /api/settings/usage` — Usage analytics
- `GET /api/sources/[sourceId]/status` — Processing status polling
- `GET/POST /api/sources/[sourceId]/notes` — Source notes CRUD
- `PUT/DELETE /api/notes/[noteId]` — Individual note operations
- `POST /api/essays` (action: updateDraft) — Save draft content

## New Pages

- `/settings/usage` — Usage analytics dashboard

## Files Created

- `src/lib/crypto.ts` — AES-256-GCM encryption
- `src/lib/ai/gemini-provider.ts` — Google Gemini provider
- `src/lib/services/apikey-service.ts` — API key CRUD
- `src/lib/services/storage-service.ts` — Storage abstraction
- `src/lib/services/usage-service.ts` — Usage tracking and analytics
- `src/lib/services/rate-limit-service.ts` — In-memory rate limiter
- `src/app/api/settings/api-keys/route.ts`
- `src/app/api/settings/profile/route.ts`
- `src/app/api/settings/usage/route.ts`
- `src/app/api/sources/[sourceId]/status/route.ts`
- `src/app/api/sources/[sourceId]/notes/route.ts`
- `src/app/api/notes/[noteId]/route.ts`
- `src/app/settings/usage/page.tsx`
- `src/components/settings/usage-content.tsx`
- `scripts/create-vector-index.sql`

## Files Modified

- `prisma/schema.prisma` — New models, new fields
- `src/lib/auth.ts` — OAuth providers, account linking
- `src/lib/ai/providers.ts` — User-level key resolution, usage logging, Gemini
- `src/lib/services/upload-service.ts` — Background processing, status tracking
- `src/lib/services/data-service.ts` — updateEssay supports draftContent
- `src/app/api/assistant/route.ts` — Rate limiting, userId passthrough
- `src/app/api/essays/route.ts` — updateDraft action
- `src/app/auth/signin/page.tsx` — OAuth buttons
- `src/app/settings/page.tsx` — Full user data, connections
- `src/app/essays/[essayId]/page.tsx` — Pass draftContent
- `src/components/settings/settings-content.tsx` — Full rewrite with tabs
- `src/components/essays/essay-workspace-content.tsx` — Draft editor tab
- `src/components/sources/source-viewer-content.tsx` — Notes section
- `src/components/layout/shell.tsx` — Responsive layout
- `src/components/layout/sidebar.tsx` — Close handler for mobile
- `src/components/layout/topbar.tsx` — Mobile nav with fixed header
- `.env.example` — New environment variables

## Known Limitations

1. **Rate limiter is in-memory**: Resets on server restart. For production, consider Redis-backed rate limiting.
2. **S3 storage**: Requires `@aws-sdk/client-s3` (installed). File migration from local to S3 is manual.
3. **OAuth**: Requires GitHub/Google OAuth apps to be created and env vars configured.
4. **Usage analytics**: Cost estimates are approximate based on published pricing.
5. **Draft editor**: Uses textarea (not rich text). TipTap could be added in future.
6. **Processing status**: Uses polling (not SSE). Polling interval is client-controlled.

## Recommended Next Phase

- Rich text editor (TipTap) for draft editing
- Redis-backed rate limiting for production
- SSE for real-time processing updates
- File migration tool (local → S3)
- Email verification for new accounts
- Dark mode support
- Export functionality (PDF export of essays, source summaries)
- Collaborative features (shared modules)
- Admin dashboard for user management
