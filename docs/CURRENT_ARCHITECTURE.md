# Polis — Current Architecture

**Last updated**: 2026-06-21
**Status**: Authoritative — this document supersedes stale references in AGENTS.md and older phase docs.

## Product Direction

Polis is an AI-native module operating system for students. Create a workspace from a module name → import everything → Polis classifies and extracts → assessment dashboard → work inside an assessment (Plan / Write / Review) with source-backed AI, including powerful writing help.

The runtime stack below is the substrate for that experience. The internal data model (Module / Assignment / Argument / Draft) is unchanged; user-facing language is Workspace / Assessment / Evidence Map / Plan / Write / Review. See `docs/PRODUCT_VISION.md`.

## Runtime Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS v4 | Active |
| Backend | Convex (schema, queries, mutations, actions, storage) | Active |
| Auth | Clerk (sign-in, sign-up, JWT templates → Convex identity) | Active |
| AI (primary) | z.ai / GLM (ZhipuAI) | Active — actions in convex/ |
| AI (secondary) | Google Gemini (free API key) | Active — actions in convex/ |
| Dev tools | GPT Plus Codex, GitHub Copilot Student | Development only — not runtime providers |
| File storage | Convex storage (`ctx.storage`) | Active |
| Embeddings/Retrieval | Convex vector search | Keyword retrieval live; vector search planned |

## What Is Live

The following are wired end-to-end with Convex + Clerk:

