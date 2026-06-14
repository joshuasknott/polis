# Polis — Data Model

**Last updated**: 2026-06-14

## Terminology

This document uses **internal data-model names** (Module, Assignment, Argument, Draft, CoThinker, Workbench) because it describes schema and code. The product uses user-facing names when talking to students:

| User-facing | Internal (this document) |
|-------------|--------------------------|
| Workspace | Module |
| Assessment | Assignment |
| Source Base | The collection of sources in a module |
| Evidence Map | Arguments + evidence links |
| Plan | Build stage (and Understand/Map/Judge preparation) |
| Write | Draft stage |
| Review | Refine stage |
| In-context Assistant | CoThinker |
| In-context Tools | Workbench actions |

Internal names are authoritative for code, schema, table names, and field names. See `docs/PRODUCT_VISION.md` for the product thesis.

## Current Backend Status

Polis is migrating from the old Prisma/PostgreSQL backend to Convex. The active foundational schema now lives in `convex/schema.ts`; this document is the authoritative product-level model reference and will be reconciled as Convex-backed features are rebuilt.

## Product Model

```
Module → Assignment → Argument → Draft
```

User-facing, this is presented as **Workspace → Assessment → Evidence Map → Write/Review**. The internal model is unchanged.

## Production Stages

Every assignment progresses internally through:

```
Ingest → Understand → Map → Judge → Build → Draft → Refine
```

Represented as `ProductionStage` union in `convex/lib/validators.ts` and `src/lib/types.ts`.

The user sees a simpler three-phase flow inside an assessment: **Plan → Write → Review**. Mapping:

- **Plan** absorbs Understand → Map → Judge → Build
- **Write** = Draft
- **Review** = Refine

Workspace setup (Create workspace → Import → Classify → Extract → Dashboard) happens at the module level and populates Ingest.

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
  tokenIdentifier: string
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

## Import Model

The import-first module operating system ingests batches of files, classifies them, and extracts structured facts before the user reviews and applies them to the module.

### ImportBatch
```
ImportBatch {
  id: string
  moduleId: string → Module
  name: string | null
  status: ImportBatchStatus
  totalFiles: number
  processedFiles: number | null
  autoAcceptedFiles: number | null
  needsReviewFiles: number | null
  failedFiles: number | null
  errorMessage: string | null
  createdAt: number
  updatedAt: number
}
```
Groups a set of uploaded files into a single import operation. Tracks aggregate progress across all files in the batch.

**ImportBatchStatus**: `pending | processing | completed | partial | failed`

### ImportedFile
```
ImportedFile {
  id: string
  batchId: string → ImportBatch
  moduleId: string → Module
  sourceId: string | null → SourceFile     // set when converted to a source
  storageId: string | null → _storage
  fileName: string | null
  fileType: string | null
  fileSize: number | null
  extractionStatus: ImportFileExtractionStatus
  extractionError: string | null
  labels: ClassificationLabel[] | null      // all applicable labels from AI
  primaryLabel: ClassificationLabel | null   // single best-fit label
  confidence: number | null                  // 0.0–1.0 classification confidence
  rationale: string | null                   // AI reasoning for classification
  classificationStatus: ImportFileClassificationStatus
  classificationError: string | null
  modelUsed: string | null
  providerUsed: string | null
  reviewedLabel: ClassificationLabel | null  // user-confirmed label
  reviewedAt: number | null
  createdAt: number
  updatedAt: number
}
```
An individual file within an import batch. Tracks extraction and classification as separate pipelines. The file is converted to a SourceFile via `imports.applyFileToModule`, which sets `sourceId`.

**ClassificationLabel**: `handbook | syllabus | assignment_brief | rubric | slides | reading | draft | notes | integrity_guidance | reading_list | other`

**ImportFileExtractionStatus**: `pending | extracting | extracted | unsupported | skipped | failed`

**ImportFileClassificationStatus**: `pending | classifying | auto_accepted | needs_review | accepted | rejected | failed`

Files above the auto-accept confidence threshold are labelled `auto_accepted`; lower-confidence files are `needs_review` until the user accepts or rejects.

## Extraction Model

Structured data extracted from imported files. Every extracted fact carries provenance tracing it back to the source file, page range, quote, and AI run.

### ModuleFact
```
ModuleFact {
  id: string
  moduleId: string → Module
  batchId: string | null → ImportBatch
  importedFileId: string | null → ImportedFile
  field: ModuleFactField
  value: string
  status: ExtractionStatus
  provenance: ExtractionProvenance
  createdAt: number
  updatedAt: number
}
```
A single extracted fact about the module (title, code, themes, learning outcomes, etc.). List-type fields (`themes`, `concepts`, `learning_outcomes`) store one row per item. Applying a fact writes the value to the module and marks the fact `applied`.

**ModuleFactField**: `title | code | academic_year | semester | description | themes | concepts | learning_outcomes | integrity_guidance | submission_format | referencing_rules`

**ExtractionStatus**: `extracted | applied | rejected | superseded`

