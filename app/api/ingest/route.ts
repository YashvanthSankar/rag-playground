// INGEST endpoint
// ---------------
// Receives raw text + an optional source label. Runs the first half of the
// RAG pipeline: chunk -> embed -> store. After this completes, the chunks
// are searchable.

import { NextResponse } from "next/server";
import { chunkText } from "@/lib/rag/chunk";
import { embedBatch } from "@/lib/rag/embed";
import { upsert, size } from "@/lib/rag/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { text, source } = (await req.json()) as { text?: string; source?: string };
  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const chunks = chunkText(text, source ?? `doc-${Date.now()}`);
  const embeddings = await embedBatch(chunks.map((c) => c.text));

  const stored = chunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));
  upsert(stored);

  return NextResponse.json({
    chunksAdded: stored.length,
    totalChunks: size(),
  });
}
