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

## What this RAG has

**Pipeline**

- Fixed-size character chunking with overlap ([lib/rag/chunk.ts](lib/rag/chunk.ts))
- Local embedding generation, no API or rate limits, via Transformers.js + `all-MiniLM-L6-v2` (384-d) ([lib/rag/embed.ts](lib/rag/embed.ts))
- In-memory vector store with hand-written cosine similarity ([lib/rag/store.ts](lib/rag/store.ts))
- Top-K retrieval ([lib/rag/retrieve.ts](lib/rag/retrieve.ts))
- Grounded prompting: "answer only from context, say 'I don't know' otherwise"
- Inline citations like `[1]` `[2]` matching numbered chunks
- Streaming generation via Groq's free Llama 3.3 70B

**UX / API**

- Single-page chat UI with paste-to-ingest ([app/page.tsx](app/page.tsx))
- Multi-source ingestion with source labels
- `/api/ingest`, `/api/chat`, `/api/debug` endpoints
- `x-rag-sources` header on chat responses so you can see what was retrieved per request

**Engineering choices worth noting**

- Singleton extractor in [lib/rag/embed.ts](lib/rag/embed.ts) so the embedding model loads once, not per request
- Store pinned to `globalThis` so Next.js dev-mode module isolation doesn't split it ([lib/rag/store.ts:22-26](lib/rag/store.ts#L22-L26))
- Normalized embeddings so cosine sim = dot product (faster)
- Failures aren't counted — only successful ingests update the store

## What this RAG doesn't have

This is a deliberately minimal learning RAG. These are the things real systems add — useful to know what you'd build next.

| Missing | What it is | When you need it |
|---|---|---|
| **Persistence** | Restart the server → store is empty | Production. Day 1. |
| **Smart chunking** | Real splitters break on sentences, headings, markdown structure | Larger docs where mid-sentence splits hurt retrieval |
| **Reranking** | A second model rescores top-20 to find the *really* relevant top-4 | Quality jump on hard queries |
| **Hybrid search** | Combine vector similarity with keyword/BM25 search | Numbers, names, acronyms — vectors are weak at exact matches |
| **Query rewriting** | LLM expands "how much is it?" → "what is the price of the Pro plan?" before retrieval | Short or vague user questions |
| **Multi-turn awareness** | Retrieval ignores chat history — only embeds the latest message | Follow-up questions like "and what about Free?" |
| **Metadata filtering** | "Only search chunks where source=handbook AND date>2025" | Multi-tenant, time-sensitive data |
| **Citations with provenance** | Returns the exact source URL, page #, character range | Compliance, fact-checking |
| **Document chunk dedup** | Re-ingesting the same doc creates duplicate chunks | Anyone re-uploading docs |
| **Deletion / update** | Can't remove or replace specific docs | Document lifecycle |
| **Evaluation** | No way to measure if changes (chunk size, k, model) made retrieval *better* | Iterating with confidence |
| **Caching** | Re-embeds the same query every time | High-traffic apps |
| **Auth / per-user stores** | Everyone shares one global store | Real users |
| **PDF / DOCX / HTML parsing** | Only accepts pre-extracted text | Real-world inputs |
| **Observability** | No logs of retrievals, scores, token usage | Debugging production |
| **Rate limiting** | None | Public endpoints |

### Suggested learning order

For learning, what's here is the right size — small enough that you can read every line in 20 minutes. Once that clicks, the two upgrades with the biggest learning payoff are:

1. **Persistence** — write the store to `data/index.json` so restarts don't wipe it
2. **Smarter chunking** — switch from character windows to a recursive splitter or split on markdown headings, then see retrieval quality improve

After that, **reranking + hybrid search** is usually the biggest production-quality jump.

For the bigger picture — Basic → Production → Advanced → Agentic, with the techniques and signals that distinguish each level — see [RAG_LEVELS.md](RAG_LEVELS.md).

## Things to try once it works

- Ingest a Wikipedia article, then ask a question it answers — and one it doesn't (watch the model say "I don't know").
- Change the chunk `size` and `overlap` in [lib/rag/chunk.ts](lib/rag/chunk.ts) and notice how retrieval quality shifts.
- Change `k` in [app/api/chat/route.ts](app/api/chat/route.ts) (the number of chunks retrieved). Too few = missed info; too many = noise.
- Swap the embedding model in [lib/rag/embed.ts](lib/rag/embed.ts) — try `Xenova/bge-small-en-v1.5` for better retrieval at the same size.
- Move the vector store to disk or pgvector when the in-memory version stops being enough.
- Hit `/api/debug` to inspect the stored embeddings, or `POST /api/debug` with a query to see what would be retrieved for that question.
