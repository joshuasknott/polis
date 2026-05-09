# Polis — Academic Integrity Policy

**Last updated**: 2026-05-09
**Authority**: This document defines non-negotiable integrity guarantees. All AI actions must enforce these rules.

## Core Principles

1. **No fabricated citations.** The system must never generate citations that do not exist in the uploaded source base.
2. **No invented page numbers.** Every page reference must come from actual extracted text (chunk metadata).
3. **No misattribution.** The system must not claim a source says something it does not say.
4. **Clear labelling.** Every AI output must distinguish between source-supported claims, model interpretation, user ideas, and general context.
5. **Sufficient evidence requirement.** The system must warn when the available source base is insufficient to support a claim.
6. **Student responsibility.** The student remains fully responsible for the final submitted work.
7. **Learning support, not replacement.** All features are designed to support understanding and improve academic skills.
8. **Harvard citation style.** Default citation format is `(Author, Year, p. X)`. Users may configure alternatives in future.
9. **AI source summaries are permitted.** AI-generated summaries of uploaded sources are an allowed feature, clearly labelled as AI-generated.
10. **Powerful but bounded AI help.** The CoThinker should be as helpful and progress-oriented as possible, but must preserve source grounding and academic integrity at all times.

## Label Taxonomy

Every claim in an AI response must be labelled. Implementation: `src/lib/integrity/labels.ts`.

| Label | Meaning | Requires Citation |
|-------|---------|-------------------|
| **`source_supported`** | Directly supported by uploaded source text, with citation | Yes |
| **`interpretation`** | The model's reading of a source — reasonable but not explicitly stated. Must still reference the source | Yes |
| **`user_idea`** | The student's own claim or argument | No |
| **`general_context`** | Background knowledge, not from any specific uploaded source | No |
| **`unsupported`** | Claim lacks sufficient evidence in the current source base | No |

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

## Unsupported Claim Policy

Implementation: `src/lib/integrity/unsupported-claim.ts`.

- `"I could not find this in your uploaded sources"` is always an acceptable answer.
- Interpretations must be labelled as such — they are not the same as unsupported claims.
- The system may suggest evidence gaps without fabricating evidence.
- Prohibited behaviours are enumerated in `UNSUPPORTED_CLAIM_POLICY.prohibitedBehaviours`.

## Draft Feedback Boundaries

Implementation: `src/lib/integrity/draft-feedback-boundaries.ts`.

**Allowed during Draft / Refine stages:**
- Identifying structural strengths and weaknesses
- Flagging unsupported claims that need citations
- Suggesting types of evidence needed (no fabrication)
- Checking argument coherence
- Comparing against rubric criteria

**Prohibited at all times:**
- Rewriting paragraphs or sections for the student
- Generating new content for insertion into drafts
- Fabricating citations, quotes, or page numbers
- Producing a complete or near-complete essay

## Prompt Guardrails

Implementation: `src/lib/integrity/prompt-guardrails.ts`.

`buildFullSystemPrompt(stage)` produces a composable system prompt containing:
- Integrity preamble (prohibited + permitted behaviours)
- Citation rules (mandatory Harvard format with no invented pages)
- Harvard format specification
- Stage-aware reminder (different reminder for each of the 7 production stages)

`buildSourceContextBlock(sources)` formats retrieved chunks into numbered `[Source N]` blocks for LLM consumption.

## Prohibited Behaviours

The system will NOT:
- Generate complete essays for submission
- Fabricate citations, authors, or publications
- Invent page numbers or quote locations
- Present model-generated text as source text
- Help students circumvent university academic integrity policies
- Write content designed to pass AI detection tools

## Safe Behaviours

The system WILL:
- Help students understand dense readings
- Generate structured summaries with source references
- Identify key concepts and arguments in uploaded materials
- Compare theories using evidence from sources
- Help plan essay structures with evidence allocation
- Provide feedback on draft quality against rubrics
- Flag unsupported claims in student writing
- Suggest where additional sources are needed
- Check citation coverage in drafts

## Implementation Map

| Concern | File |
|---------|------|
| Label taxonomy | `src/lib/integrity/labels.ts` |
| Harvard renderer | `src/lib/integrity/harvard.ts` |
| Citation validator (pure) | `src/lib/integrity/citation-validator.ts` |
| Unsupported claim policy | `src/lib/integrity/unsupported-claim.ts` |
| Draft feedback boundaries | `src/lib/integrity/draft-feedback-boundaries.ts` |
| Prompt guardrails | `src/lib/integrity/prompt-guardrails.ts` |
| Barrel export | `src/lib/integrity/index.ts` |
| Convex adapter | `convex/lib/integrity.ts` |
| Tests (Harvard) | `convex/integrity/harvard.test.ts` |
| Tests (validator) | `convex/integrity/citation-validator.test.ts` |
| Tests (labels/policy) | `convex/integrity/labels-and-policy.test.ts` |

## University Policy

Students are encouraged to:
- Check their university's policy on AI-assisted tools
- Use Polis as a learning aid, not a writing substitute
- Cite all sources properly in final submissions
- Verify all AI-generated summaries against original texts
- Discuss their use of AI tools with tutors if required
