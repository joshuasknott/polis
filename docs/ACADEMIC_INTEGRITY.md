# Polis — Academic Integrity Policy

**Last updated**: 2026-06-14
**Authority**: This document defines non-negotiable integrity guarantees. All AI actions must enforce these rules.

## Direction Summary

Polis provides **powerful writing help** — drafting, paraphrasing, critique, restructuring, and revision. Integrity is enforced through **source-truth and labelling**, not by refusing to write.

Two kinds of guardrail:

- **Hard guardrails (validation truth).** Fake citations, invented authors, invented page numbers, misattribution, and fabricated catalog/source records are never produced and never treated as valid. These are errors, not warnings.
- **Soft guardrails (honest signalling).** Insufficient evidence, unsupported claims, and thin source coverage produce visible warnings and labels — but they do not block the user. The student decides what to do.

Student responsibility for the submitted work is explicit throughout the product.

## Core Principles

1. **No fabricated citations, authors, page numbers, source claims, or catalog records.** The system must never generate citations that do not exist in the uploaded Source Base.
2. **No invented page numbers.** Every page reference must come from actual extracted text (chunk metadata).
3. **No misattribution.** The system must not claim a source says something it does not say.
4. **Source-backed means source-backed.** AI text that claims to be source-supported must trace to a real retrieved chunk, with a valid citation.
5. **Clear labelling.** Every AI output must distinguish between source-supported claims, model interpretation, user ideas, and general context.
6. **Soft warnings over hard blocks.** Polis warns and labels; it does not gate the user — except for validation truth (fake citations, invented pages, misattribution), which are hard errors.
7. **Student responsibility.** The student remains fully responsible for the final submitted work. AI output is assistance, not authorship transfer.
8. **Learning support.** All features are designed to support understanding and improve academic skills, not to replace them.
9. **Harvard citation style (default).** Default citation format is `(Author, Year, p. X)`. Users may configure alternatives in future.
10. **Powerful, bounded AI help.** Polis is as helpful and progress-oriented as possible — including drafting, paraphrasing, critique, restructuring, and revision — while preserving source grounding and honesty about what is and is not in the Source Base.

## Label Taxonomy

Every claim in an AI response must be labelled. Implementation: `src/lib/integrity/labels.ts`.

| Label | Meaning | Requires Citation |
|-------|---------|-------------------|
| **`source_supported`** | Directly supported by uploaded source text, with citation | Yes |
| **`interpretation`** | The model's reading of a source — reasonable but not explicitly stated. Must still reference the source | Yes |
| **`user_idea`** | The student's own claim or argument | No |
| **`general_context`** | Background knowledge, not from any specific uploaded source | No |
| **`unsupported`** | Claim lacks sufficient evidence in the current Source Base | No |

A claim labelled `source_supported` that cannot be traced to a real chunk is an integrity violation and must be rejected or relabelled before display.

## Hard Errors vs Soft Warnings

| Outcome | Trigger | UX behaviour |
|---------|---------|--------------|
| **Hard error (validation truth)** | Fabricated citation, invented author, invented page, misattribution, fabricated source/catalog record | The system never emits these. If detected in any output, the offending item is rejected and never shown as valid |
| **Soft warning** | Insufficient evidence, thin source coverage, low retrieval confidence, claim not in assignment scope, missing page provenance | Visible label + warning. The user may proceed |
| **Info** | Single-source result set, comparative sources missing | Visible note. The user may proceed |

The only user-blocking behaviour is rejecting invalid source data at the validation layer. Everything else warns and lets the student decide.

## Writing Help Boundaries

Polis may help the student write. Implementation: `src/lib/integrity/draft-feedback-boundaries.ts` (scope widened from review-only).

**Allowed (Plan / Write / Review):**
- Drafting passages, sections, or full working drafts on request
- Paraphrasing and restructuring the student's own text
- Generating text grounded in retrieved source chunks (labelled `source_supported`)
- Generating text from the model's reasoning where no source claim is made (labelled `interpretation` or `general_context`)
- Critique against rubric, structure, evidence use, and argument coherence
- Inserting citations using only verified source data
- Suggesting revisions and surfacing unsupported claims
- Identifying where additional sources are needed

**Prohibited (always):**
- Generating citations, authors, page numbers, quotes, or source/catalog records that do not exist in the Source Base
- Attaching a `source_supported` label to text that is not traceable to a real chunk
- Presenting invented text as a direct quote from a source
- Helping students evade university academic-integrity disclosure obligations

**Explicit:**
- The student owns the submission. Polis does not warrant that any AI-assisted text is submittable as-is under the student's university policy. The student is responsible for reading, verifying, and disclosing AI use as their institution requires.

## Harvard Citation Format

Default citation style. Implementation: `src/lib/integrity/harvard.ts`.

