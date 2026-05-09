# Polis — Data Model

## Backend

**Engine**: Convex
**Active schema**: `convex/schema.ts`
**Auth**: Clerk JWTs validated by `convex/auth.config.ts`; identity via `ctx.auth.getUserIdentity()`
**User scoping**: All queries/mutations use `tokenIdentifier` index, resolved by `getAuthIdentifier(ctx)` from `convex/lib/auth.ts`

## Product Model

```
Module → Assignment → Argument → Draft
```

## Production Stages

Every assignment progresses through:

```
Ingest → Understand → Map → Judge → Build → Draft → Refine
```

Represented as `stage` string field on `assignments` table.

## Core Entities (Convex Tables)

### userProfiles

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Clerk JWT subject, used as primary user key |
| email | string? | From Clerk |
| name | string? | From Clerk |
| image | string? | From Clerk avatar |
| university | string? | User-entered |
| course | string? | User-entered |
| yearOfStudy | number? | User-entered |
| preferences | any? | JSON: defaultAiMode, citationStyle, etc. |
| createdAt | number | Unix timestamp |
| updatedAt | number | Unix timestamp |

Indexes: `by_tokenIdentifier`, `by_email`

### modules

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| title | string | e.g. "International Security" |
| code | string | e.g. "PIRR30041" |
| description | string? | |
| academicYear | string? | e.g. "2025–26" |
| semester | string? | e.g. "Semester 1" |
| colour | string? | UI accent |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_tokenIdentifier`

### folders

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| moduleId | id("modules") | Parent module |
| parentFolderId | id("folders")? | Nested folders |
| name | string | |
| type | string | e.g. "readings", "assignments" |
| sortOrder | number | |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_module`, `by_tokenIdentifier`

Default folders per module: Module Info, Readings, Lecture and Seminar Material, Source Notes, Assignments, Argument Maps, Drafts and Reviews, Submissions.

### sources

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| moduleId | id("modules") | Parent module |
| folderId | id("folders")? | Optional grouping |
| title | string | |
| authors | string? | |
| year | number? | |
| type | string | "journal", "book", "chapter", etc. |
| status | string | "uploading", "processing", "ready", "error" |
| fileName | string? | Original filename |
| fileType | string? | MIME type |
| fileSize | number? | Bytes |
| storageId | id("_storage")? | Convex storage reference |
| citation | string? | Pre-formatted citation string |
| summary | string? | AI-generated or manual |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_tokenIdentifier`, `by_tokenIdentifier_and_module`, `by_module`, `by_folder`

### sourceChunks

| Field | Type | Notes |
|-------|------|-------|
| sourceId | id("sources") | Parent source |
| chunkIndex | number | Ordering |
| text | string | Extracted text segment |
| pageStart | number? | Page boundary |
| pageEnd | number? | Page boundary |
| tokenEstimate | number? | Approximate token count |
| createdAt | number | |

Indexes: `by_source`

### sourceNotes

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| sourceId | id("sources") | Attached source |
| content | string | User-written note |
| tags | string[]? | Optional tags |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_source`, `by_tokenIdentifier`

### sourceAnalyses

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| sourceId | id("sources") | Analysed source |
| assignmentId | id("assignments")? | Optional assignment context |
| analysisType | string | "summary", "concepts", "claims", etc. |
| content | string | Analysis output |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_source`, `by_assignment`, `by_source_and_type`

### sourceClaims

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| sourceId | id("sources") | Source |
| claim | string | Extracted claim |
| context | string? | Surrounding context |
| pageRange | string? | "42–44" |
| strength | string? | "strong", "moderate", "weak" |
| createdAt | number | |

Indexes: `by_source`

### sourceConcepts

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| sourceId | id("sources") | Source |
| concept | string | Key concept |
| definition | string? | Working definition |
| relevance | string? | Relevance to module |
| createdAt | number | |

Indexes: `by_source`

## Assignment Model

### assignments

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| moduleId | id("modules") | Parent module |
| title | string | |
| question | string? | Coursework question |
| wordLimit | number? | |
| dueDate | string? | ISO date |
| rubric | RubricCriterion[]? | { name, description, weight } |
| stage | string | "ingest" through "refine" |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_tokenIdentifier`, `by_tokenIdentifier_and_module`, `by_module`, `by_module_and_stage`

### assignmentSources

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| assignmentId | id("assignments") | Assignment |
| sourceId | id("sources") | Linked source |
| addedAt | number | |

Indexes: `by_assignment`, `by_source`, `by_assignment_and_source`

### arguments

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| assignmentId | id("assignments") | Parent assignment |
| claim | string | The main claim |
| synthesis | string? | How evidence supports the claim |
| sortOrder | number | |
| status | string? | "draft", "final", etc. |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_tokenIdentifier`, `by_assignment`

### argumentNodes

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| argumentId | id("arguments") | Parent argument |
| type | string | "premise", "warrant", "backing", "rebuttal" |
| content | string | |
| parentId | id("argumentNodes")? | Tree structure |
| sortOrder | number | |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_argument`

