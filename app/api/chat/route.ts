// CHAT endpoint
// -------------
// The second half of RAG: retrieve, augment, generate.
//
//   1. retrieve: find the top-K chunks most similar to the user's question
//   2. augment: build a prompt that includes those chunks as context
//   3. generate: stream the LLM's answer back to the browser
//
// The "augmented prompt" is the heart of RAG. We tell the model:
//   - here is some context
//   - answer ONLY from that context
//   - if the context doesn't contain the answer, say so
// This grounding is what reduces hallucinations.

import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { retrieve } from "@/lib/rag/retrieve";

export const runtime = "nodejs";
export const maxDuration = 30;

const CHAT_MODEL = "openai/gpt-4o-mini";

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const question = lastUser
    ? lastUser.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n")
    : "";

  const hits = question ? await retrieve(question, 4) : [];

  const context = hits
    .map((h, i) => `[${i + 1}] (source: ${h.source}, score: ${h.score.toFixed(3)})\n${h.text}`)
    .join("\n\n---\n\n");

  const system = `You are a helpful assistant answering questions using only the provided context.

If the context does not contain the answer, say "I don't know based on the provided documents." Do not make up information. When you use a fact from the context, cite it like [1], [2], etc. matching the numbered chunks below.

CONTEXT:
${context || "(no documents have been ingested yet)"}`;

  const result = streamText({
    model: CHAT_MODEL,
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "x-rag-sources": JSON.stringify(
        hits.map((h, i) => ({ n: i + 1, source: h.source, score: h.score })),
      ),
    },
  });
}
