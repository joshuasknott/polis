import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  folders: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.id("modules"),
    parentFolderId: v.optional(v.id("folders")),
    name: v.string(),
    type: v.string(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["moduleId"])
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
    citation: v.optional(v.string()),
    summary: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_module", ["moduleId"])
    .index("by_folder", ["folderId"]),

  sourceChunks: defineTable({
    sourceId: v.id("sources"),
    chunkIndex: v.number(),
    text: v.string(),
    pageStart: v.optional(v.number()),
    pageEnd: v.optional(v.number()),
    tokenEstimate: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_source", ["sourceId"]),

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
    rubric: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          weight: v.number(),
        }),
      ),
    ),
    stage: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_module", ["moduleId"])
    .index("by_module_and_stage", ["moduleId", "stage"]),

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
    status: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_assignment", ["assignmentId"]),

  argumentNodes: defineTable({
    tokenIdentifier: v.string(),
    argumentId: v.id("arguments"),
    type: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("argumentNodes")),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_argument", ["argumentId"]),

  evidenceLinks: defineTable({
    tokenIdentifier: v.string(),
    argumentId: v.id("arguments"),
    argumentNodeId: v.optional(v.id("argumentNodes")),
    sourceId: v.id("sources"),
    sourceClaimId: v.optional(v.id("sourceClaims")),
    quote: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    usage: v.optional(v.string()),
    strength: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_argument", ["argumentId"])
    .index("by_source", ["sourceId"])
    .index("by_argumentNodeId", ["argumentNodeId"]),

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
    .index("by_tokenIdentifier", ["tokenIdentifier"]),

  draftBlocks: defineTable({
    tokenIdentifier: v.string(),
    draftId: v.id("drafts"),
    blockType: v.string(),
    content: v.optional(v.string()),
    argumentId: v.optional(v.id("arguments")),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_draft", ["draftId"]),

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
    status: v.string(),
    overallFeedback: v.optional(v.string()),
    rubricAlignment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_draft", ["draftId"])
    .index("by_status", ["status"]),

  reviewFindings: defineTable({
    tokenIdentifier: v.string(),
    reviewRunId: v.id("reviewRuns"),
    category: v.string(),
    content: v.string(),
    severity: v.optional(v.string()),
    resolved: v.optional(v.boolean()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_reviewRun", ["reviewRunId"]),

  coThinkerSessions: defineTable({
    tokenIdentifier: v.string(),
    moduleId: v.optional(v.id("modules")),
    assignmentId: v.optional(v.id("assignments")),
    sourceId: v.optional(v.id("sources")),
    title: v.string(),
    scope: v.string(),
    stage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_module", ["moduleId"])
    .index("by_assignment", ["assignmentId"]),

  coThinkerMessages: defineTable({
    tokenIdentifier: v.string(),
    sessionId: v.id("coThinkerSessions"),
    role: v.string(),
    content: v.string(),
    citedChunkIds: v.optional(v.array(v.id("sourceChunks"))),
    labels: v.optional(v.array(v.string())),
    warnings: v.optional(v.array(v.string())),
    followUpSuggestions: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),

  coThinkerInterventions: defineTable({
    tokenIdentifier: v.string(),
    sessionId: v.id("coThinkerSessions"),
    type: v.string(),
    content: v.string(),
    resolved: v.optional(v.boolean()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),

  processingJobs: defineTable({
    tokenIdentifier: v.string(),
    sourceId: v.optional(v.id("sources")),
    type: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_source", ["sourceId"])
    .index("by_status", ["status"]),

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
    .index("by_tokenIdentifier_and_provider", ["tokenIdentifier", "provider"]),

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
    .index("by_type", ["type"]),
});
