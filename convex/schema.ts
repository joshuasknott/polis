import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  productionStage,
  folderType,
  cothinkerScope,
  messageRole,
  evidenceStrength,
  reviewStatus,
  processingJobType,
  argumentNodeType,
  argumentStatus,
  cothinkerInterventionType,
  rubricCriterion,
  importBatchStatus,
  classificationLabel,
  importFileExtractionStatus,
  importFileClassificationStatus,
  moduleFactField,
  extractionStatus,
  assessmentSpecStatus,
  extractionProvenance,
  gapCategory,
  gapRunStatus,
  sourceCatalog,
  recommendationStatus,
  provenanceLabel,
  provenanceWarning,
} from "./lib/validators";

export default defineSchema({
  userProfiles: defineTable({
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    university: v.optional(v.string()),
    course: v.optional(v.string()),
    yearOfStudy: v.optional(v.number()),
    preferences: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  modules: defineTable({
    tokenIdentifier: v.string(),
    title: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    themes: v.optional(v.array(v.string())),
    concepts: v.optional(v.array(v.string())),
    learningOutcomes: v.optional(v.array(v.string())),
    contextVersion: v.optional(v.number()),
    contextUpdatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_updatedAt", ["tokenIdentifier", "updatedAt"]),

  folders: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    parentFolderId: v.optional(v.id("folders")),
    name: v.string(),
    type: folderType,
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["moduleId"])
    .index("by_module_and_sortOrder", ["moduleId", "sortOrder"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  sources: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    folderId: v.optional(v.id("folders")),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.string(),
    status: v.string(),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    errorMessage: v.optional(v.string()),
    citation: v.optional(v.string()),
    summary: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_module", ["tokenIdentifier", "moduleId"])
    .index("by_module", ["moduleId"])
    .index("by_module_and_status", ["moduleId", "status"])
    .index("by_folder", ["folderId"])
    .index("by_status", ["status"]),

  sourceChunks: defineTable({
    sourceId: v.id("sources"),
    chunkIndex: v.number(),
    text: v.string(),
    pageStart: v.optional(v.number()),
    pageEnd: v.optional(v.number()),
    tokenEstimate: v.optional(v.number()),
    citationLabel: v.optional(v.string()),
    provenance: v.optional(
      v.object({
        extractor: v.string(),
        extractionRunId: v.optional(v.string()),
        chunkingStrategy: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
  })
    .index("by_source", ["sourceId"])
    .index("by_source_and_chunkIndex", ["sourceId", "chunkIndex"])
    .searchIndex("search_text", {
      searchField: "text",
      filterFields: ["sourceId"],
    }),

  sourceNotes: defineTable({
    tokenIdentifier: v.string(),
    sourceId: v.id("sources"),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_source", ["sourceId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  assignments: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    title: v.string(),
    question: v.optional(v.string()),
    wordLimit: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    rubric: v.optional(v.array(rubricCriterion)),
    stage: productionStage,
    contextVersion: v.optional(v.number()),
    contextUpdatedAt: v.optional(v.number()),
    thesis: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_module", ["tokenIdentifier", "moduleId"])
    .index("by_module", ["moduleId"])
    .index("by_module_and_stage", ["moduleId", "stage"])
    .index("by_module_and_updatedAt", ["moduleId", "updatedAt"]),

  assignmentSources: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    sourceId: v.id("sources"),
    addedAt: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_source", ["sourceId"])
    .index("by_assignment_and_source", ["assignmentId", "sourceId"]),

  sourceAnalyses: defineTable({
    tokenIdentifier: v.string(),
    sourceId: v.id("sources"),
    assignmentId: v.optional(v.id("assignments")),
    analysisType: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_source", ["sourceId"])
    .index("by_assignment", ["assignmentId"])
    .index("by_source_and_type", ["sourceId", "analysisType"]),

  sourceClaims: defineTable({
    tokenIdentifier: v.string(),
    sourceId: v.id("sources"),
    claim: v.string(),
    context: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    strength: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_source", ["sourceId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  sourceConcepts: defineTable({
    tokenIdentifier: v.string(),
    sourceId: v.id("sources"),
    concept: v.string(),
    definition: v.optional(v.string()),
    relevance: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_source", ["sourceId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  arguments: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    claim: v.string(),
    synthesis: v.optional(v.string()),
    sortOrder: v.number(),
    status: v.optional(argumentStatus),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_assignment", ["assignmentId"])
    .index("by_assignment_and_sortOrder", ["assignmentId", "sortOrder"]),

  argumentNodes: defineTable({
    tokenIdentifier: v.string(),
    argumentId: v.id("arguments"),
    type: argumentNodeType,
    content: v.string(),
    parentId: v.optional(v.id("argumentNodes")),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_argument", ["argumentId"])
    .index("by_argument_and_sortOrder", ["argumentId", "sortOrder"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  evidenceLinks: defineTable({
    tokenIdentifier: v.string(),
    argumentId: v.id("arguments"),
    argumentNodeId: v.optional(v.id("argumentNodes")),
    sourceId: v.id("sources"),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    sourceClaimId: v.optional(v.id("sourceClaims")),
    quote: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    usage: v.optional(v.string()),
    strength: evidenceStrength,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_argument", ["argumentId"])
    .index("by_source", ["sourceId"])
    .index("by_argumentNodeId", ["argumentNodeId"])
    .index("by_sourceChunk", ["sourceChunkId"]),

  drafts: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    version: v.number(),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    status: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_assignment_and_version", ["assignmentId", "version"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  draftBlocks: defineTable({
    tokenIdentifier: v.string(),
    draftId: v.id("drafts"),
    blockType: v.string(),
    content: v.optional(v.string()),
    argumentId: v.optional(v.id("arguments")),
    sortOrder: v.number(),
    label: v.optional(provenanceLabel),
    sourceId: v.optional(v.id("sources")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    evidenceLinkId: v.optional(v.id("evidenceLinks")),
    quote: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    aiGenerated: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_draft", ["draftId"])
    .index("by_draft_and_sortOrder", ["draftId", "sortOrder"])
    .index("by_draft_and_label", ["draftId", "label"])
    .index("by_source", ["sourceId"])
    .index("by_evidenceLink", ["evidenceLinkId"]),

  claimProvenance: defineTable({
    tokenIdentifier: v.string(),
    draftId: v.id("drafts"),
    draftBlockId: v.optional(v.id("draftBlocks")),
    claimText: v.string(),
    spanStart: v.optional(v.number()),
    spanEnd: v.optional(v.number()),
    label: provenanceLabel,
    effectiveLabel: v.optional(provenanceLabel),
    sourceId: v.optional(v.id("sources")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    evidenceLinkId: v.optional(v.id("evidenceLinks")),
    requiredReadingId: v.optional(v.id("requiredReadings")),
    quote: v.optional(v.string()),
    claimedPageStart: v.optional(v.number()),
    claimedPageEnd: v.optional(v.number()),
    isCatalogRecommendation: v.optional(v.boolean()),
    evidenceStrength: v.optional(evidenceStrength),
    validationWarnings: v.optional(v.array(provenanceWarning)),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_draft", ["draftId"])
    .index("by_draftBlock", ["draftBlockId"])
    .index("by_draft_and_label", ["draftId", "label"])
    .index("by_source", ["sourceId"])
    .index("by_sourceChunk", ["sourceChunkId"])
    .index("by_evidenceLink", ["evidenceLinkId"]),

  judgementOptions: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    type: v.string(),
    question: v.string(),
    createdAt: v.number(),
  }).index("by_assignment", ["assignmentId"]),

  judgementDecisions: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    judgementOptionId: v.optional(v.id("judgementOptions")),
    type: v.string(),
    content: v.string(),
    severity: v.string(),
    createdAt: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_judgementOption", ["judgementOptionId"]),

  reviewRuns: defineTable({
    tokenIdentifier: v.string(),
    draftId: v.id("drafts"),
    status: reviewStatus,
    overallFeedback: v.optional(v.string()),
    rubricAlignment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_draft", ["draftId"])
    .index("by_draft_and_status", ["draftId", "status"])
    .index("by_status", ["status"])
    .index("by_status_and_createdAt", ["status", "createdAt"]),

  reviewFindings: defineTable({
    tokenIdentifier: v.string(),
    reviewRunId: v.id("reviewRuns"),
    category: v.string(),
    content: v.string(),
    severity: v.optional(v.string()),
    resolved: v.optional(v.boolean()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_reviewRun", ["reviewRunId"])
    .index("by_reviewRun_and_category", ["reviewRunId", "category"]),

  coThinkerSessions: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.optional(v.id("modules")),
    assignmentId: v.optional(v.id("assignments")),
    sourceId: v.optional(v.id("sources")),
    title: v.string(),
    scope: cothinkerScope,
    stage: v.optional(productionStage),
    messageCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_module", ["tokenIdentifier", "moduleId"])
    .index("by_tokenIdentifier_and_assignment", [
      "tokenIdentifier",
      "assignmentId",
    ])
    .index("by_module", ["moduleId"])
    .index("by_assignment", ["assignmentId"])
    .index("by_module_and_createdAt", ["moduleId", "createdAt"])
    .index("by_assignment_and_createdAt", ["assignmentId", "createdAt"]),

  coThinkerMessages: defineTable({
    tokenIdentifier: v.string(),
    sessionId: v.id("coThinkerSessions"),
    role: messageRole,
    content: v.string(),
    citedChunkIds: v.optional(v.array(v.id("sourceChunks"))),
    labels: v.optional(v.array(v.string())),
    warnings: v.optional(v.array(v.string())),
    followUpSuggestions: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_createdAt", ["sessionId", "createdAt"]),

  coThinkerInterventions: defineTable({
    tokenIdentifier: v.string(),
    sessionId: v.id("coThinkerSessions"),
    type: cothinkerInterventionType,
    content: v.string(),
    resolved: v.optional(v.boolean()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_createdAt", ["sessionId", "createdAt"]),

  processingJobs: defineTable({
    tokenIdentifier: v.string(),
    sourceId: v.optional(v.id("sources")),
    type: processingJobType,
    status: v.string(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_source", ["sourceId"])
    .index("by_status", ["status"])
    .index("by_source_and_status", ["sourceId", "status"])
    .index("by_status_and_type", ["status", "type"]),

  aiProviderConnections: defineTable({
    tokenIdentifier: v.string(),
    provider: v.string(),
    status: v.string(),
    modelPreference: v.optional(v.string()),
    encryptedCredentialRef: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_provider", [
      "tokenIdentifier",
      "provider",
    ]),

  usageEvents: defineTable({
    tokenIdentifier: v.string(),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    type: v.string(),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    costEstimate: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_type", ["type"])
    .index("by_tokenIdentifier_and_createdAt", [
      "tokenIdentifier",
      "createdAt",
    ])
    .index("by_tokenIdentifier_and_type", ["tokenIdentifier", "type"])
    .index("by_tokenIdentifier_and_type_and_createdAt", [
      "tokenIdentifier",
      "type",
      "createdAt",
    ])
    .index("by_tokenIdentifier_and_provider", ["tokenIdentifier", "provider"])
    .index("by_tokenIdentifier_and_model", ["tokenIdentifier", "model"]),

  rateLimits: defineTable({
    tokenIdentifier: v.string(),
    windowStart: v.number(),
    requestCount: v.number(),
    tokenCount: v.number(),
    provider: v.optional(v.string()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_provider", ["tokenIdentifier", "provider"]),

  errorEvents: defineTable({
    tokenIdentifier: v.string(),
    source: v.string(),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    errorType: v.string(),
    errorMessage: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_createdAt", [
      "tokenIdentifier",
      "createdAt",
    ])
    .index("by_source", ["source"]),

  sectionPlans: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    label: v.string(),
    wordBudget: v.number(),
    argumentIds: v.optional(v.array(v.id("arguments"))),
    counterargumentPlan: v.optional(v.string()),
    rebuttalPlan: v.optional(v.string()),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  importBatches: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    name: v.optional(v.string()),
    status: importBatchStatus,
    totalFiles: v.number(),
    processedFiles: v.optional(v.number()),
    autoAcceptedFiles: v.optional(v.number()),
    needsReviewFiles: v.optional(v.number()),
    failedFiles: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_module", ["tokenIdentifier", "moduleId"])
    .index("by_module", ["moduleId"])
    .index("by_module_and_createdAt", ["moduleId", "createdAt"])
    .index("by_tokenIdentifier_and_status", ["tokenIdentifier", "status"])
    .index("by_status", ["status"]),

  importedFiles: defineTable({
    tokenIdentifier: v.string(),
    batchId: v.id("importBatches"),
    moduleId: v.id("modules"),
    sourceId: v.optional(v.id("sources")),
    storageId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    extractionStatus: importFileExtractionStatus,
    extractionError: v.optional(v.string()),
    labels: v.optional(v.array(classificationLabel)),
    primaryLabel: v.optional(classificationLabel),
    confidence: v.optional(v.number()),
    rationale: v.optional(v.string()),
    classificationStatus: importFileClassificationStatus,
    classificationError: v.optional(v.string()),
    modelUsed: v.optional(v.string()),
    providerUsed: v.optional(v.string()),
    reviewedLabel: v.optional(classificationLabel),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_batch", ["tokenIdentifier", "batchId"])
    .index("by_batch", ["batchId"])
    .index("by_module", ["moduleId"])
    .index("by_source", ["sourceId"])
    .index("by_extractionStatus", ["extractionStatus"])
    .index("by_classificationStatus", ["classificationStatus"])
    .index("by_batch_and_extractionStatus", ["batchId", "extractionStatus"])
    .index(
      "by_batch_and_classificationStatus",
      ["batchId", "classificationStatus"],
    )
    .index("by_module_and_classificationStatus", [
      "moduleId",
      "classificationStatus",
    ])
    .index(
      "by_tokenIdentifier_and_classificationStatus",
      ["tokenIdentifier", "classificationStatus"],
    ),

  moduleFacts: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    field: moduleFactField,
    value: v.string(),
    uncertain: v.optional(v.boolean()),
    status: extractionStatus,
    provenance: extractionProvenance,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_module", ["tokenIdentifier", "moduleId"])
    .index("by_module", ["moduleId"])
    .index("by_module_and_field", ["moduleId", "field"])
    .index("by_module_and_status", ["moduleId", "status"])
    .index("by_module_and_field_and_status", [
      "moduleId",
      "field",
      "status",
    ])
    .index("by_batch", ["batchId"])
    .index("by_importedFile", ["importedFileId"]),

  assessmentSpecs: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    assignmentId: v.optional(v.id("assignments")),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    title: v.string(),
    question: v.optional(v.string()),
    deadline: v.optional(v.string()),
    weight: v.optional(v.number()),
    wordLimit: v.optional(v.number()),
    referencingRule: v.optional(v.string()),
    submissionFormat: v.optional(v.string()),
    uncertain: v.optional(v.boolean()),
    status: assessmentSpecStatus,
    provenance: extractionProvenance,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_module", ["tokenIdentifier", "moduleId"])
    .index("by_module", ["moduleId"])
    .index("by_module_and_status", ["moduleId", "status"])
    .index("by_assignment", ["assignmentId"])
    .index("by_batch", ["batchId"])
    .index("by_importedFile", ["importedFileId"]),

  extractedRubricCriteria: defineTable({
    tokenIdentifier: v.string(),
    assessmentSpecId: v.id("assessmentSpecs"),
    name: v.string(),
    description: v.optional(v.string()),
    weight: v.optional(v.number()),
    sortOrder: v.number(),
    status: assessmentSpecStatus,
    provenance: v.optional(extractionProvenance),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_assessmentSpec", ["assessmentSpecId"])
    .index("by_assessmentSpec_and_sortOrder", [
      "assessmentSpecId",
      "sortOrder",
    ]),

  weeklyTopics: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    weekNumber: v.optional(v.number()),
    title: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
    sourceId: v.optional(v.id("sources")),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    status: v.optional(extractionStatus),
    provenance: v.optional(extractionProvenance),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_module", ["tokenIdentifier", "moduleId"])
    .index("by_module", ["moduleId"])
    .index("by_module_and_sortOrder", ["moduleId", "sortOrder"])
    .index("by_module_and_weekNumber", ["moduleId", "weekNumber"])
    .index("by_source", ["sourceId"])
    .index("by_batch", ["batchId"])
    .index("by_importedFile", ["importedFileId"]),

  requiredReadings: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    weekNumber: v.optional(v.number()),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    citation: v.optional(v.string()),
    url: v.optional(v.string()),
    kind: v.optional(v.string()),
    sourceId: v.optional(v.id("sources")),
    batchId: v.optional(v.id("importBatches")),
    importedFileId: v.optional(v.id("importedFiles")),
    sortOrder: v.number(),
    status: v.optional(extractionStatus),
    provenance: v.optional(extractionProvenance),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_module", ["tokenIdentifier", "moduleId"])
    .index("by_module", ["moduleId"])
    .index("by_module_and_sortOrder", ["moduleId", "sortOrder"])
    .index("by_module_and_weekNumber", ["moduleId", "weekNumber"])
    .index("by_source", ["sourceId"])
    .index("by_batch", ["batchId"])
    .index("by_importedFile", ["importedFileId"]),

  gapAnalysisRuns: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    status: gapRunStatus,
    summary: v.string(),
    overallConfidence: v.optional(v.number()),
    providerUsed: v.optional(v.string()),
    modelUsed: v.optional(v.string()),
    warnings: v.optional(v.array(v.string())),
    sourceCount: v.optional(v.number()),
    chunkCount: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_assignment", ["assignmentId"])
    .index("by_assignment_and_createdAt", ["assignmentId", "createdAt"]),

  gapAnalysisFindings: defineTable({
    tokenIdentifier: v.string(),
    runId: v.id("gapAnalysisRuns"),
    assignmentId: v.id("assignments"),
    gapCategory,
    title: v.string(),
    content: v.string(),
    severity: v.string(),
    confidence: v.number(),
    rationale: v.string(),
    label: v.optional(v.string()),
    citedChunkIds: v.optional(v.array(v.id("sourceChunks"))),
    relatedRubricCriterion: v.optional(v.string()),
    suggestedSearchTerms: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_run", ["runId"])
    .index("by_assignment", ["assignmentId"])
    .index("by_run_and_category", ["runId", "gapCategory"])
    .index("by_assignment_and_severity", ["assignmentId", "severity"]),

  sourceRecommendations: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    gapAnalysisRunId: v.optional(v.id("gapAnalysisRuns")),
    catalog: sourceCatalog,
    catalogId: v.string(),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    venue: v.optional(v.string()),
    doi: v.optional(v.string()),
    url: v.optional(v.string()),
    abstract: v.optional(v.string()),
    status: recommendationStatus,
    matchReason: v.optional(v.string()),
    raw: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_assignment", ["assignmentId"])
    .index("by_assignment_and_status", ["assignmentId", "status"])
    .index("by_gapAnalysisRun", ["gapAnalysisRunId"])
    .index("by_catalog_and_catalogId", ["catalog", "catalogId"])
    .index("by_assignment_and_catalog", ["assignmentId", "catalog"]),
});
