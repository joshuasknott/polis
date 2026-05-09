# Polis — Roadmap

**Last updated**: 2026-05-09

## Current: Phase 4 — Production Architecture & Runtime

**Status**: In progress
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

- [ ] File extraction + chunking actions (`feat/convex-extraction`)
- [ ] Vector embeddings + Convex vector search (`feat/convex-embeddings`)
- [ ] AI provider actions: z.ai + Gemini (`feat/convex-ai-providers`)
- [ ] CoThinker chat runtime with retrieval (`feat/convex-cothinker-runtime`)
- [ ] Source analysis actions (`feat/convex-source-analysis`)
- [ ] Draft review AI action (`feat/convex-draft-review`)
- [ ] Judgement generation actions (`feat/convex-judgements`)

### UI Wiring (Agent Branches)

- [ ] Assignment workspace connected to live Convex data (`feat/ui-assignment-workspace`)
- [ ] CoThinker panel connected to live runtime (`feat/ui-cothinker`)
- [ ] Module workspace refinements for live data

### Infrastructure

- [ ] Update AGENTS.md to reflect Convex + Clerk stack (`chore/update-agents-md`)
- [ ] Cleanup cascade actions for entity deletion
- [ ] Rate limiting via usage event tracking
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
- [x] 27-table Convex schema covering the full product model
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
| AI hallucination in academic context | Strict source-grounding, citation badges, warnings, `[Source N]` format enforced |
| Academic integrity concerns | Prominent integrity policy, clear labelling, no essay generation, draft review analyses only |
| User adoption | Focus on genuine workflow value, not AI gimmicks |
| API cost sensitivity | z.ai primary (cost-effective), Gemini free tier fallback, transparent usage tracking |
| Provider API changes | Abstraction layer, multi-provider support |
| Data privacy | Server-side processing (Convex actions), no third-party data sharing beyond provider API |
| Convex vector search maturity | Start with keyword fallback, add vector search incrementally |

## Open Questions

- Pricing model (if any) for future phases
- Mobile app vs responsive web → Responsive web for now
- University partnership opportunities
- Content moderation requirements
- Rich text editor choice for draft editing
- Convex vector search dimensionality and index strategy
