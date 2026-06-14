# Polis — Product Vision

**Last updated**: 2026-06-14

## Product Thesis

Polis is an AI-native module operating system for students. A student creates a workspace with just a module name, imports everything they already have for that module, and Polis turns messy files into an organized command center for coursework.

Polis then stays with the student through every assessment in that module — providing source-backed AI for planning, writing, and review. Where Polis claims a claim is source-backed, it really is; where evidence is thin, Polis warns rather than fabricates.

## Positioning

Polis is **not** a chatbot, a "chat with PDF" tool, or an essay mill. It is a workspace that mirrors how a module actually works: one home for the module, every assessment visible at a glance, every AI action grounded in the student's own uploaded material.

The shift in this direction:

- The **module is the workspace**. One module = one command center.
- **Assessments are tracks inside the workspace**, not separate destinations.
- **CoThinker and Workbench are embedded capabilities**, surfaced in context where the student is working — not standalone pages.
- Polis provides **powerful writing help** (drafting, paraphrasing, critique, restructuring, revision) — but writing that claims to be source-backed must be source-backed.
- **Soft warnings over hard blocks.** Polis warns and labels; it does not gate the user — except where integrity-of-record is at stake (fake citations, invented page numbers, misattribution are never treated as valid).
- **Student responsibility is explicit.** Polis assists; the student owns the submission.

## Core Product Flow

```
Create workspace → Import module material → Classify files → Extract assessments & module facts → Build assessment dashboard → Work inside an assessment → Plan / Write / Review with source-backed AI
```

| Step | What happens | Who |
|------|--------------|-----|
| **Create workspace** | Student enters just a module name. A workspace is created. | Student |
| **Import** | Student drops in everything they have: readings, slides, handbook, briefs, notes. | Student |
| **Classify** | Polis sorts files into a coherent Source Base (readings, lectures, briefs, handbook, etc.). | Polis (student confirms) |
| **Extract** | Polis reads briefs/handbook and extracts assessments, deadlines, rubrics, and module facts. | Polis (student confirms) |
| **Dashboard** | Polis builds an assessment dashboard: every assessment for the module, with status, deadline, and source coverage. | Polis |
| **Work in assessment** | Inside an assessment, the student moves through Plan → Write → Review with embedded, source-backed AI. | Student + Polis |

## User-Facing Language

Polis uses workspace language, not database language, when talking to students.

| User-facing term | What it maps to (internal) |
|------------------|----------------------------|
| **Workspace** | Module |
| **Assessment** | Assignment |
| **Source Base** | The collection of sources in a workspace |
| **Evidence Map** | Arguments + evidence links (the visual/structured claim map) |
| **Plan** | Build stage (argument/outline/evidence allocation) |
| **Write** | Draft stage |
| **Review** | Refine stage (review runs, citation safety, revision) |
| **Assistant** (in-context) | CoThinker |
| **Tools** (in-context) | Workbench actions |

Internal data model names (Module, Assignment, Argument, Draft) remain authoritative in code and schema. See `docs/DATA_MODEL.md`.

## Product Model (Internal)

The internal data model is unchanged:

```
Module → Assignment → Argument → Draft
```

- **Module** mirrors a university module and is the workspace root.
- **Assignment** is an assessment track inside the module.
- **Argument** is a structured claim within an assignment, linked to evidence from sources.
- **Draft** is a versioned piece of written work for an assignment.

User-facing, this is presented as **Workspace → Assessment → Evidence Map → Write/Review**.

## Assessment Workflow

Inside an assessment, the student moves through three user-facing phases:

```
Plan → Write → Review
```

Internally, the production stage enum is richer and remains:

```
Ingest → Understand → Map → Judge → Build → Draft → Refine
```

The first four (Ingest, Understand, Map, Judge) are largely absorbed into workspace setup and Plan preparation. The user sees Plan / Write / Review; the system tracks the granular stage for AI prompting, completion signals, and stage-aware behavior.

