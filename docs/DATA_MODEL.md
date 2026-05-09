# Polis — Data Model

## Current Backend Status

Polis is migrating from the old Prisma/PostgreSQL backend to Convex. The active foundational schema now lives in `convex/schema.ts`; this document is the authoritative product-level model reference and will be reconciled as Convex-backed features are rebuilt.

## Product Model

```
Module → Assignment → Argument → Draft
```

## Production Stages

Every assignment progresses through:

```
Ingest → Understand → Map → Judge → Build → Draft → Refine
```

Represented as `ProductionStage` union in `convex/lib/validators.ts` and `src/lib/types.ts`.

## Core Invariant

The module is the workspace. Assignments must consume live module context. Never split module and assignment context.

## Core Entities

### User
```
User {
  id: string
  name: string
  email: string
  university: string
  course: string
  yearOfStudy: number
  createdAt: string
}
```

### Module
```
Module {
  id: string
  title: string
  code: string
  academicYear: string
  semester: string
  description: string
  color: string
  themes: string[]            // module-level themes (context)
  concepts: string[]          // module-level concepts (context)
  learningOutcomes: string[]  // module learning outcomes (context)
  contextVersion?: number     // incremented on context change; optional during migration
  contextUpdatedAt?: number   // timestamp of last context change; optional during migration
  sourceCount: number
  assignmentCount: number
  noteCount: number
  lastActivityAt: string
}
```
Maps to a university module (e.g., "International Security" / PIRR30041).

### Folder
```
Folder {
  id: string
  moduleId: string → Module
  parentFolderId: string | null → Folder
  name: string
  type: FolderType
  sortOrder: number
  sourceCount: number
}
```
Default folders per module: Module Info, Readings, Lecture Material, Source Notes, Assignments, Drafts & Reviews, Submissions.

**FolderType**: `module_info | readings | lecture_material | source_notes | assignments | drafts_reviews | submissions | custom`

### SourceFile
```
SourceFile {
  id: string
  moduleId: string → Module
  folderId: string | null → Folder
  title: string
  author: string
  year: number | null
  type: SourceType
  status: SourceStatus
  tags: string[]
  citation: string
  pageCount: number
  uploadedAt: string
  summary: string
  mainArgument: string
  keyConcepts: string[]
}
```

**SourceType**: `journal_article | book_chapter | lecture_slides | module_handbook | assignment_brief | marking_rubric | seminar_notes | draft | book | report | news_article`

**SourceStatus**: `placeholder | processing | processed | needs_review | failed`

### SourceChunk
```
SourceChunk {
  id: string
  sourceId: string → SourceFile
  chunkIndex: number
  text: string
  pageStart: number | null
  pageEnd: number | null
  tokenEstimate: number | null
  citationLabel: string | null
  provenance: {
    extractor: string
    extractionRunId: string | null
    chunkingStrategy: string | null
  } | null
}
```
A text segment extracted from a source for retrieval purposes.

### SourceNote
```
SourceNote {
  id: string
  sourceId: string → SourceFile
  userId: string → User
  content: string
  createdAt: string
  tags: string[]
}
```

## Assignment Model

### Assignment
```
Assignment {
  id: string
  moduleId: string → Module
  title: string
  question: string
  wordLimit: number | null
  dueDate: string | null
  rubric: RubricCriterion[]
  selectedSourceIds: string[]
  stage: ProductionStage
  contextVersion: number | null  // module context version at creation
  contextUpdatedAt: number | null
  createdAt: string
}
```
A piece of coursework with a question, rubric, and deadline.

### Argument
```
Argument {
  id: string
  assignmentId: string → Assignment
  claim: string
  synthesis: string
  sortOrder: number
  status: ArgumentStatus | null
  evidenceLinks: EvidenceLink[]
}
```

**ArgumentStatus**: `draft | developing | complete`

### ArgumentNode
```
ArgumentNode {
  id: string
  argumentId: string → Argument
  type: ArgumentNodeType
  content: string
  parentId: string | null → ArgumentNode
  sortOrder: number
}
```

**ArgumentNodeType**: `premise | warrant | backing | rebuttal | qualifier | counterargument`

### EvidenceLink
```
EvidenceLink {
  id: string
  argumentId: string → Argument
  argumentNodeId: string | null → ArgumentNode
  sourceId: string → SourceFile
  sourceChunkId: string | null → SourceChunk
  sourceClaimId: string | null → SourceClaim
  sourceTitle: string
  quote: string
  pageRange: string
  usage: EvidenceRole | ""
  strength: EvidenceStrength
}
```

**EvidenceStrength**: `strong | moderate | weak`

**EvidenceRole**: `supports | contradicts | nuances | contextualizes`

### Draft
```
Draft {
  id: string
  assignmentId: string → Assignment
  version: number
  content: string
  wordCount: number
  createdAt: string
  updatedAt: string
}
```

### DraftBlock
```
DraftBlock {
  id: string
  draftId: string → Draft
  blockType: DraftBlockType
  content: string | null
  argumentId: string | null → Argument
  sortOrder: number
}
```

**DraftBlockType**: `introduction | body | conclusion | heading | quote | note`

### Review (ReviewRun)
```
ReviewRun {
  id: string
  draftId: string → Draft
  status: ReviewStatus
  overallFeedback: string
  rubricAlignment: string
  createdAt: string
  updatedAt: string
}
```

**ReviewStatus**: `pending | running | completed | failed`

### ReviewFinding
```
ReviewFinding {
  id: string
  reviewRunId: string → ReviewRun
  category: ReviewFindingCategory
  content: string
  severity: JudgementSeverity | null
  resolved: boolean | null
  resolvedAt: number | null
}
```

