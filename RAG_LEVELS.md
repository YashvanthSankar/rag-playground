# RAG Levels — Basic → Production → Advanced → Agentic

There's no official taxonomy, but the field has settled on a rough progression. Here's how to describe the levels, what each is good for, and what separates them.

## Level 1 — Basic / Naive RAG (this repo)

**What it is:** chunk → embed → store → top-K cosine → stuff into prompt → generate.

**Capabilities:**

- Single document type (text)
- One vector store, one similarity metric
- Single-shot retrieval (one query → K chunks → answer)
- Stateless (no memory of past turns)

**Good for:**

- Learning RAG
- Internal demos
- Small, clean knowledge bases (a handbook, a product doc)
- Personal projects, hackathons

**Where it breaks:**

- Vague questions ("how does it work?")
- Multi-hop reasoning ("compare X and Y")
- Acronyms, exact numbers, IDs (vectors are fuzzy)
- Anything past ~10k chunks
- Production traffic (no persistence, no auth)

**Tech signals:** in-memory or single JSON file, no reranker, one embedding model, prompt template hand-written.

---

## Level 2 — Production RAG

The minimum that's actually deployable. This is where ~80% of "we shipped a RAG chatbot" companies sit.

**What's added on top of Level 1:**

| Capability | Why |
|---|---|
| **Persistent vector DB** (pgvector / Qdrant / Pinecone) | Survives restarts, scales past one box |
| **Smart chunking** (recursive splitter, markdown-aware, code-aware) | Stops mid-sentence splits from killing retrieval |
| **Document ingestion pipeline** (PDF, DOCX, HTML, OCR) | Real-world inputs aren't pre-cleaned markdown |
| **Metadata + filters** (`source`, `date`, `tenant_id`, `permissions`) | Multi-tenant, time-sensitive, access-controlled data |
| **Hybrid search** (vector + BM25/keyword) | Vectors miss exact matches; keyword search catches them |
| **Reranker** (Cohere Rerank, Voyage Rerank, bge-reranker) | Big quality jump — fetch top 20–50, rerank to top 4 |
| **Chunk dedup + upsert** | Re-ingesting the same doc shouldn't double chunks |
| **Source citations with URLs/page #** | Users need to verify |
| **Eval harness** (precision@K, faithfulness, answer relevance via RAGAS or trulens) | You can't improve what you can't measure |
| **Observability** (LangSmith, Langfuse, Arize) | Debug "why did it answer X?" in production |
| **Caching** (embedding cache, semantic answer cache) | Cost + latency |
| **Rate limiting, auth, per-user history** | Real users |

**Good for:**

- Internal knowledge assistants (Notion-AI-like)
- Customer support deflection bots
- Documentation Q&A
- Most "chat with your docs" SaaS

**Where it breaks:**

- Questions requiring synthesis across many docs
- Quantitative reasoning ("what's the total revenue across all FY24 reports?")
- Long, ambiguous queries that need clarification
- Tasks requiring tool use (database queries, calculations)

**Tech signals:** vector DB + S3 for raw docs, eval CI, a reranker in the path, hybrid retrieval, structured metadata schema.

---

## Level 3 — Advanced RAG

The retrieval gets *smart*. Instead of "embed query → top-K → answer," there's reasoning *around* the retrieval.

**What's added:**

| Technique | What it does |
|---|---|
| **Query rewriting / expansion** | LLM rewrites "how much?" → "what is the price of the Pro plan in 2026?" before embedding |
| **HyDE** (Hypothetical Document Embeddings) | LLM writes a *fake answer* first, embeds that, retrieves real docs similar to the fake answer. Surprisingly effective. |
| **Multi-query retrieval** | Generate 3–5 query variations, retrieve for each, merge |
| **Step-back prompting** | LLM generates a more general question first ("what plans exist?" before "what's the Pro plan India price?"), retrieves both |
| **Multi-hop retrieval** | Retrieve → reason → retrieve again with new query → answer ("compare X and Y" needs two retrievals) |
| **Self-querying retriever** | LLM extracts filters from the query ("emails from John last week" → `sender=John AND date>last_week`) |
| **Contextual chunking / contextual retrieval** (Anthropic, 2024) | Before embedding each chunk, prepend a model-generated 1-sentence summary of *what this chunk is about in the whole doc*. ~35% retrieval improvement. |
| **Sentence-window retrieval** | Embed small sentences for precision; return surrounding paragraph for context |
| **Parent-document retrieval** | Embed small chunks, return their larger parent section to the LLM |
| **Late chunking** | Embed the whole doc once, then slice the embeddings — preserves long-range context |
| **Graph RAG** (Microsoft, 2024) | Extract entities + relationships into a knowledge graph; traverse the graph for queries about connections |
| **Cross-encoder rerankers** + **LLM-as-reranker** | Stronger reranking than bi-encoders |
| **Fine-tuned embedding model** on your domain | Generic embeddings miss domain jargon (legal, medical, internal codenames) |
| **Adaptive K** | Retrieve more chunks for complex queries, fewer for simple ones |
| **Answer verification** (self-critique, citation grounding checks) | Catch hallucinations before serving |

