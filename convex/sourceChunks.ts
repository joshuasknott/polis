import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { requireServerSecret } from "./serverAuth";

export const getBySourceId = query({
  args: { sourceId: v.string(), userId: v.optional(v.string()), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { sourceId, userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    if (userId) {
      const source = await ctx.db.get(sourceId as any) as any;
      if (!source || source.userId !== userId) return [];
    }
    const chunks = await ctx.db.query("sourceChunks").withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId)).order("asc").collect();
    return chunks.map((c) => ({
      id: c._id,
      sourceId: c.sourceId,
      chunkIndex: c.chunkIndex,
      text: c.text,
      charCount: c.charCount,
      tokenEstimate: c.tokenEstimate,
      pageNumber: c.pageNumber,
      hasEmbedding: !!c.embedding,
    }));
  },
});

export const createBatch = mutation({
  args: {
    userId: v.optional(v.string()),
    chunks: v.array(v.object({
      sourceId: v.string(),
      chunkIndex: v.number(),
      text: v.string(),
      charCount: v.number(),
      tokenEstimate: v.number(),
      pageNumber: v.optional(v.number()),
    })),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { chunks, userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const ids = [];
    for (const chunk of chunks) {
      if (userId) {
        const source = await ctx.db.get(chunk.sourceId as any) as any;
        if (!source || source.userId !== userId) throw new Error("Source not found");
      }
      const id = await ctx.db.insert("sourceChunks", chunk);
      ids.push(id);
    }
    return ids;
  },
});

export const setEmbedding = mutation({
  args: {
    chunkId: v.string(),
    embedding: v.array(v.float64()),
    userId: v.optional(v.string()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { chunkId, embedding, userId, serverSecret }) => {
    requireServerSecret(serverSecret);
    if (userId) {
      const chunk = await ctx.db.get(chunkId as any) as any;
      const source = chunk ? await ctx.db.get(chunk.sourceId as any) as any : null;
      if (!source || source.userId !== userId) throw new Error("Chunk not found");
    }
    await ctx.db.patch(chunkId as any, { embedding });
  },
});

export const getChunksWithoutEmbeddings = query({
  args: { userId: v.string(), limit: v.optional(v.number()), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, limit = 100, serverSecret }) => {
    requireServerSecret(serverSecret);
    const sources = await ctx.db.query("sources").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    const readySourceIds = new Set(sources.filter((s) => s.status === "ready").map((s) => s._id));

    const results = [];
    for (const sourceId of readySourceIds) {
      const chunks = await ctx.db.query("sourceChunks").withIndex("by_sourceId", (q) => q.eq("sourceId", sourceId)).collect();
      for (const chunk of chunks) {
        if (!chunk.embedding) {
          results.push({ id: chunk._id, text: chunk.text, sourceId: chunk.sourceId });
          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  },
});

export const searchByEmbedding = action({
  args: {
    userId: v.string(),
    embedding: v.array(v.float64()),
    sourceId: v.optional(v.string()),
    moduleId: v.optional(v.string()),
    sourceIds: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, embedding, sourceId, moduleId, sourceIds, limit = 10, serverSecret }) => {
    requireServerSecret(serverSecret);
    const filter: any = sourceId ? { sourceId } : undefined;

    const results = await ctx.vectorSearch("sourceChunks", "by_embedding", {
      vector: embedding,
      limit: Math.min(limit * 5, 50),
      filter,
    });

    const output = [];
    const allowedSourceIds = sourceIds ? new Set(sourceIds) : null;
    for (const result of results) {
      const chunk: any = await ctx.runQuery(api.sourceChunks._getChunk, { chunkId: result._id, serverSecret });
      if (chunk) {
        const source: any = await ctx.runQuery(api.sourceChunks._getSource, { sourceId: chunk.sourceId, serverSecret });
        if (!source || source.userId !== userId) continue;
        if (moduleId && source.moduleId !== moduleId) continue;
        if (allowedSourceIds && !allowedSourceIds.has(source._id)) continue;
        output.push({
          chunkId: chunk._id,
          sourceId: chunk.sourceId,
          text: chunk.text,
          score: result._score,
          sourceTitle: source?.title ?? "",
          sourceAuthors: source?.authors ?? "",
          sourceYear: source?.year ?? 0,
        });
        if (output.length >= limit) break;
      }
    }
    return output;
  },
});

export const _getChunk = query({
  args: { chunkId: v.id("sourceChunks"), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { chunkId, serverSecret }) => {
    requireServerSecret(serverSecret);
    return ctx.db.get(chunkId);
  },
});

export const _getSource = query({
  args: { sourceId: v.id("sources"), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { sourceId, serverSecret }) => {
    requireServerSecret(serverSecret);
    return ctx.db.get(sourceId);
  },
});

export const keywordSearch = query({
  args: {
    userId: v.string(),
    query: v.string(),
    moduleId: v.optional(v.string()),
    sourceId: v.optional(v.string()),
    sourceIds: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
    serverSecret: v.optional(v.string()),
  },
  handler: async (ctx, { userId, query, moduleId, sourceId, sourceIds, limit = 10, serverSecret }) => {
    requireServerSecret(serverSecret);
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    if (queryWords.length === 0) return [];

    let sources = await ctx.db.query("sources").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    sources = sources.filter((s) => s.status === "ready");
    if (moduleId) sources = sources.filter((s) => s.moduleId === moduleId);
    if (sourceId) sources = sources.filter((s) => s._id === sourceId);
    if (sourceIds) {
      const allowed = new Set(sourceIds);
      sources = sources.filter((s) => allowed.has(s._id));
    }

    const scored: any[] = [];
    for (const src of sources) {
      const chunks = await ctx.db.query("sourceChunks").withIndex("by_sourceId", (q) => q.eq("sourceId", src._id)).collect();
      for (const chunk of chunks) {
        const textLower = chunk.text.toLowerCase();
        let score = 0;
        for (const word of queryWords) {
          const matches = textLower.match(new RegExp(word, "gi"));
          if (matches) score += matches.length;
        }
        const titleLower = (src.title ?? "").toLowerCase();
        for (const word of queryWords) {
          if (titleLower.includes(word)) score += 3;
        }
        if (score > 0) {
          const normalizedScore = score / Math.max(1, Math.sqrt(chunk.text.length / 100));
          scored.push({
            chunkId: chunk._id,
            sourceId: chunk.sourceId,
            text: chunk.text,
            score: Math.round(normalizedScore * 100) / 100,
            sourceTitle: src.title,
            sourceAuthors: src.authors,
            sourceYear: src.year,
          });
        }
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  },
});

export const getEvidenceSourceIds = query({
  args: { userId: v.string(), essayId: v.string(), serverSecret: v.optional(v.string()) },
  handler: async (ctx, { userId, essayId, serverSecret }) => {
    requireServerSecret(serverSecret);
    const essay = await ctx.db.get(essayId as any) as any;
    if (!essay || essay.userId !== userId) return [];
    const evidence = await ctx.db.query("evidenceItems").withIndex("by_essayId", (q) => q.eq("essayId", essayId)).collect();
    return [...new Set(evidence.map((e) => e.sourceId).filter(Boolean))];
  },
});
