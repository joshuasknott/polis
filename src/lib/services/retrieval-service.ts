import "server-only";
import { prisma } from "@/lib/db";

export interface RetrievalResultItem {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceAuthors: string;
  sourceYear: number;
  text: string;
  score: number;
  citationLabel: string;
}

export async function retrieveRelevantChunks(params: {
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
      citationLabel: `${chunk.source.authors} (${chunk.source.year})`,
    };
  });

  const results = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (results.length > 0) {
    await prisma.retrievalLog.create({
      data: {
        userId,
        query,
        moduleId,
        sourceIds: sourceId ? sourceId : null,
        selectedChunkIds: results.map((r) => r.chunkId).join(","),
        mode: "keyword",
      },
    });
  }

  return results;
}
