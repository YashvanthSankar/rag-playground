// STEP 2 of RAG: Embedding
// ------------------------
// An "embedding" turns a piece of text into a vector (a list of numbers)
// such that texts with similar meaning end up close together in that vector
// space. We embed every chunk once at ingest time, and embed the user's
// question at query time, then compare them with cosine similarity.
//
// We use the Vercel AI Gateway. The Gateway lets us pick any provider with
// a single API key — here we use OpenAI's text-embedding-3-small via the
// "openai/text-embedding-3-small" string. Swap to "voyage/voyage-3" or
// another model by changing the string.

import { embed, embedMany } from "ai";

const MODEL = "openai/text-embedding-3-small";

export async function embedOne(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: MODEL,
    value: text,
  });
  return embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: MODEL,
    values: texts,
  });
  return embeddings;
}
