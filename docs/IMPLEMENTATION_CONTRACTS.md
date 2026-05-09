# Polis — Implementation Contracts

**Last updated**: 2026-05-09
**Purpose**: Canonical contracts that all implementation agents must follow. This document defines contexts, stage artifacts, backend boundaries, academic integrity guarantees, and the branch dependency map.

---

## 1. Core Invariant

**The module is the workspace. Assignments are focused production tracks inside the module.**

Assignments must consume live, refined module context:
- Module metadata and folders
- Readings and lecture/seminar material
- Module handbook/module info
- Assignment briefs and rubrics
- Source notes
- Source chunks, analyses, concepts, and claims
- Module themes
- CoThinker sessions
- Recent activity

**Never separate module context from assignment context.** An assignment that cannot see its parent module's full data is architecturally broken.

---

## 2. Product Model

```
Module → Assignment → Argument → Draft
```

### Module
The top-level workspace mirroring a university module. Contains all sources, folders, assignments, and CoThinker sessions.

### Assignment
A focused production track within a module. Has a question, rubric, deadline, selected sources, and a production stage. Consumes the full ModuleContext.

### Argument
A structured claim within an assignment, linked to evidence from sources. Contains argument nodes for hierarchical structure.

### Draft
A versioned piece of written work for an assignment, composed of draft blocks. Subject to review runs and findings.

---

## 3. Production Workflow

```
Ingest → Understand → Map → Judge → Build → Draft → Refine
```

### Stage Transition Rules
- Assignments start at `"ingest"` on creation.
- Stage transitions are user-initiated (explicit action or stage-complete trigger).
- Stages may be revisited (non-linear progression allowed).
- All stage transitions must update `assignments.updatedAt`.

---

## 4. ModuleContext

The live context available to any feature operating within a module. Assembled by `modules.getWorkspaceBundle` and extended by downstream queries.

| Context Element | Convex Table | Source Query |
|----------------|-------------|-------------|
| Module metadata | `modules` | `modules.get` |
| Folders | `folders` | `modules.getWorkspaceBundle` |
| Sources | `sources` | `modules.getWorkspaceBundle` |
| Source chunks | `sourceChunks` | `sources.listChunks` (per source) |
| Source notes | `sourceNotes` | `notes.listForSource` (per source) |
| Source analyses | `sourceAnalyses` | `sources.listAnalyses` (per source) |
| Source concepts | `sourceConcepts` | By source index |
| Source claims | `sourceClaims` | By source index |
| Assignments | `assignments` | `modules.getWorkspaceBundle` |
| CoThinker sessions | `coThinkerSessions` | `cothinker.listSessions` |
| Recent activity | Derived from `_creationTime` / `updatedAt` | Various |

---

## 5. AssignmentContext

Extends ModuleContext with assignment-scoped data. Assembled by `assignments.getWorkspaceBundle`.

| Context Element | Convex Table | Source Query |
|----------------|-------------|-------------|
| **Full ModuleContext** | All module tables | Inherited |
| Assignment metadata | `assignments` | `assignments.get` |
| Question | `assignments.question` | Included |
| Rubric | `assignments.rubric` | Included |
| Selected sources | `assignmentSources` | `assignments.getWorkspaceBundle` |
| Source notes (selected) | `sourceNotes` | `assignments.getWorkspaceBundle` |
| Arguments | `arguments` | `assignments.getWorkspaceBundle` |
| Argument nodes | `argumentNodes` | `arguments.listNodes` (per argument) |
| Evidence links | `evidenceLinks` | `assignments.getWorkspaceBundle` |
| Drafts | `drafts` | `assignments.getWorkspaceBundle` |
| Draft blocks | `draftBlocks` | `drafts.listBlocks` (per draft) |
| Review runs | `reviewRuns` | `assignments.getWorkspaceBundle` |
| Review findings | `reviewFindings` | `assignments.getWorkspaceBundle` |
| Judgement options | `judgementOptions` | By assignment index |
| Judgement decisions | `judgementDecisions` | By assignment index |
| CoThinker sessions | `coThinkerSessions` | `cothinker.listSessions` |
| CoThinker messages | `coThinkerMessages` | `cothinker.listMessages` (per session) |
| CoThinker interventions | `coThinkerInterventions` | `cothinker.listInterventions` (per session) |

---

## 6. Stage Artifact Contracts

Each production stage produces specific artifacts. Every agent building stage features must know what artifacts exist and what their schema contracts are.

### Ingest

| Artifact | Table | Status | Notes |
|----------|-------|--------|-------|
| Source uploads | `sources` + `assignmentSources` | Schema ready | `files.generateUploadUrl` → client upload → `sources.attachStorage` |
| Brief/rubric | `assignments.question`, `assignments.rubric` | Live | Set on assignment creation or update |
| Processing state | `processingJobs` | Schema ready | Needs extraction action |