### AssessmentSpec
```
AssessmentSpec {
  id: string
  moduleId: string → Module
  assignmentId: string | null → Assignment    // set when applied
  batchId: string | null → ImportBatch
  importedFileId: string | null → ImportedFile
  title: string
  question: string | null
  deadline: string | null                      // ISO date
  weight: number | null                         // percentage
  wordLimit: number | null
  referencingRule: string | null
  status: AssessmentSpecStatus
  provenance: ExtractionProvenance
  createdAt: number
  updatedAt: number
}
```
An extracted assessment brief specification. Applying a spec creates or updates an Assignment with the extracted fields and rubric criteria.

**AssessmentSpecStatus**: `extracted | applied | rejected | needs_review`

### ExtractedRubricCriterion
```
ExtractedRubricCriterion {
  id: string
  assessmentSpecId: string → AssessmentSpec
  name: string
  description: string | null
  weight: number | null
  sortOrder: number
  status: AssessmentSpecStatus
  provenance: ExtractionProvenance | null
  createdAt: number
  updatedAt: number
}
```
An individual rubric criterion extracted from an assessment brief. Child of `AssessmentSpec`. When the spec is applied, non-rejected criteria are written to the assignment's `rubric` array.

### WeeklyTopic
```
WeeklyTopic {
  id: string
  moduleId: string → Module
  weekNumber: number | null
  title: string
  description: string | null
  sortOrder: number
  sourceId: string | null → SourceFile
  batchId: string | null → ImportBatch
  importedFileId: string | null → ImportedFile
  status: ExtractionStatus | null
  provenance: ExtractionProvenance | null
  createdAt: number
  updatedAt: number
}
```
A weekly topic in the module schedule. Can be extracted from a syllabus or manually created. Optional `sourceId` links to a source file.

### RequiredReading
```
RequiredReading {
  id: string
  moduleId: string → Module
  weekNumber: number | null
  title: string
  authors: string | null
  year: number | null
  citation: string | null
  url: string | null
  sourceId: string | null → SourceFile
  batchId: string | null → ImportBatch
  importedFileId: string | null → ImportedFile
  sortOrder: number
  status: ExtractionStatus | null
  provenance: ExtractionProvenance | null
  createdAt: number
  updatedAt: number
}
```
A required or recommended reading. Optional `sourceId` links to an imported source.

### ExtractionProvenance
```
ExtractionProvenance {
  source: "imported_file" | "source" | "manual"
  batchId: string | null → ImportBatch
  importedFileId: string | null → ImportedFile
  sourceId: string | null → SourceFile
  sourceChunkId: string | null → SourceChunk
  extractor: string                            // e.g. "ai:zai:glm-4", "manual"
  extractionRunId: string | null
  pageStart: number | null
  pageEnd: number | null
  quote: string | null                         // supporting text from source
  confidence: number | null                     // 0.0–1.0
  extractedAt: number                           // timestamp
}
```
Embedded in every extracted fact, spec, topic, and reading. Provides full traceability from AI output back to the source document and specific page range.

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
  tokenIdentifier: string
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
Module 1→* ImportBatch
Module 1→* ModuleFact
Module 1→* AssessmentSpec
Module 1→* WeeklyTopic
Module 1→* RequiredReading

Folder 1→* SourceFile (optional grouping)

SourceFile 1→* SourceChunk
SourceFile 1→* SourceNote
SourceFile 1→* ProcessingJob

ImportBatch 1→* ImportedFile
ImportBatch 1→* ModuleFact (optional origin)
ImportBatch 1→* AssessmentSpec (optional origin)
ImportBatch 1→* WeeklyTopic (optional origin)
ImportBatch 1→* RequiredReading (optional origin)

ImportedFile *→0..1 SourceFile (via sourceId when converted)

AssessmentSpec 1→* ExtractedRubricCriterion
AssessmentSpec *→0..1 Assignment (via assignmentId when applied)

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
11. ImportedFile batchId must reference a batch in the same module
12. ModuleFact moduleId must match the batch's moduleId when batchId is set
13. AssessmentSpec moduleId must match the batch's moduleId when batchId is set
14. Applying an AssessmentSpec to an Assignment requires same-module ownership
15. ExtractedRubricCriterion assessmentSpecId must belong to the same spec

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

- `deleteModuleData` — deletes a module and all descendant data (including import batches, module facts, assessment specs, weekly topics, required readings)
- `deleteSourceData` — deletes a source and all descendant data; unlinks importedFiles, requiredReadings referencing the source
- `deleteAssignmentData` — deletes an assignment and all descendant data; unlinks assessmentSpecs referencing the assignment
- `deleteImportBatchData` — deletes a batch and all its files, extracted facts, specs, rubric criteria, topics, and readings

These are internal mutations not exposed to the client.

## Backend Implementation

- **Engine**: Convex
- **Active schema**: `convex/schema.ts`
- **Validators**: `convex/lib/validators.ts`
- **Current scope**: foundational tables plus assignment, argument, evidence, draft, review, judgement, CoThinker, import batch/file, module fact, assessment spec, weekly topic, and required reading functions
- **Pending**: live UI wiring to Convex data, full retrieval pipeline, and runtime AI provider selection on the Convex backend
