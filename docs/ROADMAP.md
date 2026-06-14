# Polis — Roadmap

**Last updated**: 2026-06-14

## Next: Phase 5 — AI-Native Module OS

**Status**: Planning
**Goal**: Rebuild the product surface around the new direction. The student creates a workspace from a module name, imports everything, Polis classifies files and extracts assessments, and the student works inside assessments with embedded, source-backed AI — including powerful writing help.

Reuses the Phase 4 backend (Convex + Clerk + AI providers + extraction). Full scope: `docs/MVP_SCOPE.md`.

### Workspace Setup

- [ ] Create workspace from a module name only
- [ ] Bulk import flow (drop everything you have)
- [ ] AI-assisted source classification (user-confirmable)
- [ ] Assessment + module-fact extraction from imported briefs and handbook
- [ ] Assessment dashboard

### Embedded AI

- [ ] In-context assistant inside workspace and assessment (CoThinker becomes embedded, no standalone destination)
- [ ] In-context tools surfaced within Plan / Write / Review phases (Workbench becomes embedded, no standalone destination)
- [ ] Phase-aware directive cards

### Writing Help

- [ ] Drafting on request (source-backed where claimed)
- [ ] Paraphrase / restructure
- [ ] Critique against rubric and evidence
- [ ] Citation insertion from verified source data
- [ ] Revision and restructuring in Review
- [ ] Soft warnings for unsupported claims; hard errors only for fabrication/misattribution

### Integrity UX

- [ ] Hard rejection of fabricated citations / pages / misattribution at the validation layer
- [ ] Visible labels on all AI claims
- [ ] Explicit student-responsibility messaging

### Terminology Migration

- [ ] Update user-facing copy: Workspace / Assessment / Source Base / Evidence Map / Plan / Write / Review
- [ ] Keep internal data-model names in code and schema (Module / Assignment / Argument / Draft)

---

## Current: Phase 4 — Production Architecture & Runtime

**Status**: In progress (foundation complete)
**Goal**: Rebuild all runtime capabilities on Convex + Clerk, connect the full product model to live data, and ship source-grounded AI.

### Architecture Contracts (This Branch)

- [x] Reconcile current reality: Convex + Clerk active, Prisma/Auth.js/PostgreSQL historical
- [x] Define production architecture in `docs/CURRENT_ARCHITECTURE.md`
- [x] Define implementation contracts in `docs/IMPLEMENTATION_CONTRACTS.md`
- [x] Update data model documentation for Convex schema
- [x] Define RAG architecture for Convex
- [x] Define AI provider strategy: z.ai primary, Gemini secondary
- [x] Define academic integrity guarantees for AI actions
- [x] Define branch dependency map for parallel agents

### Backend Runtime (Agent Branches)

- [x] File extraction + chunking actions (`feat/convex-extraction`)
- [ ] Vector embeddings + Convex vector search (`feat/convex-embeddings`)
- [x] AI provider actions: z.ai + Gemini (`feat/convex-ai-providers`)
- [x] CoThinker chat runtime with retrieval (`feat/convex-cothinker-runtime`)
- [x] Source analysis actions (`feat/convex-source-analysis`)
- [x] Draft review AI action (`feat/convex-draft-review`)
- [ ] Judgement generation actions (`feat/convex-judgements`)

### UI Wiring (Agent Branches)

- [ ] Assignment workspace connected to live Convex data (`feat/ui-assignment-workspace`)
- [ ] CoThinker panel connected to live runtime (`feat/ui-cothinker`)
- [ ] Module workspace refinements for live data

### Infrastructure

- [x] Update AGENTS.md to reflect Convex + Clerk stack (`chore/update-agents-md`)
- [x] Cleanup cascade actions for entity deletion
- [x] Rate limiting via usage event tracking
- [ ] Processing pipeline monitoring

---

## Done: Convex Foundation Migration

**Status**: Complete (foundation only)
**Goal**: Replace the pre-existing Prisma/PostgreSQL/Auth.js backend with a clean Convex backend.

### Foundation Delivered

- [x] Removed Prisma/PostgreSQL package scripts and backend files
- [x] Removed old Next API routes for the previous backend behaviour
- [x] Installed Convex and added foundational schema/functions
- [x] Clerk auth integrated via JWT templates
- [x] 29-table Convex schema covering the full product model
- [x] Full CRUD for modules, folders, sources, notes, assignments, arguments, evidence, drafts, reviews, CoThinker
- [x] File upload via Convex storage
- [x] UI mappers bridging Convex docs to existing component types

---

## Done: Phase 0 — Static Prototype

**Status**: Complete
**Goal**: Polished frontend prototype with mock data

### Deliverables

- [x] Next.js project setup with TypeScript and Tailwind
- [x] Landing page
- [x] Dashboard with module cards
- [x] Module workspace with folder navigation
- [x] Source library and viewer
- [x] CoThinker panel with mock responses
- [x] Assignment workspace
- [x] Workbench page
- [x] Settings page
- [x] Documentation set
- [x] Type definitions and mock data

---

## Done: Phase 1-3 (Historical — Prisma/PostgreSQL Stack)

**Status**: Complete, then superseded by Convex migration
**Goal**: Working foundation with database, auth, uploads, ingestion, retrieval, and AI

These phases were delivered on the old Prisma/PostgreSQL/Auth.js stack. Their deliverables are historical references. The capabilities they built (file processing, RAG, AI providers) need to be rebuilt on Convex as part of Phase 4.

### Phase 1 Deliverables (Historical)

- [x] PostgreSQL database with Prisma ORM
- [x] User authentication (Auth.js v5)
- [x] File upload and text extraction
- [x] Basic chunking and retrieval
- [x] Source-grounded CoThinker

### Phase 2 Deliverables (Historical)

- [x] Real AI provider integration (OpenAI, Anthropic)
- [x] Vector embeddings with pgvector
- [x] Hybrid retrieval
- [x] Citation safety checking
- [x] Draft review

### Phase 3 Deliverables (Historical)

- [x] Per-user BYO API key management
- [x] OAuth providers
- [x] Background file processing
- [x] Cloud file storage
- [x] Usage analytics
- [x] Rate limiting
- [x] Google Gemini provider

---

## Risks

| Risk | Mitigation |
|------|------------|
| AI hallucination in academic context | Source-grounding, citation validation (hard error on fabrication), labels, soft warnings |
| Academic integrity concerns | Explicit responsibility messaging, clear labelling, source-backed-where-claimed, soft warnings; student owns the submission |
| User adoption | Focus on workspace-first flow: drop files in, get a command center, write with help |
| API cost sensitivity | z.ai primary (cost-effective), Gemini free tier fallback, transparent usage tracking |
| Provider API changes | Abstraction layer, multi-provider support |
| Data privacy | Server-side processing (Convex actions), no third-party data sharing beyond provider API |
| Convex vector search maturity | Start with keyword fallback, add vector search incrementally |
| Writing-help perception | Clear labelling, source-truth enforcement, student-responsibility messaging; never fabricate |

## Open Questions

- Pricing model (if any) for future phases
- Mobile app vs responsive web → Responsive web for now
- University partnership opportunities
- Content moderation requirements
- Rich text editor choice for the Write phase
- Convex vector search dimensionality and index strategy
- How aggressively to auto-extract assessments from imported briefs vs. asking the student
