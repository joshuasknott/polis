import "server-only";
import { prisma } from "@/lib/db";
import { embedQuery, isEmbeddingAvailable } from "./embedding-service";

export interface RetrievalResultItem {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceAuthors: string;
  sourceYear: number;
  text: string;
  score: number;
  semanticScore?: number;
  keywordScore?: number;
  citationLabel: string;
}

export type RetrievalMode = "hybrid" | "semantic" | "keyword";

interface SemanticRow {
  id: string;
  source_id: string;
  text: string;
  similarity: number;
  source_title: string;
  source_authors: string;
  source_year: number;
}

export async function retrieveRelevantChunks(params: {
  userId: string;
  query: string;
  moduleId?: string;
  sourceId?: string;
  essayId?: string;
  limit?: number;
  retrievalMode?: RetrievalMode;
}): Promise<RetrievalResultItem[]> {
  const { retrievalMode = "hybrid" } = params;

  const useSemantic = (retrievalMode === "semantic" || retrievalMode === "hybrid") && await isEmbeddingAvailable();
  const useKeyword = retrievalMode === "keyword" || retrievalMode === "hybrid";

  if (useSemantic && !useKeyword) {
    return semanticSearch(params);
  }

  if (useKeyword && !useSemantic) {
    return keywordSearch(params);
  }

  if (useSemantic && useKeyword) {
    return hybridSearch(params);
  }

  return keywordSearch(params);
}

async function semanticSearch(params: {
  userId: string;
  query: string;
  moduleId?: string;
  sourceId?: string;
  essayId?: string;
  limit?: number;
}): Promise<RetrievalResultItem[]> {
  const { userId, query, moduleId, sourceId, essayId, limit = 10 } = params;

  const queryEmbedding = await embedQuery(query);
  if (!queryEmbedding) return [];

  const vectorStr = `[${queryEmbedding.join(",")}]`;

  let whereClause = "sc.embedding IS NOT NULL AND s.user_id = $2 AND s.status = 'ready'";
  const queryParams: (string | number)[] = [vectorStr, userId];
  let paramIdx = 3;

  if (moduleId) {
    whereClause += ` AND s.module_id = $${paramIdx}`;
    queryParams.push(moduleId);
    paramIdx++;
  }

  if (sourceId) {
    whereClause += ` AND sc.source_id = $${paramIdx}`;
    queryParams.push(sourceId);
    paramIdx++;
  }

  if (essayId) {
    queryParams.push(essayId);
    whereClause += ` AND sc.source_id IN (SELECT source_id FROM evidence_items WHERE essay_id = $${paramIdx} AND source_id IS NOT NULL)`;
    paramIdx++;
  }

  queryParams.push(limit);

  const rows = await prisma.$queryRawUnsafe<SemanticRow[]>(
    `SELECT sc.id, sc.source_id, sc.text,
       1 - (sc.embedding <=> $1::vector) as similarity,
       s.title as source_title, s.authors as source_authors, s.year as source_year
     FROM source_chunks sc
     JOIN sources s ON sc.source_id = s.id
     WHERE ${whereClause}
     ORDER BY sc.embedding <=> $1::vector
     LIMIT $${paramIdx}`,
    ...queryParams
  );

  const results: RetrievalResultItem[] = rows.map((row) => ({
    chunkId: row.id,
    sourceId: row.source_id,
    sourceTitle: row.source_title,
    sourceAuthors: row.source_authors,
    sourceYear: row.source_year,
    text: row.text,
    score: Math.round(row.similarity * 100) / 100,
    semanticScore: Math.round(row.similarity * 100) / 100,
    citationLabel: `${row.source_authors} (${row.source_year})`,
  }));

  await logRetrieval(userId, query, moduleId, sourceId, results, "semantic");

  return results;
}