**ReviewFindingCategory**: `strength | weakness | missing_evidence | unsupported_claim | revision_priority`

### Judgement
```
Judgement {
  id: string
  assignmentId: string → Assignment
  type: JudgementType
  findings: string[]
  severity: JudgementSeverity
  createdAt: string
}
```

**JudgementType**: `gap_analysis | evidence_sufficiency | counterargument_check | citation_safety`

**JudgementSeverity**: `info | warning | critical`

## CoThinker Model

### CoThinker Session
```
CoThinkerSession {
  id: string
  moduleId: string → Module          // always required
  assignmentId: string | null → Assignment
  sourceId: string | null → SourceFile
  title: string
  scope: CoThinkerScope
  stage: ProductionStage | null
  messageCount?: number
  createdAt: string
  updatedAt: string
}
```

### CoThinkerMessage
```
CoThinkerMessage {
  id: string
  sessionId: string → CoThinkerSession
  role: MessageRole
  content: string
  citedChunks: CitedChunk[]
  labels: MessageLabel[]
  warnings: string[]
  followUpSuggestions: string[]
  createdAt: string
}
```

### CoThinkerScope
```
CoThinkerScope = "whole_module" | "current_folder" | "selected_sources" | "assignment"
```

**MessageRole**: `user | assistant | system`

**MessageLabel**: `source_supported | interpretation | user_idea | general_context | unsupported`

### CoThinkerIntervention
```
CoThinkerIntervention {
  id: string
  sessionId: string → CoThinkerSession
  type: CoThinkerInterventionType
  content: string
  resolved: boolean | null
  resolvedAt: number | null
}
```

**CoThinkerInterventionType**: `evidence_prompt | counterargument_prompt | citation_warning | source_gap_warning`

## Supporting Types

### RubricCriterion
```
RubricCriterion {
  name: string
  description: string
  weight: number
}
```

### CitedChunk
```
CitedChunk {
  chunkId: string
  sourceId: string → SourceFile
  sourceTitle: string
  quote: string
  pageRange: string
}
```

### AIProviderConnection
```
AIProviderConnection {
  id: string
  userId: string → User
  provider: ProviderName
  encryptedApiKey: string (AES-256-GCM encrypted)
  status: "connected" | "disconnected" | "error"
  modelPreference: string
  createdAt: string
  updatedAt: string
}
```

**ProviderName**: `zai | gemini`

### ProcessingJob
```
ProcessingJob {
  id: string
  sourceId: string | null → SourceFile
  type: ProcessingJobType
  status: ProcessingJobStatus
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}
```

**ProcessingJobType**: `ingestion | text_extraction | chunking | embedding | analysis`

**ProcessingJobStatus**: `queued | extracting | chunking | pending | running | processed | completed | failed`

## Relationships

```
User 1→* Module
User 1→* SourceFile
User 1→* Assignment
User 1→* CoThinker
User 1→* AIProviderConnection

Module 1→* Folder
Module 1→* SourceFile
Module 1→* Assignment
Module 1→* CoThinker

Folder 1→* SourceFile (optional grouping)

SourceFile 1→* SourceChunk
SourceFile 1→* SourceNote
SourceFile 1→* ProcessingJob

Assignment *→1 Module
Assignment 1→* Argument
Assignment 1→* Draft
Assignment 1→* Judgement
Assignment 1→* CoThinker (optional scoping)
Assignment *→* SourceFile (via assignmentSources)

Argument 1→* ArgumentNode
Argument 1→* EvidenceLink

EvidenceLink *→1 SourceFile
EvidenceLink *→1 SourceChunk (optional)
EvidenceLink *→1 SourceClaim (optional)
EvidenceLink *→1 ArgumentNode (optional)

Draft 1→* DraftBlock
Draft 1→* ReviewRun

ReviewRun 1→* ReviewFinding

DraftBlock *→1 Argument (optional)
```

## Cross-Reference Integrity

The following invariants are enforced at the mutation level:

1. Evidence source must belong to the same module as the assignment
2. Evidence chunk must belong to the source it references
3. Evidence claim must belong to the source it references
4. Argument node parent must belong to the same argument
5. Draft block argument must belong to the draft's assignment
6. Folder parent update must stay inside the same module
7. CoThinker session moduleId is always required
8. CoThinker session assignmentId must reference an assignment in the same module
9. CoThinker session sourceId must reference a source in the same module
10. Cited chunks in CoThinker messages must belong to sources in the session's module

## Assignment Context Assembly

`assignments:getFullContext` returns the complete live context for an assignment:

- Module with context version
- All folders
- All module sources
- Selected sources (via assignmentSources)
- Source notes for all module sources
- Source analyses for selected sources
- Source claims for selected sources
- Source concepts for selected sources
- All arguments with nodes, sorted by sortOrder
- All evidence links
- All drafts (latest first)
- Draft blocks for latest draft
- Review runs and findings for latest draft
- Judgement options and decisions
- CoThinker sessions, messages, and interventions

## Cleanup

Internal helpers in `convex/cleanup.ts` provide batched cascading deletes:

- `deleteModuleData` — deletes a module and all descendant data
- `deleteSourceData` — deletes a source and all descendant data
- `deleteAssignmentData` — deletes an assignment and all descendant data

These are internal mutations not exposed to the client.

## Backend Implementation

- **Engine**: Convex
- **Active schema**: `convex/schema.ts`
- **Validators**: `convex/lib/validators.ts`
- **Current scope**: foundational tables plus assignment, argument, evidence, draft, review, judgement, and CoThinker functions
- **Pending**: live UI wiring to Convex data, full retrieval pipeline, and runtime AI provider selection on the Convex backend
