# Polis — MVP Scope

**Last updated**: 2026-06-14

## Direction

Polis is now an **AI-native module operating system for students**. The student creates a workspace with a name, semester, and year, imports everything they have, and Polis turns messy files into an organized command center for coursework. Full thesis: `docs/PRODUCT_VISION.md`.

The Phase 4 foundation (Convex + Clerk + CRUD + storage + extraction + AI providers) is the substrate. Phase 5 builds the new product experience on top of it.

User-facing language: Workspace / Assessment / Source Base / Evidence Map / Plan / Write / Review. Internal data model: Module / Assignment / Argument / Draft (unchanged).

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
- AI provider abstraction stubs and RAG architecture documentation
- Comprehensive documentation set

**Does NOT include**:
- Real authentication
- Real file upload or processing
- Real AI API calls
- Real vector search or RAG
- Database persistence
- Payment or billing

## Phase 1: Core Functionality (Historical — Prisma Stack)

**Goal**: Make the prototype functional with real file upload and AI integration.

**Delivered on the old Prisma/PostgreSQL/Auth.js stack. Superseded by Convex migration. Capabilities need rebuilding.**

**Included**:
- File upload and text extraction (PDF, DOCX, PPTX)
- AI provider integration (BYO API key, server-side)
- Real conversational CoThinker scoped to modules/sources
- Basic chunking and retrieval
- Source summarisation and concept extraction
- Assignment planning with live CoThinker assistance

## Phase 2: Intelligence Layer (Historical — Prisma Stack)

**Goal**: Build robust source-grounded AI with citation integrity.

**Delivered on the old stack. Superseded by Convex migration. Capabilities need rebuilding.**

**Included**:
- Full RAG pipeline (embedding, retrieval, citation injection)
- Page-level and chunk-level citation tracking
- Citation safety checking
- Draft review against rubrics
- Theory comparison and literature matrices
- Evidence linking with source-grounded entries
- Argument mapping

## Phase 3: Production Platform (Historical — Prisma Stack)

**Goal**: Expand to a production-ready platform.

**Delivered on the old stack. Superseded by Convex migration. Capabilities need rebuilding.**

**Included**:
- User authentication and accounts (OAuth)
- Per-user BYO API key management
- Background file processing
- Cloud storage abstraction
- Usage analytics and rate limiting
- Draft editor in assignment workspace
- Source notes
- Mobile-responsive design refinements
- Google Gemini provider integration

## Phase 4: Production Architecture & Runtime (Current)

**Goal**: Rebuild all runtime capabilities on Convex + Clerk and ship the full product model.

### Foundation (Complete)

- [x] Convex schema (29 tables) covering full product model
- [x] Clerk auth integrated with Convex
- [x] Full CRUD for all entities
- [x] File upload via Convex storage
- [x] UI mappers bridging Convex to existing components
- [x] Assignment workspace with production stage tracking
- [x] Module workspace backed by Convex data

### Architecture Contracts (Complete)

- [x] Reconcile current reality vs. historical docs
- [x] Define production architecture
- [x] Define implementation contracts
- [x] Update data model, RAG, AI provider docs
- [x] Update AGENTS.md

### Backend Runtime (Mostly complete)

- [x] File extraction + chunking actions on Convex
- [ ] Vector embeddings + Convex vector search
- [x] AI provider actions (z.ai primary, Gemini secondary)
- [x] CoThinker chat with retrieval
- [x] Source analysis generation
- [x] Draft review AI
- [ ] Judgement generation

### UI Wiring (Next)

- [ ] Assignment workspace fully connected to live Convex data
- [ ] CoThinker panel connected to live AI runtime
- [ ] Source viewer with live analyses, concepts, claims

### Production Readiness (Later)

- [x] Cleanup cascade actions
- [x] Rate limiting
- [ ] Processing pipeline monitoring
- [ ] Error handling and failure states
- [ ] Mobile refinements

## Phase 5: AI-Native Module OS (Next — New Direction)

**Goal**: Rebuild the product surface around the new direction: workspace-first, import-to-dashboard, embedded AI, powerful source-backed writing help.

This phase reuses the Phase 4 backend and adds the new product experience on top.

### Workspace Setup

- [x] Create workspace from name, semester, and year (no upfront folder/brief setup)
- [ ] Bulk import flow: drop everything you have for the module
- [ ] AI-assisted source classification (readings / lectures / briefs / handbook / notes), user-confirmable
- [ ] Assessment + module-fact extraction from imported briefs and handbook
- [x] Workspace dashboard with workspaces and merged deadline timeline
- [ ] Assessment dashboard inside each workspace, with status, deadline, coverage

### Embedded AI (formerly standalone CoThinker / Workbench)

- [ ] In-context assistant panel available inside workspace and assessment (no standalone destination)
- [ ] In-context tools surfaced within Plan / Write / Review phases (no standalone Workbench destination)
- [ ] Scope selector: workspace / assessment / specific sources
- [ ] Phase-aware directive cards (Plan / Write / Review)

### Writing Help (Write and Review)

- [ ] Drafting on request (source-backed where claimed)
- [ ] Paraphrase / restructure selected text
- [ ] Critique against rubric and evidence
- [ ] Citation insertion using only verified source data
- [ ] Revision and restructuring in Review
- [ ] Soft warnings for unsupported claims and missing citations (no hard user-blocking except validation truth)

### Integrity UX

- [ ] Hard rejection of fabricated citations / pages / misattribution at the validation layer
- [ ] Visible labels (source-supported / interpretation / general / unsupported) on all AI claims
- [ ] Explicit student-responsibility messaging in assistant and Review

### Terminology Migration (UI)

- [x] Update user-facing copy: Workspace / Assessment / Source Base / Evidence Map / Plan / Write / Review
- [ ] Keep internal data-model names in code and schema

### Out of Scope for Phase 5

- Vector search (tracked separately in Phase 4)
- Payments, collaboration, mobile app

