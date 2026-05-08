# Polis — UX Flow

## Main User Journey

### First Visit
1. User lands on the **Landing Page**
2. Reads value proposition: "Turn scattered readings into structured arguments"
3. Sees workflow explanation, feature cards, academic integrity commitment
4. Clicks "Get Started" → navigates to **Dashboard**

### Dashboard
1. Welcome message with user context (university, course, year)
2. Module cards showing active modules with source counts and activity
3. Recent sources list
4. Recent AI conversations
5. Upcoming essay deadlines
6. Quick actions (Create Module, Upload Source, Start Essay)

## Module Journey

### Creating a Module
1. Click "Create Module" from Dashboard
2. Enter module title, code, academic year, semester, description
3. Default folder structure is created automatically
4. Module card appears on Dashboard

### Working in a Module
1. Click module card → **Module Workspace**
2. Left panel: folder tree navigation
3. Center panel: folder contents or overview
4. Right panel: AI assistant

### Module Workspace Layout
```
┌──────────────┬────────────────────────────┬──────────────────┐
│  Module Nav  │     Main Content Area      │  AI Assistant    │
│              │                            │                  │
│  Folders     │  Source List / Source View  │  Scope Selector  │
│  Tools       │  Essay Overview            │  Chat Messages   │
│  Essays      │  Evidence Bank             │  Citations       │
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
4. Actions: Summarise, Extract Concepts, Add to Evidence Bank, Compare, Use in Essay

### Understanding a Source
1. Open AI assistant with source selected
2. Ask "What is the main argument of this reading?"
3. Receive source-grounded answer with citations
4. See "Supported by sources" badges
5. Follow up with "How could I use this in my essay?"

## Essay Journey

### Starting an Essay
1. From module workspace → Essay Plans folder
2. Click "Create Essay Project"
3. Enter essay question, word count, due date
4. Select or upload marking rubric
5. Select relevant sources

### Planning an Essay
1. **Essay Project Workspace** opens
2. View essay question and rubric
3. Use AI to generate thesis options
4. Build essay structure section by section
5. Allocate evidence to sections
6. Identify counterarguments
7. See research gaps highlighted

### Drafting an Essay
1. Write draft in the essay workspace or paste from external editor
2. AI provides real-time feedback:
   - Unsupported claims flagged
   - Missing citations highlighted
   - Structure suggestions
3. Evidence bank shows available evidence by section

### Reviewing a Draft
1. Submit draft for AI review
2. Receive structured feedback:
   - Strengths
   - Weaknesses
   - Missing evidence
   - Unsupported claims
   - Revision priorities
   - Estimated mark range
3. Iterate on draft

## Assistant Journey

### Asking Questions
1. Open AI assistant panel (right side of module workspace)
2. Select scope: whole module / current folder / selected sources / essay project
3. Select mode: source-grounded / brainstorm / reading summary / essay planning / draft feedback / citation safety
4. Type question
5. Receive answer with:
   - Source citations where applicable
   - "Supported by sources" badges
   - "Interpretation" labels where applicable
   - Warnings if evidence is insufficient
   - Follow-up suggestions

### Example Interaction
```
User: "What is the difference between Lijphart's consensus model and
       Tsebelis's veto player theory?"

AI:   [Source-supported] Lijphart classifies democracies along a
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
