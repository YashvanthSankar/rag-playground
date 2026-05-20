// STEP 3 of RAG: The vector store
// -------------------------------
// A vector store does ONE important thing: given a query vector, return the
// K stored vectors that are most similar. We implement it ourselves with
// plain arrays and a cosine-similarity function so you can read every line.
//
// Cosine similarity measures the angle between two vectors. 1 = identical
// direction (same meaning), 0 = unrelated, -1 = opposite. We pick top-K by
// sorting all stored chunks by similarity to the query.
//
// In production you'd swap this for pgvector, Pinecone, Qdrant, etc. —
// but the *interface* (upsert + search) stays the same.

import type { Chunk } from "./chunk";

export type StoredChunk = Chunk & { embedding: number[] };
export type ScoredChunk = StoredChunk & { score: number };

// Module-level state. Lives only as long as the Node.js process — restart
// the dev server and it's gone. Good enough for a playground; in real apps
// you'd persist to disk or a database.
const store: StoredChunk[] = [];

export function upsert(chunks: StoredChunk[]) {
  store.push(...chunks);
}

export function size() {
  return store.length;
}

export function clear() {
  store.length = 0;
}

export function search(queryEmbedding: number[], k = 4): ScoredChunk[] {
  return store
    .map((c) => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// Cosine similarity = (A · B) / (|A| * |B|)
// Embedding models from OpenAI return already-normalized vectors (|A| = 1),
// so the dot product alone would suffice — but we compute the full formula
// for clarity and so this works with any provider.
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