**Completion signal**: At least one source selected for the assignment, brief/question set.

### Understand

| Artifact | Table | Status | Notes |
|----------|-------|--------|-------|
| Summaries | `sourceAnalyses` (analysisType: `"summary"`) | Schema ready | Needs AI action |
| Concepts | `sourceConcepts` | Schema ready | Needs AI action |
| Main arguments | `sourceAnalyses` (analysisType: `"main_argument"`) | Schema ready | Needs AI action |
| Source claims | `sourceClaims` | Schema ready | Needs AI action |
| Notes | `sourceNotes` | Live | User-created |
| Limitations | `sourceAnalyses` (analysisType: `"limitations"`) | Schema ready | Needs AI action |

**Completion signal**: All selected sources have summaries generated.

### Map

| Artifact | Table | Status | Notes |
|----------|-------|--------|-------|
| Evidence candidates | `evidenceLinks` (with `usage: "candidate"`) | Live | User or AI can create |
| Themes | `sourceAnalyses` (analysisType: `"themes"`) | Schema ready | Needs AI action |
| Source comparison | `sourceAnalyses` (analysisType: `"comparison"`) | Schema ready | Needs AI action |
| Claims cross-reference | `sourceClaims` | Schema ready | Needs AI action |
| Evidence links | `evidenceLinks` | Live | Direct evidence-to-argument linking |

**Completion signal**: At least one argument with linked evidence exists.

### Judge

| Artifact | Table | Status | Notes |
|----------|-------|--------|-------|
| Gap analysis | `judgementOptions` + `judgementDecisions` | Schema ready | Needs AI action |
| Evidence sufficiency | `judgementDecisions` (type: `"evidence_sufficiency"`) | Schema ready | Needs AI action |
| Counterarguments | `judgementDecisions` (type: `"counterargument_check"`) | Schema ready | Needs AI action |
| Rubric risks | `judgementDecisions` (type: `"rubric_risk"`) | Schema ready | Needs AI action |
| User decisions | `judgementDecisions` | Schema ready | User records their response |

**Completion signal**: User has acknowledged all critical/warning judgements.

### Build

| Artifact | Table | Status | Notes |
|----------|-------|--------|-------|
| Working thesis | `arguments` (claim + synthesis) | Live | User creates |
| Section plan | `argumentNodes` (type: `"section"`) | Live | User creates |
| Word budget | `argumentNodes` (type: `"budget"`) | Live | User creates |
| Evidence allocation | `evidenceLinks` (with `usage: "planned"`) | Live | User/AI creates |
| Counterargument plan | `argumentNodes` (type: `"counter"`) | Live | User creates |

**Completion signal**: At least one argument with synthesis and allocated evidence.

### Draft

| Artifact | Table | Status | Notes |
|----------|-------|--------|-------|
| Versioned draft | `drafts` | Live | Auto-incrementing version |
| Draft blocks | `draftBlocks` | Live | Block-level structure |
| Citations used | Derived from `evidenceLinks` + draft content | Derived | No explicit tracking table yet |
| Evidence coverage | Derived from arguments vs. draft blocks | Derived | No explicit tracking table yet |

**Completion signal**: Draft has content and word count > 0.

### Refine

| Artifact | Table | Status | Notes |
|----------|-------|--------|-------|
| Review runs | `reviewRuns` | Schema ready | Needs AI action to populate |
| Review findings | `reviewFindings` | Schema ready | Needs AI action to populate |
| Citation safety | `reviewFindings` (category: `"citation_safety"`) | Schema ready | Needs AI action |
| Readiness checklist | Derived from findings | Derived | All findings resolved = ready |
| Resolved findings | `reviewFindings.resolved` | Live | User marks resolved |

**Completion signal**: All review findings resolved, user confirms ready.

---

## 7. Backend Boundaries

### Public Queries (client-facing, read-only, reactive)

All queries are auth-gated via `getAuthIdentifier(ctx)` which calls `ctx.auth.getUserIdentity()` and returns `tokenIdentifier`. Every query must filter by `tokenIdentifier`.

| File | Queries |
|------|---------|
| `modules.ts` | list, get, listWithCounts, getWorkspaceBundle |
| `folders.ts` | list, get |
| `sources.ts` | list, get, listAnalyses, listChunks |
| `notes.ts` | listForSource |
| `assignments.ts` | list, get, listSources, getWorkspaceBundle |
| `arguments.ts` | list, get, listNodes |
| `evidence.ts` | listForArgument, listForSource, listForAssignment, listForNode |
| `drafts.ts` | list, get, getLatest, listBlocks |
| `reviews.ts` | listForDraft, get, getWithFindings, listFindings |
| `cothinker.ts` | listSessions, getSession, listMessages, listInterventions |
| `usage.ts` | listEvents |
| `ai.ts` | providerPlaceholders (placeholder) |
| `users.ts` | getProfile |