| User phase | Internal stage(s) | Purpose | Key actions |
|------------|-------------------|---------|-------------|
| **Plan** | Understand → Map → Judge → Build | Turn the Source Base into a structured plan | Summaries, concepts, claims, evidence links, Evidence Map, gap checks, thesis and outline |
| **Write** | Draft | Produce the submission | Drafting, paraphrasing, restructuring, citing sources, integrating evidence |
| **Review** | Refine | Validate and polish | Review runs, citation safety, revision priorities, readiness checklist |

## What Polis Will Do for Writing

Polis is genuinely useful for writing. It will:

- Draft passages on request, grounded in the student's sources
- Paraphrase and restructure the student's own text
- Critique drafts against rubric and evidence
- Suggest revisions and surface unsupported claims
- Insert and format citations using only verified source data

Everything Polis writes that **claims** to be source-backed must be source-backed. Where the student uses AI-generated text, that is the student's responsibility to read, verify, and own.

## Target Users

- Undergraduate students in Politics, International Relations, Sociology, History, Law, Philosophy, Public Policy, PPE, Criminology, and related fields
- Students managing high volumes of complex material across multiple modules
- Students who want AI help that is grounded in their actual readings, not in a generic model's prior
- Students who take academic integrity seriously and want their tooling to support, not undermine, it

## The Problem

Social science coursework involves managing large volumes of complex material across multiple modules simultaneously. Students must:

- Track dozens of readings per module across multiple modules
- Extract arguments and evidence from dense academic texts
- Compare theories and frameworks across sources
- Build coherent, evidence-based submissions under time pressure
- Ensure proper citation and avoid unsupported claims
- Manage drafts, feedback, and revision cycles

Existing tools either fail to handle academic workflows (generic note-taking apps, generic AI chat) or encourage poor academic practice (essay mills, source-free AI generation that fabricates fluently).

## The Solution

Polis provides an AI-native workspace that mirrors how a module actually works:

1. One workspace per module
2. Drop in everything you have — Polis organizes it into a Source Base
3. Polis detects assessments and builds a dashboard
4. Inside each assessment, Plan / Write / Review with an embedded, source-backed assistant

Every AI action is scoped to the student's uploaded material. Every source-backed claim traces to a real chunk. Every warning is explicit.

## Differentiation

Polis is NOT:

- A generic "chat with PDFs" tool
- An essay mill or cheating aid
- A ChatGPT wrapper with a different skin
- An enterprise knowledge management platform
- A learning management system

Polis IS:

- An AI-native module operating system
- A workspace that organizes messy module files into a command center
- A source-grounded writing and review environment
- A planning tool that turns a Source Base into an Evidence Map
- A system that is honest about what it does and does not know

## Core Workflow

1. **Create a workspace** from a module name.
2. **Import** everything you have for the module — readings, slides, handbook, briefs, notes.
3. Polis **classifies** files and builds a **Source Base**.
4. Polis **extracts assessments and module facts** and builds an **assessment dashboard**.
5. Open an **assessment** and move through **Plan → Write → Review**.
6. Use the embedded **assistant** scoped to the workspace, the assessment, or specific sources.
7. Export or copy the finished work — the student owns the submission.

## Integrity Posture

- No fabricated citations, authors, page numbers, source claims, or catalog records — ever.
- AI writing that claims to be source-backed must be source-backed.
- Insufficient evidence produces soft warnings, not silent fabrication.
- Fake citations, invented page numbers, and misattribution are validation errors and are never treated as valid.
- Student responsibility for the submitted work is explicit throughout the product.

Full rules in `docs/ACADEMIC_INTEGRITY.md`.

## Non-Goals

- Not a cheating tool or unsupervised essay generator
- Not a replacement for reading
- Not a generic SaaS product for businesses
- Not a social network or collaboration platform (yet)
- Not a learning management system
- Not a citation manager (though it integrates citation awareness and validation)
