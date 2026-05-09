import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  productionStage,
  sourceType,
  sourceStatus,
  folderType,
  cothinkerScope,
  messageRole,
  evidenceStrength,
  evidenceRole,
  judgementType,
  judgementSeverity,
  reviewStatus,
  reviewFindingCategory,
  processingJobType,
  processingJobStatus,
  providerName,
  argumentNodeType,
  argumentStatus,
  cothinkerInterventionType,
  draftBlockType,
  rubricCriterion,
  messageLabel,
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
    contextVersion: v.number(),
    contextUpdatedAt: v.number(),
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
    type: sourceType,
    status: sourceStatus,
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
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
    .index("by_source_and_chunkIndex", ["sourceId", "chunkIndex"]),

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
    strength: v.optional(evidenceStrength),
    createdAt: v.number(),
  }).index("by_source", ["sourceId"]),

  sourceConcepts: defineTable({
    tokenIdentifier: v.string(),
    sourceId: v.id("sources"),
    concept: v.string(),
    definition: v.optional(v.string()),
    relevance: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_source", ["sourceId"]),

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
    .index("by_argument_and_sortOrder", ["argumentId", "sortOrder"]),

  evidenceLinks: defineTable({
    tokenIdentifier: v.string(),
    argumentId: v.id("arguments"),
    argumentNodeId: v.optional(v.id("argumentNodes")),
    sourceId: v.id("sources"),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    sourceClaimId: v.optional(v.id("sourceClaims")),
    quote: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    usage: v.optional(evidenceRole),
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
    blockType: draftBlockType,
    content: v.optional(v.string()),
    argumentId: v.optional(v.id("arguments")),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_draft", ["draftId"])
    .index("by_draft_and_sortOrder", ["draftId", "sortOrder"]),

  judgementOptions: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    type: judgementType,
    question: v.string(),
    createdAt: v.number(),
  }).index("by_assignment", ["assignmentId"]),

  judgementDecisions: defineTable({
    tokenIdentifier: v.string(),
    assignmentId: v.id("assignments"),
    judgementOptionId: v.optional(v.id("judgementOptions")),
    type: judgementType,
    content: v.string(),
    severity: judgementSeverity,
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
    category: reviewFindingCategory,
    content: v.string(),
    severity: v.optional(judgementSeverity),
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
    labels: v.optional(v.array(messageLabel)),
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
    status: processingJobStatus,
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
    provider: providerName,
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error"),
    ),
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
    provider: v.optional(providerName),
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
    ]),
});
