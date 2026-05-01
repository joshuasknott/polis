# Polis Audit

## Current State (Pre-Implementation)

Polis already has:
- Module-first workspace structure with Overview/Sources/Knowledge/Plan/Draft/Final tabs
- Source upload, text extraction, chunking with Convex vector indexing
- Knowledge pages (source briefs, concepts, theories, etc.)
- Context packs, plans, drafts, feedback — full workflow chain
- Legacy `assessments` table (simple, no user ownership, no status tracking)
- Legacy essay/tools/assistant surfaces still present but secondary

## Implemented Changes

### New Convex Tables
- **`assignments`** — First-class assignment model per module with userId ownership, type (essay/research_project/literature_review/briefing/exam/quiz/presentation/other), status (detected/approved/active/archived/dismissed), question/brief, weighting, due date, word count, marking criteria, detected-from source tracking
- **`moduleProfiles`** — Per-module profile with summary, key themes, concepts, theories, cases, assessment summary, important readings, academic expectations
- **`assignmentSourceRelevance`** — Links sources to assignments with relevance type (core/supporting/opposing/theoretical/empirical_case/methodological/background/not_relevant), notes, evidence, quotes

### Schema Updates to Existing Tables
- `contextPacks` — added optional `assignmentId`
- `plans` — added optional `assignmentId`
- `drafts` — added optional `assignmentId`
- `feedback` — added optional `assignmentId`
- Removed old `assessments` table (replaced by `assignments`)

### New Convex Functions
- `convex/assignments.ts` — listByModule, getById, create, update, approve, dismiss, archive
- `convex/moduleProfiles.ts` — getByModule, upsert, updateFields
- `convex/assignmentSourceRelevance.ts` — listByAssignment, upsert, remove

### New API Actions (via `/api/polis`)
- createAssignment, updateAssignment, approveAssignment, dismissAssignment, archiveAssignment
- upsertModuleProfile
- upsertAssignmentSourceRelevance, removeAssignmentSourceRelevance

### New UI
- **Module Profile card** in Overview — displays and edits key themes, concepts, theories, cases, assessment summary
- **Assignments card** in Overview — shows detected (awaiting approval) and active assignments, approve/dismiss actions, Add button
- **Assignment form** — create/edit assignments with title, type, question/brief, weighting, due date, word count, marking criteria
- **Assignment detail view** — shows full assignment info with links to Context/Plan, Draft, Final tabs

### New TypeScript Types
- `Assignment`, `AssignmentType`, `AssignmentStatus`
- `ModuleProfile`
- `AssignmentSourceRelevance`, `SourceRelevanceType`

## Remaining Gaps

1. **AI-powered assignment detection** — Schema supports `detected` status and `detectedFromSourceIds`, but no AI pipeline yet to auto-detect assignments from uploaded module handbooks
2. **Module profile AI generation** — Profile is manual-only; no AI to auto-generate from sources
3. **Assignment-scoped workflow routing** — `assignmentId` is stored on context packs/plans/drafts/feedback but the UI doesn't yet filter by assignment; all workflow views still operate at module level
4. **Source relevance UI** — `assignmentSourceRelevance` data model exists but no UI to set/view source relevance per assignment
5. **Codex integration** — Placeholder only; no provider implementation
6. **Old `assessments` table migration** — Schema dropped the old table; existing data in that table would need migration if any exists

## AI Intelligence Phase

### What was added

Four AI-powered actions via `/api/polis/ai` route, all using the existing OpenAI provider path through `chat()`:

1. **Module profile generation** (`generateModuleProfile`) — Gathers source text from module, prioritises module handbooks/assessment briefs, sends to AI with structured JSON prompt, upserts profile to Convex
2. **Assignment detection** (`detectAssignments`) — Analyses module sources (especially assessment types) for assignment details, creates `detected` status assignments with duplicate prevention via title matching
3. **AI source briefs** (`generateSourceBrief`) — Generates structured briefs from source text with summary, key argument, concepts, theories, cases, evidence, verbatim passages, limitations, and essay use suggestions; upserts into knowledgePages
4. **Assignment-source relevance** (`suggestAssignmentSourceRelevance`) — Reviews all module sources against an assignment and creates relevance records with typed relevance (core/supporting/opposing/theoretical/empirical_case/methodological/background/not_relevant)

