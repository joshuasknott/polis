-- Create HNSW index for fast approximate nearest neighbor search
-- Run this after enabling pgvector extension (scripts/enable-pgvector.sql)
-- Recommended when source_chunks table has > 1,000 rows

CREATE INDEX CONCURRENTLY IF NOT EXISTS source_chunks_embedding_idx
ON source_chunks
USING hnsw (embedding vector_cosine_ops);

-- Optional: IVFFlat alternative (better for very large datasets > 100k rows)
-- Requires pre-existing data to build centroids
-- CREATE INDEX IF NOT EXISTS source_chunks_embedding_ivfflat_idx
-- ON source_chunks
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);
