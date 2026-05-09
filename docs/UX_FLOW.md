# Polis — UX Flow

## Main User Journey

### First Visit
1. User lands on the **Landing Page**
2. Reads value proposition: "Turn scattered readings into structured arguments"
3. Sees workflow explanation (Ingest → Understand → Map → Judge → Build → Draft → Refine)
4. Clicks "Get Started" → navigates to **Dashboard**

### Dashboard
1. Welcome message with user context (university, course, year)
2. Module cards showing active modules with source counts and activity
3. Active assignments with deadlines and current production stage
4. Recent CoThinker conversations
5. Quick actions (Create Module, Upload Source, New Assignment)

## Module Journey

### Creating a Module
1. Click "Create Module" from Dashboard
2. Enter module title, code, academic year, semester, description
3. Default folder structure is created automatically
4. Module card appears on Dashboard

### Working in a Module
1. Click module card → **Module Workspace**
2. Left panel: folder tree navigation
3. Centre panel: folder contents or overview
4. Right panel: CoThinker

### Module Workspace Layout
```
┌──────────────┬────────────────────────────┬──────────────────┐
│  Module Nav  │     Main Content Area      │  CoThinker       │
│              │                            │                  │
│  Folders     │  Source List / Source View  │  Scope Selector  │
│  Workbench   │  Assignment Overview       │  Chat Messages   │
│  Assignments │  Argument Map              │  Citations       │
│              │                            │  Warnings        │
└──────────────┴────────────────────────────┴──────────────────┘
```

## Source Journey

### Adding Sources
1. Navigate to module → Readings folder
2. Click upload area (future: real upload; prototype: mock files)
3. Source is processed: text extracted, chunked, embedded
4. Source appears in folder with metadata

### Viewing a Source
1. Click source from list → **Source Viewer**
2. Header: title, author, year, type badge, citation
3. Tabs or sections: Summary, Main Argument, Key Concepts, Evidence, Limitations
4. Actions: Summarise, Extract Concepts, Add to Evidence Bank, Compare, Link to Argument

### Understanding a Source (Understand stage)
1. Open CoThinker with source selected
2. Ask "What is the main argument of this reading?"
3. Receive source-grounded answer with citations
4. See "Supported by sources" badges
5. Follow up with "How could I use this in my assignment?"

## Assignment Journey

### Creating an Assignment
1. From module workspace → Assignments folder
2. Click "New Assignment"
3. Enter coursework question, word limit, due date
4. Select or upload marking rubric
5. Select relevant sources
6. Assignment enters the **Ingest** stage

### Production Workflow

#### Ingest → Understand
1. Review selected sources in the assignment workspace
2. Use CoThinker to summarise individual readings
3. Extract key concepts and arguments
4. Stage advances to **Understand** when sources are processed

#### Map
1. Use the literature matrix or theory comparison tools
2. Build connections between sources
3. Identify themes and patterns across readings
4. Begin linking evidence to potential claims

#### Judge
1. Run gap analysis on the current evidence base
2. Identify counterarguments to emerging claims
3. Check evidence sufficiency for each planned section
4. Receive Judgements flagging weak areas

#### Build
1. **Assignment Workspace** opens
2. View coursework question and rubric
3. Construct structured Arguments with linked evidence
4. Allocate word budget to sections
5. CoThinker helps refine thesis and structure

#### Draft
1. Write draft in the assignment workspace or paste from external editor
2. CoThinker provides contextual feedback:
   - Unsupported claims flagged
   - Missing citations highlighted
   - Structure suggestions
3. Evidence links show available evidence by argument

#### Refine
1. Submit draft for review
2. Receive structured Review:
   - Strengths
   - Weaknesses
   - Missing evidence
   - Unsupported claims
   - Revision priorities
   - Rubric alignment assessment
3. Iterate on draft
4. Run citation safety check

## CoThinker Journey

### Asking Questions
1. Open CoThinker panel (right side of assignment workspace) or the global CoThinker page
2. Select scope: module / assignment (with live Convex data)
3. CoThinker adapts to the current production stage
4. Create or resume a persisted conversation
5. Type question
6. Receive answer with:
   - Source citations where applicable
   - "Supported by sources" badges
   - "Interpretation" labels where applicable
   - Warnings if evidence is insufficient
   - Follow-up suggestions

### Persistent Sessions
- Conversations are persisted in Convex and can be resumed
- Session list shows message count, stage, and scope
- Assignment-scoped sessions appear in the CoThinker panel
- Global sessions appear on the /assistant page

### Stage-Aware Directive Cards
- Ingest: coverage and brief/rubric questions
- Understand: source summary and concept prompts
- Map: theme and evidence link prompts
- Judge: gap and counterargument prompts
- Build: structure and thesis prompts
- Draft: writing feedback and citation reminders
- Refine: unsupported claims, rubric alignment, citation safety

### Integrity
- If no evidence, CoThinker says so explicitly
- No fabricated citations
- Labels for source-supported, interpretation, unsupported, general context
- Warnings for insufficient evidence
- No essay generation

### Example Interaction
```
User: "What is the difference between Lijphart's consensus model and
       Tsebelis's veto player theory?"

CoThinker: [Source-supported] Lijphart classifies democracies along a
           majoritarian-consensus dimension using 10 institutional variables...
           (Lijphart, 1999, pp. 2-3)

           [Source-supported] Tsebelis identifies "veto players" whose
           agreement is necessary for policy change... (Tsebelis, 2002, p. 19)

           [Interpretation] These frameworks complement each other:
           Lijphart for classification, Tsebelis for mechanism.

           ⚠️ Warning: Your source base does not include a direct comparison
           of these two theorists. Consider adding a comparative source.

           Follow-up: "How does Tsebelis explain policy change in consensus
           systems?"
```

## Workbench Journey

The Workbench is secondary to the assignment workflow. Stage-appropriate actions should appear in context first, with the standalone Workbench remaining a paused migration surface until Convex-backed runtime actions are rebuilt:

| Production Stage | Available Tools |
|-----------------|-----------------|
| Understand | Reading Summary, Key Concept Extractor |
| Map | Theory Comparison, Literature Matrix, Evidence Bank |
| Judge | Counterargument Finder, Research Gap Finder, Argument Map |
| Build | Argument Builder, Section Planner |
| Draft | Draft Editor |
| Refine | Draft Review, Citation Safety Check |
