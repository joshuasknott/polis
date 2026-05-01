import type { DraftStatus, KnowledgePageType, ProcessingStatus, SourceRelevance, SourceType, WorkspaceStage } from "@/lib/types";

export function normalizeSourceStatus(status?: string | null, processingStatus?: string | null): ProcessingStatus {
  if (status === "ready" || status === "processed") return "processed";
  if (status === "error" || status === "failed" || processingStatus === "error") return "failed";
  if (status === "unprocessed") return "unprocessed";
  if (status === "needs_review") return "needs_review";
  return "processing";
}

export function sourceTypeLabel(type?: string | null): string {
  const labels: Record<string, string> = {
    reading: "Reading",
    lecture: "Lecture",
    assessment: "Assessment",
    feedback: "Feedback",
    note: "Note",
    link: "Link",
    other: "Other",
    journal_article: "Reading",
    book_chapter: "Reading",
    book: "Reading",
    lecture_slides: "Lecture",
    module_handbook: "Assessment",
    essay_brief: "Assessment",
    marking_rubric: "Assessment",
    seminar_notes: "Note",
    draft: "Draft",
    report: "Report",
    news_article: "Reading",
  };
  return labels[type || ""] || "Other";
}

export function sourceStatusLabel(status?: string | null): string {
  const normalized = normalizeSourceStatus(status);
  const labels: Record<ProcessingStatus, string> = {
    unprocessed: "Unprocessed",
    processing: "Processing",
    processed: "Processed",
    needs_review: "Needs review",
    failed: "Failed",
  };
  return labels[normalized];
}

export function sourceStatusClass(status?: string | null): string {
  const normalized = normalizeSourceStatus(status);
  const classes: Record<ProcessingStatus, string> = {
    unprocessed: "bg-stone-100 text-stone-700",
    processing: "bg-blue-100 text-blue-800",
    processed: "bg-green-100 text-green-800",
    needs_review: "bg-amber-100 text-amber-800",
    failed: "bg-red-100 text-red-800",
  };
  return classes[normalized];
}

export function relevanceLabel(relevance?: string | null): string {
  const normalized = (relevance || "unknown") as SourceRelevance;
  const labels: Record<SourceRelevance, string> = {
    low: "Low relevance",
    medium: "Medium relevance",
    high: "High relevance",
    unknown: "Unrated",
  };
  return labels[normalized] || labels.unknown;
}

export function relevanceClass(relevance?: string | null): string {
  const normalized = (relevance || "unknown") as SourceRelevance;
  const classes: Record<SourceRelevance, string> = {
    low: "bg-stone-100 text-stone-700",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-blue-100 text-blue-800",
    unknown: "bg-stone-100 text-stone-700",
  };
  return classes[normalized] || classes.unknown;
}

export function stageLabel(stage?: string | null): string {
  const labels: Record<WorkspaceStage, string> = {
    setup: "Setup",
    sources: "Sources",
    knowledge: "Knowledge",
    context: "Context",
    plan: "Plan",
    draft: "Draft",
    final: "Final",
  };
  return labels[(stage || "setup") as WorkspaceStage] || "Setup";
}

export function knowledgeTypeLabel(type: KnowledgePageType): string {
  const labels: Record<KnowledgePageType, string> = {
    source_brief: "Source Brief",
    concept: "Concept",
    theory: "Theory",
    author: "Author",
    case: "Case",
    debate: "Debate",
    comparison: "Comparison",
    contradiction: "Contradiction",
    synthesis: "Synthesis",
    essay_pack: "Essay Pack",
  };
  return labels[type];
}

export function draftStatusLabel(status?: string | null): string {
  const labels: Record<DraftStatus, string> = {
    rough: "Rough draft",
    revised: "Revised",
    final: "Final",
  };
  return labels[(status || "rough") as DraftStatus] || "Rough draft";
}

export const polisSourceTypes: SourceType[] = ["reading", "lecture", "assessment", "feedback", "note", "link", "other"];

export const knowledgePageTypes: KnowledgePageType[] = [
  "source_brief",
  "concept",
  "theory",
  "author",
  "case",
  "debate",
  "comparison",
  "contradiction",
  "synthesis",
  "essay_pack",
];
