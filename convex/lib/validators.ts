import { v } from "convex/values";

export const productionStage = v.union(
  v.literal("ingest"),
  v.literal("understand"),
  v.literal("map"),
  v.literal("judge"),
  v.literal("build"),
  v.literal("draft"),
  v.literal("refine"),
);

export const sourceType = v.union(
  v.literal("journal_article"),
  v.literal("book_chapter"),
  v.literal("lecture_slides"),
  v.literal("module_handbook"),
  v.literal("assignment_brief"),
  v.literal("marking_rubric"),
  v.literal("seminar_notes"),
  v.literal("draft"),
  v.literal("book"),
  v.literal("report"),
  v.literal("news_article"),
);

export const sourceStatus = v.union(
  v.literal("placeholder"),
  v.literal("uploading"),
  v.literal("queued"),
  v.literal("extracting"),
  v.literal("chunking"),
  v.literal("processing"),
  v.literal("processed"),
  v.literal("needs_review"),
  v.literal("failed"),
);

export const folderType = v.union(
  v.literal("module_info"),
  v.literal("readings"),
  v.literal("lecture_material"),
  v.literal("source_notes"),
  v.literal("assignments"),
  v.literal("drafts_reviews"),
  v.literal("submissions"),
  v.literal("custom"),
);

export const cothinkerScope = v.union(
  v.literal("whole_module"),
  v.literal("current_folder"),
  v.literal("selected_sources"),
  v.literal("assignment"),
);

export const messageRole = v.union(
  v.literal("user"),
  v.literal("assistant"),
  v.literal("system"),
);

export const evidenceStrength = v.union(
  v.literal("strong"),
  v.literal("moderate"),
  v.literal("weak"),
);

export const evidenceRole = v.union(
  v.literal("supports"),
  v.literal("contradicts"),
  v.literal("nuances"),
  v.literal("contextualizes"),
);

export const judgementType = v.union(
  v.literal("gap_analysis"),
  v.literal("evidence_sufficiency"),
  v.literal("counterargument_check"),
  v.literal("citation_safety"),
);

export const judgementSeverity = v.union(
  v.literal("info"),
  v.literal("warning"),
  v.literal("critical"),
);

export const reviewStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
);

export const reviewFindingCategory = v.union(
  v.literal("strength"),
  v.literal("weakness"),
  v.literal("missing_evidence"),
  v.literal("unsupported_claim"),
  v.literal("revision_priority"),
);

export const processingJobType = v.union(
  v.literal("ingestion"),
  v.literal("text_extraction"),
  v.literal("chunking"),
  v.literal("embedding"),
  v.literal("analysis"),
);

export const processingJobStatus = v.union(
  v.literal("queued"),
  v.literal("extracting"),
  v.literal("chunking"),
  v.literal("pending"),
  v.literal("running"),
  v.literal("processed"),
  v.literal("completed"),
  v.literal("failed"),
);

export const providerName = v.union(
  v.literal("openai"),
  v.literal("anthropic"),
  v.literal("google"),
);

export const argumentNodeType = v.union(
  v.literal("premise"),
  v.literal("warrant"),
  v.literal("backing"),
  v.literal("rebuttal"),
  v.literal("qualifier"),
  v.literal("counterargument"),
);

export const argumentStatus = v.union(
  v.literal("draft"),
  v.literal("developing"),
  v.literal("complete"),
);

export const cothinkerInterventionType = v.union(
  v.literal("evidence_prompt"),
  v.literal("counterargument_prompt"),
  v.literal("citation_warning"),
  v.literal("source_gap_warning"),
);

export const draftBlockType = v.union(
  v.literal("introduction"),
  v.literal("body"),
  v.literal("conclusion"),
  v.literal("heading"),
  v.literal("quote"),
  v.literal("note"),
);

export const rubricCriterion = v.object({
  name: v.string(),
  description: v.string(),
  weight: v.number(),
});

export const messageLabel = v.union(
  v.literal("source_supported"),
  v.literal("interpretation"),
  v.literal("user_idea"),
  v.literal("general_context"),
  v.literal("unsupported"),
);
