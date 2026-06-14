# Polis

Source-backed coursework workspace for students.

## What It Is

Polis is an AI-native module operating system. A student creates a workspace with a module name, semester, and year, imports the material they already have, and Polis turns it into a command center for assessments, sources, evidence maps, drafting, and review.

The core promise is simple: powerful writing help that stays connected to real uploaded sources. Polis can help plan, draft, critique, restructure, paraphrase, and revise, but it labels source support clearly and warns when evidence is thin.

## Product Flow

User-facing flow:

```text
Create workspace -> Import -> Dashboard -> Plan -> Write -> Review
```

Internal model:

```text
Module -> Assignment -> Argument -> Draft
```

User-facing names:

- Module = Workspace
- Assignment = Assessment
- Source collection = Source Base
- Argument + evidence links = Evidence Map
- Draft = Write
- Refine = Review

## Current Product State

- Public marketing site is product-led, direct, and focused on the source-backed workspace workflow.
- Dashboard shows Workspaces first and includes the deadline timeline inside Workspaces.
- The sidenav is not shown on the dashboard; it appears inside an opened workspace.
- Workspace creation asks only for name, semester, and year. Semester is a free-text field.
- Convex-backed workspace, source, assignment, draft, review, CoThinker, and usage data models are in place.
- AI runtime strategy is z.ai/GLM primary with Gemini as secondary. Runtime AI calls belong in Convex actions only.

## Tech Stack

- Next.js 16 App Router with TypeScript
- React 19
- Tailwind CSS v4 with CSS-first theme tokens
- Convex for backend data, functions, and file storage
- Clerk for authentication and user identity
- lucide-react for icons
- z.ai/GLM as primary runtime AI provider
- Google Gemini as secondary runtime AI provider

## Getting Started

### Prerequisites

- Node.js 22+
- A Clerk account and application
- A Convex account and project
- Optional: z.ai and Gemini API keys for runtime AI features

### Setup

```bash
npm install
cp .env.example .env.local
npx convex dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `CONVEX_DEPLOYMENT` | Yes | Set automatically by `npx convex dev` |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `CLERK_JWT_ISSUER_DOMAIN` | Yes | Clerk JWT issuer domain for Convex auth |
| `ENCRYPTION_KEY` | Optional | Encrypts user AI API keys at rest |

## Scripts

```bash
npm run dev            # Development server
npm run dev:convex     # Convex development server
npm run build          # Production build
npm run start          # Production server
npm run lint           # ESLint
npm run typecheck      # TypeScript check
npm run convex:codegen # Generate Convex client bindings
```

## Project Structure

```text
src/
  app/                    # Next.js App Router pages
  components/             # React components by feature
  components/brand/       # Shared brand mark components
  components/landing/     # Public marketing site
  lib/                    # Types, utilities, Convex UI mappers

convex/
  schema.ts               # Convex schema
  modules.ts              # Workspace/module functions
  assignments.ts          # Assessment functions
  sources.ts              # Source and chunk functions
  drafts.ts, reviews.ts   # Write and review functions
  cothinker.ts            # In-context assistant sessions
  ai_*.ts                 # Runtime AI provider strategy and calls

docs/
  PRODUCT_VISION.md
  MVP_SCOPE.md
  DATA_MODEL.md
  ACADEMIC_INTEGRITY.md
  UX_FLOW.md
  CURRENT_ARCHITECTURE.md
```

## Academic Integrity

Polis supports writing help, but source truth is strict:

- Never fabricate citations, authors, page numbers, source claims, or catalog records.
- Never present invented text as a direct quote from a source.
- Never label output as source-supported unless it traces to a retrieved source chunk.
- Warn when evidence is insufficient instead of fabricating support.
- Make student responsibility explicit.

See `docs/ACADEMIC_INTEGRITY.md` for the full policy.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```
