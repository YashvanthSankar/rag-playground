# RAG Playground

A minimal Retrieval-Augmented Generation (RAG) demo built to learn how it works. Every file is small and commented so you can read the whole thing top to bottom.

## The pipeline

1. **Chunk** — split documents into overlapping pieces ([lib/rag/chunk.ts](lib/rag/chunk.ts))
2. **Embed** — turn each chunk into a vector via Vercel AI Gateway ([lib/rag/embed.ts](lib/rag/embed.ts))
3. **Store** — keep vectors in memory; search with cosine similarity ([lib/rag/store.ts](lib/rag/store.ts))
4. **Retrieve** — embed the question, find the top-K closest chunks ([lib/rag/retrieve.ts](lib/rag/retrieve.ts))
5. **Augment + generate** — build a grounded prompt and stream the answer ([app/api/chat/route.ts](app/api/chat/route.ts))

## Run it

```bash
cp .env.example .env.local
# fill in AI_GATEWAY_API_KEY
npm install
npm run dev
```

Open http://localhost:3000, paste some text in the "Ingest" panel, then ask questions.

## Things to try once it works

- Ingest a Wikipedia article, then ask a question it answers — and one it doesn't (watch the model say "I don't know").
- Change the chunk `size` and `overlap` in [lib/rag/chunk.ts](lib/rag/chunk.ts) and notice how retrieval quality shifts.
- Change `k` in [app/api/chat/route.ts](app/api/chat/route.ts) (the number of chunks retrieved). Too few = missed info; too many = noise.
- Swap the embedding model in [lib/rag/embed.ts](lib/rag/embed.ts) — e.g. `voyage/voyage-3` — and compare.
- Move the vector store to disk or pgvector when the in-memory version stops being enough.
