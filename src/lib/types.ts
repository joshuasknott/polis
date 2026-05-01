export type SourceType =
  | "reading"
  | "lecture"
  | "assessment"
  | "feedback"
  | "note"
  | "link"
  | "other"
  | "journal_article"
  | "book_chapter"
  | "lecture_slides"
  | "module_handbook"
  | "essay_brief"
  | "marking_rubric"
  | "seminar_notes"
  | "draft"
  | "book"
  | "report"
  | "news_article";

export type ProcessingStatus = "unprocessed" | "processing" | "processed" | "needs_review" | "failed";

export type SourceRelevance = "low" | "medium" | "high" | "unknown";

export type WorkspaceStage = "setup" | "sources" | "knowledge" | "context" | "plan" | "draft" | "final";

export type PolisSection = "overview" | "sources" | "knowledge" | "context" | "plan" | "draft" | "final";

export type KnowledgePageType =
  | "source_brief"
  | "concept"
  | "theory"
  | "author"
  | "case"
  | "debate"
  | "comparison"
  | "contradiction"
  | "synthesis"
  | "essay_pack";

export type DraftStatus = "rough" | "revised" | "final";

export type AssignmentType =
  | "essay"
  | "research_project"
  | "literature_review"
  | "briefing"
  | "exam"
  | "quiz"
  | "presentation"
  | "other";

export type AssignmentStatus = "detected" | "approved" | "active" | "archived" | "dismissed";

export type SourceRelevanceType =
  | "core"
  | "supporting"
  | "opposing"
  | "theoretical"
  | "empirical_case"
  | "methodological"
  | "background"
  | "not_relevant";

export type AIMode =
  | "source_grounded"
  | "brainstorm"
  | "reading_summary"
  | "essay_planning"
  | "draft_feedback"
  | "citation_safety";

export type AnswerStyle = "concise" | "detailed" | "critical" | "essay_focused";

export type AIScope = "whole_module" | "current_folder" | "selected_sources" | "essay_project";

export type MessageRole = "user" | "assistant" | "system";

export type EssayStatus = "planning" | "drafting" | "reviewing" | "revising" | "submitted";

export type FolderType =
  | "module_info"
  | "readings"
  | "lectures"
  | "source_notes"
  | "essay_plans"
  | "drafts"
  | "final_submission"
  | "custom";

export type ToolType =
  | "reading_summary"
  | "concept_extractor"
  | "theory_comparison"
  | "literature_matrix"
  | "evidence_bank"
  | "argument_map"
  | "essay_plan_builder"
  | "counterargument_finder"
  | "draft_review"
  | "citation_safety_check"
  | "research_gap_finder";

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
  name?: string;
  code: string;
  moduleCode?: string;
  academicYear: string;
  semester: string;
  description: string;
  assessmentTitle?: string;
  assessmentQuestion?: string;
  deadline?: string;
  targetGrade?: string;
  referencingStyle?: string;
  currentStage?: WorkspaceStage;
  sourceCount: number;
  processedSourceCount?: number;
  knowledgePageCount?: number;
  contextPackCount?: number;
  hasPlan?: boolean;
  planStatus?: string;
  hasDraft?: boolean;
  draftStatus?: DraftStatus | string;
  noteCount: number;
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
  folderId?: string;
  title: string;
  author: string;
  authors?: string;
  year: number;
  type: SourceType;
  status: ProcessingStatus;
  relevance?: SourceRelevance;
  tags: string[];
  citation: string;
  fileUrl?: string;
  storagePath?: string;
  extractedText?: string;
  rawText?: string;
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

export interface AIConversation {
  id: string;
  moduleId: string;
  title: string;
  scope: AIScope;
  mode: AIMode;
  messages: AIMessage[];
  createdAt: string;
}

export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  citedChunks: CitedChunk[];
  warnings: string[];
  labels: MessageLabel[];
  followUpSuggestions: string[];
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

export interface GeneratedOutput {
  id: string;
  moduleId: string;
  type: ToolType;
  title: string;
  content: string;
  sourcesUsed: string[];
  createdAt: string;
}

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
  status: EssayStatus;
  structure: EssaySection[];
  evidenceBank: EvidenceItem[];
  counterarguments: Counterargument[];
  gaps: ResearchGap[];
  draftContent: string;
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
}