### Public Mutations (client-facing, transactional)

All mutations are auth-gated. Every mutation must verify ownership before write.

| File | Mutations |
|------|-----------|
| `modules.ts` | create, update, remove |
| `folders.ts` | create, update, remove |
| `sources.ts` | createPlaceholder, update, remove, attachStorage |
| `notes.ts` | create, update, remove |
| `assignments.ts` | create, update, updateStage, remove, addSource, removeSource |
| `arguments.ts` | create, update, remove, createNode, updateNode, removeNode |
| `evidence.ts` | create, update, remove |
| `drafts.ts` | create, update, remove, createBlock, updateBlock, removeBlock |
| `reviews.ts` | createRun, updateRun, removeRun, createFinding, updateFinding, removeFinding |
| `cothinker.ts` | createSession, updateSession, removeSession, addMessage, addIntervention, updateIntervention |
| `files.ts` | generateUploadUrl |
| `users.ts` | createOrUpdateProfile |

### Internal Mutations (system-only)

Used by actions to write data. Not exposed to clients.

| Planned | Purpose |
|---------|---------|
| `processing._insertChunks` | Write extracted chunks after text extraction |
| `processing._updateSourceStatus` | Update source processing status |
| `ai._writeAnalysis` | Write AI-generated source analysis |
| `ai._writeUsageEvent` | Log AI usage event |
| `ai._writeCoThinkerResponse` | Write AI-generated CoThinker message |
| `ai._writeReviewFindings` | Write AI-generated review findings |

### Actions (Node.js runtime, can call external APIs)

Actions run in the Node.js runtime and are the only place where external API calls (z.ai, Gemini) happen.

| Planned Action | Purpose |
|---------------|---------|
| `processing.extractText` | Extract text from uploaded file (PDF, DOCX) |
| `processing.chunkText` | Split extracted text into chunks |
| `processing.generateEmbeddings` | Generate vector embeddings for chunks |
| `ai.summarizeSource` | Generate source summary, concepts, claims |
| `ai.chat` | Generate CoThinker response with retrieval |
| `ai.reviewDraft` | Analyse draft and produce review findings |
| `ai.runJudgement` | Run gap analysis, evidence sufficiency, etc. |
| `ai.checkCitations` | Citation safety check on draft text |

### Provider Actions

| Planned Action | Provider | Purpose |
|---------------|----------|---------|
| `ai.providers.zai.chat` | z.ai / GLM | Primary chat completions |
| `ai.providers.zai.embed` | z.ai / GLM | Primary embeddings |
| `ai.providers.gemini.chat` | Google Gemini | Secondary chat completions |
| `ai.providers.gemini.embed` | Google Gemini | Secondary embeddings |

### Processing Actions (Background Pipeline)

Triggered by file upload or manual action:

```
upload → extractText → chunkText → generateEmbeddings → summarizeSource
                                                         ↓
                                                   write analyses, concepts, claims
```

### Cleanup/Cascade Jobs

| Planned | Purpose |
|---------|---------|
| `cleanup.deleteModuleCascade` | Delete module + all child entities |
| `cleanup.deleteSourceCascade` | Delete source + chunks, notes, analyses, claims, concepts |
| `cleanup.deleteAssignmentCascade` | Delete assignment + arguments, nodes, evidence, drafts, blocks, reviews, findings, judgements |
| `cleanup.deleteArgumentCascade` | Delete argument + nodes, evidence links |
| `cleanup.deleteDraftCascade` | Delete draft + blocks, review runs, findings |
| `cleanup.staleProcessingJobs` | Mark timed-out processing jobs as failed |

---

## 8. Academic Integrity Guarantees

These guarantees are non-negotiable. Every AI action must enforce them.

### Hard Rules

1. **No fake citations.** The AI must never generate author names, publication titles, or years that do not exist in the user's uploaded source base.
2. **No invented page numbers.** Every page reference in AI output must trace to an extracted chunk with a real `pageStart`/`pageEnd`.
3. **Clear labels on every claim.** AI responses must label each substantive claim as:
   - `source_supported` — Directly backed by a source chunk, with `[Source N]` citation.
   - `interpretation` — The model's reading of a source; reasonable but not explicit.
   - `general_context` — Background knowledge, not from any uploaded source.
   - `unsupported` — Claim lacks sufficient evidence in the current source base.
4. **Insufficient evidence warnings.** When retrieval returns fewer than 3 relevant chunks, or the AI detects the evidence base is thin, the response must include a warning.
5. **No essay generation.** The AI must never produce content that could be submitted as a student's own work. Draft review analyses and suggests; it does not rewrite.
6. **Harvard citation style.** Default citation format: `(Author, Year, p. X)`.
7. **User responsibility.** The student remains fully responsible for their submitted work. AI output is advisory.

