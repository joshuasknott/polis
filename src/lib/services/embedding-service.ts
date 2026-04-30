import "server-only";
import { prisma } from "@/lib/db";
import { generateEmbedding, generateEmbeddings, isOpenAIConfigured } from "@/lib/ai/providers";

export async function isEmbeddingAvailable(): Promise<boolean> {
  return isOpenAIConfigured();
}

export async function embedAndStoreChunks(sourceId: string): Promise<number> {
  if (!isOpenAIConfigured()) {
    return 0;
  }

  const chunks = await prisma.sourceChunk.findMany({
    where: { sourceId },
    orderBy: { chunkIndex: "asc" },
  });

  if (chunks.length === 0) return 0;

  const texts = chunks.map((c) => c.text.slice(0, 8000));
  const embeddings = await generateEmbeddings(texts);

  let updated = 0;
  for (let i = 0; i < chunks.length; i++) {
    if (embeddings[i]) {
      const vectorStr = `[${embeddings[i].join(",")}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE source_chunks SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        chunks[i].id
      );
      updated++;
    }
  }

  return updated;
}

export async function embedQuery(query: string): Promise<number[] | null> {
  if (!isOpenAIConfigured()) return null;
  try {
    return await generateEmbedding(query);
  } catch {
    return null;
  }
}

export async function embedAllUserChunks(userId: string): Promise<number> {
  if (!isOpenAIConfigured()) return 0;

  const chunks: Array<{ id: string; text: string }> = await prisma.$queryRaw`
    SELECT sc.id, sc.text FROM source_chunks sc
    JOIN sources s ON sc.source_id = s.id
    WHERE s.user_id = ${userId} AND s.status = 'ready' AND sc.embedding IS NULL
    ORDER BY sc.chunk_index ASC LIMIT 100
  `;

  if (chunks.length === 0) return 0;

  const texts = chunks.map((c) => c.text.slice(0, 8000));
  const batchSize = 20;
  let updated = 0;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batchTexts = texts.slice(i, i + batchSize);
    const batchChunks = chunks.slice(i, i + batchSize);
    const embeddings = await generateEmbeddings(batchTexts);

    for (let j = 0; j < batchChunks.length; j++) {
      if (embeddings[j]) {
        const vectorStr = `[${embeddings[j].join(",")}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE source_chunks SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          batchChunks[j].id
        );
        updated++;
      }
    }
  }

  return updated;
}
