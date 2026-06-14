# Polis Roadmap

**Last updated**: 2026-06-14

## Active: Phase 5 - AI-Native Module OS

**Status**: In progress

**Goal**: Make Polis a workspace-first module operating system. A student creates a workspace, imports everything they already have, and works through assessments with embedded, source-backed AI across Plan, Write, and Review.

### Completed UX Foundation

- [x] Product-led marketing site focused on source-backed workspaces.
- [x] Dashboard is workspace-first and has no sidenav.
- [x] Timeline is merged into Workspaces instead of being a separate top-level destination.
- [x] Workspace creation asks for name, semester, and year only.
- [x] Semester is a free-text field.
- [x] Workspace shell appears after opening a workspace.
- [x] User-facing copy now centers Workspace / Assessment / Source Base / Evidence Map / Plan / Write / Review.

### Workspace Setup

- [x] Create workspace from name, semester, and year.
- [ ] Bulk import flow: drop everything for the module.
- [ ] AI-assisted source classification with user confirmation.
- [ ] Assessment and module-fact extraction from briefs, rubrics, and handbooks.
- [ ] Workspace home shows import review, assessment deadlines, timeline, and source coverage.

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
- [ ] Processing pipeline monitoring.

## Reference Docs

- `docs/PRODUCT_VISION.md`
- `docs/MVP_SCOPE.md`
- `docs/CURRENT_ARCHITECTURE.md`
- `docs/IMPLEMENTATION_CONTRACTS.md`
- `docs/UX_FLOW.md`
- `docs/ACADEMIC_INTEGRITY.md`
