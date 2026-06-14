# Polis — UX Flow

**Last updated**: 2026-06-14

## Terminology

This document uses **user-facing language**. Internal data-model names (kept stable in code) appear in parentheses where useful for implementation agents.

| User-facing | Internal |
|-------------|----------|
| Workspace | Module |
| Assessment | Assignment |
| Source Base | Sources in a module |
| Evidence Map | Arguments + evidence links |
| Plan | Build stage (and Understand/Map/Judge preparation) |
| Write | Draft stage |
| Review | Refine stage |
| Assistant (in-context) | CoThinker |
| Tools (in-context) | Workbench actions |

See `docs/PRODUCT_VISION.md` for the full product thesis.

## Top-Level Flow

```
Create workspace → Import → Classify → Extract → Dashboard → Open assessment → Plan / Write / Review
```

The workspace is the home base. Everything else lives inside it. There are no standalone CoThinker or Workbench destinations — those capabilities are embedded in context where the student is working.

## First Visit

1. User lands on the **Landing Page**.
2. Reads the value proposition: "Turn messy module files into a command center for coursework."
3. Sees the flow explanation: Create workspace → Import → Classify → Dashboard → Plan / Write / Review.
4. Clicks "Get Started" → navigates to **Dashboard**.

## Dashboard

1. Welcome message with user context.
2. **Workspace cards** showing active modules with source counts, assessment counts, and recent activity.
3. **Active assessments** across all workspaces, with deadlines and current phase (Plan / Write / Review).
4. Recent in-context assistant conversations.
5. Quick actions: **Create workspace**, **Import**, **Open assessment**.

## Workspace Journey

### Creating a Workspace

1. Click **Create workspace** from the Dashboard.
2. Enter just the **module name**. (Optional: module code, year, semester.)
3. A workspace is created. The student is dropped straight into the import step.

> Internal: creates a `modules` row. Default folders are created automatically. The student is not asked to set up folders manually.

### Importing Module Material

1. The workspace shows a large drop zone: "Drop everything you have for this module."
2. Student drops in PDFs, DOCX, PPTX, images of slides, the module handbook, briefs, their own notes — anything.
3. Files upload via Convex storage and begin processing (extraction + chunking + analysis).
4. Progress is shown per file.

> Internal: `files.generateUploadUrl` → client upload → `sources.attachStorage` → `processing.extractText` → `processing.chunkText` → `ai.summarizeSource`.

### Classifying Files

1. As files finish processing, Polis **classifies** each into the Source Base: readings, lecture material, seminar material, module handbook, assignment briefs, marking rubrics, the student's own notes, etc.
2. The student sees the proposed classification and can reclassify or merge items.
3. The Source Base becomes the navigable library of everything in the workspace.

> Internal: `sources.type` (`SourceType`) drives classification. Classification may be AI-suggested and user-confirmed. Folders are derived/organised from `SourceType`.

### Extracting Assessments and Module Facts

1. Polis reads the handbook, briefs, and rubrics and **extracts assessments** (questions, word limits, deadlines, rubrics) plus **module facts** (learning outcomes, themes, key concepts).
2. The student reviews extracted assessments for accuracy and confirms or edits them.
3. Confirmed assessments appear on the assessment dashboard.

> Internal: creates `assignments` rows from extracted briefs. Module-level facts populate `modules.themes`, `modules.concepts`, `modules.learningOutcomes`.

### Assessment Dashboard

1. The workspace shows an **assessment dashboard**: every assessment for the module, with status, deadline, word count progress, source coverage, and current phase.
2. The student picks an assessment and enters it.

### Workspace Layout

```
┌──────────────┬────────────────────────────┬──────────────────┐
│  Workspace   │     Main Content Area      │  Assistant       │
│  Nav         │                            │  (in-context)    │
│              │                            │                  │
│  Source Base │  Assessment Dashboard      │  Scope selector  │
│  Assessments │  Source Viewer             │  Chat / actions  │
│  Evidence    │  Plan / Write / Review     │  Citations       │
│  Map         │                            │  Warnings        │
│              │                            │                  │
└──────────────┴────────────────────────────┴──────────────────┘
```

The right panel is the embedded assistant (formerly "CoThinker"). It is always available inside a workspace, never a separate destination. The left nav switches between Source Base, Assessments, and Evidence Map.

## Source Base Journey

### Browsing the Source Base

1. Open a workspace → **Source Base**.
2. Filter by type (readings, lectures, briefs, handbook, notes) or search.
3. Each source shows title, author, year, type, and processing status.

### Viewing a Source

1. Click a source → **Source Viewer**.
2. Header: title, author, year, type badge, citation.
3. Sections: Summary, Main Argument, Key Concepts, Evidence excerpts, Limitations.
4. Actions: re-summarise, extract concepts, add to an assessment's selected sources, link to Evidence Map.

### Working With a Source (Plan preparation)

1. Open the in-context assistant with a source selected.
2. Ask "What is the main argument of this reading?"
3. Receive a source-grounded answer with citations and labels.
4. See "Supported by sources" badges.
5. Follow up with "How could I use this in my assessment?"

## Assessment Journey

Inside an assessment, the student moves through three user-facing phases: **Plan → Write → Review**.

