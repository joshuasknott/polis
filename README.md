# Polis

Coursework intelligence workspace for social science students.

## What It Is

Polis helps Politics, IR, Sociology, and other social science students organise module materials, understand readings, build evidence-based essay plans, and review drafts — all using source-grounded AI that preserves citation integrity.

## Tech Stack

- **Next.js 16** App Router with TypeScript
- **React 19**
- **Tailwind CSS v4** (CSS-first configuration)
- **PostgreSQL + Prisma 7** (database and ORM)
- **Auth.js v5** (authentication)
- **lucide-react** for icons
- **pdf-parse** and **mammoth** for text extraction

## Getting Started

### Prerequisites
- Node.js 22+
- PostgreSQL 14+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and configure
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# 3. Set up database
npm run db:push

# 4. Seed demo data
npm run db:seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo credentials:** alex.chen@university.ac.uk / password123

## Current Status

**Phase 1: Working Academic Workspace Foundation**

- Real database persistence (PostgreSQL + Prisma)
- Authentication with credentials login
- File upload with text extraction (PDF, DOCX, TXT, MD)
- Automatic text chunking
- Keyword-based source retrieval
- Source-grounded assistant (retrieval-aware, template-based)
- Essay and evidence persistence
- All routes auth-protected

**What remains:**
- Real AI provider integration (LLM-generated responses)
- Vector embeddings for semantic search
- OAuth providers
- Background file processing
- Cloud storage

See `docs/PHASE_1_IMPLEMENTATION.md` for full details.

## Scripts

```bash
npm run dev          # Development server (Turbopack)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create and apply migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Prisma Studio GUI
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages
    api/                  # API routes
      assistant/          # Assistant endpoint
      auth/               # Auth.js routes
      essays/             # Essay CRUD
      sources/upload/     # File upload
    auth/signin/          # Sign-in page
    dashboard/            # Dashboard
    modules/[moduleId]/   # Module workspace
    sources/              # Source library
    sources/[sourceId]/   # Source viewer
    assistant/            # AI assistant
    essays/[essayId]/     # Essay workspace
    tools/                # Academic tools
    settings/             # Settings
  components/             # React components by feature
  lib/
    types.ts              # TypeScript type definitions
    utils.ts              # Utility functions
    db.ts                 # Prisma client
    auth.ts               # Auth.js config
    data/mock-data.ts     # Original mock data (preserved)
    ai/                   # AI provider stubs + grounded provider
    services/             # Service layer (data, upload, extraction, chunking, retrieval)
    ingestion/            # File ingestion stubs
    retrieval/            # RAG stubs
  types/                  # Type declarations
prisma/
  schema.prisma           # Database schema
  seed.ts                 # Demo data seed
docs/                     # Documentation
```

## Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page | No |
| `/auth/signin` | Sign in | No |
| `/dashboard` | Dashboard with modules and activity | Yes |
| `/modules/[moduleId]` | Module workspace with upload | Yes |
| `/sources` | Source library with search | Yes |
| `/sources/[sourceId]` | Source viewer with chunks | Yes |
| `/tools` | Academic tools | Yes |
| `/assistant` | AI assistant | Yes |
| `/essays/[essayId]` | Essay project workspace | Yes |
| `/settings` | Settings and status | Yes |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | Auth.js routes |
| `/api/auth/signout` | GET/POST | Sign out |
| `/api/sources/upload` | POST | Upload and process files |
| `/api/assistant` | POST | Ask questions with retrieval |
| `/api/essays` | GET/POST | Essay CRUD operations |

## Documentation

- `docs/PRODUCT_VISION.md` — Product thesis and target users
- `docs/MVP_SCOPE.md` — Phase definitions and scope
- `docs/ACADEMIC_INTEGRITY.md` — Integrity principles and rules
- `docs/AI_PROVIDER_STRATEGY.md` — BYO API key approach
- `docs/DATA_MODEL.md` — Data entities and relationships
- `docs/UX_FLOW.md` — User journey descriptions
- `docs/RAG_ARCHITECTURE.md` — Retrieval pipeline design
- `docs/ROADMAP.md` — Development roadmap
- `docs/PHASE_1_IMPLEMENTATION.md` — Phase 1 implementation details
- `AGENTS.md` — Instructions for AI coding agents

## Development

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
```
