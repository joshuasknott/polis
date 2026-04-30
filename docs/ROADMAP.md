# SocialSciencr — Roadmap

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

### What Remains in Phase 1 Scope
- [ ] Real AI provider integration (OpenAI/Anthropic/Gemini)
- [ ] Vector embeddings for semantic search
- [ ] Background file processing job queue
- [ ] OAuth providers (GitHub/Google)
- [ ] Cloud file storage (S3/Supabase)

---

## Next: Phase 2 — Intelligence Layer

**Goal**: Robust source-grounded AI with citation integrity

### Key Features
- Real LLM-powered assistant responses with source grounding
- Vector embeddings and semantic search (pgvector)
- Page-level citation tracking
- Citation safety checking against claims
- Draft review AI with rubric analysis
- Theory comparison and literature matrices
- Evidence bank with source-grounded entries
- Argument mapping visualisation
- Hybrid retrieval (semantic + keyword)
- Background job queue for file processing
- Real-time processing status updates

---

## Later: Phase 3 — Platform

**Goal**: Multi-user platform

### Key Features
- OAuth providers (GitHub, Google)
- Module sharing between students
- Collaboration features
- Advanced academic tools (plagiarism awareness, bibliography generation)
- Mobile-responsive refinements
- Usage analytics and insights
- Cloud file storage (S3, Supabase Storage)
- Pricing tier for heavy users
- Integration with university systems (LMS)

---

## Risks

| Risk | Mitigation |
|------|------------|
| AI hallucination in academic context | Strict source-grounding, citation badges, warnings |
| Academic integrity concerns | Prominent integrity policy, clear labelling, no essay generation |
| User adoption | Focus on genuine workflow value, not AI gimmicks |
| API cost sensitivity | BYO API key model, transparent usage tracking |
| Provider API changes | Abstraction layer, multi-provider support |
| Data privacy | Server-side processing, no third-party data sharing |
| Prisma 7 breaking changes | Documented configuration, adapter-based connection |

## Open Questions

- ~~Authentication provider choice (NextAuth vs Clerk vs custom)~~ → Chose Auth.js v5
- ~~Database hosting~~ → PostgreSQL via Prisma 7 with adapter-pg
- Vector store choice (pgvector vs Pinecone vs Weaviate)
- Pricing model (if any) for future phases
- Mobile app vs responsive web
- University partnership opportunities
- Content moderation requirements
- Cloud storage provider (S3 vs Supabase Storage vs UploadThing)
