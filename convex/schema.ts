import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    passwordHash: v.optional(v.string()),
    university: v.optional(v.string()),
    course: v.optional(v.string()),
    yearOfStudy: v.optional(v.number()),
    role: v.optional(v.string()),
    preferences: v.optional(v.string()),
  })
    .index("by_email", ["email"]),

  accounts: defineTable({
    userId: v.string(),
    accountId: v.string(),
    providerId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.string()),
    refreshTokenExpiresAt: v.optional(v.string()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountId", ["accountId"])
    .index("by_providerId_and_accountId", ["providerId", "accountId"]),

  sessions: defineTable({
    userId: v.string(),
    token: v.string(),
    expiresAt: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  verifications: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_identifier_value", ["identifier", "value"]),

  modules: defineTable({
    userId: v.string(),
    code: v.string(),
    title: v.string(),
    name: v.optional(v.string()),
    moduleCode: v.optional(v.string()),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    assessmentTitle: v.optional(v.string()),
    assessmentQuestion: v.optional(v.string()),
    deadline: v.optional(v.string()),
    targetGrade: v.optional(v.string()),
    referencingStyle: v.optional(v.string()),
    currentStage: v.optional(v.union(
      v.literal("setup"),
      v.literal("sources"),
      v.literal("knowledge"),
      v.literal("context"),
      v.literal("plan"),
      v.literal("draft"),
      v.literal("final"),
    )),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  })
    .index("by_userId", ["userId"]),

  folders: defineTable({
    moduleId: v.string(),
    name: v.string(),
    type: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
  })
    .index("by_moduleId", ["moduleId"]),

  assignments: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    title: v.string(),
    type: v.union(
      v.literal("essay"),
      v.literal("research_project"),
      v.literal("literature_review"),
      v.literal("briefing"),
      v.literal("exam"),
      v.literal("quiz"),
      v.literal("presentation"),
      v.literal("other"),
    ),
    questionOrBrief: v.optional(v.string()),
    weighting: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    status: v.union(
      v.literal("detected"),
      v.literal("approved"),
      v.literal("active"),
      v.literal("archived"),
      v.literal("dismissed"),
    ),
    markingCriteriaSummary: v.optional(v.string()),
    detectedFromSourceIds: v.optional(v.array(v.string())),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId_moduleId", ["userId", "moduleId"])
    .index("by_userId_moduleId_status", ["userId", "moduleId", "status"]),

  moduleProfiles: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    summary: v.optional(v.string()),
    keyThemes: v.optional(v.array(v.string())),
    keyConcepts: v.optional(v.array(v.string())),
    keyTheories: v.optional(v.array(v.string())),
    keyCases: v.optional(v.array(v.string())),
    assessmentSummary: v.optional(v.string()),
    importantReadings: v.optional(v.array(v.string())),
    academicExpectations: v.optional(v.string()),
    updatedAt: v.string(),
  })
    .index("by_userId_moduleId", ["userId", "moduleId"]),

  assignmentSourceRelevance: defineTable({
    userId: v.string(),
    assignmentId: v.string(),
    moduleId: v.string(),
    sourceId: v.string(),
    relevanceType: v.union(
      v.literal("core"),
      v.literal("supporting"),
      v.literal("opposing"),
      v.literal("theoretical"),
      v.literal("empirical_case"),
      v.literal("methodological"),
      v.literal("background"),
      v.literal("not_relevant"),
    ),
    relevanceNote: v.optional(v.string()),
    usefulEvidence: v.optional(v.string()),
    usefulQuotes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_assignmentId", ["assignmentId"])
    .index("by_userId_assignmentId_sourceId", ["userId", "assignmentId", "sourceId"])
    .index("by_userId_moduleId", ["userId", "moduleId"]),

  sources: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    folderId: v.optional(v.string()),
    title: v.string(),
    author: v.optional(v.string()),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.optional(v.string()),
    relevance: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    citation: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storagePath: v.optional(v.string()),
    storageFileId: v.optional(v.id("_storage")),
    rawText: v.optional(v.string()),
    extractedText: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyArguments: v.optional(v.string()),
    concepts: v.optional(v.string()),
    status: v.optional(v.string()),
    processingStatus: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_moduleId", ["userId", "moduleId"])
    .index("by_userId_moduleId_status", ["userId", "moduleId", "status"])
    .index("by_moduleId", ["moduleId"])
    .index("by_folderId", ["folderId"]),

  sourceChunks: defineTable({
    sourceId: v.string(),
    chunkIndex: v.number(),
    text: v.string(),
    charCount: v.number(),
    tokenEstimate: v.number(),
    pageNumber: v.optional(v.number()),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_sourceId", ["sourceId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["sourceId"],
    }),

  essays: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    assessmentId: v.optional(v.string()),
    title: v.string(),
    question: v.optional(v.string()),
    thesis: v.optional(v.string()),
    targetWordCount: v.optional(v.number()),
    status: v.optional(v.string()),
    draftContent: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_moduleId", ["userId", "moduleId"])
    .index("by_userId_status", ["userId", "status"]),

  essaySections: defineTable({
    essayId: v.string(),
    title: v.string(),
    purpose: v.optional(v.string()),
    targetWordCount: v.optional(v.number()),
    displayOrder: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_essayId", ["essayId"]),

  evidenceItems: defineTable({
    essayId: v.string(),
    sectionId: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    sourceChunkId: v.optional(v.string()),
    claim: v.string(),
    evidenceText: v.optional(v.string()),
    explanation: v.optional(v.string()),
    citation: v.optional(v.string()),
    tags: v.optional(v.string()),
  })
    .index("by_essayId", ["essayId"])
    .index("by_sectionId", ["sectionId"])
    .index("by_sourceId", ["sourceId"]),

  conversations: defineTable({
    userId: v.string(),
    moduleId: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    essayId: v.optional(v.string()),
    title: v.string(),
    mode: v.optional(v.string()),
  })
    .index("by_userId", ["userId"]),

  conversationMessages: defineTable({
    conversationId: v.string(),
    role: v.string(),
    content: v.string(),
    citedChunkIds: v.optional(v.string()),
  })
    .index("by_conversationId", ["conversationId"]),

  aiProviderConnections: defineTable({
    userId: v.string(),
    provider: v.string(),
    encryptedApiKey: v.optional(v.string()),
    status: v.optional(v.string()),
    modelPreference: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_provider", ["userId", "provider"]),

  retrievalLogs: defineTable({
    userId: v.string(),
    query: v.string(),
    moduleId: v.optional(v.string()),
    sourceIds: v.optional(v.string()),
    selectedChunkIds: v.optional(v.string()),
    mode: v.optional(v.string()),
  })
    .index("by_userId", ["userId"]),

  usageLogs: defineTable({
    userId: v.string(),
    provider: v.string(),
    model: v.string(),
    type: v.string(),
    tokensIn: v.number(),
    tokensOut: v.number(),
    costEstimate: v.number(),
  })
    .index("by_userId", ["userId"]),

  sourceNotes: defineTable({
    userId: v.string(),
    sourceId: v.string(),
    content: v.string(),
    tags: v.optional(v.string()),
  })
    .index("by_sourceId", ["sourceId"])
    .index("by_userId_sourceId", ["userId", "sourceId"]),

  knowledgePages: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    title: v.string(),
    type: v.union(
      v.literal("source_brief"),
      v.literal("concept"),
      v.literal("theory"),
      v.literal("author"),
      v.literal("case"),
      v.literal("debate"),
      v.literal("comparison"),
      v.literal("contradiction"),
      v.literal("synthesis"),
      v.literal("essay_pack"),
    ),
    content: v.string(),
    linkedSourceIds: v.array(v.string()),
    linkedPageIds: v.array(v.string()),
    tags: v.array(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId_moduleId", ["userId", "moduleId"])
    .index("by_userId_moduleId_type", ["userId", "moduleId", "type"]),

  contextPacks: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    assignmentId: v.optional(v.string()),
    title: v.string(),
    assessmentQuestion: v.optional(v.string()),
    selectedSourceIds: v.array(v.string()),
    selectedKnowledgePageIds: v.array(v.string()),
    markingCriteria: v.optional(v.string()),
    workingThesis: v.optional(v.string()),
    keyClaims: v.array(v.string()),
    keyQuotes: v.array(v.string()),
    caseStudies: v.array(v.string()),
    missingEvidence: v.array(v.string()),
    draftingInstructions: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId_moduleId", ["userId", "moduleId"]),

  plans: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    assignmentId: v.optional(v.string()),
    contextPackId: v.string(),
    title: v.string(),
    thesis: v.optional(v.string()),
    sections: v.array(v.object({
      id: v.string(),
      title: v.string(),
      purpose: v.optional(v.string()),
      claim: v.optional(v.string()),
      evidenceSourceIds: v.array(v.string()),
      knowledgePageIds: v.array(v.string()),
      counterargument: v.optional(v.string()),
      evaluation: v.optional(v.string()),
      wordCount: v.optional(v.number()),
      notes: v.optional(v.string()),
    })),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId_moduleId", ["userId", "moduleId"])
    .index("by_contextPackId", ["contextPackId"]),

  drafts: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    assignmentId: v.optional(v.string()),
    contextPackId: v.string(),
    planId: v.string(),
    title: v.string(),
    content: v.string(),
    status: v.union(v.literal("rough"), v.literal("revised"), v.literal("final")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId_moduleId", ["userId", "moduleId"])
    .index("by_planId", ["planId"]),

  feedback: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    assignmentId: v.optional(v.string()),
    draftId: v.string(),
    content: v.string(),
    revisionTasks: v.array(v.object({
      id: v.string(),
      text: v.string(),
      completed: v.boolean(),
    })),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId_moduleId", ["userId", "moduleId"])
    .index("by_draftId", ["draftId"]),

  externalSourceRecommendations: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    assignmentId: v.optional(v.string()),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    sourceType: v.union(
      v.literal("book"),
      v.literal("journal_article"),
      v.literal("report"),
      v.literal("dataset"),
      v.literal("lecture_resource"),
      v.literal("website"),
      v.literal("other"),
    ),
    whyUseful: v.optional(v.string()),
    recommendedUse: v.union(
      v.literal("core"),
      v.literal("supporting"),
      v.literal("opposing"),
      v.literal("theoretical"),
      v.literal("empirical_case"),
      v.literal("methodological"),
      v.literal("background"),
    ),
    searchQuery: v.optional(v.string()),
    possibleCitation: v.optional(v.string()),
    url: v.optional(v.string()),
    publisherOrJournal: v.optional(v.string()),
    confidence: v.optional(v.string()),
    status: v.union(
      v.literal("suggested"),
      v.literal("saved"),
      v.literal("dismissed"),
      v.literal("imported"),
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId_moduleId", ["userId", "moduleId"])
    .index("by_userId_assignmentId", ["userId", "assignmentId"])
    .index("by_userId_moduleId_status", ["userId", "moduleId", "status"]),
});