| Scenario | Format |
|----------|--------|
| Author + Year + Page | `Author (Year, p. X)` |
| Author + Year + Page range | `Author (Year, pp. X–Y)` |
| Author + Year, no page | `Author (Year)` |
| Two authors | `Author1 and Author2 (Year)` |
| 3+ authors | `Author1 et al. (Year)` |
| Missing year | `Author (n.d.)` |
| Missing author | `Unknown Author (Year)` |

**Page numbers MUST come from chunk/source metadata. Page numbers MUST NOT be invented.**
If chunk metadata has no page data, the page reference MUST be omitted.

## Citation Validation

Implementation: `src/lib/integrity/citation-validator.ts` + `convex/lib/integrity.ts`.

All citations are validated against:

1. **Chunk existence** — the cited chunk must exist in the database (`CHUNK_NOT_FOUND` → error)
2. **Chunk–source consistency** — the chunk must belong to the claimed source (`CHUNK_SOURCE_MISMATCH` → error)
3. **Source existence** — the cited source must exist (`SOURCE_NOT_FOUND` → error)
4. **Ownership** — the source must belong to the current user (`SOURCE_OWNERSHIP_VIOLATION` → error)
5. **Assignment scope** — sources not in assignment selection produce a warning, not an error (`SOURCE_NOT_IN_ASSIGNMENT_SCOPE` → warning)
6. **Page verification** — claimed pages are checked against chunk metadata (`PAGE_UNVERIFIABLE`, `PAGE_OUTSIDE_CHUNK_RANGE` → warning; `PAGE_RANGE_INVALID` → error)
7. **Cross-module rejection** — sources from a different module are rejected (`CROSS_MODULE_CHUNK` → error)

Validation errors are hard: the offending citation is never shown as valid. Validation warnings are soft: the citation is shown with a visible warning.

## Unsupported Claim Policy

Implementation: `src/lib/integrity/unsupported-claim.ts`.

- `"I could not find this in your Source Base"` is always an acceptable answer.
- Interpretations must be labelled as such — they are not the same as unsupported claims.
- The system may suggest evidence gaps without fabricating evidence.
- Prohibited behaviours are enumerated in `UNSUPPORTED_CLAIM_POLICY.prohibitedBehaviours`.

## Prompt Guardrails

Implementation: `src/lib/integrity/prompt-guardrails.ts`.

`buildFullSystemPrompt(stage)` produces a composable system prompt containing:
- Integrity preamble (prohibited + permitted behaviours, including the writing-help permissions)
- Citation rules (mandatory Harvard format with no invented pages)
- Harvard format specification
- Stage-aware reminder (different reminder for each production stage)

`buildSourceContextBlock(sources)` formats retrieved chunks into numbered `[Source N]` blocks for LLM consumption.

## Prohibited Behaviours

The system will NOT:

- Fabricate citations, authors, publications, page numbers, or catalog records
- Invent quotes or quote locations
- Present model-generated text as source text
- Label text `source_supported` unless it traces to a real retrieved chunk
- Help students evade university academic-integrity disclosure obligations
- Write content designed to defeat AI-detection tools

The system no longer refuses to draft, paraphrase, restructure, or revise on principle. Those are permitted and supported, subject to source-truth and labelling.

## Safe Behaviours

The system WILL:

- Help students understand dense readings
- Generate structured summaries with source references
- Identify key concepts and arguments in uploaded materials
- Compare theories using evidence from sources
- Help plan assessment structures with evidence allocation
- Draft, paraphrase, restructure, and revise text — source-backed where claimed
- Critique drafts against rubrics
- Flag unsupported claims in student writing
- Suggest where additional sources are needed
- Check citation coverage in drafts
- Say explicitly when it could not find support in the Source Base

## Implementation Map

| Concern | File |
|---------|------|
| Label taxonomy | `src/lib/integrity/labels.ts` |
| Harvard renderer | `src/lib/integrity/harvard.ts` |
| Citation validator (pure) | `src/lib/integrity/citation-validator.ts` |
| Unsupported claim policy | `src/lib/integrity/unsupported-claim.ts` |
| Writing help boundaries | `src/lib/integrity/draft-feedback-boundaries.ts` |
| Prompt guardrails | `src/lib/integrity/prompt-guardrails.ts` |
| Barrel export | `src/lib/integrity/index.ts` |
| Convex adapter | `convex/lib/integrity.ts` |
| Tests (Harvard) | `convex/integrity/harvard.test.ts` |
| Tests (validator) | `convex/integrity/citation-validator.test.ts` |
| Tests (labels/policy) | `convex/integrity/labels-and-policy.test.ts` |

## University Policy

Students are encouraged to:

- Check their university's policy on AI-assisted tools and AI disclosure
- Use Polis as a learning aid, not a writing substitute
- Cite all sources properly in final submissions
- Verify all AI-generated summaries and drafts against original texts
- Disclose their use of AI tools where their institution requires it
- Take full responsibility for the submitted work, including any AI-assisted passages
