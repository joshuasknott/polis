import "server-only";
import { prisma } from "@/lib/db";

const TARGET_CHUNK_WORDS = 1000;
const OVERLAP_WORDS = 150;

export interface ChunkResult {
  chunkIndex: number;
  text: string;
  charCount: number;
  tokenEstimate: number;
  pageNumber: number | null;
}

export function createChunksFromText(
  text: string,
  targetWords: number = TARGET_CHUNK_WORDS,
  overlapWords: number = OVERLAP_WORDS
): ChunkResult[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: ChunkResult[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < words.length) {
    const end = Math.min(start + targetWords, words.length);
    const chunkWords = words.slice(start, end);
    const chunkText = chunkWords.join(" ");

    chunks.push({
      chunkIndex,
      text: chunkText,
      charCount: chunkText.length,
      tokenEstimate: Math.ceil(chunkWords.length * 1.3),
      pageNumber: null,
    });

    chunkIndex++;
    start += targetWords - overlapWords;
    if (start >= words.length) break;
    if (end === words.length) break;
  }

  return chunks;
}

export async function chunkAndStore(sourceId: string, text: string): Promise<number> {
  const chunks = createChunksFromText(text);

  await prisma.sourceChunk.createMany({
    data: chunks.map((chunk) => ({
      sourceId,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      charCount: chunk.charCount,
      tokenEstimate: chunk.tokenEstimate,
      pageNumber: chunk.pageNumber,
    })),
  });

  return chunks.length;
}
