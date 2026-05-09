# Phase 1 Implementation — Polis

Historical note: this document describes the pre-Convex Prisma/Auth.js implementation. The active product workflow is Module → Assignment → Argument → Draft and the active backend foundation is Convex.

## What Is Now Real

### Database (PostgreSQL + Prisma)
- Full Prisma schema with 15 models: User, Account, Session, VerificationToken, Module, Folder, Assessment, Source, SourceChunk, Essay, EssaySection, EvidenceItem, Conversation, ConversationMessage, AIProviderConnection, RetrievalLog
- Prisma 7 with `@prisma/adapter-pg` for direct PostgreSQL connections
- Seed script with realistic Politics/IR demo data (4 modules, 12 sources, 6 chunks, 1 essay with sections and evidence, 1 conversation)
- All data scoped to users with row-level security via `userId` foreign keys

### Authentication (Auth.js v5)
- Credentials-based auth for local development
- JWT session strategy
- Middleware-based route protection for all app routes
- Sign-in page at `/auth/signin` with demo credentials
- Session available server-side via `auth()` in all server components
- Sign-out via sidebar

### File Upload
- `POST /api/sources/upload` — accepts PDF, DOCX, TXT, MD files
- Files stored locally in `./uploads/` (gitignored)
- Upload UI in module workspace and source library
- Module selection for upload destination
- File type and size validation (configurable via env)
- Source status tracking: uploaded → processing → ready/error

### Text Extraction
- PDF extraction via `pdf-parse`
- DOCX extraction via `mammoth`
- TXT/MD direct text reading
- Extraction results: text, word count, estimated page count
- Isolated extraction service in `src/lib/services/extraction-service.ts`

### Chunking
- Automatic chunking after text extraction
- Target 1000 words per chunk with 150 word overlap
- Character count and token estimate stored per chunk
- Chunk order preserved via `chunkIndex`
- Isolated chunking service in `src/lib/services/chunking-service.ts`

### Retrieval
- Keyword-based retrieval over source chunks
- Title-boosted scoring (source title matches get extra weight)
- Length-normalised relevance scores
- Scoped to user, optionally to module/source/essay
- Retrieval logging for analytics
- Service at `src/lib/services/retrieval-service.ts`

### Source-Grounded Assistant
- `POST /api/assistant` — retrieval-aware response generation
- Retrieves relevant chunks before generating response
- Shows cited chunks with source title, quote, and citation label
- Warns when no relevant sources found
- Warns when limited source material available
- Modes: source-grounded, reading summary, assignment planning
- Does not fabricate citations
- Encourages user synthesis, not submission

### Essay/Evidence Persistence
- Essays with sections and evidence items stored in DB
- Evidence items link to sources and chunks
- Essay sections with word allocation, purpose, notes (JSON)
- CRUD services in `src/lib/services/data-service.ts`
- API at `POST /api/essays`

### UI Integration
- Dashboard reads real modules, sources, conversations from DB
- Source library shows real sources with search and type filtering
- Source viewer shows extracted text, chunks, metadata
- Module workspace shows real folders, sources, essays with file upload
- Assistant page uses real retrieval with follow-up suggestions
- Essay workspace reads real sections and evidence items
- Settings shows Phase 1 status and auth info
- All pages are auth-protected via middleware

## What Remains Mocked

- **AI Provider**: No real AI API calls yet. Assistant uses retrieval-aware template responses, not LLM-generated text. The `providers.ts` stub still throws errors for direct `chat()` calls.
- **Source Summaries**: Summaries in seed data are manually written. Auto-generated summaries require AI.
- **Concept Extraction**: Concepts in seed data are manually written.
- **Draft Review**: Not implemented yet. Needs AI provider.
- **Vector Embeddings/Semantic Search**: Retrieval is keyword-based only.
- **OAuth Providers**: GitHub/Google OAuth scaffolded via env vars but not configured.
- **Real-time Processing**: File processing is synchronous within the upload request. Background job queue not implemented.

## Database Setup

### Prerequisites
- PostgreSQL 14+ running locally or accessible via connection string

### Steps
```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your DATABASE_URL
# DATABASE_URL="postgresql://user:password@localhost:5432/polis"

# 3. Push schema to database (creates tables)
npm run db:push

# 4. Seed with demo data
npm run db:seed
```

### Alternative: Using Prisma Migrate
```bash
npm run db:migrate  # Creates migration files and applies them
npm run db:seed     # Seeds demo data
```

