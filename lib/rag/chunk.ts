// STEP 1 of RAG: Chunking
// ------------------------
// LLMs and embedding models have a context limit, and embeddings get "blurry"
// if a single chunk covers too many ideas. So we split documents into smaller
// overlapping pieces. Overlap keeps context that straddles a chunk boundary
// from being lost (e.g. a sentence cut in half).
//
// This is the simplest possible splitter: fixed-size character windows with
// a small overlap. Production systems use smarter splitters (by sentence,
// markdown heading, token count, etc.) — but the principle is identical.

export type Chunk = {
  id: string;
  text: string;
  source: string;
};

export function chunkText(
  text: string,
  source: string,
  opts: { size?: number; overlap?: number } = {},
): Chunk[] {
  const size = opts.size ?? 800;
  const overlap = opts.overlap ?? 100;

  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length === 0) return [];

  const chunks: Chunk[] = [];
  let start = 0;
  let i = 0;
  while (start < clean.length) {
    const end = Math.min(start + size, clean.length);
    chunks.push({
      id: `${source}#${i++}`,
      text: clean.slice(start, end),
      source,
    });
    if (end === clean.length) break;
    start = end - overlap;
  }
  return chunks;
}
