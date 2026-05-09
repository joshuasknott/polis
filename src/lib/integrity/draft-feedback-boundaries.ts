import type { ProductionStage } from "../types";

export type DraftFeedbackStage = "draft" | "refine";

export interface DraftFeedbackBoundaries {
  allowed: string[];
  prohibited: string[];
  integrityReminder: string;
}

export const DRAFT_FEEDBACK_BOUNDARIES: DraftFeedbackBoundaries = {
  allowed: [
    "Identifying structural strengths and weaknesses in the draft",
    "Flagging unsupported claims that need citations",
    "Suggesting the types of evidence needed (without fabricating sources)",
    "Checking argument coherence and logical progression",
    "Comparing draft content against rubric criteria",
    "Highlighting where the student's own ideas need grounding in sources",
    "Providing formative feedback on academic writing style",
  ],
  prohibited: [
    "Rewriting paragraphs or sections for the student",
    "Generating new content to insert into the draft",
    "Fabricating citations, quotes, or page numbers",
    "Producing a complete or near-complete essay",
    "Writing content that could be submitted as the student's own work",
    "Generating unlabelled full essay sections",
  ],
  integrityReminder:
    "Polis provides feedback and scaffolding only. All writing must remain the student's own work.",
};

export function isDraftFeedbackAllowed(action: string): boolean {
  const lc = action.toLowerCase();
  const prohibitedKeywords = [
    "rewrite",
    "write this for me",
    "generate the essay",
    "complete essay",
    "full essay",
    "write my",
    "write the introduction",
    "write the conclusion",
    "write a paragraph",
    "write me a",
  ];
  return !prohibitedKeywords.some((kw) => lc.includes(kw));
}

export function getDraftFeedbackBoundaryWarning(stage: ProductionStage): string | null {
  if (stage === "draft" || stage === "refine") {
    return (
      "Feedback identifies strengths, weaknesses, and improvement areas. " +
      "It does not rewrite your work or generate new content for insertion."
    );
  }
  return null;
}
