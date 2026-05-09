# Polis — Current Architecture

**Last updated**: 2026-05-09
**Status**: Authoritative — this document supersedes stale references in AGENTS.md and older phase docs.

## Runtime Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS v4 | Active |
| Backend | Convex (schema, queries, mutations, actions, storage) | Active |
| Auth | Clerk (sign-in, sign-up, JWT templates → Convex identity) | Active |
| AI (primary) | z.ai / GLM (ZhipuAI) | Planned — no runtime integration yet |
| AI (secondary) | Google Gemini (free API key) | Planned — no runtime integration yet |
| Dev tools | GPT Plus Codex, GitHub Copilot Student | Development only — not runtime providers |
| File storage | Convex storage (`ctx.storage`) | Active |
| Embeddings/Retrieval | Convex vector search | Not yet built |

## What Is Live

The following are wired end-to-end with Convex + Clerk:

- **Auth**: Clerk sign-in/sign-up pages, `ConvexProviderWithClerk`, `convex/auth.config.ts` validating Clerk JWTs, `ctx.auth.getUserIdentity()` → `tokenIdentifier` for all data access.
- **User profiles**: `userProfiles` table, `convex/users.ts` CRUD, keyed by `tokenIdentifier`.
- **Modules**: `modules` table, `convex/modules.ts` — list, get, create, update, remove, listWithCounts, getWorkspaceBundle. Default folders created on module creation.
- **Folders**: `folders` table, `convex/folders.ts` — list, get, create, update, remove. Indexed by module and tokenIdentifier.
- **Sources**: `sources` table, `convex/sources.ts` — list, get, createPlaceholder, update, remove, attachStorage, listAnalyses, listChunks. Placeholder sources exist without files; `attachStorage` links a Convex storage ID after upload.
- **Source chunks**: `sourceChunks` table. Schema exists. No extraction action yet.
- **Source notes**: `sourceNotes` table, `convex/notes.ts` — listForSource, create, update, remove.
- **Assignments**: `assignments` table, `convex/assignments.ts` — list, get, create, update, updateStage, remove, listSources, addSource, removeSource, getWorkspaceBundle. Stage defaults to `"ingest"`.
- **Assignment-source links**: `assignmentSources` join table.
- **Source analyses**: `sourceAnalyses` table. Schema exists. No analysis action yet.
- **Source claims**: `sourceClaims` table. Schema exists. No extraction action yet.
- **Source concepts**: `sourceConcepts` table. Schema exists. No extraction action yet.
- **Arguments**: `arguments` table, `convex/arguments.ts` — list, get, create, update, remove, listNodes, createNode, updateNode, removeNode.
- **Argument nodes**: `argumentNodes` table — typed nodes within an argument tree.
- **Evidence links**: `evidenceLinks` table, `convex/evidence.ts` — listForArgument, listForSource, create, update, remove, listForAssignment, listForNode.
- **Drafts**: `drafts` table, `convex/drafts.ts` — list, get, getLatest, create, update, remove. Auto-increments version. Includes `draftBlocks` sub-table.
- **Draft blocks**: `draftBlocks` table — block-level draft structure with argumentId linkage.
- **Reviews**: `reviewRuns` + `reviewFindings` tables, `convex/reviews.ts` — full CRUD for runs and findings.
- **CoThinker sessions**: `coThinkerSessions` table, `convex/cothinker.ts` — listSessions, getSession, createSession, updateSession, removeSession. Scoped to module/assignment/source.
- **CoThinker messages**: `coThinkerMessages` table — listMessages, addMessage. Includes citedChunkIds, labels, warnings, followUpSuggestions.
- **CoThinker interventions**: `coThinkerInterventions` table — listInterventions, addIntervention, updateIntervention.
- **Processing jobs**: `processingJobs` table. Schema exists. No processing action yet.
- **AI provider connections**: `aiProviderConnections` table. Schema exists. `convex/ai.ts` has a placeholder query only.
- **Usage events**: `usageEvents` table, `convex/usage.ts` — listEvents query. No event-writing action yet.
- **File upload**: `convex/files.ts` — `generateUploadUrl` mutation for Convex storage.

## What Is Not Live (Paused/Planned)

These capabilities have schema support but no runtime implementation:

