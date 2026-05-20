// STEP 4 of RAG: Retrieval
// ------------------------
// Putting it together: embed the user's question, then ask the store for
// the most similar chunks. Those chunks become the "context" we hand to
// the LLM in the next step.

import { embedOne } from "./embed";
import { search, type ScoredChunk } from "./store";

export async function retrieve(question: string, k = 4): Promise<ScoredChunk[]> {
  const queryEmbedding = await embedOne(question);
  return search(queryEmbedding, k);
}
