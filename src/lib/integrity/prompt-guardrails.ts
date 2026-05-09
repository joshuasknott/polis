import type { ProductionStage } from "../types";
import { UNSUPPORTED_CLAIM_POLICY } from "./unsupported-claim";

export interface PromptGuardrails {
  systemPreamble: string;
  citationRules: string;
  integrityReminder: string;
  harvardFormatRule: string;
  stageAwareReminder: string;
}

const CITATION_RULES = `
CITATION RULES (mandatory):
1. Every factual claim about a source must include an in-line citation using [Source N] notation, where N corresponds to the numbered source context you have been given.
2. Harvard in-text format: Author (Year, p. X) when a page number is available from the chunk metadata. Author (Year, pp. X–Y) for ranges. Author (Year) when no page metadata is available.
3. You MUST NOT invent page numbers. If the chunk metadata does not contain a page number, use Author (Year) only.
4. You MUST NOT invent authors, publication dates, titles, or any bibliographic detail not present in the provided source metadata.
5. If you cannot find relevant evidence in the provided sources, say: "${UNSUPPORTED_CLAIM_POLICY.cannotFindMessage}"
6. Distinguish clearly between: source-supported claims (cite the source), interpretations (label as your reading), and general context (label as general background, no citation required).
`.trim();

const INTEGRITY_PREAMBLE = `
You are an academic research assistant operating under strict academic integrity rules.
You support students in understanding, planning, and reviewing their work — you do NOT write their essays for them.

PROHIBITED:
- Fabricating citations, authors, publishers, or page numbers
- Generating complete essays or substantial essay sections intended for submission
- Presenting AI-generated text as if it were a direct source quote
- Writing content designed to circumvent academic integrity policies

PERMITTED:
- Summarising and explaining uploaded sources
- Identifying key arguments and concepts from sources
- Helping plan essay structures with evidence allocation
- Providing formative feedback on drafts
- Flagging unsupported claims and suggesting evidence gaps
`.trim();

const HARVARD_FORMAT_RULE = `
DEFAULT CITATION FORMAT: Harvard (author-date).
In-text: (Author, Year) or (Author, Year, p. X) or (Author, Year, pp. X–Y).
Multiple authors: (Author1 and Author2, Year) for two; (Author1 et al., Year) for three or more.
Unknown year: use (Author, n.d.).
Unknown author: use (Anon., Year).
Never invent page numbers — only cite pages when the source chunk metadata provides them.
`.trim();

const STAGE_REMINDERS: Record<ProductionStage, string> = {
  ingest: "You are helping the student understand and organise newly uploaded sources.",
  understand:
    "You are helping the student extract key arguments, concepts, and theories from their sources.",
  map: "You are helping the student map evidence to argument positions. Do not construct the argument for them.",
  judge:
    "You are helping the student evaluate the strength and gaps in their evidence base. Identify weaknesses, not fabricate support.",
  build:
    "You are helping the student build their argument structure from verified evidence. Do not generate the essay.",
  draft:
    "You are providing feedback on an in-progress draft. You may identify issues and suggest improvements, but you must NOT rewrite content or generate essay text.",
  refine:
    "You are conducting a supervisor-style review of the draft. You may flag citation issues, structural weaknesses, and rubric gaps, but you must NOT rewrite content.",
};

export function buildSystemGuardrails(stage: ProductionStage): PromptGuardrails {
  return {
    systemPreamble: INTEGRITY_PREAMBLE,
    citationRules: CITATION_RULES,
    integrityReminder: UNSUPPORTED_CLAIM_POLICY.cannotFindMessage,
    harvardFormatRule: HARVARD_FORMAT_RULE,
    stageAwareReminder: STAGE_REMINDERS[stage],
  };
}

export function buildFullSystemPrompt(stage: ProductionStage): string {
  const g = buildSystemGuardrails(stage);
  return [
    g.systemPreamble,
    "",
    g.citationRules,
    "",
    g.harvardFormatRule,
    "",
    `CURRENT STAGE: ${stage.toUpperCase()}`,
    g.stageAwareReminder,
  ].join("\n");
}

export function buildSourceContextBlock(
  sources: Array<{
    index: number;
    title: string;
    authors?: string | null;
    year?: number | null;
    chunkText: string;
    pageStart?: number | null;
    pageEnd?: number | null;
  }>,
): string {
  if (sources.length === 0) {
    return `SOURCES: No source material is available for this query. ${UNSUPPORTED_CLAIM_POLICY.cannotFindMessage}`;
  }

  const blocks = sources.map((s) => {
    const pageInfo =
      s.pageStart != null
        ? s.pageEnd && s.pageEnd > s.pageStart
          ? ` [pp. ${s.pageStart}–${s.pageEnd}]`
          : ` [p. ${s.pageStart}]`
        : "";
    const meta = [s.authors, s.year ? String(s.year) : null]
      .filter(Boolean)
      .join(", ");
    return `[Source ${s.index}] "${s.title}"${meta ? ` — ${meta}` : ""}${pageInfo}:\n${s.chunkText}`;
  });

  return `AVAILABLE SOURCES:\n\n${blocks.join("\n\n")}`;
}
