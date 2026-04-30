export interface ChunkConfig {
  maxTokens: number;
  overlapTokens: number;
  respectPageBoundaries: boolean;
}

export const defaultChunkConfig: ChunkConfig = {
  maxTokens: 800,
  overlapTokens: 150,
  respectPageBoundaries: true,
};

export interface TextChunk {
  id: string;
  text: string;
  pageStart: number;
  pageEnd: number;
  tokenEstimate: number;
}

export function chunkText(
  text: string,
  config: ChunkConfig = defaultChunkConfig
): TextChunk[] {
  const words = text.split(/\s+/);
  const chunks: TextChunk[] = [];
  const wordsPerChunk = config.maxTokens;
  const overlap = config.overlapTokens;
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + wordsPerChunk, words.length);
    const chunkWords = words.slice(start, end);

    chunks.push({
      id: `chunk_${chunks.length}`,
      text: chunkWords.join(" "),
      pageStart: 1,
      pageEnd: 1,
      tokenEstimate: chunkWords.length,
    });

    start += wordsPerChunk - overlap;
    if (start >= words.length) break;
  }

  return chunks;
}