- **Auth**: Clerk sign-in/sign-up pages, `ConvexProviderWithClerk`, `convex/auth.config.ts` validating Clerk JWTs, `ctx.auth.getUserIdentity()` → `tokenIdentifier` for all data access.
- **User profiles**: `userProfiles` table, `convex/users.ts` CRUD, keyed by `tokenIdentifier`.
- **Modules**: `modules` table, `convex/modules.ts` — list, get, create, update, remove, listWithCounts, getWorkspaceBundle. The workspace bundle includes sources, folders, assignments, import batches/files, AI action history, relevance signals, and gap signals.
- **Folders/source groups**: `folders` table, `convex/folders.ts` — list, create, update, remove. New workspaces create Module Info, Readings, Lecture Material, and Briefs/Rubrics source groups. All Sources and Needs Review are virtual groups inside Sources. Custom folders remain supported.
- **Sources**: `sources` table, `convex/sources.ts` — list, get, createPlaceholder, update, remove, attachStorage, listAnalyses, listChunks. Import-created sources keep optional `batchId` and `importedFileId` links back to raw uploads.
- **Source chunks**: `sourceChunks` table, `convex/ingestion/lib.ts` — text chunking from extracted content.
- **Source notes**: `sourceNotes` table, `convex/notes.ts` — listForSource, create, update, remove.
- **Assignments**: `assignments` table, `convex/assignments.ts` — list, get, create, update, updateStage, remove, listSources, addSource, removeSource, getWorkspaceBundle. Stage defaults to `"ingest"`.
- **Assignment-source links**: `assignmentSources` join table.
- **Source analyses**: `sourceAnalyses` table, `convex/sourceAnalyses.ts` + `convex/sourceAnalysisAI.ts` — CRUD and AI-powered summaries, arguments, limitations, concepts, claims, and import-time source context.
- **Source claims**: `sourceClaims` table. Import-time source context analysis can create chunk-traced claims with confidence/provenance.
- **Source concepts**: `sourceConcepts` table. Import-time source context analysis can create chunk-traced concepts with confidence/provenance.
- **Source relevance and gap signals**: `sourceRelevanceSignals` and `sourceGapSignals` tables store source-traced signals created during import-time source context analysis.
- **Arguments**: `arguments` table, `convex/arguments.ts` — list, get, create, update, remove, listNodes, createNode, updateNode, removeNode.
- **Argument nodes**: `argumentNodes` table — typed nodes within an argument tree.
- **Evidence links**: `evidenceLinks` table, `convex/evidence.ts` — listForArgument, listForSource, create, update, remove, listForAssignment, listForNode.
- **Drafts**: `drafts` table, `convex/drafts.ts` — list, get, getLatest, create, update, remove. Auto-increments version. Includes `draftBlocks` sub-table.
- **Draft blocks**: `draftBlocks` table — block-level draft structure with argumentId linkage.
- **Reviews**: `reviewRuns` + `reviewFindings` tables, `convex/reviews.ts` — full CRUD for runs and findings.
- **CoThinker sessions**: `coThinkerSessions` table, `convex/cothinker.ts` — listSessions, getSession, createSession, updateSession, removeSession. Scoped to module/assignment/source.
- **CoThinker messages**: `coThinkerMessages` table — listMessages, addMessage. Includes citedChunkIds, labels, warnings, followUpSuggestions.
- **CoThinker interventions**: `coThinkerInterventions` table — listInterventions, addIntervention, updateIntervention.
- **Processing jobs**: `processingJobs` table tracks source extraction/chunking status.
- **AI action log**: `aiActions` table records visible AI/system actions from imports and source context generation, including provenance, auto-apply status, reversibility, and undo state.
- **AI provider connections**: `aiProviderConnections` table, `convex/ai_keys.ts` + `convex/ai_providers.ts` — encrypted key storage, validation, per-user resolution, provider selection.
- **AI chat**: `convex/ai.ts` — `chat` action calling z.ai or Gemini with system prompt and message history.
- **Usage events**: `usageEvents` table, `convex/usage.ts` — listEvents query. Events written by `ai_keys.internalLogUsage`.
- **Rate limiting**: `convex/rateLimits.ts` — usage-based rate limit checks before AI calls.
- **Observability**: `convex/observability.ts` — error tracking and logging for AI actions.
- **File upload**: `convex/files.ts` — `generateUploadUrl` mutation for Convex storage. The primary UI path is batch import: create batch -> upload raw files -> register imported files -> process batch.
- **File extraction**: `convex/ingestion/process.ts` — text extraction from PDF/DOCX after upload.
- **Text chunking**: `convex/ingestion/lib.ts` — split extracted text into `sourceChunks`.
- **Source analysis AI**: `convex/sourceAnalysisAI.ts` — auto-generate summaries, concepts, claims, relevance signals, and soft gap signals from sources. Import-time analysis writes structured, reversible outputs through internal mutations.
- **Retrieval**: `convex/retrieval.ts` — keyword search across source chunks.
- **Citation safety**: `convex/citationSafety.ts` — citation integrity checks and badge logic.
- **CoThinker runtime**: `convex/cothinker_ask.ts` — AI-powered CoThinker responses with retrieval grounding.
- **Draft review AI**: `convex/reviews.ts` — `runReview` action with AI analysis + template fallback.
- **Judgements**: `convex/judgements.ts` — manual CRUD for gap analysis and evidence sufficiency.
- **Cleanup cascades**: `convex/cleanup.ts` — recursive `deleteAll` for entity deletion with cascading removes. Includes module, source, assignment, draft, and import batch cascades. Extraction tables (moduleFacts, assessmentSpecs, extractedRubricCriteria, weeklyTopics, requiredReadings) are cleaned up in module and batch cascades.
- **Import batches**: `importBatches` + `importedFiles` tables, `convex/imports.ts` + `convex/importClassification.ts` — batch file import with raw upload retention, AI classification, conversion to sources, extraction/chunking, context extraction, source analysis, review status, and visible/reversible AI action logging.
- **Assessment spec extraction**: `assessmentSpecs` + `extractedRubricCriteria` tables, `convex/extraction.ts` + `convex/extractionAI.ts` — AI-powered extraction of assessment titles, questions, deadlines, weights, word limits, referencing rules, submission formats, and rubric criteria from classified sources. Every field carries provenance (source chunk, page range, confidence) and uncertainty flags. Extracted specs start as `"extracted"` (pending) and are applied to live assignments via review mutations.
- **Module fact extraction**: `moduleFacts` table, `convex/extraction.ts` + `convex/extractionAI.ts` — AI-powered extraction of module themes, concepts, learning outcomes, integrity guidance, referencing rules, and submission format from handbooks/syllabi. Each fact has provenance + uncertainty. Applied to module fields via `extraction.applyModuleFact`.
- **Weekly topic extraction**: `weeklyTopics` table, `convex/extraction.ts` — AI-extracted weekly schedule topics with provenance. Review/apply/reject per topic.
- **Required readings extraction**: `requiredReadings` table, `convex/extraction.ts` — AI-extracted required and recommended readings (distinguished by `kind`). Review/apply/reject per reading. Apply optionally creates a placeholder source.
- **Extraction review/confirm**: `convex/extraction.ts` — `applyAssessmentSpec` (creates/updates live assignment from extracted spec), `rejectAssessmentSpec`, `applyModuleFact` (updates module fields), `rejectModuleFact`, `applyWeeklyTopic`, `rejectWeeklyTopic`, `applyRequiredReading`, `rejectRequiredReading`, `rejectAllForFile`. Pending extracted data is visible, source-traced, and reversible. Live module/assignment application still requires student confirmation.

