# Polis — Roadmap

## Current: Phase 4 — Product Model on Convex

**Status**: In progress
**Goal**: Full Module → Assignment → Argument → Draft product model with the 7-stage production workflow on the Convex + Clerk foundation.

### Foundation Delivered

- [x] Convex schema for all product entities (30+ tables)
- [x] Clerk authentication with JWT flow to Convex
- [x] Convex functions for modules, folders, sources, notes
- [x] Convex functions for assignments, arguments, evidence links, drafts, reviews, judgements, CoThinker
- [x] Dashboard, modules, sources, source viewer wired to Convex data
- [x] Settings page with AI key placeholder (z.ai), feature status, academic integrity

### In Progress

- [ ] Connect remaining assignment workspace UI surfaces to live Convex data
- [ ] Wire runtime AI provider selection and retrieval against Convex

### Planned

- [ ] Rebuild file upload → extraction → chunking → embedding pipeline on Convex
- [ ] Implement z.ai/GLM provider via Convex actions
- [ ] Implement Gemini provider via Convex actions
- [ ] Rebuild hybrid retrieval pipeline on Convex
- [ ] Implement draft diff/history beyond staged draft surface
- [ ] Surface Workbench actions contextually inside assignment stages
- [ ] Rebuild usage analytics dashboard against Convex data
- [ ] Implement rate limiting for AI calls

---

## Done: Convex Foundation Migration

**Status**: Complete
**Goal**: Replace Prisma/PostgreSQL/Auth.js backend with Convex + Clerk.

### Delivered

- [x] Removed all Prisma/PostgreSQL package scripts and backend files
- [x] Removed old Next API routes for the previous backend behaviour
- [x] Installed Convex and Clerk
- [x] Built foundational Convex schema and functions
- [x] Kept frontend components as workspace surfaces during migration
- [x] Removed runtime mock data; UI reads from Convex

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

## Historical: Phases 1–3 (Pre-Convex)

These phases were implemented on the old Prisma/PostgreSQL/Auth.js backend. They were complete and functional before the Convex migration. The features described below are **paused** and will be rebuilt on Convex.

### Phase 1 — Academic Workspace Foundation

- [x] PostgreSQL database with Prisma ORM (15 models)
- [x] User authentication (Auth.js v5, credentials)
- [x] File upload (PDF, DOCX, TXT, MD)
- [x] Text extraction (pdf-parse, mammoth)
- [x] Automatic text chunking
- [x] Keyword-based source retrieval
- [x] Source-grounded CoThinker (template-based responses)
- [x] Module workspace with real data
- [x] Source library with search and filtering
- [x] Route protection via middleware
- [x] Demo data seed script

### Phase 2 — Intelligence Layer

- [x] Real AI provider integration (OpenAI, Anthropic)
- [x] Vector embeddings with pgvector (text-embedding-3-small, 1536d)
- [x] Hybrid retrieval (semantic 0.7 + keyword 0.3)
- [x] LLM-powered CoThinker with citation parsing
- [x] Template fallback when no AI provider configured
- [x] Auto-generated source summaries and concept extraction
- [x] Citation safety checking
- [x] Draft review with rubric analysis
- [x] Conversation memory (multi-turn)

### Phase 3 — Production Platform

- [x] Per-user BYO API key management (AES-256-GCM encrypted)
- [x] OAuth providers (GitHub, Google) with account linking
- [x] Profile editing and user preferences
- [x] Background file processing
- [x] Cloud file storage abstraction (local + S3)
- [x] Usage analytics dashboard
- [x] Rate limiting on AI API calls
- [x] Draft editor in assignment workspace
- [x] Source notes
- [x] Mobile-responsive design refinements
- [x] Google Gemini provider integration
- [x] pgvector HNSW index

---

## Risks

| Risk | Mitigation |
|------|------------|
| AI hallucination in academic context | Strict source-grounding, citation badges, warnings, [Source N] format enforced |
| Academic integrity concerns | Prominent integrity policy, clear labelling, no essay generation, draft review only analyses |
| User adoption | Focus on genuine workflow value, not AI gimmicks |
| API cost sensitivity | BYO API key model, transparent usage tracking |
| Provider API changes | Abstraction layer, multi-provider support |
| Data privacy | Server-side processing, Convex-managed data |

## Open Questions

- Pricing model (if any) for future phases
- Mobile app vs responsive web — responsive web for now
- University partnership opportunities
- Rich text editor choice for draft editing (TipTap vs alternatives)
