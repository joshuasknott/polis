# Polis — Data Model

**Last updated**: 2026-05-09
**Authority**: This document reflects the live Convex schema at `convex/schema.ts`.
**Backend**: Convex. Prisma/PostgreSQL references are historical.

## Product Model

```
Module → Assignment → Argument → Draft
```

## Production Stages

```
Ingest → Understand → Map → Judge → Build → Draft → Refine
```

Represented as `ProductionStage` type in `src/lib/types.ts`. Stored as `v.string()` in the `assignments` table `stage` field.

## Convex Schema (27 Tables)

### User & Auth

#### userProfiles
```
userProfiles {
  tokenIdentifier: string          // Clerk JWT tokenIdentifier (primary key)
  email?: string
  name?: string
  image?: string
  university?: string
  course?: string
  yearOfStudy?: number
  preferences?: any
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_tokenIdentifier`, `by_email`

### Module & Organisation

#### modules
```
modules {
  tokenIdentifier: string
  title: string
  code: string
  description?: string
  academicYear?: string
  semester?: string
  colour?: string
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_tokenIdentifier`
Maps to a university module (e.g., "International Security" / PIRR30041).

#### folders
```
folders {
  tokenIdentifier: string
  moduleId: Id<"modules">
  parentFolderId?: Id<"folders">
  name: string
  type: string                   // module_info, readings, lecture_material, source_notes, assignments, drafts_reviews, submissions, custom
  sortOrder: number
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_module`, `by_tokenIdentifier`
Default folders created on module creation: Module Info, Readings, Lecture and Seminar Material, Source Notes, Assignments, Drafts and Reviews, Submissions.

### Sources & Content

#### sources
```
sources {
  tokenIdentifier: string
  moduleId: Id<"modules">
  folderId?: Id<"folders">
  title: string
  authors?: string
  year?: number
  type: string                   // journal_article, book_chapter, lecture_slides, module_handbook, assignment_brief, marking_rubric, seminar_notes, draft, book, report, news_article
  status: string                 // placeholder, processing, processed, needs_review, failed
  fileName?: string
  fileType?: string
  fileSize?: number
  storageId?: Id<"_storage">
  citation?: string
  summary?: string
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_tokenIdentifier`, `by_tokenIdentifier_and_module`, `by_module`, `by_folder`

#### sourceChunks
```
sourceChunks {
  sourceId: Id<"sources">
  chunkIndex: number
  text: string
  pageStart?: number
  pageEnd?: number
  tokenEstimate?: number
  createdAt: number
}
```
Indexes: `by_source`

#### sourceNotes
```
sourceNotes {
  tokenIdentifier: string
  sourceId: Id<"sources">
  content: string
  tags?: string[]
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_source`, `by_tokenIdentifier`

#### sourceAnalyses
```
sourceAnalyses {
  tokenIdentifier: string
  sourceId: Id<"sources">
  assignmentId?: Id<"assignments">
  analysisType: string           // summary, main_argument, limitations, themes, comparison
  content: string
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_source`, `by_assignment`, `by_source_and_type`

#### sourceClaims
```
sourceClaims {
  tokenIdentifier: string
  sourceId: Id<"sources">
  claim: string
  context?: string
  pageRange?: string
  strength?: string              // strong, moderate, weak
  createdAt: number
}
```
Indexes: `by_source`

#### sourceConcepts
```
sourceConcepts {
  tokenIdentifier: string
  sourceId: Id<"sources">
  concept: string
  definition?: string
  relevance?: string
  createdAt: number
}
```
Indexes: `by_source`

### Assignments & Production

#### assignments
```
assignments {
  tokenIdentifier: string
  moduleId: Id<"modules">
  title: string
  question?: string
  wordLimit?: number
  dueDate?: string
  rubric?: Array<{ name: string, description: string, weight: number }>
  stage: string                  // ingest, understand, map, judge, build, draft, refine
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_tokenIdentifier`, `by_tokenIdentifier_and_module`, `by_module`, `by_module_and_stage`

#### assignmentSources
```
assignmentSources {
  tokenIdentifier: string
  assignmentId: Id<"assignments">
  sourceId: Id<"sources">
  addedAt: number
}
```
Indexes: `by_assignment`, `by_source`, `by_assignment_and_source`

### Arguments & Evidence

#### arguments
```
arguments {
  tokenIdentifier: string
  assignmentId: Id<"assignments">
  claim: string
  synthesis?: string
  sortOrder: number
  status?: string
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_tokenIdentifier`, `by_assignment`

#### argumentNodes
```
argumentNodes {
  tokenIdentifier: string
  argumentId: Id<"arguments">
  type: string                   // claim, support, counter, section, budget, etc.
  content: string
  parentId?: Id<"argumentNodes">
  sortOrder: number
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_argument`

#### evidenceLinks
```
evidenceLinks {
  tokenIdentifier: string
  argumentId: Id<"arguments">
  argumentNodeId?: Id<"argumentNodes">
  sourceId: Id<"sources">
  sourceClaimId?: Id<"sourceClaims">
  quote?: string
  pageRange?: string
  usage?: string                 // candidate, planned, used
  strength: string               // strong, moderate, weak
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_argument`, `by_source`, `by_argumentNodeId`

### Drafts & Reviews

#### drafts
```
drafts {
  tokenIdentifier: string
  assignmentId: Id<"assignments">
  version: number
  content?: string
  wordCount?: number
  status?: string
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_assignment`, `by_tokenIdentifier`
Version auto-increments on creation.

