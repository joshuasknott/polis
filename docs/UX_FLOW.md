# Polis — UX Flow

## Product Shape

Polis is a module-first personal academic knowledge base and writing system for Politics and International Relations coursework.

The global app is intentionally small: Workspaces and Settings. Tools and global Assistant are not primary surfaces.

## Main Flow

Raw Sources → Compiled Knowledge Base → Essay Context Pack → Plan → Draft → Final

Each module workspace has exactly six sections:

1. Overview
2. Sources
3. Knowledge
4. Plan
5. Draft
6. Final

## Workspaces Page

The dashboard is now a Workspaces page. It shows module cards with assessment focus, deadline, current stage, source count, processed source count, knowledge page count, plan/draft state, and a deterministic next action.

Next action logic:

1. No sources: add your first source.
2. Sources but no processed/source briefs: create source briefs.
3. Knowledge but no context pack: build a context pack.
4. Context pack but no plan: create a plan.
5. Plan but no draft: start drafting.
6. Draft not final: review and revise.
7. Final draft: prepare export.

## Module Overview

Overview stores assessment setup: assessment title, question, deadline, target grade, referencing style, and current stage. It also shows workflow status across Sources, Knowledge, Context Pack, Plan, Draft, and Final.

## Sources

Sources is the raw input area for readings, lectures, assessment briefs, feedback, notes, and links.

It supports upload, source search, status/type/relevance filters, citation visibility, metadata editing, source viewing, source brief creation, and adding sources to the active Context Pack.

Folders are no longer the user-facing module navigation.

## Source Viewer

The source viewer shows metadata, citation, analysis, extracted chunks, source notes, linked Knowledge Pages, and Polis actions: create/open Source Brief, add to Context Pack, and mark relevance.

No source viewer action routes to a fake evidence bank or generic Assistant workflow.

## Knowledge

Knowledge is the compiled module understanding layer. It lists Knowledge Pages grouped by type and supports manual create/edit/delete, source linking, page linking, tags, and Markdown/plain text content.

Source Briefs are Knowledge Pages created from Source metadata and existing summaries when AI generation is not invoked.

## Plan

Plan contains Context Pack management and structured planning.

The Context Pack selects the sources and Knowledge Pages for one assessment and stores thesis, marking criteria, claims, quotes, case studies, missing evidence, and drafting instructions.

The Plan is linked to the active Context Pack and stores thesis plus sections with claims, evidence sources, knowledge pages, counterarguments, evaluation, word count, and notes.

## Draft

Draft is linked to the active Context Pack and Plan. It displays the assessment question, working thesis, selected context, and plan sections next to the editor.

Draft actions include save draft, status changes, citation check, and draft review where configured.

## Final

Final shows the current draft, selected source reference basis, feedback notes, revision tasks, and a basic Markdown export.

Export is intentionally simple in this MVP.
