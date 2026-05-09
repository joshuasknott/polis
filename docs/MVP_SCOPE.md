# Polis — MVP Scope

## Phase 0: Static Prototype (Complete)

**Goal**: Build a polished, convincing frontend prototype with realistic mock data.

**Includes**:
- Landing page communicating product vision
- Dashboard with module cards, recent activity, quick actions
- Module workspace with folder navigation and source management
- Source library and source viewer with metadata and summaries
- CoThinker panel with mock source-grounded responses
- Assignment workspace with planning, evidence linking, and draft review
- Workbench page with stage-appropriate tool cards
- Settings page with provider configuration placeholders
- Complete TypeScript data model and realistic mock data
- Comprehensive documentation set

## Phase 1: Core Functionality (Pre-Convex — Historical)

**Goal**: Made the prototype functional with real file upload and AI integration using Prisma/PostgreSQL/Auth.js.

**Status**: Superseded by the Convex migration. These features were built and working on the old backend. They are now paused and will be rebuilt on Convex.

**Historically included**:
- File upload and text extraction (PDF, DOCX, PPTX)
- AI provider integration (BYO API key, server-side)
- Real conversational CoThinker scoped to modules/sources
- Basic chunking and retrieval
- Source summarisation and concept extraction
- Assignment planning with live CoThinker assistance

## Phase 2: Intelligence Layer (Pre-Convex — Historical)

**Goal**: Built robust source-grounded AI with citation integrity using pgvector/OpenAI/Anthropic.

**Status**: Superseded by the Convex migration. Retrieval, embeddings, and AI features will be rebuilt on Convex with z.ai/GLM and Gemini as providers.

**Historically included**:
- Full RAG pipeline (embedding, retrieval, citation injection)
- Page-level and chunk-level citation tracking
- Citation safety checking
- Draft review against rubrics
- Theory comparison and literature matrices
- Evidence linking with source-grounded entries
- Argument mapping

## Phase 3: Production Platform (Pre-Convex — Historical)

**Goal**: Expanded to a production-ready platform using Auth.js OAuth, Prisma, S3 storage, and per-user keys.

**Status**: Superseded by the Convex migration. Auth is now Clerk; storage is Convex storage; AI keys are paused.

**Historically included**:
- User authentication and accounts (OAuth)
- Per-user BYO API key management
- Background file processing
- Cloud storage abstraction
- Usage analytics and rate limiting
- Draft editor in assignment workspace
- Source notes
- Mobile-responsive design refinements

## Convex Foundation Migration (Complete)

**Goal**: Replace Prisma/PostgreSQL/Auth.js with Convex + Clerk.

**Status**: Complete.

**Delivered**:
- Removed Prisma/PostgreSQL package scripts and backend files
- Removed old Next API routes for the previous backend behaviour
- Installed Convex and Clerk
- Built foundational Convex schema with all product entities
- Clerk JWT auth flow wired to Convex
- Dashboard, modules, sources, source viewer, notes connected to Convex

## Phase 4: Product Model (Current)

**Goal**: Implement the full Module → Assignment → Argument → Draft product model with the 7-stage production workflow on the Convex backend.

**Status**: In progress.

**Includes**:
- Assignment entity replacing the prior essay-centric prototype model
- Argument construction with evidence linking
- Versioned drafts with review history
- Judgement system for evidence quality assessment
- CoThinker with stage-aware behaviour
- Workbench with stage-appropriate tool surfacing
- Production stage tracking per assignment
- All entities backed by Convex schema and functions

**Remaining**:
- Wire runtime AI providers (z.ai/GLM, Gemini) through Convex actions
- Rebuild file extraction and chunking on Convex
- Rebuild retrieval pipeline on Convex
- Implement draft diff/history beyond staged draft surface
- Surface Workbench actions contextually inside assignment stages
