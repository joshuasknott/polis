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

export type ProcessingStatus = "processed" | "processing" | "needs_review" | "failed";

export type ProductionStage =
  | "ingest"
  | "understand"
  | "map"
  | "judge"
  | "build"
  | "draft"
  | "refine";

export type CoThinkerScope = "whole_module" | "current_folder" | "selected_sources" | "assignment";

export type MessageRole = "user" | "assistant" | "system";

export type FolderType =
  | "module_info"
  | "readings"
  | "lectures"
  | "source_notes"
  | "assignments"
  | "argument_maps"
  | "drafts"
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

export type JudgementSeverity = "info" | "warning" | "critical";

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
  /** @deprecated Use assignmentCount */
  essayProjectCount: number;
  lastActivityAt: string;
  color: string;
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
  folderId: string;
  title: string;
  author: string;
  year: number;
  type: SourceType;
  status: ProcessingStatus;
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
  text: string;
  pageStart: number;
  pageEnd: number;
  citationLabel: string;
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
  wordLimit: number;
  dueDate: string;
  rubric: RubricCriterion[];
  selectedSourceIds: string[];
  stage: ProductionStage;
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
  usage: string;
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

export interface MessageLabel {
  type: "source_supported" | "interpretation" | "user_idea" | "general_context" | "unsupported";
  text: string;
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
  provider: string;
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

// ---------------------------------------------------------------------------
// Legacy compatibility aliases
// ---------------------------------------------------------------------------
// These preserve compilation for files that still import the old names.
// Each alias is marked @deprecated and should be migrated in follow-up work.



/** @deprecated Use `ProductionStage` */
export type EssayStatus = ProductionStage;

/** @deprecated Use `CoThinkerScope` */
export type AIScope = CoThinkerScope;

/** @deprecated Use `WorkbenchToolType` */
export type ToolType = WorkbenchToolType;

/** @deprecated Use `ProductionStage` */
export type AIMode = ProductionStage;

/** @deprecated Use `CoThinkerMessage` */
export type AIMessage = CoThinkerMessage;

/** @deprecated Use `CoThinker` */
export type AIConversation = CoThinker;

/** @deprecated Use `WorkbenchTool` */
export type AcademicTool = WorkbenchTool;

/** @deprecated Use `Review` */
export type DraftReview = Review;

/** @deprecated Use `Assignment` */
export interface EssayProject {
  id: string;
  moduleId: string;
  title: string;
  question: string;
  wordCount: number;
  dueDate: string;
  rubric: RubricCriterion[];
  selectedSourceIds: string[];
  thesis: string;
  status: ProductionStage;
  structure: EssaySection[];
  evidenceBank: LegacyEvidenceItem[];
  counterarguments: LegacyCounterargument[];
  gaps: LegacyResearchGap[];
  draftContent: string;
}

/** @deprecated Use structured Arguments instead */
export interface EssaySection {
  id: string;
  heading: string;
  points: string[];
  evidenceIds: string[];
  wordAllocation: number;
}

/** @deprecated Use `EvidenceLink` */
export interface LegacyEvidenceItem {
  id: string;
  sourceId: string;
  sourceTitle: string;
  quote: string;
  pageRange: string;
  argumentUse: string;
}

/** @deprecated Counterarguments are now strings on `Argument` */
export interface LegacyCounterargument {
  id: string;
  claim: string;
  sourceId: string;
  sourceTitle: string;
  rebuttal: string;
}

/** @deprecated Use `Judgement` with type "gap_analysis" */
export interface LegacyResearchGap {
  id: string;
  description: string;
  severity: "high" | "medium" | "low";
  suggestedSourceType: string;
}

/** @deprecated Use `LegacyEvidenceItem` */
export type EvidenceItem = LegacyEvidenceItem;

/** @deprecated Use `LegacyCounterargument` */
export type Counterargument = LegacyCounterargument;

/** @deprecated Use `LegacyResearchGap` */
export type ResearchGap = LegacyResearchGap;

/** @deprecated Use `GeneratedOutput` is removed — tools generate Judgements or Reviews */
export interface GeneratedOutput {
  id: string;
  moduleId: string;
  type: WorkbenchToolType;
  title: string;
  content: string;
  sourcesUsed: string[];
  createdAt: string;
}

export type AnswerStyle = "concise" | "detailed" | "critical" | "assignment_focused";
