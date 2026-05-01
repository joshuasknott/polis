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
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
  })
    .index("by_userId", ["userId"]),

  folders: defineTable({
    moduleId: v.string(),
    name: v.string(),
    type: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
  })
    .index("by_moduleId", ["moduleId"]),

  assessments: defineTable({
    moduleId: v.string(),
    title: v.string(),
    type: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    weighting: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    status: v.optional(v.string()),
    brief: v.optional(v.string()),
  })
    .index("by_moduleId", ["moduleId"]),

  sources: defineTable({
    userId: v.string(),
    moduleId: v.string(),
    folderId: v.optional(v.string()),
    title: v.string(),
    authors: v.optional(v.string()),
    year: v.optional(v.number()),
    type: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storagePath: v.optional(v.string()),
    storageFileId: v.optional(v.id("_storage")),
    extractedText: v.optional(v.string()),
    summary: v.optional(v.string()),
    keyArguments: v.optional(v.string()),
    concepts: v.optional(v.string()),
    status: v.optional(v.string()),
    processingStatus: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    wordCount: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
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
});
