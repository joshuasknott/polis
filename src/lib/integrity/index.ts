export { CLAIM_LABELS, LABEL_META, isValidClaimLabel, labelRequiresCitation } from "./labels";
export type { ClaimLabel, LabelMeta } from "./labels";

export { renderHarvardInText, renderHarvardReference } from "./harvard";
export type { HarvardCitationInput, HarvardCitationResult } from "./harvard";

export {
  validateCitationOwnership,
  validateNoFabricatedPages,
  crossModuleChunkRejection,
  noSourceQueryWarning,
} from "./citation-validator";
export type {
  CitationInput,
  CitationFinding,
  CitationValidationResult,
  CitationSeverity,
  SourceMeta,
  ChunkMeta,
} from "./citation-validator";

export {
  UNSUPPORTED_CLAIM_POLICY,
  classifyUnsupportedClaim,
  buildUnsupportedClaimWarnings,
} from "./unsupported-claim";
export type { UnsupportedClaimPolicy } from "./unsupported-claim";

export {
  DRAFT_FEEDBACK_BOUNDARIES,
  isDraftFeedbackAllowed,
  getDraftFeedbackBoundaryWarning,
} from "./draft-feedback-boundaries";
export type { DraftFeedbackBoundaries, DraftFeedbackStage } from "./draft-feedback-boundaries";

export {
  buildSystemGuardrails,
  buildFullSystemPrompt,
  buildSourceContextBlock,
} from "./prompt-guardrails";
export type { PromptGuardrails } from "./prompt-guardrails";
