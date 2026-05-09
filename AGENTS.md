<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Polis — Agent Instructions

## Project Overview

Polis is a coursework intelligence workspace for social science students. It helps students organise modules, understand readings, build evidence-based arguments, and review drafts using source-grounded AI. Read `docs/PRODUCT_VISION.md` for the full product thesis.

## Current Status

**Active phase**: Product Model (Phase 4) — Module → Assignment → Argument → Draft with the 7-stage production workflow.

The Convex/Clerk foundation is in place. Clerk handles authentication; Convex is the backend database and function layer. Runtime AI (z.ai/GLM, Gemini), file upload, extraction, retrieval, and embeddings are **paused** and will be rebuilt on the Convex backend after the data/auth foundation is stable. Do not treat pre-Convex implementation docs (Phase 1–3) as describing the current runtime.

### What Is Live

- Convex schema and functions for all product entities
- Clerk authentication with JWT flow to Convex
- Dashboard, modules, sources, source viewer, notes — all read/write through Convex
- Assignment, argument, evidence, draft, review, judgement, and CoThinker Convex functions
- Settings page (profile, AI keys, academic integrity, feature status)
- File upload URL generation via Convex storage

### What Is Paused

- Runtime AI provider calls (z.ai/GLM and Gemini not yet wired)
- File text extraction (PDF, DOCX parsing)
- Text chunking and embedding generation
- Hybrid retrieval pipeline
- LLM-powered CoThinker responses
- Source analysis auto-generation
- Citation safety check and draft review tool endpoints
- Background processing and processing status
- Usage analytics dashboard (schema exists, UI placeholder only)

## Tech Stack

- **Next.js 16** App Router (TypeScript)
- **React 19**
- **Tailwind CSS v4** (CSS-first config via `@theme` in globals.css — NO tailwind.config.js)
- **Convex** (backend database, functions, storage)
- **Clerk** (authentication and user identity, JWT sessions)
- **lucide-react** for icons
- **z.ai/GLM** (planned AI provider)
- **Google Gemini** (planned AI provider)

### Do Not Reference

