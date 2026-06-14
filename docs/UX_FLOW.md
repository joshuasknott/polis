# Polis UX Flow

**Last updated**: 2026-06-14

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
Landing page -> Dashboard -> Create workspace -> Import -> Workspace -> Plan / Write / Review
```

The workspace is the home base. Assessments live inside a workspace. Timeline information is part of the Workspaces dashboard and workspace home, not a separate top-level destination.

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
3. Cross-workspace deadline timeline appears inside Workspaces.
4. Workspace cards show source count, assessment count, and recent activity.
5. Quick action: **New Workspace**.

## Creating a Workspace

1. Click **New Workspace** from the dashboard.
2. Enter:
   - Workspace name
   - Year
   - Semester
3. Semester is free text. It is not a dropdown.
4. The workspace is created.

Internal: creates a `modules` row. Optional metadata such as code, colour, and description can be edited later.

## Workspace Layout

Once the user opens a workspace, the workspace shell appears.

```text
Workspace sidenav | Workspace content | In-context assistant/actions
```

Workspace navigation includes:

- Home
- Imports
- Assessments
- Knowledge Base
- Workspace Settings

CoThinker and Workbench are embedded capabilities. They are not standalone destinations.

## Workspace Home

The workspace home gives the user the current state of the module:

1. Suggested next actions.
2. Imports needing review.
3. Assessment deadlines and weights.
4. Deadline timeline for that workspace.
5. Source coverage and missing context.

## Importing Material

1. The student imports readings, lecture notes, assignment briefs, rubrics, slides, source images, and their own notes.
2. Files upload through Convex storage.
3. Polis extracts and chunks text.
4. Polis classifies material into the Source Base.
5. The student can review or correct classifications.

Internal flow:

```text
generateUploadUrl -> client upload -> attachStorage -> extract text -> chunk text -> classify/analyse
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
