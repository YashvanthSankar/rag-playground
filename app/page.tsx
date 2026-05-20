"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export default function Page() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const [doc, setDoc] = useState("");
  const [source, setSource] = useState("");
  const [ingestMsg, setIngestMsg] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);

  async function ingest() {
    if (!doc.trim()) return;
    setIngesting(true);
    setIngestMsg(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: doc, source: source || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ingest failed");
      setIngestMsg(`Added ${data.chunksAdded} chunks. Total: ${data.totalChunks}.`);
      setDoc("");
      setSource("");
    } catch (e) {
      setIngestMsg(`Error: ${(e as Error).message}`);
    } finally {
      setIngesting(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "32px 20px 80px",
        display: "grid",
        gap: 28,
      }}
    >
      <header>
        <h1 style={{ margin: 0, fontSize: 24 }}>RAG Playground</h1>
        <p style={{ margin: "6px 0 0", color: "#9aa3ad", fontSize: 14 }}>
          Paste some text below to ingest it, then ask questions on the right. The
          model only answers from your ingested documents.
        </p>
      </header>

      <section
        style={{
          border: "1px solid #232830",
          background: "#11151a",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: 15, color: "#cfd4da" }}>
          1. Ingest documents
        </h2>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="source label (optional, e.g. 'company-handbook')"
          style={inputStyle}
        />
        <textarea
          value={doc}
          onChange={(e) => setDoc(e.target.value)}
          placeholder="Paste raw text here — a wiki page, a doc, an article..."
          rows={6}
          style={{ ...inputStyle, marginTop: 8, fontFamily: "inherit", resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
          <button onClick={ingest} disabled={ingesting || !doc.trim()} style={btnStyle}>
            {ingesting ? "Ingesting..." : "Ingest"}
          </button>
          {ingestMsg && (
            <span style={{ fontSize: 13, color: "#9aa3ad" }}>{ingestMsg}</span>
          )}
        </div>
      </section>

      <section
        style={{
          border: "1px solid #232830",
          background: "#11151a",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: 15, color: "#cfd4da" }}>
          2. Ask questions
        </h2>
        <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
          {messages.length === 0 && (
            <p style={{ color: "#6f7680", fontSize: 13, margin: 0 }}>
              Ingest something first, then ask a question about it.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: m.role === "user" ? "#1a2530" : "#161b21",
                border: "1px solid #232830",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  color: "#6f7680",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                {m.role}
              </div>
              <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5 }}>
                {m.parts
                  .filter((p) => p.type === "text")
                  .map((p, i) => (
                    <span key={i}>{(p as { type: "text"; text: string }).text}</span>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the ingested documents..."
            style={inputStyle}
          />
          <button type="submit" disabled={status === "streaming" || !input.trim()} style={btnStyle}>
            {status === "streaming" ? "..." : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  background: "#0b0d10",
  border: "1px solid #232830",
  borderRadius: 6,
  color: "#e6e8eb",
  outline: "none",
  boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  background: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
  fontWeight: 500,
};
