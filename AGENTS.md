<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Polis — Agent Instructions

## Project Overview

Polis is an AI-native module operating system for students. A student creates a workspace with just a module name, imports everything they already have for that module, and Polis turns messy files into an organized command center for coursework. Polis then stays with the student through every assessment — Plan / Write / Review — with embedded, source-backed AI, including powerful writing help. Read `docs/PRODUCT_VISION.md` for the full product thesis.

## Terminology

Internal data-model names are authoritative in code and schema. User-facing names differ:

| User-facing | Internal |
|-------------|----------|
| Workspace | Module |
| Assessment | Assignment |
| Source Base | The collection of sources in a module |
| Evidence Map | Arguments + evidence links |
| Plan | Understand → Map → Judge → Build stages |
| Write | Draft stage |
| Review | Refine stage |
| In-context Assistant | CoThinker |
| In-context Tools | Workbench actions |

CoThinker and Workbench are embedded capabilities, not standalone destinations.

## Current Status

Phase 4 (Convex + Clerk runtime rebuild) is the foundation. Phase 5 (AI-native module OS) is the active product direction: workspace-first flow, embedded AI, source-backed writing help. See `docs/CURRENT_ARCHITECTURE.md` for the authoritative state, `docs/MVP_SCOPE.md` for phase scope, and `docs/IMPLEMENTATION_CONTRACTS.md` for contracts.

## Tech Stack

- Next.js 16 App Router (TypeScript)
- React 19
- Tailwind CSS v4 (CSS-first config via `@theme` in globals.css — NO tailwind.config.js)
- Convex (backend: schema, queries, mutations, actions, storage)
- Clerk (authentication: sign-in, sign-up, JWT templates → Convex identity)
- lucide-react for icons

## Runtime AI Providers

- **Primary**: z.ai / GLM (ZhipuAI)
- **Secondary**: Google Gemini (free API key)
- **Dev tools only**: GPT Plus Codex, GitHub Copilot Student (not runtime providers)

## Commands

```bash
npm run dev            # Start dev server (Turbopack)
npm run dev:convex     # Start Convex dev server
npm run build          # Production build
npm run lint           # ESLint check
npm run convex:codegen # Generate Convex client bindings
```

## Architecture

- **Frontend**: Next.js App Router pages with React components. Data fetched via Convex hooks.
- **Backend**: Convex functions (`convex/`). Auth-gated via `getAuthIdentifier(ctx)` which calls `ctx.auth.getUserIdentity()`.
- **Auth**: Clerk handles sign-in/sign-up/session. `convex/auth.config.ts` validates Clerk JWTs. `ConvexProviderWithClerk` in `src/app/convex-provider.tsx`.
- **Database**: Convex (29 tables). Schema at `convex/schema.ts`. No Prisma, no PostgreSQL.
- **Storage**: Convex storage (`ctx.storage`). File upload via `generateUploadUrl` → client upload → `attachStorage`.
- **AI**: All AI calls will be Convex actions (Node.js runtime). Server-side only. No client-side API calls.

## Core Invariant

The module is the workspace. Assignments are assessment tracks inside the module. Assignments must consume live refined module context. Never separate module context from assignment context.

## Product Model

```
Module → Assignment → Argument → Draft
```

User-facing: **Workspace → Assessment → Evidence Map → Write/Review**.

## Production Workflow

Internal stage enum:

```
Ingest → Understand → Map → Judge → Build → Draft → Refine
```

User-facing flow:

```
Create workspace → Import → Classify → Extract → Dashboard → Plan → Write → Review
```

Mapping: Plan absorbs Understand/Map/Judge/Build; Write = Draft; Review = Refine.

## Coding Standards

- TypeScript strict mode
- Functional React components with named exports
- Tailwind CSS classes only (no CSS modules, no styled-components)
- No comments unless explicitly requested
- Clean imports: React hooks first, then libraries, then local modules
- Types in `src/lib/types.ts`; live app data comes from Convex functions
- Utility functions in `src/lib/utils.ts`
- Convex UI mappers in `src/lib/convex-ui-mappers.ts`
- Components in `src/components/` organised by feature
- Server components for data fetching, client components for interactivity
- All Convex queries/mutations must be auth-gated via `getAuthIdentifier(ctx)`
- Never accept `userId` as a function argument — derive from `ctx.auth.getUserIdentity()`

## Convex Conventions

- Read `convex/_generated/ai/guidelines.md` before writing Convex code.
- Use indexed queries with `withIndex()` — never `filter()`.
- Always use `.take(n)` or `.paginate()` — never unbounded `.collect()`.
- Actions that need Node.js must have `"use node"` and be in separate files from queries/mutations.
- No `ctx.db` inside actions — use `ctx.runQuery` and `ctx.runMutation`.
- Never store unbounded arrays — use separate tables for child collections.
- Index names must include all indexed fields: `by_tokenIdentifier_and_module`.

## Product Principles

1. Source-grounded: Every AI claim that says it is source-backed must trace to an uploaded source
2. Academic integrity through source-truth and labelling, not through refusing to write
3. Workflow-driven: Design around real student workflows (workspace → import → dashboard → plan/write/review), not generic AI chat
4. Clear labelling: Distinguish source-supported claims from interpretation, general context, and unsupported
5. Warn, don't hide: Flag insufficient evidence with soft warnings; never fabricate support
6. Hard only on validation truth: Fake citations/page numbers/misattribution are never treated as valid
7. Embedded, not standalone: CoThinker and Workbench live inside the workspace and assessment, not as destinations
8. Powerful writing help: Drafting, paraphrasing, critique, restructuring, and revision are permitted and supported
9. Student responsibility is explicit: The student owns the submission

