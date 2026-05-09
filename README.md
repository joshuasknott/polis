# Polis

Coursework intelligence workspace for social science students.

## What It Is

Polis helps Politics, IR, Sociology, and other social science students organise module materials, understand readings, build evidence-based arguments, and review drafts — all using source-grounded AI that preserves citation integrity.

## Tech Stack

- **Next.js 16** App Router with TypeScript
- **React 19**
- **Tailwind CSS v4** (CSS-first configuration)
- **Convex** (backend database, functions, and file storage)
- **Clerk** (authentication and user identity)
- **lucide-react** for icons
- **z.ai/GLM** (planned AI provider)
- **Google Gemini** (planned AI provider)

## Getting Started

### Prerequisites

- Node.js 22+
- A [Clerk](https://clerk.com) account and application
- A [Convex](https://convex.dev) account and project
- (Planned) A z.ai API key for AI features
- (Planned) A Google Gemini API key for AI features

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and configure
cp .env.example .env.local
# Fill in Clerk keys, Convex URL, and JWT issuer domain in .env.local

# 3. Configure Clerk JWT template
# In the Clerk dashboard, create a JWT template named "convex" with:
#   - Issuer: your CLERK_JWT_ISSUER_DOMAIN
#   - Audience: "convex"
#   - Claims: default (sub, name, email, picture) are sufficient

# 4. Configure Convex
npx convex dev

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CONVEX_DEPLOYMENT` | Yes | Set automatically by `npx convex dev` |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `CLERK_JWT_ISSUER_DOMAIN` | Yes | Clerk JWT issuer domain for Convex auth |
| `ENCRYPTION_SECRET` | Planned | For encrypting user AI API keys at rest |

## Current Status

- **Auth/user identity**: Clerk + Convex. Users sign in via Clerk; identity flows to Convex through JWT templates and `ctx.auth.getUserIdentity()`.
- **Product data**: Modules, assignments, sources, chunks, notes, drafts, evidence, and CoThinker session metadata are wired to Convex. Legacy runtime mock data has been removed.
- **Source viewer**: Reads source, module, extracted chunks, and source notes from Convex. Notes can be created and removed through Convex mutations.
- **Paused capabilities**: Upload processing, file extraction, RAG/retrieval, source analysis generation, runtime AI (z.ai/GLM and Gemini), and AI provider key storage are paused pending Convex backend wiring.

## Scripts

```bash
npm run dev            # Development server (Turbopack)
npm run dev:convex     # Convex development server
npm run build          # Production build
npm run start          # Production server
npm run lint           # ESLint
npm run convex:codegen # Generate Convex client bindings
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    layout.tsx            # Root layout: ClerkProvider → ConvexClientProvider
    convex-provider.tsx   # Convex + Clerk wiring
    sign-in/[[...sign-in]]/  # Clerk sign-in page
    sign-up/[[...sign-up]]/  # Clerk sign-up page
    dashboard/            # Dashboard backed by Convex modules
    modules/[moduleId]/   # Module workspace backed by Convex
    sources/              # Source library backed by Convex
    sources/[sourceId]/   # Source viewer backed by Convex
    assistant/            # Assistant placeholder
    essays/[essayId]/     # Essay workspace placeholder
    tools/                # Academic tools placeholder
    settings/             # Settings (profile, AI keys, features)
  components/             # React components by feature
  lib/
    types.ts              # TypeScript type definitions
    utils.ts              # Utility functions
    convex-ui-mappers.ts  # Convex document → UI type mappers
convex/
  auth.config.ts          # Convex auth config for Clerk JWT validation
  schema.ts               # Convex schema
  users.ts                # User profile queries/mutations (auth-gated)
  modules.ts, folders.ts, sources.ts, notes.ts  # Core data CRUD
  assignments.ts, arguments.ts, evidence.ts      # Assignment model
  drafts.ts, reviews.ts                          # Draft and review
  cothinker.ts                                   # CoThinker sessions
  ai.ts                   # AI provider placeholder (z.ai planned)
  files.ts                # Convex storage upload URL
  usage.ts                # Usage event queries
  lib/auth.ts             # getAuthIdentifier helper
docs/                     # Product documentation
```

## Authentication

Polis uses Clerk for authentication, integrated with Convex:

1. **Clerk** handles sign-in, sign-up, session management, and user profiles.
2. **Convex** validates Clerk JWTs via `convex/auth.config.ts` and exposes identity through `ctx.auth.getUserIdentity()`.
3. **ConvexClientProvider** (`src/app/convex-provider.tsx`) wraps the app with `ConvexProviderWithClerk`, passing Clerk auth state to Convex.

## Product Model

```
Module → Assignment → Argument → Draft
```

Every assignment moves through seven stages:

```
Ingest → Understand → Map → Judge → Build → Draft → Refine
```

See `docs/PRODUCT_VISION.md` for the full product thesis.

## Academic Integrity

Polis enforces strict academic integrity:

- No fabricated citations, authors, or page numbers
- No invented page references
- Harvard citation style by default (APA, Chicago, MLA available)
- Every AI output is labelled as source-supported, interpretation, or general
- The student remains fully responsible for submitted work

See `docs/ACADEMIC_INTEGRITY.md` for the full policy.

## Deployment

### Convex

```bash
npx convex deploy          # Deploy Convex functions to production
```

### Next.js

```bash
npm run build              # Build the Next.js application
npm run start              # Run the production server
```

Deploy to Vercel or any Node.js hosting platform. Set all environment variables in the deployment dashboard.

### Verification

```bash
npm run lint               # Verify code quality
npm run build              # Verify build succeeds
npx convex deploy --dry-run  # Verify Convex functions compile
```

## Documentation

- `docs/PRODUCT_VISION.md` — Product thesis and target users
- `docs/MVP_SCOPE.md` — Phase definitions and scope
- `docs/DATA_MODEL.md` — Product data model and Convex schema reference
- `docs/ACADEMIC_INTEGRITY.md` — Integrity principles and rules
- `docs/DEPLOYMENT.md` — Deployment guide
- `docs/AI_PROVIDER_STRATEGY.md` — AI provider strategy and planned providers
- `docs/RAG_ARCHITECTURE.md` — Intended RAG pipeline architecture
- `docs/ROADMAP.md` — Feature roadmap and progress
- `docs/UX_FLOW.md` — User experience flows
- `AGENTS.md` — Instructions for AI coding agents
