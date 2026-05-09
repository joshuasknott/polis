<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Polis — Agent Instructions

## Project Overview

Polis is a coursework intelligence workspace for social science students. It helps students organise modules, understand readings, build evidence-based arguments, and review drafts using source-grounded AI. Read `docs/PRODUCT_VISION.md` for the full product thesis.

## Current Status

Phase 4: Production architecture and runtime rebuild. Convex + Clerk are the active backend. AI runtime (z.ai, Gemini), file extraction, embeddings, and RAG are being built as Convex actions. See `docs/CURRENT_ARCHITECTURE.md` for the authoritative state and `docs/IMPLEMENTATION_CONTRACTS.md` for contracts.

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
- **Database**: Convex (27 tables). Schema at `convex/schema.ts`. No Prisma, no PostgreSQL.
- **Storage**: Convex storage (`ctx.storage`). File upload via `generateUploadUrl` → client upload → `attachStorage`.
- **AI**: All AI calls will be Convex actions (Node.js runtime). Server-side only. No client-side API calls.

## Core Invariant

The module is the workspace. Assignments are focused production tracks inside the module. Assignments must consume live refined module context. Never separate module context from assignment context.

## Product Model

```
Module → Assignment → Argument → Draft
```

## Production Workflow

```
Ingest → Understand → Map → Judge → Build → Draft → Refine
```

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
- Default citation style: Harvard `(Author, Year, p. X)`

## What Not To Do

- Do not implement AI API calls outside Convex actions
- Do not store API keys in localStorage, cookies, or client state
- Do not create fake citations that look real without marking them as mock/demo
- Do not build payments or collaboration features yet
- Do not use real API keys without encryption
- Do not reference Prisma, PostgreSQL, Auth.js, pgvector, or `src/lib/services/` as if they are active
- Do not reference OpenAI or Anthropic as runtime providers

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
  schema.ts              # Convex schema (27 tables)
  auth.config.ts         # Clerk JWT validation config
  modules.ts             # Module CRUD + workspace bundle
  folders.ts             # Folder CRUD
  sources.ts             # Source CRUD + storage + analyses + chunks
  notes.ts               # Source note CRUD
  assignments.ts         # Assignment CRUD + source links + workspace bundle
  arguments.ts           # Argument + argument node CRUD
  evidence.ts            # Evidence link CRUD
  drafts.ts              # Draft + draft block CRUD
  reviews.ts             # Review run + finding CRUD
  cothinker.ts           # CoThinker session + message + intervention CRUD
  files.ts               # Upload URL generation
  ai.ts                  # Placeholder (AI provider actions planned)
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
