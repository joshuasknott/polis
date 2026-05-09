# Polis — Roadmap

## Current: Phase 4 — Product Model Refactor

**Status**: Integrated on `feat/workflow-product-model`
**Goal**: Replace the prior essay-centric prototype with Module → Assignment → Argument → Draft and the 7-stage production workflow.

### Contract Delivered
- [x] Updated product documentation with new model and terminology
- [x] Defined new TypeScript types: Assignment, Argument, Draft, EvidenceLink, Judgement, Review, CoThinker, ProductionStage
- [x] Updated mock data to demonstrate the new workflow
- [x] Renamed user-facing concepts (CoThinker, Workbench, Assignments)

### Integrated
- [x] Implemented Convex schema/functions for assignments, arguments, evidence links, drafts, reviews, judgements, and CoThinker sessions
- [x] Built assignment workspace UI with production stage tracking
- [x] Built argument construction, evidence map, judgement, draft, refine, and CoThinker surfaces
- [x] Preserved staged draft support without one-click essay generation
- [x] Isolated the legacy `/essays` route behind redirects to assignment workspaces

### Remaining Product Work
- [ ] Connect assignment workspace UI to live Convex data
- [ ] Rebuild runtime AI provider selection and retrieval against Convex
- [ ] Implement draft diff/history beyond the current staged draft surface
- [ ] Surface Workbench actions contextually inside assignment stages

---

## Done: Convex Foundation Migration

**Status**: Complete (foundation only)
**Goal**: Replace the pre-existing Prisma/PostgreSQL/Auth.js/backend service foundation with a clean Convex backend.

### Foundation Delivered
- [x] Removed Prisma/PostgreSQL package scripts and backend files
- [x] Removed old Next API routes for the previous backend behaviour
- [x] Installed Convex and added foundational schema/functions
- [x] Kept frontend components and mock data as placeholders during migration

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
- [x] AI/RAG architecture stubs

---

## Done: Phase 1 — Academic Workspace Foundation

**Status**: Complete
**Goal**: Working foundation with database, auth, uploads, ingestion, retrieval, and source-grounded CoThinker

### Key Features
- [x] PostgreSQL database with Prisma ORM (15 models)
- [x] User authentication (Auth.js v5, credentials)
- [x] File upload (PDF, DOCX, TXT, MD)
- [x] Text extraction (pdf-parse, mammoth)
- [x] Automatic text chunking (1000-word chunks with 150-word overlap)
- [x] Keyword-based source retrieval
- [x] Source-grounded CoThinker (retrieval-aware template responses)
- [x] Assignment and evidence persistence
- [x] Module workspace with real data
- [x] Source library with search and filtering
- [x] Route protection via middleware
- [x] Demo data seed script

---

## Done: Phase 2 — Intelligence Layer

**Status**: Complete
**Goal**: Real LLM-powered source-grounded AI with citation integrity

### Key Features
- [x] Real AI provider integration (OpenAI primary, Anthropic secondary)
- [x] Vector embeddings with pgvector (text-embedding-3-small, 1536 dimensions)
- [x] Hybrid retrieval (semantic 0.7 + keyword 0.3 weighting)
- [x] LLM-powered source-grounded CoThinker responses with citation parsing
- [x] Template fallback when no AI provider configured
- [x] Auto-generated source summaries and concept extraction
- [x] Citation safety checking tool endpoint
- [x] Draft review with rubric analysis endpoint
- [x] Conversation memory (multi-turn, last 10 messages)
- [x] Enhanced UI: CoThinker mode badge, evidence bank button, tool cards wired
- [x] pgvector schema integration with embedding column
- [x] Batch embedding script for existing chunks

---

## Done: Phase 3 — Production Platform

**Status**: Complete
**Goal**: Production-ready platform with per-user AI configuration, background processing, and enhanced workflows

### Key Features
- [x] Per-user BYO API key management (AES-256-GCM encrypted storage)
- [x] OAuth providers (GitHub, Google) with account linking
- [x] Profile editing and user preferences
- [x] Background file processing (extract → chunk → embed → analyse)
- [x] Cloud file storage abstraction (local + S3)
- [x] Usage analytics dashboard with cost estimation
- [x] Rate limiting on AI API calls (in-memory)
- [x] Draft editor in assignment workspace
- [x] Source notes (user-created notes on sources)
- [x] Mobile-responsive design refinements
- [x] Google Gemini provider integration
- [x] pgvector HNSW index script
- [x] Processing status polling for uploads

---

## Risks

| Risk | Mitigation |
|------|------------|
| AI hallucination in academic context | Strict source-grounding, citation badges, warnings, [Source N] format enforced |
| Academic integrity concerns | Prominent integrity policy, clear labelling, no essay generation, draft review only analyses |
| User adoption | Focus on genuine workflow value, not AI gimmicks |
| API cost sensitivity | BYO API key model, transparent usage tracking, gpt-4o-mini as default |
| Provider API changes | Abstraction layer, multi-provider support |
| Data privacy | Server-side processing, no third-party data sharing beyond provider API |

## Open Questions

- Pricing model (if any) for future phases
- Mobile app vs responsive web → Responsive web for now
- University partnership opportunities
- Content moderation requirements
- Rich text editor choice for draft editing
