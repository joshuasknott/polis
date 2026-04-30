export interface RetrievalResult {
  chunkId: string;
  sourceId: string;
  text: string;
  score: number;
  pageRange: string;
  citationLabel: string;
}

export interface RetrievalConfig {
  topK: number;
  minScore: number;
  scope: "module" | "folder" | "sources" | "essay";
  scopeId: string;
}

export async function retrieve(
  _query: string,
  _config: RetrievalConfig
): Promise<RetrievalResult[]> {
  throw new Error(
    "Retrieval not implemented. Vector search will be available in Phase 2."
  );
}

export async function embed(_text: string): Promise<number[]> {
  throw new Error(
    "Embedding not implemented. Embeddings will be available in Phase 2."
  );
}
