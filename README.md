# Polis

Coursework intelligence workspace for social science students.

## What It Is

Polis helps Politics, IR, Sociology, and other social science students organise module materials, understand readings, build evidence-based essay plans, and review drafts — all using source-grounded AI that preserves citation integrity.

## Tech Stack

- **Next.js 16** App Router with TypeScript
- **React 19**
- **Tailwind CSS v4** (CSS-first configuration)
- **Convex** (backend database and functions)
- **Clerk** (authentication and user identity)
- **lucide-react** for icons

## Getting Started

### Prerequisites
- Node.js 22+
- A [Clerk](https://clerk.com) account and application
- A [Convex](https://convex.dev) account and project

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and configure
cp .env.example .env.local
# Fill in Clerk keys, Convex URL, and JWT issuer domain in .env.local

# 3. Configure Clerk JWT template
# In the Clerk dashboard, create a JWT template named "convex" with audience "convex".

# 4. Configure Convex
npx convex dev

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current Status

- **Auth/user identity**: Clerk + Convex. Users sign in via Clerk, identity flows to Convex through JWT templates and `ctx.auth.getUserIdentity()`.
- **Product data**: Still mock/placeholder. Modules, sources, essays, tools, and assistant use static mock data pending future migration to Convex.
- **Runtime AI**: Intentionally paused. No AI provider integrations are active.

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
    sign-in/[[...sign-in]]/  # Clerk sign-in page
    sign-up/[[...sign-up]]/  # Clerk sign-up page
    dashboard/            # Dashboard (mock data)
    modules/[moduleId]/   # Module workspace (mock data)
    sources/              # Source library (mock data)
    sources/[sourceId]/   # Source viewer (mock data)
    assistant/            # Assistant placeholder
    essays/[essayId]/     # Essay workspace placeholder
    tools/                # Academic tools placeholder
    settings/             # Settings placeholder
  components/             # React components by feature
  lib/
    types.ts              # TypeScript type definitions
    utils.ts              # Utility functions
    data/mock-data.ts     # Mock data (preserved for now)
convex/
  auth.config.ts          # Convex auth config for Clerk JWT validation
  schema.ts               # Convex schema
  users.ts                # User profile queries/mutations (auth-gated)
  *.ts                    # Other Convex functions (placeholder)
```

## Authentication

Polis uses Clerk for authentication, integrated with Convex:

1. **Clerk** handles sign-in, sign-up, session management, and user profiles.
2. **Convex** validates Clerk JWTs via `convex/auth.config.ts` and exposes identity through `ctx.auth.getUserIdentity()`.
3. **Middleware** (`src/middleware.ts`) protects workspace routes; the landing page remains public.

## Documentation

- `docs/PRODUCT_VISION.md` — Product thesis and target users
- `docs/MVP_SCOPE.md` — Phase definitions and scope
- `docs/ACADEMIC_INTEGRITY.md` — Integrity principles and rules
- `AGENTS.md` — Instructions for AI coding agents

## Development

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
```
