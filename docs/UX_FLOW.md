# Polis UX Flow

**Last updated**: 2026-06-21

## Terminology

This document uses user-facing language. Internal data-model names are kept stable in code.

| User-facing | Internal |
| --- | --- |
| Workspace | Module |
| Assessment | Assignment |
| Source Base | Sources in a module |
| Evidence Map | Arguments + evidence links |
| Plan | Understand, Map, Judge, Build |
| Write | Draft |
| Review | Refine |
| In-context Assistant | CoThinker |
| In-context Tools | Workbench actions |

## Top-Level Flow

```text
Landing page -> Dashboard -> Create workspace -> Module Info -> Sources / Assignments -> Plan / Write / Review
```

The dashboard is only a workspace launcher. The workspace is the home base. Assessments live inside a workspace, and Module Info is the default landing page for setup state.

## Landing Page

1. User sees the direct product promise: "Your module, organized into a source-backed workspace."
2. The first viewport shows a realistic workspace preview.
3. Primary action: **Start your workspace**.
4. Secondary action: **See how Polis works**.
5. The page explains workspace, assessment, evidence map, Write/Review, and source-backed AI with soft warnings.

## Dashboard

The dashboard is a workspace launcher, not the full app shell.

1. No sidenav is shown on the dashboard.
2. User sees **Workspaces** and can create/open a workspace.
3. Workspace cards show source count, assessment count, and recent activity.
4. Quick action: **New Workspace**.

## Creating a Workspace

1. Click **New Workspace** from the dashboard.
2. Enter the workspace name.
3. The workspace is created.

Internal: creates a `modules` row. `code` remains internal and may be generated as a fallback; it is not part of the user-facing create or edit flow.

## Workspace Layout

Once the user opens a workspace, the workspace shell appears.

```text
Workspace sidenav | Workspace content | In-context assistant/actions
```

Workspace navigation includes:

- Module Info
- Sources
- Assignments
- Settings, pinned at the bottom

CoThinker and Workbench are embedded capabilities. They are not standalone destinations.

## Module Info

Module Info is the default workspace landing page. It gives the user the current setup state:

1. Workspace created.
2. Upload module info.
3. Upload reading list.
4. Upload assessment brief/rubric.
5. Upload readings/lecture material.
6. Review Polis organization.
7. Confirm extracted info.
8. Start assessment.
9. Plan.
10. Write.
11. Review.

Module Info can show status summaries and links into Sources or Assignments, but it does not add extra top-level navigation.

## Sources

Sources is the single top-level place for importing and organizing the Source Base.

1. The student imports readings, lecture notes, assignment briefs, rubrics, slides, and their own notes.
2. Files enter an import batch and upload through Convex storage.
3. Polis classifies each file, converts it into a source, extracts and chunks text, then generates source context.
4. Sources are grouped inside Sources as All Sources, Needs Review, Readings, Lecture Material, Module Info, Briefs/Rubrics, and custom groups.
5. The student can search, filter, review, accept, correct, or undo Polis actions without leaving Sources.

## Importing Material

1. The student imports readings, lecture notes, assignment briefs, rubrics, slides, and their own notes.
2. Files enter an `importBatches` row and each raw upload is tracked in `importedFiles`.
3. Polis classifies files, creates sources, extracts/chunks source text, extracts module/assessment context, and generates source summaries, concepts, claims, relevance signals, and gap signals.
4. High-confidence safe results may be auto-applied to the Source Base.
5. Every AI action is visible in Sources, source-traceable where applicable, and reversible where safe. Raw uploads are retained.
6. The student can review or correct classifications and undo supported Polis actions.

Internal flow:

```text
createBatch -> generateUploadUrl -> client upload -> registerFile -> processBatch
  -> classify -> create source -> extract/chunk -> extract workspace context -> analyse source context
```

## Assessment Flow

Most assessments should come from imported briefs, handbooks, or rubrics. Students can also create assessments manually inside a workspace.

An assessment moves through:

```text
Plan -> Write -> Review
```

### Plan

Goal: turn the Source Base into a structured plan and Evidence Map.

1. Review selected and suggested sources.
2. Understand relevant readings.
3. Map claims, counterarguments, and evidence links.
4. Judge evidence strength and identify gaps.
5. Build thesis, section plan, and word budget.

### Write

Goal: produce source-aware coursework.

The assistant can:

- Draft passages on request.
- Paraphrase and restructure selected text.
- Critique structure and argument.
- Suggest revisions.
- Insert citations only from verified source data.

Claims are labelled as source-supported, interpretation, general context, unsupported, or needing evidence.

### Review

Goal: validate and polish.

Review checks include:

- Unsupported claims.
- Missing evidence.
- Citation safety.
- Rubric alignment.
- Structural weaknesses.
- Revision priorities.

Insufficient evidence produces a soft warning. Fake citations, fake page numbers, and misattribution are hard failures.

## In-Context Assistant

The assistant adapts to current context:

- Workspace
- Assessment
- Source
- Current phase: Plan, Write, or Review

Responses must label source support clearly. Source-backed claims must trace to real retrieved source chunks.

## In-Context Tools

Tools appear where they are useful:

| Phase | Tools |
| --- | --- |
| Plan | Reading summary, concept extraction, literature matrix, evidence bank, counterargument finder, argument builder |
| Write | Draft editor, paraphrase, restructure, citation inserter |
| Review | Draft review, citation safety, readiness checklist |

The standalone Workbench destination is deprecated.
