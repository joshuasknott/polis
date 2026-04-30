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
  userId: string → User
  provider: string
  encryptedApiKey: string (AES-256-GCM encrypted)
  status: "connected" | "disconnected" | "error"
  modelPreference: string
  createdAt: string
  updatedAt: string
}
```

### UsageLog (Phase 3)
```
UsageLog {
  id: string
  userId: string → User
  provider: string
  model: string
  type: "chat" | "embedding"
  tokensIn: number
  tokensOut: number
  costEstimate: number
  createdAt: string
}
```

### SourceNote (Phase 3)
```
SourceNote {
  id: string
  userId: string → User
  sourceId: string → Source
  content: string
  tags: string (comma-separated)
  createdAt: string
  updatedAt: string
}
```

## Relationships

```
User 1→* Module
User 1→* Source
User 1→* Essay
User 1→* Conversation
User 1→* AIProviderConnection
User 1→* UsageLog
User 1→* SourceNote
Module 1→* Folder
Module 1→* Source
Module 1→* Essay
Module 1→* Conversation
Folder 1→* Source (optional grouping)
Source 1→* SourceChunk
Source 1→* SourceNote
Essay 1→* EssaySection
Essay 1→* EvidenceItem
EssaySection 1→* EvidenceItem
EvidenceItem *→1 Source (optional)
EvidenceItem *→1 SourceChunk (optional)
Conversation 1→* ConversationMessage
AIProviderConnection *→1 User (unique per provider)
```

## Database Implementation

- **Engine**: PostgreSQL via Prisma 7 with @prisma/adapter-pg
- **Schema**: `prisma/schema.prisma` (17 models)
- **Vector search**: pgvector extension with HNSW index
- **File storage**: Local filesystem or S3-compatible (configurable)
- **Auth**: Auth.js v5 with JWT sessions, credentials + OAuth
- **Encryption**: AES-256-GCM for user API keys