#### draftBlocks
```
draftBlocks {
  tokenIdentifier: string
  draftId: Id<"drafts">
  blockType: string
  content?: string
  argumentId?: Id<"arguments">
  sortOrder: number
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_draft`

#### reviewRuns
```
reviewRuns {
  tokenIdentifier: string
  draftId: Id<"drafts">
  status: string                 // pending, running, complete, failed
  overallFeedback?: string
  rubricAlignment?: string
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_draft`, `by_status`

#### reviewFindings
```
reviewFindings {
  tokenIdentifier: string
  reviewRunId: Id<"reviewRuns">
  category: string               // strength, weakness, missing_evidence, unsupported_claim, revision_priority, citation_safety
  content: string
  severity?: string              // info, warning, critical
  resolved?: boolean
  resolvedAt?: number
  createdAt: number
}
```
Indexes: `by_reviewRun`, `by_reviewRun_and_category`

### Judgements

#### judgementOptions
```
judgementOptions {
  tokenIdentifier: string
  assignmentId: Id<"assignments">
  type: string                   // gap_analysis, evidence_sufficiency, counterargument_check, rubric_risk, citation_safety
  question: string
  createdAt: number
}
```
Indexes: `by_assignment`

#### judgementDecisions
```
judgementDecisions {
  tokenIdentifier: string
  assignmentId: Id<"assignments">
  judgementOptionId?: Id<"judgementOptions">
  type: string
  content: string
  severity: string               // info, warning, critical
  createdAt: number
}
```
Indexes: `by_assignment`, `by_judgementOption`

### CoThinker

#### coThinkerSessions
```
coThinkerSessions {
  tokenIdentifier: string
  moduleId?: Id<"modules">
  assignmentId?: Id<"assignments">
  sourceId?: Id<"sources">
  title: string
  scope: string                  // whole_module, current_folder, selected_sources, assignment
  stage?: string
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_tokenIdentifier`, `by_tokenIdentifier_and_module`, `by_tokenIdentifier_and_assignment`, `by_module`, `by_assignment`

#### coThinkerMessages
```
coThinkerMessages {
  tokenIdentifier: string
  sessionId: Id<"coThinkerSessions">
  role: string                   // user, assistant, system
  content: string
  citedChunkIds?: Array<Id<"sourceChunks">>
  labels?: string[]              // source_supported, interpretation, general_context, unsupported
  warnings?: string[]
  followUpSuggestions?: string[]
  createdAt: number
}
```
Indexes: `by_session`

#### coThinkerInterventions
```
coThinkerInterventions {
  tokenIdentifier: string
  sessionId: Id<"coThinkerSessions">
  type: string
  content: string
  resolved?: boolean
  resolvedAt?: number
  createdAt: number
}
```
Indexes: `by_session`

### Infrastructure

#### processingJobs
```
processingJobs {
  tokenIdentifier: string
  sourceId?: Id<"sources">
  type: string
  status: string                 // pending, running, complete, failed
  errorMessage?: string
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_tokenIdentifier`, `by_source`, `by_status`

#### aiProviderConnections
```
aiProviderConnections {
  tokenIdentifier: string
  provider: string               // zai, gemini
  status: string                 // connected, disconnected, error
  modelPreference?: string
  encryptedCredentialRef?: string
  createdAt: number
  updatedAt: number
}
```
Indexes: `by_tokenIdentifier`, `by_tokenIdentifier_and_provider`

#### usageEvents
```
usageEvents {
  tokenIdentifier: string
  provider?: string
  model?: string
  type: string
  tokensIn?: number
  tokensOut?: number
  costEstimate?: number
  metadata?: any
  createdAt: number
}
```
Indexes: `by_tokenIdentifier`, `by_type`

## Relationships

```
Clerk Identity (tokenIdentifier) 1→* Everything

modules 1→* folders
modules 1→* sources
modules 1→* assignments
modules 1→* coThinkerSessions

folders →* sources (optional grouping)

sources 1→* sourceChunks
sources 1→* sourceNotes
sources 1→* sourceAnalyses
sources 1→* sourceClaims
sources 1→* sourceConcepts

assignments *→* sources (via assignmentSources)
assignments 1→* arguments
assignments 1→* drafts
assignments 1→* judgementOptions
assignments 1→* judgementDecisions
assignments 1→* coThinkerSessions

arguments 1→* argumentNodes
arguments 1→* evidenceLinks

argumentNodes 1→* argumentNodes (parent-child)
argumentNodes 1→* evidenceLinks

evidenceLinks *→1 sources
evidenceLinks *→? sourceClaims

drafts 1→* draftBlocks
drafts 1→* reviewRuns

reviewRuns 1→* reviewFindings

draftBlocks *→? arguments

coThinkerSessions 1→* coThinkerMessages
coThinkerSessions 1→* coThinkerInterventions

coThinkerMessages *→* sourceChunks (via citedChunkIds)
```

## Backend Implementation

- **Engine**: Convex
- **Active schema**: `convex/schema.ts`
- **Auth**: Clerk → `convex/auth.config.ts` → `ctx.auth.getUserIdentity()` → `tokenIdentifier`
- **Current scope**: Full CRUD for all 27 tables. No AI actions, no extraction, no embeddings yet.
- **Pending**: File extraction, text chunking, embedding generation, vector search, AI provider actions, source analysis actions, CoThinker runtime, draft review AI, judgement generation, rate limiting, usage tracking writes.