These are from a pre-Convex migration and do **not** describe the current system:
- PostgreSQL, Prisma, @prisma/adapter-pg, pgvector
- Auth.js / next-auth
- src/lib/services/* (extraction-service, chunking-service, retrieval-service, etc.)
- src/lib/ai/* (openai-provider, anthropic-provider, gemini-provider, etc.)
- src/lib/auth.ts, src/lib/db.ts, src/lib/crypto.ts
- prisma/schema.prisma, prisma/seed.ts
- src/types/next-auth.d.ts
- src/app/api/* routes

## Commands

```bash
npm run dev            # Start dev server (Turbopack)
npm run dev:convex     # Start Convex dev server
npm run build          # Production build
npm run start          # Production server
npm run lint           # ESLint check
npm run convex:codegen # Generate Convex client bindings
```

There are no `db:*` commands. There is no Prisma. The database is Convex.

## Architecture

- **Pages**: Next.js App Router pages, primarily client components that read/write through Convex hooks
- **Auth**: Clerk handles sign-in, sign-up, session management. `src/middleware.ts` is not present — Clerk middleware protects routes. Identity flows to Convex through JWT templates via `ConvexProviderWithClerk`.
- **Database**: Convex, schema at `convex/schema.ts`, auth config at `convex/auth.config.ts`
- **Data access**: Convex queries and mutations in `convex/*.ts`, consumed via `useQuery`/`useMutation` React hooks
- **File storage**: Convex storage (`ctx.storage.generateUploadUrl()` in `convex/files.ts`)
- **UI mapping**: `src/lib/convex-ui-mappers.ts` converts Convex documents to UI types

## Coding Standards

- TypeScript strict mode
- Functional React components with named exports
- Tailwind CSS classes only (no CSS modules, no styled-components)
- No comments unless explicitly requested
- Clean imports: React hooks first, then libraries, then local modules
- Types in `src/lib/types.ts`
- Utility functions in `src/lib/utils.ts`
- Convex UI mappers in `src/lib/convex-ui-mappers.ts`
- Components in `src/components/` organised by feature
- All Convex queries and mutations must be scoped to the authenticated user via `getAuthIdentifier(ctx)` from `convex/lib/auth.ts`

## Product Principles

1. Source-grounded: Every AI claim should trace back to uploaded sources
2. Academic integrity first: No cheating features, no essay generation
3. Workflow-driven: Design around real student workflows, not generic AI chat
4. Clear labelling: Distinguish source-supported claims from interpretation
5. Warn, don't hide: Flag insufficient evidence, don't fabricate support

## Academic Integrity Rules

- NEVER generate fake citations, authors, or page numbers
- NEVER write content that could be submitted as a student's own work
- ALWAYS label AI outputs clearly (source-supported, interpretation, general)
- ALWAYS warn when evidence is insufficient
- NEVER store API keys in client-side code
- NEVER claim incomplete features are production-ready

## What Not To Do

- Do not reference or resurrect Prisma, PostgreSQL, Auth.js, or next-auth patterns
- Do not reference `src/lib/services/`, `src/lib/ai/`, `src/lib/auth.ts`, or `src/lib/db.ts` — these do not exist
- Do not reference `src/app/api/` routes — API routes are not the backend; Convex functions are
- Do not store API keys in localStorage, cookies, or client state
- Do not create fake citations that look real without marking them as mock/demo
- Do not build payments or collaboration features yet
- Do not implement AI API calls without Convex actions or server-side routes
- Do not use real API keys without encryption

## How to Update Docs

When making significant changes, update the relevant docs:
- New features → update `docs/ROADMAP.md` and `docs/MVP_SCOPE.md`
- Data model changes → update `docs/DATA_MODEL.md`, `convex/schema.ts`, and `src/lib/types.ts`
- Architecture changes → update `docs/RAG_ARCHITECTURE.md` or `docs/AI_PROVIDER_STRATEGY.md`
- UX changes → update `docs/UX_FLOW.md`

## File Structure

```
src/
  app/                    # Next.js App Router pages
    layout.tsx            # Root layout: ClerkProvider → ConvexClientProvider
    convex-provider.tsx   # ConvexProviderWithClerk wiring
    page.tsx              # Landing page (public)
    sign-in/[[...sign-in]]/  # Clerk sign-in page
    sign-up/[[...sign-up]]/  # Clerk sign-up page
    dashboard/            # Dashboard (Convex modules)
    modules/[moduleId]/   # Module workspace (Convex)
    sources/              # Source library (Convex)
    sources/[sourceId]/   # Source viewer (Convex)
    assistant/            # Assistant placeholder
    essays/[essayId]/     # Essay workspace placeholder
    tools/                # Academic tools placeholder
    settings/             # Settings (profile, AI keys, features)
  components/
    layout/               # Shell, sidebar, topbar
    dashboard/            # Dashboard components
    modules/              # Module workspace components
    sources/              # Source components
    assistant/            # AI assistant components
    essays/               # Essay workspace components
    tools/                # Tool cards
    settings/             # Settings components
  lib/
    types.ts              # TypeScript type definitions
    utils.ts              # Utility functions
    convex-ui-mappers.ts  # Convex document → UI type mappers
convex/
  auth.config.ts          # Convex auth config (Clerk JWT validation)
  schema.ts               # Convex schema (all tables)
  users.ts                # User profile queries/mutations
  modules.ts              # Module CRUD
  folders.ts              # Folder CRUD
  sources.ts              # Source CRUD
  sourceChunks placeholder
  notes.ts                # Source notes CRUD
  assignments.ts          # Assignment CRUD
  arguments.ts            # Argument CRUD
  evidence.ts             # Evidence link CRUD
  drafts.ts               # Draft CRUD
  reviews.ts              # Review runs and findings
  cothinker.ts            # CoThinker session/message CRUD
  ai.ts                   # AI provider placeholder
  files.ts                # Convex storage upload URL
  usage.ts                # Usage event queries
  lib/
    auth.ts               # getAuthIdentifier helper
docs/                     # Product documentation
```

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
