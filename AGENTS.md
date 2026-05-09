<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Polis — Agent Instructions

## Project Overview

Polis is a coursework intelligence workspace for social science students. It helps students organise modules, understand readings, build evidence-based arguments, and review drafts using source-grounded AI. Read `docs/PRODUCT_VISION.md` for the full product thesis.

## Current Status

Phase 3: Production platform with per-user AI keys, OAuth, background processing, cloud storage, usage analytics, rate limiting, draft editor, source notes, mobile-responsive design, Google Gemini provider, and pgvector indexing. See `docs/PHASE_3_IMPLEMENTATION.md` for details.

## Tech Stack

- Next.js 16 App Router (TypeScript)
- React 19
- Tailwind CSS v4 (CSS-first config via `@theme` in globals.css — NO tailwind.config.js)
- PostgreSQL + Prisma 7 (with @prisma/adapter-pg)
- Auth.js v5 (credentials + OAuth, JWT sessions)
- lucide-react for icons
- pdf-parse and mammoth for text extraction
- @google/generative-ai for Google Gemini
- @aws-sdk/client-s3 for S3-compatible storage

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Prisma generate + production build (run before considering work done)
npm run lint         # ESLint check
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create and apply migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Prisma Studio GUI
```

## Architecture

- **Pages**: Server components that fetch data via service layer, pass to client components
- **Service Layer**: `src/lib/services/` — data-service, extraction-service, chunking-service, retrieval-service, upload-service, storage-service, apikey-service, usage-service, rate-limit-service
- **API Routes**: `src/app/api/` — upload, assistant, essays, auth, settings (api-keys, profile, usage), sources, notes, tools
- **Auth**: Auth.js v5 with credentials + OAuth (GitHub, Google), JWT sessions, middleware protection
- **Database**: Prisma 7 with PostgreSQL via adapter-pg, schema at `prisma/schema.prisma`
- **Mock Data**: Preserved at `src/lib/data/mock-data.ts` for reference; real data via DB

## Coding Standards

- TypeScript strict mode
- Functional React components with named exports
- Tailwind CSS classes only (no CSS modules, no styled-components)
- No comments unless explicitly requested
- Clean imports: React hooks first, then libraries, then local modules
- Types in `src/lib/types.ts`, mock data in `src/lib/data/mock-data.ts`
- Utility functions in `src/lib/utils.ts`
- Database services in `src/lib/services/`
- Components in `src/components/` organised by feature
- Server components for data fetching, client components for interactivity
- All database queries must be scoped to the current user

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

- Do not implement AI API calls without server-side routes
- Do not store API keys in localStorage, cookies, or client state
- Do not create fake citations that look real without marking them as mock/demo
- Do not build payments or collaboration features yet
- Do not use real API keys without encryption

## How to Update Docs

When making significant changes, update the relevant docs:
- New features → update `docs/ROADMAP.md` and `docs/MVP_SCOPE.md`
- Data model changes → update `docs/DATA_MODEL.md`, `prisma/schema.prisma`, and `src/lib/types.ts`
- Architecture changes → update `docs/RAG_ARCHITECTURE.md` or `docs/AI_PROVIDER_STRATEGY.md`
- UX changes → update `docs/UX_FLOW.md`
- Phase changes → update `docs/PHASE_1_IMPLEMENTATION.md`

## File Structure

```
src/
  app/                    # Next.js App Router pages
    api/                  # API routes
      assistant/          # Assistant endpoint
      auth/               # Auth.js routes
      essays/             # Essay CRUD
      sources/upload/     # File upload
    auth/signin/          # Sign-in page
    page.tsx              # Landing page
    dashboard/            # Dashboard
    modules/[moduleId]/   # Module workspace
    sources/              # Source library
    sources/[sourceId]/   # Source viewer
    tools/                # Academic tools
    essays/[essayId]/     # Essay workspace
    settings/             # Settings
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
    crypto.ts             # AES-256-GCM encryption for API keys
    db.ts                 # Prisma client singleton
    auth.ts               # Auth.js configuration (credentials + OAuth)
    data/mock-data.ts     # Original mock data (preserved)
    ai/                   # AI provider stubs + grounded provider
      providers.ts        # Provider registry with user-level key resolution
      openai-provider.ts  # OpenAI SDK (chat + embeddings)
      anthropic-provider.ts # Anthropic SDK (chat)
      gemini-provider.ts  # Google Gemini SDK (chat)
      grounded-provider.ts # Template-based response generation (fallback)
      prompts.ts          # Prompt templates for 6 modes
      response-processor.ts # Citation parsing, validation, labelling
      tool-prompts.ts     # Prompts for citation check and draft review
    services/             # Service layer
      data-service.ts     # Data access (CRUD)
      extraction-service.ts # Text extraction
      chunking-service.ts   # Text chunking
      retrieval-service.ts  # Hybrid retrieval
      upload-service.ts     # Background file upload processing
      storage-service.ts    # Cloud storage abstraction (local/S3)
      apikey-service.ts     # Encrypted API key management
      usage-service.ts      # Usage analytics and cost estimation
      rate-limit-service.ts # In-memory AI rate limiting
      embedding-service.ts  # Embedding generation and storage
    ingestion/            # File ingestion stubs
    retrieval/            # RAG stubs
  types/                  # Type declarations (next-auth)
prisma/
  schema.prisma           # Database schema
  seed.ts                 # Demo data seed
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