## What Is Not Live (Paused/Planned)

These capabilities have schema support but no runtime implementation:

- **Embedding generation**: No action to generate or store vector embeddings.
- **Vector search**: No Convex vector index or hybrid retrieval pipeline.
- **Judgement AI generation**: Judgements have manual CRUD only; no AI action for automated gap analysis or counterargument checks.

## Historical References (Do Not Trust)

The following references in existing docs describe the old Prisma/Auth.js/PostgreSQL stack and are **historical only**:

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
| AI writing help | Allowed | Drafting, paraphrasing, critique, restructuring, revision — bounded by source-truth and labelling |
| Fabricated citations / pages / misattribution | Hard error | Validation truth: never produced, never treated as valid |
| Insufficient evidence / unsupported claims | Soft warning | Warn and label; do not block the user |
| Standalone CoThinker / Workbench destinations | Deprecated | Capabilities are embedded in context where the student is working |

## File Structure (Current)

```
convex/
  _generated/            # Auto-generated Convex bindings
  lib/
    auth.ts              # getAuthIdentifier helper
    retrieval.ts         # Shared retrieval utilities
    integrity.ts         # Academic integrity helpers
    citation.ts          # Citation format helpers
  ingestion/
    process.ts           # File extraction (PDF/DOCX)
    lib.ts               # Text chunking
  schema.ts              # Convex schema (32 tables)
  auth.config.ts         # Clerk JWT validation config
  modules.ts             # Module CRUD + workspace bundle
  folders.ts             # Folder CRUD
  sources.ts             # Source CRUD + storage + analyses + chunks
  notes.ts               # Source note CRUD
  assignments.ts         # Assignment CRUD + source links + workspace bundle
  arguments.ts           # Argument + argument node CRUD
  evidence.ts            # Evidence link CRUD
  drafts.ts              # Draft + draft block CRUD
  reviews.ts             # Review run + finding CRUD + runReview AI action
  cothinker.ts           # CoThinker session + message + intervention CRUD
  cothinker_ask.ts       # CoThinker AI runtime with retrieval
  files.ts               # Upload URL generation
  ai.ts                  # AI chat action (z.ai/Gemini)
  ai_keys.ts             # API key storage + encryption + resolution
  ai_providers.ts        # Provider selection and configuration
  ai_prompts.ts          # System prompt templates
  ai_crypto.ts           # Encryption/decryption for API keys
  ai_zai.ts              # z.ai/GLM provider action
  ai_gemini.ts           # Google Gemini provider action
  rateLimits.ts          # Rate limiting via usage tracking
  observability.ts       # Error tracking and logging
  cleanup.ts             # Cascade delete actions
  retrieval.ts           # Keyword search across source chunks
  citation.ts            # Citation CRUD
  citationSafety.ts      # Citation integrity checks
  sourceAnalyses.ts      # Source analysis CRUD
  sourceAnalysisAI.ts    # AI-powered source analysis
  judgements.ts          # Judgement CRUD (manual)
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
