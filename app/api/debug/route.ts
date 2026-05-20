// DEBUG endpoint
// --------------
// Read-only window into the in-memory vector store. Lets you SEE what RAG
// actually stored:
//   - how many chunks are in the store
//   - the source labels they came from
//   - the chunk text
//   - the first 8 numbers of each embedding vector (so you can see what an
//     "embedding" really is — just an array of floats)
//
// Usage:
//   GET  /api/debug                 → summary of everything in the store
//   GET  /api/debug?source=refile   → only chunks from that source
//   GET  /api/debug?full=1          → include full text + full 384-d vectors
//   POST /api/debug { "query": "..." } → run a similarity search and see
//                                        scores for ALL stored chunks

import { NextResponse } from "next/server";
import { search, size } from "@/lib/rag/store";
import { embedOne } from "@/lib/rag/embed";

export const runtime = "nodejs";

// Reach back into the store via the same globalThis handle store.ts uses.
// Slightly hacky, but this is a debug-only endpoint — we want raw access.
type StoredChunk = {
  id: string;
  text: string;
  source: string;
  embedding: number[];
};
function getAll(): StoredChunk[] {
  const g = globalThis as unknown as { __ragStore?: StoredChunk[] };
  return g.__ragStore ?? [];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sourceFilter = url.searchParams.get("source");
  const full = url.searchParams.get("full") === "1";

  let chunks = getAll();
  if (sourceFilter) chunks = chunks.filter((c) => c.source === sourceFilter);

  const sources = Array.from(new Set(getAll().map((c) => c.source))).sort();
  const dim = chunks[0]?.embedding.length ?? 0;

  return NextResponse.json({
    totalChunks: size(),
    embeddingDim: dim,
    sources,
    showing: chunks.length,
    chunks: chunks.map((c) => ({
      id: c.id,
      source: c.source,
      textLength: c.text.length,
      text: full ? c.text : c.text.slice(0, 120) + (c.text.length > 120 ? "..." : ""),
      embeddingPreview: full ? c.embedding : c.embedding.slice(0, 8),
    })),
  });
}

export async function POST(req: Request) {
  const { query, k = 5 } = (await req.json()) as { query?: string; k?: number };
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const queryEmbedding = await embedOne(query);
  const hits = search(queryEmbedding, k);

  return NextResponse.json({
    query,
    queryEmbeddingPreview: queryEmbedding.slice(0, 8),
    embeddingDim: queryEmbedding.length,
    hits: hits.map((h) => ({
      id: h.id,
      source: h.source,
      score: h.score,
      text: h.text.slice(0, 200) + (h.text.length > 200 ? "..." : ""),
    })),
  });
}