## Academic Integrity Rules

- NEVER generate fake citations, authors, page numbers, source claims, or catalog records
- NEVER present invented text as a direct quote from a source
- NEVER label text `source_supported` unless it traces to a real retrieved chunk
- ALWAYS label AI outputs clearly (source-supported, interpretation, general, unsupported)
- ALWAYS warn (soft) when evidence is insufficient — do not hard-block except for validation truth
- ALWAYS make student responsibility explicit
- NEVER store API keys in client-side code
- NEVER claim incomplete features are production-ready
- Writing help (drafting, paraphrasing, critique, restructuring, revision) is permitted in Plan / Write / Review
- Default citation style: Harvard `(Author, Year, p. X)`

## What Not To Do

- Do not implement AI API calls outside Convex actions
- Do not store API keys in localStorage, cookies, or client state
- Do not create fake citations that look real without marking them as mock/demo
- Do not build payments or collaboration features yet
- Do not use real API keys without encryption
- Do not reference Prisma, PostgreSQL, Auth.js, pgvector, or `src/lib/services/` as if they are active
- Do not reference OpenAI or Anthropic as runtime providers
- Do not label AI text `source_supported` unless it traces to a real retrieved chunk
- Do not hard-block users on insufficient evidence — warn instead (except for validation truth)
- Do not treat CoThinker or Workbench as standalone destinations; they are embedded capabilities

## How to Update Docs

When making significant changes, update the relevant docs:
- New features → update `docs/ROADMAP.md` and `docs/MVP_SCOPE.md`
- Data model changes → update `docs/DATA_MODEL.md` and `convex/schema.ts`
- Architecture changes → update `docs/CURRENT_ARCHITECTURE.md`, `docs/RAG_ARCHITECTURE.md`, or `docs/AI_PROVIDER_STRATEGY.md`
- UX changes → update `docs/UX_FLOW.md`
- Implementation contracts → update `docs/IMPLEMENTATION_CONTRACTS.md`

## File Structure

```
convex/
  _generated/            # Auto-generated Convex bindings
  lib/
    auth.ts              # getAuthIdentifier helper
    retrieval.ts         # Shared retrieval utilities
    integrity.ts         # Academic integrity helpers
    citation.ts          # Citation format helpers
  ingestion/
    process.ts           # File extraction (PDF/DOCX)
    lib.ts               # Text chunking
  schema.ts              # Convex schema (29 tables)
  auth.config.ts         # Clerk JWT validation config
  modules.ts             # Module CRUD + workspace bundle
  folders.ts             # Folder CRUD
  sources.ts             # Source CRUD + storage + analyses + chunks
  notes.ts               # Source note CRUD
  assignments.ts         # Assignment CRUD + source links + workspace bundle
  arguments.ts           # Argument + argument node CRUD
  evidence.ts            # Evidence link CRUD
  drafts.ts              # Draft + draft block CRUD
  reviews.ts             # Review run + finding CRUD + runReview AI action
  cothinker.ts           # CoThinker session + message + intervention CRUD
  cothinker_ask.ts       # CoThinker AI runtime with retrieval
  files.ts               # Upload URL generation
  ai.ts                  # AI chat action (z.ai/Gemini)
  ai_keys.ts             # API key storage + encryption + resolution
  ai_providers.ts        # Provider selection and configuration
  ai_prompts.ts          # System prompt templates
  ai_crypto.ts           # Encryption/decryption for API keys
  ai_zai.ts              # z.ai/GLM provider action
  ai_gemini.ts           # Google Gemini provider action
  rateLimits.ts          # Rate limiting via usage tracking
  observability.ts       # Error tracking and logging
  cleanup.ts             # Cascade delete actions
  retrieval.ts           # Keyword search across source chunks
  citation.ts            # Citation CRUD
  citationSafety.ts      # Citation integrity checks
  sourceAnalyses.ts      # Source analysis CRUD
  sourceAnalysisAI.ts    # AI-powered source analysis
  judgements.ts          # Judgement CRUD (manual)
  usage.ts               # Usage event query
  users.ts               # User profile CRUD

src/
  app/                    # Next.js App Router pages
    layout.tsx            # Root layout with Clerk + Convex providers
    convex-provider.tsx   # ConvexProviderWithClerk
    page.tsx              # Landing page
    sign-in/              # Clerk sign-in
    sign-up/              # Clerk sign-up
    dashboard/            # Dashboard (Convex-backed)
    modules/[moduleId]/   # Module workspace (Convex-backed)
    modules/[moduleId]/assignments/[assignmentId]/  # Assignment workspace
    sources/              # Source library (Convex-backed)
    sources/[sourceId]/   # Source viewer (Convex-backed)
    assistant/            # Placeholder
    essays/[essayId]/     # Redirect → assignment workspace
    tools/                # Placeholder
    settings/             # Placeholder
  components/             # React components by feature
  lib/
    types.ts              # TypeScript type definitions
    utils.ts              # Utility functions
    convex-ui-mappers.ts  # Maps Convex docs → UI types

docs/                     # Product documentation
  CURRENT_ARCHITECTURE.md  # Authoritative architecture state
  IMPLEMENTATION_CONTRACTS.md  # Contracts for all implementation agents
  DATA_MODEL.md           # Convex data model reference
  RAG_ARCHITECTURE.md     # RAG pipeline design
  AI_PROVIDER_STRATEGY.md # Provider strategy (z.ai, Gemini)
  PRODUCT_VISION.md       # Product thesis
  MVP_SCOPE.md            # Phase definitions and scope
  ROADMAP.md              # Roadmap and progress
  UX_FLOW.md              # UX flow documentation
  ACADEMIC_INTEGRITY.md   # Integrity principles and rules
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
