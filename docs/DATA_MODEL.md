# Polis — Data Model

Polis is now organised around the academic workflow:

Raw Sources → Compiled Knowledge Base → Essay Context Pack → Plan → Draft → Final

## Core Entities

### Module / Workspace
The existing `modules` table remains the internal workspace table for migration safety.

Fields now support module identity plus assessment focus: `userId`, `name`, `moduleCode`, `description`, `assessmentTitle`, `assessmentQuestion`, `deadline`, `targetGrade`, `referencingStyle`, `currentStage`, `createdAt`, and `updatedAt`.

`currentStage` values: `setup`, `sources`, `knowledge`, `context`, `plan`, `draft`, `final`.

### Source
`sources` remains the raw material layer and keeps upload/extraction compatibility.

Sources support module ownership, metadata, processing status, relevance, citation, file/storage data, extracted text, summary fields, and tags. Folders may remain for legacy data, but they are not a core Polis navigation concept.

Source types: `reading`, `lecture`, `assessment`, `feedback`, `note`, `link`, `other`.

Source statuses shown in the UI: `unprocessed`, `processing`, `processed`, `failed`.

### SourceChunk
`sourceChunks` remain retrieval infrastructure for extracted source text and vector search. They are not the knowledge layer.

### KnowledgePage
`knowledgePages` is the compiled module knowledge layer.

Fields: `userId`, `moduleId`, `title`, `type`, `content`, `linkedSourceIds`, `linkedPageIds`, `tags`, `createdAt`, `updatedAt`.

Types: `source_brief`, `concept`, `theory`, `author`, `case`, `debate`, `comparison`, `contradiction`, `synthesis`, `essay_pack`.

### ContextPack
`contextPacks` is the selected knowledge bundle for one assessment.

Fields: `userId`, `moduleId`, `title`, `assessmentQuestion`, `selectedSourceIds`, `selectedKnowledgePageIds`, `markingCriteria`, `workingThesis`, `keyClaims`, `keyQuotes`, `caseStudies`, `missingEvidence`, `draftingInstructions`, `createdAt`, `updatedAt`.

Context Packs are managed inside Plan, not as a top-level navigation item.

### Plan
`plans` stores structured plans linked to a Context Pack.

Fields: `userId`, `moduleId`, `contextPackId`, `title`, `thesis`, `sections`, `createdAt`, `updatedAt`.

Each section supports `id`, `title`, `purpose`, `claim`, `evidenceSourceIds`, `knowledgePageIds`, `counterargument`, `evaluation`, `wordCount`, and `notes`.

### Draft
`drafts` stores module drafts linked to a Context Pack and Plan.

Fields: `userId`, `moduleId`, `contextPackId`, `planId`, `title`, `content`, `status`, `createdAt`, `updatedAt`.

Statuses: `rough`, `revised`, `final`.

### Feedback
`feedback` stores draft-specific feedback and revision tasks.

Fields: `userId`, `moduleId`, `draftId`, `content`, `revisionTasks`, `createdAt`, `updatedAt`.

Tutor feedback can also be uploaded as a Source of type `feedback`; draft-specific revision work belongs in `feedback`.

## Legacy Entities

`folders`, `essays`, `essaySections`, `evidenceItems`, and global `conversations` remain for compatibility with older routes and data. They are not the primary Polis workflow.
