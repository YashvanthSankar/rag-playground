// STEP 2 of RAG: Embedding (LOCAL, via Transformers.js)
// ------------------------------------------------------
// An "embedding" turns a piece of text into a vector (a list of numbers)
// such that texts with similar meaning end up close together in that vector
// space. We embed every chunk once at ingest time, and embed the user's
// question at query time, then compare them with cosine similarity.
//
// This version runs a small ONNX embedding model IN THIS NODE PROCESS using
// @huggingface/transformers (formerly @xenova/transformers). No API key, no
// network call, no rate limits. The first call downloads ~25 MB of model
// weights and caches them under ~/.cache/huggingface; subsequent calls are
// ~10–50 ms per chunk on a CPU.
//
// Model: Xenova/all-MiniLM-L6-v2 — 384-dimensional sentence embeddings.
// Small, fast, and good enough to learn RAG with. Swap to
// "Xenova/bge-small-en-v1.5" for noticeably better retrieval at similar size.

import { pipeline } from "@huggingface/transformers";

const MODEL = "Xenova/all-MiniLM-L6-v2";

// Extractor type erased to `any` because @huggingface/transformers exports
// a giant union of every possible task type, which trips TS's union-too-large
// limit. We only ever use the feature-extraction pipeline here.
type Extractor = (
  input: string | string[],
  opts: { pooling: "mean"; normalize: boolean },
  // biome-ignore lint/suspicious/noExplicitAny: see comment above
) => Promise<any>;

// Lazy singleton — the pipeline (model + tokenizer) is heavy to construct,
// so we build it once and reuse it across requests. In dev with hot reload,
// you may see the model "load" again after an edit; that's just the cache.
let extractorPromise: Promise<Extractor> | null = null;

function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL) as unknown as Promise<Extractor>;
  }
  return extractorPromise;
}

export async function embedOne(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  // pooling: "mean" averages token embeddings into one sentence vector.
  // normalize: true returns unit vectors (so cosine sim == dot product).
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  // The pipeline returns a 2D tensor of shape [batch, dim]. .tolist() gives
  // us a plain JS array of arrays.
  return output.tolist() as number[][];
}