- **File extraction**: No action to extract text from PDF/DOCX after upload.
- **Text chunking**: No action to split extracted text into `sourceChunks`.
- **Embedding generation**: No action to generate or store vector embeddings.
- **Vector search**: No Convex vector index or hybrid retrieval pipeline.
- **AI provider calls**: No action that calls z.ai, Gemini, OpenAI, or any LLM. `convex/ai.ts` returns a placeholder.
- **Source analysis**: No action to auto-generate summaries, concepts, claims, or main arguments.
- **CoThinker runtime**: Sessions, messages, and interventions can be created manually, but no AI action generates responses.
- **Draft review AI**: Review runs and findings can be created manually, but no AI action analyses drafts.
- **Judgement generation**: No AI action for gap analysis, evidence sufficiency, counterargument checks.
- **Rate limiting**: No implementation.
- **Usage tracking**: Events can be queried but nothing writes them.
- **API key management**: Schema exists for `aiProviderConnections`, but no encryption, validation, or resolution logic.

## Historical References (Do Not Trust)

The following references in existing docs describe the old Prisma/Auth.js/PostgreSQL stack and are **historical only**:

- AGENTS.md "Tech Stack" section lists PostgreSQL + Prisma 7, Auth.js v5, @aws-sdk/client-s3, pdf-parse, mammoth, @google/generative-ai.
- AGENTS.md "Architecture" section references `src/lib/services/`, `src/lib/ai/`, `src/lib/auth.ts`, `src/lib/db.ts`, `src/lib/crypto.ts`.
- AGENTS.md "Commands" section references `db:generate`, `db:push`, `db:migrate`, `db:seed`, `db:studio`.
- AGENTS.md "File Structure" references `prisma/schema.prisma`, `src/lib/services/*`, `src/lib/ai/*`, `src/types/next-auth`.
- `docs/AI_PROVIDER_STRATEGY.md` references OpenAI/Anthropic/Gemini as "Active" providers with `src/lib/ai/*` implementation files.
- `docs/RAG_ARCHITECTURE.md` references pgvector, PostgreSQL, `POST /api/tools/*` endpoints.
- `docs/ROADMAP.md` Phase 1-3 deliverables reference Prisma, Auth.js, PostgreSQL, pgvector.
- `docs/MVP_SCOPE.md` Phase 3 references OAuth, per-user BYO keys, S3 storage, rate limiting.

These are superseded by this document and the updated versions of those docs on this branch.

## Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend | Convex | Real-time sync, serverless functions, built-in storage, type-safe |
| Auth | Clerk | Managed auth with JWT templates that flow identity into Convex |
| AI primary | z.ai / GLM | Cost-effective, powerful, available to the team |
| AI secondary | Gemini free | No-cost fallback for users without z.ai keys |
| Dev AI tools | Codex + Copilot | Development productivity, not runtime integration |
| Citation style | Harvard | Default for social science coursework |
| AI summaries | Allowed | Source summaries are a permitted AI use |
| Essay generation | Prohibited | Academic integrity boundary |

## File Structure (Current)

```
convex/
  _generated/            # Auto-generated Convex bindings
  ai/                    # (planned) AI provider actions
  lib/
    auth.ts              # getAuthIdentifier helper
  schema.ts              # Convex schema (27 tables)
  auth.config.ts         # Clerk JWT validation config
  modules.ts             # Module CRUD + workspace bundle
  folders.ts             # Folder CRUD
  sources.ts             # Source CRUD + storage + analyses + chunks
  notes.ts               # Source note CRUD
  assignments.ts         # Assignment CRUD + source links + workspace bundle
  arguments.ts           # Argument + argument node CRUD
  evidence.ts            # Evidence link CRUD
  drafts.ts              # Draft + draft block CRUD
  reviews.ts             # Review run + finding CRUD
  cothinker.ts           # CoThinker session + message + intervention CRUD
  files.ts               # Upload URL generation
  ai.ts                  # Placeholder query
  usage.ts               # Usage event query
  users.ts               # User profile CRUD

src/
  app/
    layout.tsx           # Root layout with Clerk + Convex providers
    convex-provider.tsx  # ConvexProviderWithClerk
    page.tsx             # Landing page
    dashboard/           # Dashboard (Convex-backed)
    modules/[moduleId]/  # Module workspace (Convex-backed)
    modules/[moduleId]/assignments/[assignmentId]/  # Assignment workspace
    sources/             # Source library (Convex-backed)
    sources/[sourceId]/  # Source viewer (Convex-backed)
    sign-in/             # Clerk sign-in
    sign-up/             # Clerk sign-up
    assistant/           # Placeholder
    essays/[essayId]/    # Redirect → assignment workspace
    tools/               # Placeholder
    settings/            # Placeholder
    auth/signin/         # Legacy sign-in (unused with Clerk)
  components/            # React components by feature
  lib/
    types.ts             # TypeScript type definitions
    utils.ts             # Utility functions
    convex-ui-mappers.ts # Maps Convex docs → UI types
```