### Creating an Assessment Manually

Most assessments come from extraction (above). The student can also create one manually:

1. From the workspace → Assessments → **New assessment**.
2. Enter coursework question, word limit, due date.
3. Select or upload marking rubric.
4. Select relevant sources from the Source Base.
5. The assessment opens at the start of **Plan**.

### Plan

Goal: turn the Source Base into a structured plan and Evidence Map.

1. Review the selected sources for this assessment.
2. Use the in-context assistant to summarise readings, extract concepts, and identify claims.
3. Build the **Evidence Map**: structured claims (Arguments) linked to evidence from sources.
4. Identify themes, gaps, and counterarguments.
5. Draft a working thesis, section plan, and word budget.
6. Allocate evidence to sections.

> Internal: corresponds to `understand → map → judge → build` stages. Completion signal: at least one Argument with synthesis and allocated evidence.

### Write

Goal: produce the submission.

1. Write in the assessment's draft editor, or paste from an external editor.
2. The in-context assistant provides powerful writing help:
   - Draft passages on request (source-backed where claimed)
   - Paraphrase and restructure selected text
   - Suggest revisions and structural changes
   - Insert citations using only verified source data
   - Critique as you go
3. Evidence links show available evidence by argument.
4. Soft warnings flag unsupported claims and missing citations — the student decides whether to act.

> Internal: corresponds to `draft` stage. Completion signal: draft has content and word count > 0.

### Review

Goal: validate and polish.

1. Submit the draft for review.
2. Receive a structured **Review**:
   - Strengths
   - Weaknesses
   - Missing evidence
   - Unsupported claims
   - Revision priorities
   - Rubric alignment assessment
   - Citation safety
3. Iterate. The assistant can revise, paraphrase, and restructure on request.
4. Run a final citation safety check.
5. Confirm readiness when all review findings are resolved.

> Internal: corresponds to `refine` stage. Completion signal: all review findings resolved, user confirms ready.

## In-Context Assistant (Embedded CoThinker)

The assistant is always available inside a workspace or assessment — never a separate destination. It adapts to context: scope (workspace / assessment / source) and phase (Plan / Write / Review).

### Asking Questions

1. Open the assistant panel (right side of the workspace or assessment).
2. Select scope: workspace / assessment / specific sources.
3. The assistant adapts to the current phase.
4. Create or resume a persisted conversation.
5. Type a question or pick a directive card.
6. Receive an answer with:
   - Source citations where applicable
   - "Supported by sources" / "Interpretation" / "General context" labels
   - Soft warnings if evidence is insufficient
   - Follow-up suggestions

### Writing Help

Inside Write and Review, the assistant will, on request:

- Draft a passage, section, or full working draft
- Paraphrase or restructure the student's own text
- Critique against rubric and evidence
- Suggest and apply revisions
- Insert citations using verified source data

All writing that claims to be source-backed must be source-backed. Where the Source Base is thin, the assistant warns and labels rather than fabricating.

### Persistent Sessions

- Conversations are persisted in Convex and can be resumed.
- Session list shows message count, phase, and scope.
- Assessment-scoped sessions appear in the assistant panel inside the assessment.

### Phase-Aware Directive Cards

- **Plan**: coverage and brief/rubric questions, source summary prompts, theme and evidence prompts, gap and counterargument prompts, structure and thesis prompts.
- **Write**: drafting prompts, paraphrase/restructure prompts, citation reminders, unsupported-claim flags.
- **Review**: revision priorities, rubric alignment, citation safety, readiness checklist.

### Integrity Behaviour

- If no evidence is found, the assistant says so explicitly.
- No fabricated citations, authors, page numbers, or catalog records.
- Labels for source-supported, interpretation, unsupported, and general context.
- Soft warnings for insufficient evidence — never silent fabrication.
- Writing help is permitted; source-backed claims must be source-backed.

### Example Interaction

```
User: "What is the difference between Lijphart's consensus model and
       Tsebelis's veto player theory?"

Assistant: [Source-supported] Lijphart classifies democracies along a
           majoritarian-consensus dimension using 10 institutional
           variables... (Lijphart, 1999, pp. 2-3)

           [Source-supported] Tsebelis identifies "veto players" whose
           agreement is necessary for policy change... (Tsebelis, 2002, p. 19)

           [Interpretation] These frameworks complement each other:
           Lijphart for classification, Tsebelis for mechanism.

           Warning: Your Source Base does not include a direct comparison
           of these two theorists. Consider adding a comparative source.

           Follow-up: "How does Tsebelis explain policy change in consensus
           systems?"
```

## In-Context Tools (Embedded Workbench)

Stage-appropriate tools appear in context within the phase the student is in — not on a standalone Workbench page.

| Phase | Available Tools |
|-------|-----------------|
| **Plan** | Reading Summary, Key Concept Extractor, Theory Comparison, Literature Matrix, Evidence Bank, Counterargument Finder, Research Gap Finder, Argument Builder, Section Planner |
| **Write** | Draft Editor, Paraphrase, Restructure, Citation Inserter |
| **Review** | Draft Review, Citation Safety Check, Readiness Checklist |

The standalone Workbench page is deprecated as a destination. Its tools are surfaced inline where they are useful.
