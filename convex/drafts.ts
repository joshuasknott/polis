import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthIdentifier } from "./lib/auth";
import { draftBlockType, provenanceLabel } from "./lib/validators";
import { internal } from "./_generated/api";

export const list = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return [];
    }

    return await ctx.db
      .query("drafts")
      .withIndex("by_assignment_and_version", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) return null;
    return draft;
  },
});

export const getLatest = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      return null;
    }

    const drafts = await ctx.db
      .query("drafts")
      .withIndex("by_assignment_and_version", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .first();
    return drafts ?? null;
  },
});

export const getDraftWithBlocks = query({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) return null;

    const blocks = await ctx.db
      .query("draftBlocks")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .order("asc")
      .take(200);

    return { draft, blocks };
  },
});

export const create = mutation({
  args: {
    assignmentId: v.id("assignments"),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const existing = await ctx.db
      .query("drafts")
      .withIndex("by_assignment_and_version", (q) =>
        q.eq("assignmentId", args.assignmentId),
      )
      .order("desc")
      .first();
    const version = existing ? existing.version + 1 : 1;

    const now = Date.now();
    return await ctx.db.insert("drafts", {
      ...args,
      tokenIdentifier,
      version,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    draftId: v.id("drafts"),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { draftId, ...updates } = args;
    const draft = await ctx.db.get(draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.patch(draftId, { ...updates, updatedAt: Date.now() });
    return draftId;
  },
});

export const saveDraft = mutation({
  args: {
    draftId: v.id("drafts"),
    content: v.string(),
    wordCount: v.number(),
    sections: v.array(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.draftId, {
      content: args.content,
      wordCount: args.wordCount,
      status: "in_progress",
      updatedAt: now,
    });

    const newBlockIds = [];
    for (const section of args.sections) {
      const blockId = await ctx.db.insert("draftBlocks", {
        tokenIdentifier,
        draftId: args.draftId,
        blockType: section.blockType,
        content: section.content,
        argumentId: section.argumentId,
        sortOrder: section.sortOrder,
        label: section.label,
        sourceId: section.sourceId,
        sourceChunkId: section.sourceChunkId,
        evidenceLinkId: section.evidenceLinkId,
        quote: section.quote,
        pageRange: section.pageRange,
        aiGenerated: section.aiGenerated,
        createdAt: now,
        updatedAt: now,
      });
      newBlockIds.push(blockId);
    }

    const existing = await ctx.db
      .query("draftBlocks")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .take(500);

    for (const block of existing) {
      if (!newBlockIds.includes(block._id)) {
        await ctx.db.delete(block._id);
      }
    }

    return args.draftId;
  },
});

export const remove = mutation({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.runMutation(internal.cleanup.deleteDraftData, {
      draftId: args.draftId,
    });
    return args.draftId;
  },
});

export const listBlocks = query({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) return [];

    return await ctx.db
      .query("draftBlocks")
      .withIndex("by_draft_and_sortOrder", (q) =>
        q.eq("draftId", args.draftId),
      )
      .order("asc")
      .take(200);
  },
});

export const createBlock = mutation({
  args: {
    draftId: v.id("drafts"),
    blockType: draftBlockType,
    content: v.optional(v.string()),
    argumentId: v.optional(v.id("arguments")),
    sortOrder: v.optional(v.number()),
    label: v.optional(provenanceLabel),
    sourceId: v.optional(v.id("sources")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    evidenceLinkId: v.optional(v.id("evidenceLinks")),
    quote: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    aiGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.argumentId) {
      const argument = await ctx.db.get(args.argumentId);
      if (
        !argument ||
        argument.tokenIdentifier !== tokenIdentifier ||
        argument.assignmentId !== draft.assignmentId
      ) {
        throw new Error("Argument must belong to the draft's assignment");
      }
    }

    if (args.sourceId) {
      const source = await ctx.db.get(args.sourceId);
      if (!source || source.tokenIdentifier !== tokenIdentifier) {
        throw new Error("Source not found");
      }
    }

    if (args.sourceChunkId) {
      const chunk = await ctx.db.get(args.sourceChunkId);
      if (!chunk || chunk.sourceId !== args.sourceId) {
        throw new Error("Chunk must belong to the specified source");
      }
    }

    const now = Date.now();
    return await ctx.db.insert("draftBlocks", {
      ...args,
      tokenIdentifier,
      sortOrder: args.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBlock = mutation({
  args: {
    blockId: v.id("draftBlocks"),
    blockType: v.optional(draftBlockType),
    content: v.optional(v.string()),
    argumentId: v.optional(v.id("arguments")),
    sortOrder: v.optional(v.number()),
    label: v.optional(provenanceLabel),
    sourceId: v.optional(v.id("sources")),
    sourceChunkId: v.optional(v.id("sourceChunks")),
    evidenceLinkId: v.optional(v.id("evidenceLinks")),
    quote: v.optional(v.string()),
    pageRange: v.optional(v.string()),
    aiGenerated: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const { blockId, ...updates } = args;
    const block = await ctx.db.get(blockId);
    if (!block || block.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    if (args.argumentId) {
      const draft = await ctx.db.get(block.draftId);
      const argument = await ctx.db.get(args.argumentId);
      if (
        !argument ||
        argument.tokenIdentifier !== tokenIdentifier ||
        !draft ||
        argument.assignmentId !== draft.assignmentId
      ) {
        throw new Error("Argument must belong to the draft's assignment");
      }
    }

    if (args.sourceId) {
      const source = await ctx.db.get(args.sourceId);
      if (!source || source.tokenIdentifier !== tokenIdentifier) {
        throw new Error("Source not found");
      }
    }

    if (args.sourceChunkId) {
      const chunk = await ctx.db.get(args.sourceChunkId);
      if (!chunk || chunk.sourceId !== args.sourceId) {
        throw new Error("Chunk must belong to the specified source");
      }
    }

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }
    await ctx.db.patch(blockId, { ...cleanUpdates, updatedAt: Date.now() });
    return blockId;
  },
});

export const removeBlock = mutation({
  args: { blockId: v.id("draftBlocks") },
  handler: async (ctx, args) => {
    const tokenIdentifier = await getAuthIdentifier(ctx);
    const block = await ctx.db.get(args.blockId);
    if (!block || block.tokenIdentifier !== tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.blockId);
    return args.blockId;
  },
});
