import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userProfiles: defineTable({
    externalId: v.string(),
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
    .index("by_externalId", ["externalId"])
    .index("by_email", ["email"]),

  modules: defineTable({
    userId: v.string(),
    title: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    semester: v.optional(v.string()),
    colour: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  folders: defineTable({
    userId: v.string(),
    moduleId: v.id("modules"),
    parentFolderId: v.optional(v.id("folders")),
    name: v.string(),
    type: v.string(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_module", ["moduleId"])
    .index("by_user", ["userId"]),

  sources: defineTable({
    userId: v.string(),
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
    .index("by_user", ["userId"])
    .index("by_module", ["moduleId"])
    .index("by_folder", ["folderId"]),

  sourceChunks: defineTable({
    userId: v.string(),
    sourceId: v.id("sources"),
    chunkIndex: v.number(),
    text: v.string(),
    pageStart: v.optional(v.number()),
    pageEnd: v.optional(v.number()),
    tokenEstimate: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_source", ["sourceId"]),

  sourceNotes: defineTable({
    userId: v.string(),
    sourceId: v.id("sources"),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_source", ["sourceId"]),

  essays: defineTable({
    userId: v.string(),
    moduleId: v.id("modules"),
    title: v.string(),
    question: v.optional(v.string()),
    thesis: v.optional(v.string()),
    targetWordCount: v.optional(v.number()),
    status: v.string(),
    draftContent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_module", ["moduleId"]),

  evidenceItems: defineTable({
    userId: v.string(),
    essayId: v.id("essays"),
    sourceId: v.optional(v.id("sources")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    claim: v.string(),
    evidenceText: v.optional(v.string()),
    explanation: v.optional(v.string()),
    citation: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_essay", ["essayId"]),

  conversations: defineTable({
    userId: v.string(),
    moduleId: v.optional(v.id("modules")),
    sourceId: v.optional(v.id("sources")),
    essayId: v.optional(v.id("essays")),
    title: v.string(),
    mode: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_module", ["moduleId"]),

  conversationMessages: defineTable({
    userId: v.string(),
    conversationId: v.id("conversations"),
    role: v.string(),
    content: v.string(),
    citedChunkIds: v.optional(v.array(v.id("sourceChunks"))),
    labels: v.optional(v.array(v.string())),
    warnings: v.optional(v.array(v.string())),
    createdAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  usageEvents: defineTable({
    userId: v.string(),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    type: v.string(),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    costEstimate: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"]),

  processingJobs: defineTable({
    userId: v.string(),
    sourceId: v.optional(v.id("sources")),
    type: v.string(),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_source", ["sourceId"])
    .index("by_status", ["status"]),

  aiProviderConnections: defineTable({
    userId: v.string(),
    provider: v.string(),
    status: v.string(),
    modelPreference: v.optional(v.string()),
    encryptedCredentialRef: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_provider", ["userId", "provider"]),
});