### Enforcement Points

| Guarantee | Enforced At | Mechanism |
|-----------|------------|-----------|
| No fake citations | AI action (response processor) | Citation validation against retrieved chunk set |
| No invented pages | AI action (response processor) | Page range validation against chunk metadata |
| Clear labels | AI action (prompt + response processor) | Prompt instruction + label extraction |
| Evidence warnings | AI action (response processor) | Chunk count threshold + AI-flagged warnings |
| No essay generation | AI action (prompt) | System prompt prohibition + response review |
| Harvard style | AI action (prompt) | Citation format instruction |
| User responsibility | UI + docs | Disclaimer in CoThinker panel + academic integrity page |

---

## 9. Branch Dependency Map

### Architecture Branch (This Branch)

**Branch**: `chore/architecture-contracts`
**Purpose**: Define production architecture, contracts, data model, and provider strategy.
**Touches**: `docs/` only (plus AGENTS.md).
**Depends on**: `integration/production-ready` only.
**Blocks**: All other agent branches depend on this for contracts.

### Agent Branches (Future)

Each agent branch must branch from `integration/production-ready` and merge this branch's docs before starting work.

| Agent Branch | Purpose | Depends On | Touches |
|-------------|---------|------------|---------|
| `feat/convex-extraction` | File extraction + chunking actions | This branch (docs) | `convex/processing.ts`, `convex/files.ts` |
| `feat/convex-embeddings` | Vector embeddings + Convex vector search | `feat/convex-extraction` | `convex/ai/embeddings.ts`, schema vector indexes |
| `feat/convex-ai-providers` | z.ai + Gemini provider actions | This branch (docs) | `convex/ai/providers/*.ts`, `convex/ai.ts` |
| `feat/convex-cothinker-runtime` | CoThinker chat action with retrieval | `feat/convex-ai-providers`, `feat/convex-embeddings` | `convex/ai/chat.ts` |
| `feat/convex-source-analysis` | Source summarization, concepts, claims | `feat/convex-ai-providers` | `convex/ai/analysis.ts` |
| `feat/convex-draft-review` | Draft review AI action | `feat/convex-ai-providers`, `feat/convex-embeddings` | `convex/ai/review.ts` |
| `feat/convex-judgements` | Judgement generation actions | `feat/convex-ai-providers` | `convex/ai/judgements.ts` |
| `feat/ui-assignment-workspace` | Wire assignment workspace to live Convex data | This branch (docs) | `src/components/assignments/*`, `src/app/modules/[moduleId]/assignments/[assignmentId]/*` |
| `feat/ui-cothinker` | Wire CoThinker to live runtime | `feat/convex-cothinker-runtime` | `src/components/cothinker/*` |
| `chore/update-agents-md` | Update AGENTS.md to reflect Convex + Clerk | This branch (docs) | `AGENTS.md` |

### Integration Order

```
1. chore/architecture-contracts (this branch)
2. feat/convex-ai-providers (parallel with extraction)
3. feat/convex-extraction → feat/convex-embeddings
4. feat/convex-source-analysis (depends on providers)
5. feat/convex-cothinker-runtime (depends on providers + embeddings)
6. feat/convex-draft-review (depends on providers + embeddings)
7. feat/convex-judgements (depends on providers)
8. feat/ui-assignment-workspace (can start early, parallel with backend)
9. feat/ui-cothinker (depends on cothinker runtime)
10. chore/update-agents-md (after all contracts are proven)
```

---

## 10. Convex Coding Conventions

All agents writing Convex code must follow these conventions:

1. **Auth gating**: Every public query and mutation must call `getAuthIdentifier(ctx)` from `convex/lib/auth.ts`. Never accept a `userId` argument.
2. **Ownership check**: Every mutation must verify `doc.tokenIdentifier === tokenIdentifier` before reading or writing.
3. **No `filter()` in queries**: Use indexed queries with `withIndex()` only.
4. **Bounded results**: Always use `.take(n)` or `.paginate()`. Never use `.collect()` for unbounded sets.
5. **Timestamps**: Use `Date.now()` for all timestamps. Store as `v.number()`.
6. **Separate actions from queries/mutations**: Actions that use Node.js (`"use node"`) must be in their own files. Never mix `action` with `query` or `mutation` in the same file.
7. **No `ctx.db` in actions**: Actions cannot access the database directly. Use `ctx.runQuery` and `ctx.runMutation`.
8. **Array size limits**: Convex documents have a 1MB limit. Never store unbounded arrays. Use separate tables for child collections.
9. **Index naming**: Always include all index fields in the index name: `by_tokenIdentifier_and_module`.
10. **Types**: Use `Id<"tableName">` for IDs, `Doc<"tableName">` for document types.
