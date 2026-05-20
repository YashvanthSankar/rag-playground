# RAG Playground

A minimal Retrieval-Augmented Generation (RAG) demo built to learn how it works. Every file is small and commented so you can read the whole thing top to bottom. **100% free, no credit card.**

## Stack

- **Next.js 15** (App Router) + Vercel AI SDK v6
- **Embeddings**: [`@huggingface/transformers`](https://www.npmjs.com/package/@huggingface/transformers) running `all-MiniLM-L6-v2` locally in the Node.js process — no API, no key, no rate limits
- **Chat**: [Groq](https://console.groq.com) free tier with Llama 3.3 70B — fastest free streaming you can get; only needs an email to sign up
- **Vector store**: in-memory JS array + hand-written cosine similarity, so you can read every line

## The pipeline

1. **Chunk** — split documents into overlapping pieces ([lib/rag/chunk.ts](lib/rag/chunk.ts))
2. **Embed** — turn each chunk into a 384-d vector locally ([lib/rag/embed.ts](lib/rag/embed.ts))
3. **Store** — keep vectors in memory; search with cosine similarity ([lib/rag/store.ts](lib/rag/store.ts))
4. **Retrieve** — embed the question, find the top-K closest chunks ([lib/rag/retrieve.ts](lib/rag/retrieve.ts))
5. **Augment + generate** — build a grounded prompt and stream the answer ([app/api/chat/route.ts](app/api/chat/route.ts))

## Run it

```bash
cp .env.example .env.local
# Paste your Groq key into .env.local — grab one at https://console.groq.com/keys
npm install
npm run dev
```

Open http://localhost:3000, paste some text in the "Ingest" panel, then ask questions.

**Heads up:** the first ingest after starting the server downloads the ~25 MB embedding model (one-time, cached under `~/.cache/huggingface`). Expect a 5–10 second pause on the very first ingest, then it's instant.

## Things to try once it works

- Ingest a Wikipedia article, then ask a question it answers — and one it doesn't (watch the model say "I don't know").
- Change the chunk `size` and `overlap` in [lib/rag/chunk.ts](lib/rag/chunk.ts) and notice how retrieval quality shifts.
- Change `k` in [app/api/chat/route.ts](app/api/chat/route.ts) (the number of chunks retrieved). Too few = missed info; too many = noise.
- Swap the embedding model in [lib/rag/embed.ts](lib/rag/embed.ts) — try `Xenova/bge-small-en-v1.5` for better retrieval at the same size.
- Move the vector store to disk or pgvector when the in-memory version stops being enough.
