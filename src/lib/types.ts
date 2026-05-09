export const PRODUCTION_STAGES = [
  "ingest",
  "understand",
  "map",
  "judge",
  "build",
  "draft",
  "refine",
] as const;

export type ProductionStage = (typeof PRODUCTION_STAGES)[number];

export type SourceType =
  | "journal_article"
  | "book_chapter"
  | "lecture_slides"
  | "module_handbook"
  | "assignment_brief"
  | "marking_rubric"
  | "seminar_notes"
  | "draft"
  | "book"
  | "report"
  | "news_article";

export type SourceStatus =
  | "placeholder"
  | "uploading"
  | "queued"
  | "extracting"
  | "chunking"
  | "processing"
  | "processed"
  | "needs_review"
  | "failed";

export type ProcessingStatus = SourceStatus;

export type CoThinkerScope =
  | "whole_module"
  | "current_folder"
  | "selected_sources"
  | "assignment";

export type MessageRole = "user" | "assistant" | "system";

export type FolderType =
  | "module_info"
  | "readings"
  | "lecture_material"
  | "source_notes"
  | "assignments"
  | "drafts_reviews"
  | "submissions"
  | "custom";

export type WorkbenchToolType =
  | "reading_summary"
  | "concept_extractor"
  | "theory_comparison"
  | "literature_matrix"
  | "evidence_bank"
  | "argument_map"
  | "argument_builder"
  | "section_planner"
  | "counterargument_finder"
  | "draft_review"
  | "citation_safety_check"
  | "research_gap_finder";

export type JudgementType =
  | "gap_analysis"
  | "evidence_sufficiency"
  | "counterargument_check"
  | "citation_safety";

export type EvidenceStrength = "strong" | "moderate" | "weak";

export type EvidenceRole =
  | "supports"
  | "contradicts"
  | "nuances"
  | "contextualizes";

export type JudgementSeverity = "info" | "warning" | "critical";

export type ReviewStatus = "pending" | "running" | "completed" | "failed";

export type ReviewFindingCategory =
  | "strength"
  | "weakness"
  | "missing_evidence"
  | "unsupported_claim"
  | "revision_priority";

export type ProcessingJobType =
  | "text_extraction"
  | "chunking"
  | "embedding"
  | "analysis";

export type ProcessingJobStatus = "pending" | "running" | "completed" | "failed";

export type ProviderName = "openai" | "anthropic" | "google";

export type ArgumentNodeType =
  | "premise"
  | "warrant"
  | "backing"
  | "rebuttal"
  | "qualifier"
  | "counterargument";

export type ArgumentStatus = "draft" | "developing" | "complete";

export type CoThinkerInterventionType =
  | "evidence_prompt"
  | "counterargument_prompt"
  | "citation_warning"
  | "source_gap_warning";

export type DraftBlockType =
  | "introduction"
  | "body"
  | "conclusion"
  | "heading"
  | "quote"
  | "note";

export type MessageLabel =
  | "source_supported"
  | "interpretation"
  | "user_idea"
  | "general_context"
  | "unsupported";

export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  yearOfStudy: number;
  createdAt: string;
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  description: string;
}

export interface Module {
  id: string;
  workspaceId: string;
  title: string;
  code: string;
  academicYear: string;
  semester: string;
  description: string;
  sourceCount: number;
  noteCount: number;
  assignmentCount: number;
  lastActivityAt: string;
  color: string;
  themes: string[];
  concepts: string[];
  learningOutcomes: string[];
  contextVersion: number;
}

export interface Folder {
  id: string;
  moduleId: string;
  parentFolderId: string | null;
  name: string;
  type: FolderType;
  sortOrder: number;
  sourceCount: number;
}

export interface SourceFile {
  id: string;
  moduleId: string;
  folderId: string | null;
  title: string;
  author: string;
  year: number | null;
  type: SourceType;
  status: SourceStatus;
  tags: string[];
  citation: string;
  pageCount: number;
  uploadedAt: string;
  summary: string;
  mainArgument: string;
  keyConcepts: string[];
}

export interface SourceChunk {
  id: string;
  sourceId: string;
  chunkIndex: number;
  text: string;
  pageStart: number | null;
  pageEnd: number | null;
  citationLabel: string | null;
}

export interface SourceNote {
  id: string;
  sourceId: string;
  userId: string;
  content: string;
  createdAt: string;
  tags: string[];
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
}

export interface Assignment {
  id: string;
  moduleId: string;
  title: string;
  question: string;
  wordLimit: number | null;
  dueDate: string | null;
  rubric: RubricCriterion[];
  selectedSourceIds: string[];
  stage: ProductionStage;
  contextVersion: number | null;
  createdAt: string;
}

export interface Argument {
  id: string;
  assignmentId: string;
  claim: string;
  synthesis: string;
  evidenceLinks: EvidenceLink[];
  counterarguments: string[];
  sortOrder: number;
}

export interface EvidenceLink {
  id: string;
  argumentId: string;
  sourceId: string;
  sourceTitle: string;
  quote: string;
  pageRange: string;
  usage: EvidenceRole | "";
  strength: EvidenceStrength;
}

export interface Draft {
  id: string;
  assignmentId: string;
  version: number;
  content: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  draftId: string;
  strengths: string[];
  weaknesses: string[];
  missingEvidence: string[];
  unsupportedClaims: string[];
  revisionPriorities: string[];
  rubricAlignment: string;
  overallFeedback: string;
}

export interface Judgement {
  id: string;
  assignmentId: string;
  type: JudgementType;
  findings: string[];
  severity: JudgementSeverity;
  createdAt: string;
}

export interface CitedChunk {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  quote: string;
  pageRange: string;
}

export interface CoThinkerMessage {
  id: string;
  role: MessageRole;
  content: string;
  citedChunks: CitedChunk[];
  warnings: string[];
  labels: MessageLabel[];
  followUpSuggestions: string[];
  createdAt: string;
}

export interface CoThinker {
  id: string;
  moduleId: string;
  assignmentId: string | null;
  title: string;
  scope: CoThinkerScope;
  stage: ProductionStage;
  messages: CoThinkerMessage[];
  createdAt: string;
}

export interface AIProviderConnection {
  id: string;
  provider: ProviderName;
  status: "connected" | "disconnected" | "error";
  modelPreference: string;
  createdAt: string;
}

export interface WorkbenchTool {
  id: WorkbenchToolType;
  title: string;
  description: string;
  inputType: string;
  outputType: string;
  icon: string;
  stages: ProductionStage[];
  academicIntegrityNote: string;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
}

export type AnswerStyle = "concise" | "detailed" | "critical" | "assignment_focused";

export type RetrievalScope =
  | "whole_module"
  | "current_folder"
  | "selected_sources"
  | "assignment"
  | "source";

export interface RetrievalResult {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  authors: string | null;
  year: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  quote: string;
  citationLabel: string;
  score: number;
  scope: RetrievalScope;
  warnings: string[];
}

export interface CitationValidation {
  valid: boolean;
  chunkId: string;
  sourceId: string;
  errors: string[];
  warnings: string[];
}

export interface RetrievedChunkSetValidation {
  allValid: boolean;
  validations: CitationValidation[];
  warnings: string[];
}

export interface InsufficientEvidenceWarning {
  type:
    | "no_chunks_found"
    | "low_score"
    | "too_few_sources"
    | "no_selected_sources"
    | "missing_page_provenance";
  message: string;
  severity: "info" | "warning" | "critical";
}