### How module profile generation works

1. Fetches all sources for the module from Convex
2. Sorts by priority: module_handbook > essay_brief > marking_rubric > assessment > lecture > other
3. Takes top 15 sources, up to 2000 chars of extracted text each
4. Sends to AI with a Politics/IR-focused prompt requesting structured JSON
5. Validates JSON shape, upserts to `moduleProfiles` table

### How assignment detection works

1. Filters sources to assessment-relevant types first, falls back to all sources
2. Takes up to 10 sources, 3000 chars each
3. AI returns array of assignments with type, question, weighting, due date, word count, marking criteria
4. Duplicate prevention: normalises titles, skips if similar title already exists in any status
5. All new assignments created with `detected` status, linked to source IDs

### How source briefs work

1. Gets source by ID, requires extracted text
2. Includes module name and assessment question in prompt for relevance
3. AI returns structured brief: summary, argument, concepts, theories, cases, evidence, safe verbatim passages, relevance, limitations, essay use
4. If existing template brief exists, overwrites with AI version; otherwise creates new knowledgePage
5. Falls back to template brief if AI fails

### How assignment relevance works

1. Gets assignment details and all module sources
2. Sends source summaries (up to 20 sources, 400 chars each) with assignment question
3. AI suggests relevance type and note for each source
4. Creates/updates relevance records via upsert (won't duplicate per source-assignment pair)

### Limitations

- Token limits handled by truncating source text; very large modules may not get full coverage
- Quote extraction is best-effort; AI is instructed to only include verbatim passages but verification is not automated
- No streaming/progress UI; AI calls block until complete
- Assignment duplicate detection is title-based only, not semantic
- Relevance suggestions may be imprecise for sources with limited extracted text

### New API actions (via `/api/polis`)
- `listAssignmentSourceRelevance` — query relevance records for an assignment

### Next recommended phase

1. Assignment-scoped workflow views (filter context packs/plans/drafts by assignmentId)
2. Context pack auto-generation from assignment relevance
3. Streaming/progress indicators for long AI operations
4. Batch source brief generation
5. Dashboard assignment overview with upcoming deadlines

## Workspace Structure Phase

### Terminology change

- Modules are now presented as **Workspaces** throughout the user-facing UI
- Dashboard heading changed from "Your module workspaces" to "Your workspaces"
- Internal data model unchanged: Convex tables and code still reference `module`, `moduleId`
- No database migrations required

### Workspace layer navigation

- Left nav inside a workspace now shows the full workflow layers: **Overview, Sources, Knowledge, Context, Plan, Draft, Final**
- New **Context** layer added between Knowledge and Plan
- Context layer provides assignment-aware context pack management
- Workflow status in Overview links directly to each layer

### Settings placement

- Settings removed from main sidebar navigation
- Settings now appears in the **bottom section** of the sidebar, visually separated from workspace navigation
- Includes Settings link, user name link, and sign-out button
- Accessible from both dashboard and inside any workspace

### Assignment-scoped workflow updates

- **Context layer**: Shows assignment-specific context packs when an assignment is selected; module-level packs otherwise
- **Plan layer**: Displays assignment banner with question/brief when assignment is selected; plans store `assignmentId`
- **Draft layer**: Displays assignment banner; drafts created with assignment context use assignment title
- **Final/Feedback layer**: Displays assignment banner; feedback records store `assignmentId`
- All layers preserve `assignmentId` in navigation links

### Context pack from relevance

- New API action: `createContextPackFromAssignmentRelevance` (deterministic, not AI-first)
- Reads assignment details and `assignmentSourceRelevance` records
- Filters out `not_relevant` sources
- Groups sources by relevance type (core, supporting, opposing, theoretical, empirical, methodological, background)
- Creates a structured context pack with:
  - Assignment brief and marking criteria
  - Source map grouped by relevance type
  - Evidence and useful passages
  - Identified gaps
  - Planning notes
- Does not fabricate source details; states clearly when source briefs are thin
- Available from both Context layer and Assignment detail launchpad

### Assignment detail as launchpad

- Assignment detail now shows:
  - Full assignment info (title, type, question, weighting, due date, word count, marking criteria)
  - Source relevance with inline editing (change relevance type, edit note)
  - Status summary (sources, relevance records, context pack, plan status)
  - Action cards linking to Context, Plan, Draft, Final with `assignmentId` preserved
  - "Auto-create context" button when relevance records exist but no context pack
  - "Clear assignment / back to workspace" link

### Source relevance editing

- Inline edit capability on relevance records in assignment detail
- Can change relevance type via dropdown
- Can edit relevance note
- Can still remove records

### Navigation cleanup

- Legacy essay/tools/assistant routes still exist but are not prominent in main navigation
- Main nav is now: Dashboard/Workspaces → Workspace → Layer navigation
- Sidebar only shows "Workspaces" as main nav item

### Limitations

- Context layer does not yet auto-select the best context pack for an assignment
- Plan/Draft/Final layers show the most recent record regardless of assignment; proper assignment-scoped filtering would require additional queries
- No streaming/progress indicators for long AI operations
- Context pack from relevance uses source IDs, not titles, in the structured content (titles could be enriched in a future pass)
- Source relevance editing uses the upsert endpoint which works but is not optimised for single-field updates

### Next recommended phase

1. Assignment-scoped record filtering (list plans/drafts by assignmentId in Convex queries)
2. AI-powered context pack enrichment (use source briefs to fill in detailed content)
3. Streaming/progress indicators for long AI operations
4. Batch source brief generation
5. Dashboard assignment overview with upcoming deadlines
6. Workspace creation flow (currently relies on seed data)

## Assignment Filtering and Workspace Creation Phase

### Assignment-scoped Convex queries

Added proper assignment-scoped queries to all four workflow Convex files:

- **contextPacks**: `listByAssignment`, updated `getActive` to accept optional `assignmentId`
- **plans**: `listByAssignment`, updated `getCurrent` to accept optional `assignmentId`
- **drafts**: `listByAssignment`, updated `getCurrent` to accept optional `assignmentId`
- **feedback**: `listByAssignment`

When `assignmentId` is provided:
- `getActive`/`getCurrent` filters to only records matching that assignment
- Returns the most recent matching record

When no `assignmentId`:
- Returns the most recent module-level record (records without `assignmentId`, or all records if none have one)

### Module-level vs assignment-level behavior

- Module page (`modules/[moduleId]/page.tsx`) now passes `assignmentId` from the URL into `getActive`, `getCurrent` for context packs, plans, and drafts
- This means Plan/Draft/Final layers automatically receive assignment-scoped data
- The module page previously fetched `getActive` without assignmentId, causing the "most recent" logic to return records from any assignment

### Workspace creation flow

- New `createWorkspace` action in `/api/polis` route
- Uses existing `modules.createWithFolders` Convex mutation (creates module + default folders)
- Dashboard has a "Create workspace" button and inline form
- Fields: title (required), code (optional, auto-generated from title), description, academic year, semester
- After creation, user is redirected to the new workspace Overview
- Empty dashboard state now shows "Create your first workspace" button

### Clean workspace empty states

- Overview shows a numbered getting-started guide when no sources exist yet
- Steps: Add sources → Build knowledge → Create assignments → Build context → Plan/Draft/Final
- "Workspace details" card at top of Overview with code and stage
- "Workspace settings" card allows editing title, description, assessment question, and other fields
- Context Pack stat card now says "Create in Context" instead of "Create in Plan"

### Remaining limitations

- No workspace deletion
- No workspace template/import flow
- Dashboard still makes many parallel queries per workspace card (performance concern for many workspaces)
- AI actions still use module-level queries in some cases (e.g., `generateModuleProfile`, `detectAssignments`)
- No batch assignment overview on dashboard with deadlines

### Next recommended phase

1. AI-powered context pack enrichment (use source briefs to fill detailed content)
2. Streaming/progress indicators for long AI operations
3. Batch source brief generation
4. Dashboard assignment overview with upcoming deadlines
5. Performance: reduce dashboard query count per workspace

## External Recommendations and Codex Experimental Phase

### Recommendation model

New Convex table `externalSourceRecommendations` with fields:
- `userId`, `moduleId`, optional `assignmentId`
- `title`, `authors`, `year`, `sourceType` (book/journal_article/report/dataset/lecture_resource/website/other)
- `whyUseful`, `recommendedUse` (core/supporting/opposing/theoretical/empirical_case/methodological/background)
- `searchQuery`, `possibleCitation`, `url`, `publisherOrJournal`, `confidence`
- `status` (suggested/saved/dismissed/imported)
- Timestamps

Recommendations are NOT uploaded sources. They are leads the student should search for and evaluate.

### AI/web recommendation behavior

The `recommendExternalSources` action in `/api/polis/ai`:
1. Gathers module profile, assignment details, existing source titles, relevance records, context pack gaps
2. Sends structured context to OpenAI with a Politics/IR-focused academic prompt
3. AI returns 5-8 recommendations with titles, authors, source type, recommended use, why useful, search query, possible citation, confidence
4. Recommendations are bulk-created in Convex with `suggested` status
5. Uncertain citations are clearly labelled as `[Approximate]`

The AI does NOT perform live web searches. Recommendations are generated from the AI's training knowledge based on the module/assignment context. They are labelled as "leads to search for" rather than verified sources.

### Distinction between recommended and uploaded sources

- **Uploaded sources**: Real files in the knowledge base, with extracted text, chunks, embeddings, and source briefs
- **Recommended external sources**: AI-suggested leads stored in a separate table, with status tracking (suggested/saved/dismissed/imported)
- The Context layer clearly separates both categories with different styling (purple for recommendations)
- The "imported" status is manual-only; no automatic source creation from recommendations

### Recommendation UI

- **Assignment detail**: Full recommendation panel with generate button, focus input, recommendation cards with save/dismiss/mark imported actions
- **Context layer**: Shows saved recommendations separately from uploaded sources, with a generate button and focus input
- Recommendations show: title, authors/year, source type, recommended use, why useful, search query, confidence, citation details
- Assignment-scoped when an assignment is selected; workspace-level otherwise

### Codex experimental surface

Added to Settings → Integrations tab:
- "Codex Experimental" card with Experimental badge
- Explanation that it is for future coding/review/repo-linked workflows
- Not required for core coursework, not used for essay/content generation
- Enabled toggle, connection mode placeholder (disabled dropdown), notes field
- All fields are UI-only placeholders; no shell execution, file access, or background tasks
- Future integrations list (Zotero, Google Scholar, university library) shown as planned

### Provider restraint

- Only OpenAI is the active implemented AI provider
- Anthropic and Google Gemini appear as BYO key options in Settings but are not wired for new features
- No new provider switching system was added
- No extra providers were implemented

### Limitations

- Recommendations are AI-generated from training data, not live web search results
- Citation details may be approximate; clearly labelled when uncertain
- No automatic import of recommended sources into the knowledge base
- Codex integration is UI-only with no backend connection
- No streaming/progress indicators for recommendation generation
- No batch generation across multiple assignments

### Next recommended phase

1. Live web search integration via OpenAI Responses API web search tool (when available)
2. Batch recommendation generation across assignments
3. Streaming/progress indicators for long AI operations
4. Dashboard assignment overview with upcoming deadlines
5. Performance: reduce dashboard query count per workspace