export interface EssaySection {
  id: string;
  heading: string;
  points: string[];
  evidenceIds: string[];
  wordAllocation: number;
}

export interface EvidenceItem {
  id: string;
  sourceId: string;
  sourceTitle: string;
  quote: string;
  pageRange: string;
  argumentUse: string;
}

export interface Counterargument {
  id: string;
  claim: string;
  sourceId: string;
  sourceTitle: string;
  rebuttal: string;
}

export interface ResearchGap {
  id: string;
  description: string;
  severity: "high" | "medium" | "low";
  suggestedSourceType: string;
}

export interface DraftReview {
  id: string;
  draftId: string;
  strengths: string[];
  weaknesses: string[];
  missingEvidence: string[];
  unsupportedClaims: string[];
  revisionPriorities: string[];
  estimatedBandRisk: string;
  overallFeedback: string;
}

export interface AIProviderConnection {
  id: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  modelPreference: string;
  createdAt: string;
}

export interface AcademicTool {
  id: ToolType;
  title: string;
  description: string;
  inputType: string;
  outputType: string;
  icon: string;
  academicIntegrityNote: string;
}

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
}

export interface KnowledgePage {
  id: string;
  userId?: string;
  moduleId: string;
  title: string;
  type: KnowledgePageType;
  content: string;
  linkedSourceIds: string[];
  linkedPageIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContextPack {
  id: string;
  userId?: string;
  moduleId: string;
  assignmentId?: string | null;
  title: string;
  assessmentQuestion: string;
  selectedSourceIds: string[];
  selectedKnowledgePageIds: string[];
  markingCriteria: string;
  workingThesis: string;
  keyClaims: string[];
  keyQuotes: string[];
  caseStudies: string[];
  missingEvidence: string[];
  draftingInstructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanSection {
  id: string;
  title: string;
  purpose: string;
  claim: string;
  evidenceSourceIds: string[];
  knowledgePageIds: string[];
  counterargument: string;
  evaluation: string;
  wordCount: number;
  notes: string;
}

export interface Plan {
  id: string;
  userId?: string;
  moduleId: string;
  assignmentId?: string | null;
  contextPackId: string;
  title: string;
  thesis: string;
  sections: PlanSection[];
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  id: string;
  userId?: string;
  moduleId: string;
  assignmentId?: string | null;
  contextPackId: string;
  planId: string;
  title: string;
  content: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Feedback {
  id: string;
  userId?: string;
  moduleId: string;
  draftId: string;
  assignmentId?: string | null;
  content: string;
  revisionTasks: RevisionTask[];
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  userId?: string;
  moduleId: string;
  title: string;
  type: AssignmentType;
  questionOrBrief: string;
  weighting: string;
  dueDate: string;
  wordCount: number;
  status: AssignmentStatus;
  markingCriteriaSummary: string;
  detectedFromSourceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ModuleProfile {
  id: string;
  userId?: string;
  moduleId: string;
  summary: string;
  keyThemes: string[];
  keyConcepts: string[];
  keyTheories: string[];
  keyCases: string[];
  assessmentSummary: string;
  importantReadings: string[];
  academicExpectations: string;
  updatedAt: string;
}

export interface AssignmentSourceRelevance {
  id: string;
  userId?: string;
  assignmentId: string;
  moduleId: string;
  sourceId: string;
  relevanceType: SourceRelevanceType;
  relevanceNote: string;
  usefulEvidence: string;
  usefulQuotes: string;
  createdAt: string;
  updatedAt: string;
}

export type ExternalSourceType = "book" | "journal_article" | "report" | "dataset" | "lecture_resource" | "website" | "other";

export type ExternalRecommendationUse = "core" | "supporting" | "opposing" | "theoretical" | "empirical_case" | "methodological" | "background";

export type ExternalRecommendationStatus = "suggested" | "saved" | "dismissed" | "imported";

export interface ExternalSourceRecommendation {
  id: string;
  userId?: string;
  moduleId: string;
  assignmentId?: string | null;
  title: string;
  authors: string;
  year: number | null;
  sourceType: ExternalSourceType;
  whyUseful: string;
  recommendedUse: ExternalRecommendationUse;
  searchQuery: string;
  possibleCitation: string;
  url: string;
  publisherOrJournal: string;
  confidence: string;
  status: ExternalRecommendationStatus;
  createdAt: string;
  updatedAt: string;
}
