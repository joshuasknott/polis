# SocialSciencr — Data Model

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

### Workspace
```
Workspace {
  id: string
  ownerId: string
  name: string
  description: string
}
```
A workspace is a top-level container. Each user has at least one personal workspace.

### Module
```
Module {
  id: string
  workspaceId: string → Workspace
  title: string
  code: string
  academicYear: string
  semester: string
  description: string
  sourceCount: number
  noteCount: number
  essayProjectCount: number
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
Default folders per module: Module Info, Readings, Lecture and Seminar Material, Source Notes, Essay Plans, Drafts and Feedback, Final Submission.

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

### AIConversation
```
AIConversation {
  id: string
  moduleId: string → Module
  title: string
  scope: AIScope
  mode: AIMode
  messages: AIMessage[]
  createdAt: string
}
```

### AIMessage
```
AIMessage {
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

### CitedChunk (embedded in AIMessage)
```
CitedChunk {
  chunkId: string
  sourceId: string → SourceFile
  sourceTitle: string
  quote: string
  pageRange: string
}
```

### EssayProject
```
EssayProject {
  id: string
  moduleId: string → Module
  title: string
  question: string
  wordCount: number
  dueDate: string
  rubric: RubricCriterion[]
  selectedSourceIds: string[]
  thesis: string
  status: EssayStatus
  structure: EssaySection[]
  evidenceBank: EvidenceItem[]
  counterarguments: Counterargument[]
  gaps: ResearchGap[]
  draftContent: string
}
```

### DraftReview
```
DraftReview {
  id: string
  draftId: string
  strengths: string[]
  weaknesses: string[]
  missingEvidence: string[]
  unsupportedClaims: string[]
  revisionPriorities: string[]
  estimatedBandRisk: string
  overallFeedback: string
}
```

### AIProviderConnection
```
AIProviderConnection {
  id: string
  provider: string
  status: "connected" | "disconnected" | "error"
  modelPreference: string
  createdAt: string
}
```

## Relationships

```
User 1→* Workspace
Workspace 1→* Module
Module 1→* Folder
Module 1→* SourceFile
Module 1→* EssayProject
Module 1→* AIConversation
Folder 1→* SourceFile (optional grouping)
SourceFile 1→* SourceChunk
SourceFile 1→* SourceNote
AIConversation 1→* AIMessage
AIMessage *→* SourceChunk (via CitedChunk)
EssayProject *→* SourceFile (selected sources)
```

## Future Backend Notes

- **Database**: PostgreSQL via Prisma or Drizzle ORM
- **File storage**: S3-compatible object storage for uploaded files
- **Vector store**: pgvector extension or dedicated vector database (Pinecone, Weaviate)
- **Search**: Full-text search via PostgreSQL or Meilisearch
- **Auth**: NextAuth.js or Clerk
- **Caching**: Redis for session data and frequent queries
