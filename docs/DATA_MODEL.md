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

Represented as `ProductionStage` enum in `src/lib/types.ts`.

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
  workspaceId: string
  title: string
  code: string
  academicYear: string
  semester: string
  description: string
  sourceCount: number
  noteCount: number
  assignmentCount: number
  lastActivityAt: string
  color: string
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
Default folders per module: Module Info, Readings, Lectures, Source Notes, Assignments, Drafts, Submissions.

### SourceFile
```
SourceFile {
  id: string
  moduleId: string → Module
  folderId: string → Folder
  title: string
  author: string
  year: number
  type: SourceType
  status: ProcessingStatus
  tags: string[]
  citation: string
  pageCount: number
  uploadedAt: string
  summary: string
  mainArgument: string
  keyConcepts: string[]
}
```
Represents an uploaded or linked source document.

### SourceChunk
```
SourceChunk {
  id: string
  sourceId: string → SourceFile
  text: string
  pageStart: number
  pageEnd: number
  citationLabel: string
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
User-created notes attached to a source.

## Assignment Model

### Assignment
```
Assignment {
  id: string
  moduleId: string → Module
  title: string
  question: string
  wordLimit: number
  dueDate: string
  rubric: RubricCriterion[]
  selectedSourceIds: string[]
  stage: ProductionStage
  createdAt: string
}
```
A piece of coursework with a question, rubric, and deadline. Replaces the old `EssayProject`.

### Argument
```
Argument {
  id: string
  assignmentId: string → Assignment
  claim: string
  synthesis: string
  evidenceLinks: EvidenceLink[]
  counterarguments: string[]
  sortOrder: number
}
```
A structured claim within an assignment, linked to evidence from sources.

### EvidenceLink
```
EvidenceLink {
  id: string
  argumentId: string → Argument
  sourceId: string → SourceFile
  sourceTitle: string
  quote: string
  pageRange: string
  usage: string
  strength: "strong" | "moderate" | "weak"
}
```
Connects a source passage to an argument claim. Replaces the old `EvidenceItem`.

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
A versioned piece of written work. Elevated from being a field on EssayProject to a first-class entity.

### Review
```
Review {
  id: string
  draftId: string → Draft
  strengths: string[]
  weaknesses: string[]
  missingEvidence: string[]
  unsupportedClaims: string[]
  revisionPriorities: string[]
  rubricAlignment: string
  overallFeedback: string
}
```
Structured feedback on a draft. Replaces the old `DraftReview`.

### Judgement
```
Judgement {
  id: string
  assignmentId: string → Assignment
  type: "gap_analysis" | "evidence_sufficiency" | "counterargument_check" | "citation_safety"
  findings: string[]
  severity: "info" | "warning" | "critical"
  createdAt: string
}
```
AI-generated assessment of argument or evidence quality within an assignment.

## CoThinker Model

### CoThinker (replaces AIConversation)
```
CoThinker {
  id: string
  moduleId: string → Module
  assignmentId: string | null → Assignment
  title: string
  scope: CoThinkerScope
  stage: ProductionStage
  messages: CoThinkerMessage[]
  createdAt: string
}
```

### CoThinkerMessage (replaces AIMessage)
```
CoThinkerMessage {
  id: string
  role: MessageRole
  content: string
  citedChunks: CitedChunk[]
  warnings: string[]
  labels: MessageLabel[]
  followUpSuggestions: string[]
  createdAt: string
}
```

### CoThinkerScope (replaces AIScope)
```
CoThinkerScope = "whole_module" | "current_folder" | "selected_sources" | "assignment"
```

## Supporting Types

### ProductionStage
```
ProductionStage = "ingest" | "understand" | "map" | "judge" | "build" | "draft" | "refine"
```

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

### MessageLabel
```
MessageLabel {
  type: "source_supported" | "interpretation" | "user_idea" | "general_context" | "unsupported"
  text: string
}
```

### AIProviderConnection
```
AIProviderConnection {
  id: string
  userId: string → User
  provider: string
  encryptedApiKey: string (AES-256-GCM encrypted)
  status: "connected" | "disconnected" | "error"
  modelPreference: string
  createdAt: string
  updatedAt: string
}
```

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

Assignment 1→* Argument
Assignment 1→* Draft
Assignment 1→* Judgement
Assignment 1→* CoThinker (optional scoping)

Argument 1→* EvidenceLink

Draft 1→* Review

EvidenceLink *→1 SourceFile
EvidenceLink *→1 SourceChunk (optional)
```

## Backend Implementation

- **Engine**: Convex
- **Active schema**: `convex/schema.ts`
- **Current scope**: foundational tables and minimal user/module/source functions
- **Pending**: Assignment/Argument/Draft/Review entities, CoThinker, Judgement, full retrieval pipeline