### evidenceLinks

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| argumentId | id("arguments") | Parent argument |
| argumentNodeId | id("argumentNodes")? | Optional node |
| sourceId | id("sources") | Cited source |
| sourceClaimId | id("sourceClaims")? | Specific claim |
| quote | string? | Quoted text |
| pageRange | string? | "42–44" |
| usage | string? | How it supports the claim |
| strength | string | "strong", "moderate", "weak" |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_argument`, `by_source`, `by_argumentNodeId`

## Draft and Review Model

### drafts

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| assignmentId | id("assignments") | Parent assignment |
| version | number | Incrementing version |
| content | string? | Draft text |
| wordCount | number? | |
| status | string? | "draft", "submitted_for_review", "reviewed" |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_assignment`, `by_tokenIdentifier`

### draftBlocks

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| draftId | id("drafts") | Parent draft |
| blockType | string | "introduction", "body", "conclusion", etc. |
| content | string? | Block text |
| argumentId | id("arguments")? | Linked argument |
| sortOrder | number | |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_draft`

### reviewRuns

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| draftId | id("drafts") | Reviewed draft |
| status | string | "pending", "complete", "error" |
| overallFeedback | string? | |
| rubricAlignment | string? | |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_draft`, `by_status`

### reviewFindings

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| reviewRunId | id("reviewRuns") | Parent review |
| category | string | "strength", "weakness", "missing_evidence", "unsupported_claim", "revision_priority" |
| content | string | |
| severity | string? | "info", "warning", "critical" |
| resolved | boolean? | |
| resolvedAt | number? | |
| createdAt | number | |

Indexes: `by_reviewRun`, `by_reviewRun_and_category`

## Judgement Model

### judgementOptions

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| assignmentId | id("assignments") | Parent assignment |
| type | string | "gap_analysis", "evidence_sufficiency", "counterargument", "citation_safety" |
| question | string | Question being judged |
| createdAt | number | |

Indexes: `by_assignment`

### judgementDecisions

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| assignmentId | id("assignments") | Parent assignment |
| judgementOptionId | id("judgementOptions")? | Linked option |
| type | string | |
| content | string | Finding |
| severity | string | "info", "warning", "critical" |
| createdAt | number | |

Indexes: `by_assignment`, `by_judgementOption`

## CoThinker Model

### coThinkerSessions

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| moduleId | id("modules")? | Module scope |
| assignmentId | id("assignments")? | Assignment scope |
| sourceId | id("sources")? | Source scope |
| title | string | |
| scope | string | "whole_module", "current_folder", "selected_sources", "assignment" |
| stage | string? | Current production stage |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_tokenIdentifier`, `by_tokenIdentifier_and_module`, `by_tokenIdentifier_and_assignment`, `by_module`, `by_assignment`

### coThinkerMessages

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| sessionId | id("coThinkerSessions") | Parent session |
| role | string | "user", "assistant", "system" |
| content | string | |
| citedChunkIds | id("sourceChunks")[]? | Referenced chunks |
| labels | string[]? | "source_supported", "interpretation", "general" |
| warnings | string[]? | Evidence warnings |
| followUpSuggestions | string[]? | |
| createdAt | number | |

Indexes: `by_session`

### coThinkerInterventions

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| sessionId | id("coThinkerSessions") | Parent session |
| type | string | "warning", "suggestion", "integrity_check" |
| content | string | |
| resolved | boolean? | |
| resolvedAt | number? | |
| createdAt | number | |

Indexes: `by_session`

## Infrastructure Tables

### processingJobs

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| sourceId | id("sources")? | Target source |
| type | string | "extract", "chunk", "embed", "analyse" |
| status | string | "pending", "processing", "complete", "error" |
| errorMessage | string? | |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_tokenIdentifier`, `by_source`, `by_status`

### aiProviderConnections

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| provider | string | "zai", "gemini" |
| status | string | "connected", "disconnected", "error" |
| modelPreference | string? | User-selected model |
| encryptedCredentialRef | string? | Reference to encrypted key |
| createdAt | number | |
| updatedAt | number | |

Indexes: `by_tokenIdentifier`, `by_tokenIdentifier_and_provider`

### usageEvents

| Field | Type | Notes |
|-------|------|-------|
| tokenIdentifier | string | Owner |
| provider | string? | AI provider used |
| model | string? | Model used |
| type | string | "chat", "embedding", "analysis" |
| tokensIn | number? | |
| tokensOut | number? | |
| costEstimate | number? | |
| metadata | any? | |
| createdAt | number | |

Indexes: `by_tokenIdentifier`, `by_type`

## Relationships

```
userProfiles 1→* modules
userProfiles 1→* sources (via tokenIdentifier)
userProfiles 1→* assignments (via tokenIdentifier)
userProfiles 1→* coThinkerSessions (via tokenIdentifier)

modules 1→* folders
modules 1→* sources
modules 1→* assignments
modules 1→* coThinkerSessions

folders 1→* sources (optional grouping)
folders →* folders (nested)

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
assignments 1→* coThinkerSessions (optional scoping)

arguments 1→* argumentNodes (tree)
arguments 1→* evidenceLinks

evidenceLinks *→1 sources
evidenceLinks *→1 sourceClaims (optional)

drafts 1→* draftBlocks
drafts 1→* reviewRuns

reviewRuns 1→* reviewFindings

coThinkerSessions 1→* coThinkerMessages
coThinkerSessions 1→* coThinkerInterventions
coThinkerMessages *→* sourceChunks (via citedChunkIds)
```