async function keywordSearch(params: {
  userId: string;
  query: string;
  moduleId?: string;
  sourceId?: string;
  essayId?: string;
  limit?: number;
}): Promise<RetrievalResultItem[]> {
  const { userId, query, moduleId, sourceId, essayId, limit = 10 } = params;

  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) return [];

  const whereClause: Record<string, unknown> = {
    source: {
      userId,
      status: "ready",
    },
  };

  if (moduleId) {
    (whereClause.source as Record<string, unknown>).moduleId = moduleId;
  }

  if (sourceId) {
    whereClause.sourceId = sourceId;
  }

  if (essayId) {
    const essay = await prisma.essay.findFirst({
      where: { id: essayId, userId },
      select: { evidence: { select: { sourceId: true } } },
    });
    if (essay) {
      const sourceIds = [...new Set(essay.evidence.map((e) => e.sourceId).filter(Boolean))];
      if (sourceIds.length > 0) {
        whereClause.sourceId = { in: sourceIds };
      }
    }
  }

  const chunks = await prisma.sourceChunk.findMany({
    where: whereClause,
    include: {
      source: {
        select: { title: true, authors: true, year: true },
      },
    },
    take: 500,
  });

  const scored = chunks.map((chunk) => {
    const textLower = chunk.text.toLowerCase();
    let score = 0;

    for (const word of queryWords) {
      const regex = new RegExp(word, "gi");
      const matches = textLower.match(regex);
      if (matches) {
        score += matches.length;
      }
    }

    const titleLower = chunk.source.title.toLowerCase();
    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 3;
      }
    }

    const textLength = chunk.text.length;
    const normalizedScore = score / Math.max(1, Math.sqrt(textLength / 100));

    return {
      chunkId: chunk.id,
      sourceId: chunk.sourceId,
      sourceTitle: chunk.source.title,
      sourceAuthors: chunk.source.authors,
      sourceYear: chunk.source.year,
      text: chunk.text,
      score: Math.round(normalizedScore * 100) / 100,
      keywordScore: Math.round(normalizedScore * 100) / 100,
      citationLabel: `${chunk.source.authors} (${chunk.source.year})`,
    };
  });

  const results = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  await logRetrieval(userId, query, moduleId, sourceId, results, "keyword");

  return results;
}

async function hybridSearch(params: {
  userId: string;
  query: string;
  moduleId?: string;
  sourceId?: string;
  essayId?: string;
  limit?: number;
}): Promise<RetrievalResultItem[]> {
  const { userId, query, limit = 10 } = params;

  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch({ ...params, limit: limit * 2 }),
    keywordSearch({ ...params, limit: limit * 2 }),
  ]);

  const combined = new Map<string, RetrievalResultItem>();

  const maxSemScore = Math.max(...semanticResults.map((r) => r.semanticScore ?? 0), 0.001);
  for (const r of semanticResults) {
    const normalized = (r.semanticScore ?? 0) / maxSemScore;
    combined.set(r.chunkId, {
      ...r,
      semanticScore: r.semanticScore,
      keywordScore: 0,
      score: Math.round(normalized * 0.7 * 100) / 100,
    });
  }

  const maxKwScore = Math.max(...keywordResults.map((r) => r.keywordScore ?? 0), 0.001);
  for (const r of keywordResults) {
    const normalized = (r.keywordScore ?? 0) / maxKwScore;
    const existing = combined.get(r.chunkId);
    if (existing) {
      existing.keywordScore = r.keywordScore;
      existing.score = Math.round((existing.score + normalized * 0.3) * 100) / 100;
    } else {
      combined.set(r.chunkId, {
        ...r,
        keywordScore: r.keywordScore,
        semanticScore: 0,
        score: Math.round(normalized * 0.3 * 100) / 100,
      });
    }
  }

  const results = [...combined.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  await logRetrieval(userId, query, params.moduleId, params.sourceId, results, "hybrid");

  return results;
}

async function logRetrieval(
  userId: string,
  query: string,
  moduleId: string | undefined,
  sourceId: string | undefined,
  results: RetrievalResultItem[],
  mode: string
) {
  if (results.length > 0) {
    await prisma.retrievalLog.create({
      data: {
        userId,
        query,
        moduleId,
        sourceIds: sourceId || null,
        selectedChunkIds: results.map((r) => r.chunkId).join(","),
        mode,
      },
    });
  }
}
