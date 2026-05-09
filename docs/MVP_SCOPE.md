# Polis — MVP Scope

**Last updated**: 2026-05-09

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

- [x] Convex schema (27 tables) covering full product model
- [x] Clerk auth integrated with Convex
- [x] Full CRUD for all entities
- [x] File upload via Convex storage
- [x] UI mappers bridging Convex to existing components
- [x] Assignment workspace with production stage tracking
- [x] Module workspace backed by Convex data

### Architecture Contracts (In Progress)

- [x] Reconcile current reality vs. historical docs
- [x] Define production architecture
- [x] Define implementation contracts
- [x] Update data model, RAG, AI provider docs
- [ ] Update AGENTS.md

### Backend Runtime (Next)

- [ ] File extraction + chunking actions on Convex
- [ ] Vector embeddings + Convex vector search
- [ ] AI provider actions (z.ai primary, Gemini secondary)
- [ ] CoThinker chat with retrieval
- [ ] Source analysis generation
- [ ] Draft review AI
- [ ] Judgement generation

### UI Wiring (Next)

- [ ] Assignment workspace fully connected to live Convex data
- [ ] CoThinker panel connected to live AI runtime
- [ ] Source viewer with live analyses, concepts, claims

### Production Readiness (Later)

- [ ] Cleanup cascade actions
- [ ] Rate limiting
- [ ] Processing pipeline monitoring
- [ ] Error handling and failure states
- [ ] Mobile refinements