**Good for:**

- Legal research, medical literature, financial analysis
- Code search and developer assistants
- Enterprise search across many systems
- High-stakes Q&A where wrong answers cost money

**Tech signals:** multiple retrieval strategies in the pipeline, query understanding step, eval-driven iteration on retrieval not just generation, often a fine-tuned component.

---

## Level 4 — Agentic RAG

Retrieval becomes a **tool the model decides when to use**, not a fixed step. This is the current frontier (and what most "AI agents" doing research really are under the hood).

**What's added:**

| Technique | What it does |
|---|---|
| **RAG as a tool** | Model chooses *whether* to retrieve, *what* to retrieve, *how many times* |
| **Multiple retrieval tools** | Different indexes for different content (docs vs. tickets vs. code vs. SQL) — model picks |
| **Tool use beyond retrieval** | SQL queries, web search, calculator, code execution, internal APIs |
| **ReAct / Plan-and-Execute loops** | "I need X, search for it… I need Y, search for it… now I can answer" |
| **Self-correcting RAG** (Corrective RAG / CRAG, Self-RAG) | Model evaluates retrieval quality, retries with better queries if bad |
| **Long-term memory** | Persistent user/conversation memory layered on top of doc retrieval |
| **Multi-modal RAG** | Images, tables, charts retrieved alongside text (ColPali, embed page screenshots directly) |
| **Workflow orchestration** | Durable execution (Vercel Workflow, Temporal, LangGraph) — pauses for human approval, resumes after long tasks |
| **Multi-agent retrieval** | Sub-agents specialized for different sources work in parallel; a coordinator merges |

**Good for:**

- Deep-research assistants (think Perplexity Pro, ChatGPT Deep Research)
- Autonomous customer support that takes actions
- Code agents that read repos + run tests + edit files
- Compliance / audit workflows

**Tech signals:** the LLM is doing function calling, there's a tool registry, a planner/executor loop, often a durable workflow engine, evals measure end-to-end task success not just retrieval precision.

---

## How to talk about it with companies

Use this rough language:

- **"Basic RAG"** = Level 1. Demos, prototypes.
- **"Production RAG"** = Level 2. What you ship to real users.
- **"Advanced RAG"** = Level 3. The retrieval strategies above. Often what unblocks accuracy plateaus.
- **"Agentic RAG"** or **"AI agents with retrieval"** = Level 4. Multi-step, tool-using, often long-running.

When someone says "we built RAG," ask:

1. **Do you have evals?** (No → Level 1 dressed up as 2)
2. **Reranking?** (No → still Level 2 at best)
3. **Does retrieval adapt to the query, or is it the same pipeline every time?** (Same every time → Level 2. Adapts → Level 3+)
4. **Can the model call retrieval multiple times in one answer?** (Yes → Level 4)

---

## Suggested next steps in this repo

If you want to feel each level by building it, here's the order:

1. **Persistence** (still Level 1, but unblocks everything else) — JSON file or SQLite
2. **Smarter chunking** (markdown-heading-aware) — visible quality jump
3. **Add a reranker** (Cohere has a free tier) — biggest single quality jump you'll feel → **you're now at Level 2**
4. **Add hybrid search** (combine cosine + BM25) — confirms Level 2
5. **Implement HyDE or query rewriting** → **you're at Level 3**
6. **Turn retrieval into a tool the model calls via function calling, add a SQL tool too** → **you're at Level 4**

Each one is a self-contained ~1-hour change in this codebase.
