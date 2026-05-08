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
- AI provider abstraction stubs and RAG architecture documentation
- Comprehensive documentation set

**Does NOT include**:
- Real authentication
- Real file upload or processing
- Real AI API calls
- Real vector search or RAG
- Database persistence
- Payment or billing

## Phase 1: Core Functionality (Complete)

**Goal**: Make the prototype functional with real file upload and AI integration.

**Includes**:
- File upload and text extraction (PDF, DOCX, PPTX)
- AI provider integration (BYO API key, server-side)
- Real conversational CoThinker scoped to modules/sources
- Basic chunking and retrieval
- Source summarisation and concept extraction
- Assignment planning with live CoThinker assistance

## Phase 2: Intelligence Layer (Complete)

**Goal**: Build robust source-grounded AI with citation integrity.

**Includes**:
- Full RAG pipeline (embedding, retrieval, citation injection)
- Page-level and chunk-level citation tracking
- Citation safety checking
- Draft review against rubrics
- Theory comparison and literature matrices
- Evidence linking with source-grounded entries
- Argument mapping

## Phase 3: Production Platform (Complete)

**Goal**: Expand to a production-ready platform.

**Includes**:
- User authentication and accounts (OAuth)
- Per-user BYO API key management
- Background file processing
- Cloud storage abstraction
- Usage analytics and rate limiting
- Draft editor in assignment workspace
- Source notes
- Mobile-responsive design refinements
- Google Gemini provider integration

## Phase 4: Product Model (Current)

**Goal**: Implement the full Module → Assignment → Argument → Draft product model with the 7-stage production workflow.

**Includes**:
- Assignment entity replacing EssayProject
- Argument construction with evidence linking
- Versioned drafts with review history
- Judgement system for evidence quality assessment
- CoThinker with stage-aware behaviour
- Workbench with stage-appropriate tool surfacing
- Production stage tracking per assignment
- Convex backend for all new entities
