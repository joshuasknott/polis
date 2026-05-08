# Polis — Roadmap

## Current: Convex Foundation Migration

**Status**: In progress
**Goal**: Replace the pre-existing Prisma/PostgreSQL/Auth.js/backend service foundation with a clean Convex backend for future feature-by-feature migration.

### Foundation Delivered
- [x] Removed Prisma/PostgreSQL package scripts and backend files
- [x] Removed old Next API routes for the previous backend behavior
- [x] Installed Convex and added foundational schema/functions
- [x] Kept frontend components and mock data as placeholders during migration

### Next Migration Steps
- [ ] Configure a real Convex deployment with `npx convex dev`
- [ ] Rebuild authentication/user identity on the Convex foundation
- [ ] Move modules and sources from mock data to Convex queries/mutations
- [ ] Reintroduce file ingestion/storage through Convex patterns
- [ ] Rebuild runtime AI provider support later, likely starting with z.ai/Zhipu

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
- [x] AI assistant panel with mock responses
- [x] Essay project workspace
- [x] Academic tools page
- [x] Settings page
- [x] Documentation set
- [x] Type definitions and mock data
- [x] AI/RAG architecture stubs

---

## Done: Phase 1 — Academic Workspace Foundation

**Status**: Complete
**Goal**: Working foundation with database, auth, uploads, ingestion, retrieval, and source-grounded assistant

### Key Features
- [x] PostgreSQL database with Prisma ORM (15 models)
- [x] User authentication (Auth.js v5, credentials)
- [x] File upload (PDF, DOCX, TXT, MD)
- [x] Text extraction (pdf-parse, mammoth)
- [x] Automatic text chunking (1000-word chunks with 150-word overlap)
- [x] Keyword-based source retrieval
- [x] Source-grounded assistant (retrieval-aware template responses)
- [x] Essay and evidence persistence
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
- [x] LLM-powered source-grounded assistant responses with citation parsing
- [x] Template fallback when no AI provider configured
- [x] Auto-generated source summaries and concept extraction
- [x] Citation safety checking tool endpoint
- [x] Draft review with rubric analysis endpoint
- [x] Conversation memory (multi-turn, last 10 messages)
- [x] Enhanced UI: AI mode badge, evidence bank button, tool cards wired
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
- [x] Draft editor in essay workspace
- [x] Source notes (user-created notes on sources)
- [x] Mobile-responsive design refinements
- [x] Google Gemini provider integration
- [x] pgvector HNSW index script
- [x] Processing status polling for uploads

### What Remains
- [ ] Rich text editor (TipTap) for draft editing
- [ ] Redis-backed rate limiting
- [ ] SSE for real-time processing updates
- [ ] File migration tool (local → S3)
- [ ] Module sharing between students
- [ ] Collaboration features
- [ ] Advanced academic tools (plagiarism awareness, bibliography generation)
- [ ] Integration with university systems (LMS)

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
| Prisma 7 breaking changes | Documented configuration, adapter-based connection |
| pgvector availability | Manual setup documented, graceful fallback to keyword search |

## Open Questions

- ~~Authentication provider choice (NextAuth vs Clerk vs custom)~~ → Chose Auth.js v5
- ~~Database hosting~~ → PostgreSQL via Prisma 7 with adapter-pg
- ~~Vector store choice~~ → pgvector (in-database, simple deployment)
- ~~Per-user API key encryption strategy~~ → AES-256-GCM with ENCRYPTION_KEY env var
- ~~Cloud storage provider~~ → S3-compatible abstraction (AWS, Supabase)
- Pricing model (if any) for future phases
- Mobile app vs responsive web → Responsive web for now
- University partnership opportunities
- Content moderation requirements
- When to add Redis for rate limiting
- TipTap vs ProseMirror for rich text editing
