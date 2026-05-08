# Polis — MVP Scope

## Phase 0: Static Prototype (Current)

**Goal**: Build a polished, convincing frontend prototype with realistic mock data.

**Includes**:
- Landing page communicating product vision
- Dashboard with module cards, recent activity, quick actions
- Module workspace with folder navigation and source management
- Source library and source viewer with metadata and summaries
- AI assistant panel with mock source-grounded responses
- Essay project workspace with planning, evidence bank, and draft review
- Academic tools page with 11 tool cards
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

## Phase 1: Core Functionality

**Goal**: Make the prototype functional with real file upload and AI integration.

**Includes**:
- File upload and text extraction (PDF, DOCX, PPTX)
- AI provider integration (BYO API key, server-side)
- Real conversational AI scoped to modules/sources
- Basic chunking and retrieval
- Source summarisation and concept extraction
- Essay planning with live AI assistance

**Does NOT include**:
- Advanced RAG (hybrid search, reranking)
- Full citation grounding with page-level references
- Draft review AI
- User authentication

## Phase 2: Intelligence Layer

**Goal**: Build robust source-grounded AI with citation integrity.

**Includes**:
- Full RAG pipeline (embedding, retrieval, citation injection)
- Page-level and chunk-level citation tracking
- Citation safety checking
- Draft review against rubrics
- Theory comparison and literature matrices
- Evidence bank with source-grounded entries
- Argument mapping

## Phase 3: Platform

**Goal**: Expand to a multi-user platform.

**Includes**:
- User authentication and accounts
- Module sharing and collaboration
- Advanced academic tools
- Usage tracking and limits
- Mobile-responsive design refinements
- Potential pricing tier
