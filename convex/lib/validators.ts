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
  v.literal("briefs_rubrics"),
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
  v.literal("zai"),
  v.literal("gemini"),
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

export const provenanceLabel = v.union(
  v.literal("quoted"),
  v.literal("paraphrased"),
  v.literal("source_supported"),
  v.literal("interpretation"),
  v.literal("generated"),
  v.literal("unsupported"),
);

export const provenanceWarningSeverity = v.union(
  v.literal("info"),
  v.literal("warning"),
  v.literal("critical"),
);

export const provenanceWarningCode = v.union(
  v.literal("UNSUPPORTED_CLAIM"),
  v.literal("WEAK_EVIDENCE"),
  v.literal("CITATION_MISMATCH"),
  v.literal("POSSIBLE_MISATTRIBUTION"),
  v.literal("SOURCE_NOT_IN_ASSESSMENT"),
  v.literal("MISSING_PAGE_METADATA"),
  v.literal("CATALOG_RECOMMENDATION_AS_EVIDENCE"),
  v.literal("LABEL_REF_MISMATCH"),
  v.literal("MISSING_QUOTE_FOR_QUOTED_LABEL"),
  v.literal("PAGE_OUTSIDE_CHUNK_RANGE"),
  v.literal("FAKE_CITATION_REJECTED"),
);

export const provenanceWarning = v.object({
  code: provenanceWarningCode,
  severity: provenanceWarningSeverity,
  message: v.string(),
});

export const gapCategory = v.union(
  v.literal("missing_theory"),
  v.literal("missing_method"),
  v.literal("missing_concept"),
  v.literal("missing_evidence_type"),
  v.literal("missing_counterargument"),
  v.literal("rubric_gap"),
  v.literal("required_reading_missing"),
  v.literal("weak_source_coverage"),
  v.literal("scope_gap"),
);

export const gapRunStatus = v.union(
  v.literal("completed"),
  v.literal("failed"),
  v.literal("partial"),
);

export const sourceCatalog = v.union(
  v.literal("crossref"),
  v.literal("openalex"),
  v.literal("semantic_scholar"),
);

export const recommendationStatus = v.union(
  v.literal("recommended"),
  v.literal("dismissed"),
  v.literal("added"),
);

export const classificationLabel = v.union(
  v.literal("handbook"),
  v.literal("syllabus"),
  v.literal("assignment_brief"),
  v.literal("rubric"),
  v.literal("slides"),
  v.literal("reading"),
  v.literal("draft"),
  v.literal("notes"),
  v.literal("integrity_guidance"),
  v.literal("reading_list"),
  v.literal("other"),
);

export const importBatchStatus = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("partial"),
  v.literal("failed"),
);

export const importFileExtractionStatus = v.union(
  v.literal("pending"),
  v.literal("extracting"),
  v.literal("extracted"),
  v.literal("unsupported"),
  v.literal("skipped"),
  v.literal("failed"),
);

export const importFileClassificationStatus = v.union(
  v.literal("pending"),
  v.literal("classifying"),
  v.literal("auto_accepted"),
  v.literal("needs_review"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("failed"),
);

export const moduleFactField = v.union(
  v.literal("title"),
  v.literal("code"),
  v.literal("academic_year"),
  v.literal("semester"),
  v.literal("description"),
  v.literal("themes"),
  v.literal("concepts"),
  v.literal("learning_outcomes"),
  v.literal("integrity_guidance"),
  v.literal("submission_format"),
  v.literal("referencing_rules"),
);

export const extractionStatus = v.union(
  v.literal("extracted"),
  v.literal("applied"),
  v.literal("rejected"),
  v.literal("superseded"),
);

export const assessmentSpecStatus = v.union(
  v.literal("extracted"),
  v.literal("applied"),
  v.literal("rejected"),
  v.literal("needs_review"),
  v.literal("superseded"),
);

export const extractionProvenance = v.object({
  source: v.union(
    v.literal("imported_file"),
    v.literal("source"),
    v.literal("manual"),
  ),
  batchId: v.optional(v.id("importBatches")),
  importedFileId: v.optional(v.id("importedFiles")),
  sourceId: v.optional(v.id("sources")),
  sourceChunkId: v.optional(v.id("sourceChunks")),
  extractor: v.string(),
  extractionRunId: v.optional(v.string()),
  pageStart: v.optional(v.number()),
  pageEnd: v.optional(v.number()),
  quote: v.optional(v.string()),
  confidence: v.optional(v.number()),
  extractedAt: v.number(),
});

export const aiActionOperation = v.union(
  v.literal("classification"),
  v.literal("source_conversion"),
  v.literal("source_processing"),
  v.literal("context_extraction"),
  v.literal("source_context_analysis"),
  v.literal("relevance_signal"),
  v.literal("gap_signal"),
  v.literal("manual_review"),
  v.literal("revert"),
);

export const aiActionStatus = v.union(
  v.literal("proposed"),
  v.literal("auto_applied"),
  v.literal("applied"),
  v.literal("needs_review"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("rejected"),
  v.literal("reverted"),
);

export const sourceSignalStatus = v.union(
  v.literal("active"),
  v.literal("dismissed"),
  v.literal("superseded"),
);

export const sourceSignalSeverity = v.union(
  v.literal("info"),
  v.literal("warning"),
  v.literal("critical"),
);