### Database Management
```bash
npm run db:studio   # Opens Prisma Studio at localhost:5555
npm run db:generate # Regenerates Prisma client
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Secret for Auth.js session encryption |
| `AUTH_URL` | No | Base URL for auth callbacks (default: http://localhost:3000) |
| `UPLOAD_DIR` | No | File upload directory (default: ./uploads) |
| `MAX_FILE_SIZE_MB` | No | Max upload size in MB (default: 50) |
| `ENCRYPTION_KEY` | Future | For encrypting user API keys |

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up database (see above)

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000

# 5. Sign in with demo credentials:
#    Email: alex.chen@university.ac.uk
#    Password: password123
```

## Files Changed/Created

### New Files
- `prisma/schema.prisma` — Database schema
- `prisma/seed.ts` — Demo data seed script
- `prisma.config.ts` — Prisma configuration
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/auth.ts` — Auth.js configuration
- `src/lib/services/data-service.ts` — Data access layer
- `src/lib/services/extraction-service.ts` — Text extraction
- `src/lib/services/chunking-service.ts` — Text chunking
- `src/lib/services/retrieval-service.ts` — Keyword retrieval
- `src/lib/services/upload-service.ts` — File upload processing
- `src/lib/ai/grounded-provider.ts` — Retrieval-aware response generation
- `src/types/next-auth.d.ts` — Auth type extensions
- `src/middleware.ts` — Route protection
- `src/app/auth/signin/page.tsx` — Sign-in page
- `src/app/api/auth/[...nextauth]/route.ts` — Auth API routes
- `src/app/api/auth/signout/route.ts` — Sign-out route
- `src/app/api/sources/upload/route.ts` — File upload API
- `src/app/api/assistant/route.ts` — Assistant API
- `src/app/api/essays/route.ts` — Essay CRUD API
- `.env.example` — Environment variable template

### Modified Files
- `package.json` — Added dependencies and scripts
- `next.config.ts` — Added server external packages
- `.gitignore` — Added uploads, env patterns
- `src/app/dashboard/page.tsx` — Server component with real data
- `src/app/sources/page.tsx` — Server component with real data
- `src/app/sources/[sourceId]/page.tsx` — Server component with real data
- `src/app/assistant/page.tsx` — Server component with real data
- `src/app/essays/[essayId]/page.tsx` — Server component with real data
- `src/app/modules/[moduleId]/page.tsx` — Server component with real data
- `src/app/settings/page.tsx` — Server component with auth
- `src/app/tools/page.tsx` — Server component with auth
- `src/components/layout/shell.tsx` — Accepts user prop
- `src/components/layout/sidebar.tsx` — Shows user name and sign-out
- `src/components/layout/topbar.tsx` — Updated status badge
- `src/components/dashboard/dashboard-content.tsx` — Accepts real data props
- `src/components/sources/source-library-content.tsx` — Real data with upload UI
- `src/components/sources/source-viewer-content.tsx` — Real data with chunks
- `src/components/assistant/assistant-content.tsx` — Real retrieval integration
- `src/components/essays/essay-workspace-content.tsx` — Real data
- `src/components/modules/module-workspace.tsx` — Real data with upload
- `src/components/settings/settings-content.tsx` — Phase 1 status

## Known Limitations

1. **No real AI generation**: Assistant responses are template-based, not LLM-generated. Templates include real retrieved chunks but lack the nuance of AI synthesis.
2. **Keyword retrieval only**: No semantic search or embeddings. Retrieval quality depends on exact keyword matches.
3. **No background processing**: File upload processes synchronously. Large files may timeout.
4. **Local file storage only**: No S3/cloud storage. Not suitable for production deployment.
5. **No OAuth**: Only credentials auth. Social login requires provider configuration.
6. **No draft editing**: Essay workspace shows structure and evidence but no inline editing.
7. **No real-time updates**: Pages require refresh after data changes.
8. **Middleware deprecation warning**: Next.js 16 deprecates middleware in favour of proxy. The middleware still works but should be migrated.

## Recommended Next Phase

1. **AI Provider Integration**: Connect OpenAI/Anthropic API for real LLM responses with source grounding
2. **Vector Embeddings**: Add pgvector extension for semantic search
3. **Background Processing**: Use job queue for file processing
4. **OAuth Providers**: Add GitHub/Google login
5. **Draft Editor**: Add inline essay editing with evidence insertion
6. **Cloud Storage**: Migrate from local uploads to S3/Supabase Storage
7. **Real-time Updates**: WebSocket or server-sent events for processing status
