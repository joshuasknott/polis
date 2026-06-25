# Polis Roadmap

**Last updated**: 2026-06-21

## Active: Phase 5 - AI-Native Module OS

**Status**: In progress

**Goal**: Make Polis a workspace-first module operating system. A student creates a workspace, imports everything they already have, and works through assessments with embedded, source-backed AI across Plan, Write, and Review.

### Completed UX Foundation

- [x] Product-led marketing site focused on source-backed workspaces.
- [x] Dashboard is workspace-first and has no sidenav.
- [x] Dashboard is a simple workspace launcher.
- [x] Workspace creation and editing ask for name only.
- [x] Workspace shell appears after opening a workspace.
- [x] Workspace sidenav is limited to Module Info, Sources, Assignments, and Settings pinned at the bottom.
- [x] Module Info is the default workspace landing page with the setup tracker.
- [x] User-facing copy now centers Workspace / Assessment / Source Base / Evidence Map / Plan / Write / Review.

### Workspace Setup

- [x] Create workspace from name only.
- [x] Bulk import flow: upload multiple files into an import batch.
- [x] AI-assisted source classification with user confirmation.
- [x] Assessment and module-fact extraction from briefs, rubrics, and handbooks.
- [x] Import-time source summaries, concepts, claims, relevance signals, and gap signals.
- [x] Visible, reversible Polis activity log for import AI actions.
- [x] Module Info shows workspace setup, source organization, assessment start, Plan, Write, and Review status.

### Embedded AI

- [ ] In-context assistant inside workspace and assessment.
- [ ] In-context tools surfaced inside Plan / Write / Review.
- [ ] Phase-aware directive cards.

### Writing Help

- [ ] Drafting on request, source-backed where claimed.
- [ ] Paraphrase and restructure.
- [ ] Critique against rubric and evidence.
- [ ] Citation insertion from verified source data.
- [ ] Revision and restructuring in Review.
- [ ] Soft warnings for unsupported claims; hard errors only for fabrication, fake citations, fake pages, or misattribution.

### Integrity UX

- [ ] Hard rejection of fabricated citations, pages, and misattribution at the validation layer.
- [ ] Visible labels on AI claims.
- [ ] Explicit student-responsibility messaging.

## Phase 4 - Production Architecture & Runtime

**Status**: Foundation in place, runtime wiring continuing.

- [x] Convex + Clerk architecture documented.
- [x] Convex schema and implementation contracts documented.
- [x] z.ai/GLM primary and Gemini secondary provider strategy documented.
- [x] AI provider actions in Convex.
- [x] CoThinker chat runtime with retrieval.
- [x] Source analysis actions.
- [x] Draft review AI action.
- [x] Cleanup cascade actions.
- [x] Rate limiting via usage event tracking.
- [ ] Vector embeddings and Convex vector search.
- [ ] Judgement generation actions.
- [x] Processing pipeline activity surfaced in Sources.

## Reference Docs

- `docs/PRODUCT_VISION.md`
- `docs/MVP_SCOPE.md`
- `docs/CURRENT_ARCHITECTURE.md`
- `docs/IMPLEMENTATION_CONTRACTS.md`
- `docs/UX_FLOW.md`
- `docs/ACADEMIC_INTEGRITY.md`
