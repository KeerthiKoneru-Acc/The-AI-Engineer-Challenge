"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageBubble } from "@/components/MessageBubble";
import { Sidebar } from "@/components/Sidebar";
import { StreamingBubble } from "@/components/StreamingBubble";
import { getApiBaseUrl } from "@/lib/api";
import { streamChatResponse } from "@/lib/streamChat";
import type { ChatMessage, Difficulty, Topic, TutorMode } from "@/lib/types";

const HINT_USER_LINE =
  "Give me a hint 💡—just a nudge forward, not the full answer.";
const EXPLAIN_USER_LINE =
  "I give up — just tell me 🏳️ Please explain clearly with the full reasoning and answer.";

export function ChatApp() {
  const [topic, setTopic] = useState<Topic>("Math");
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, streaming, scrollToBottom]);

  const runStream = useCallback(
    async (nextMessages: ChatMessage[], mode: TutorMode) => {
      setError(null);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);
      setStreamingText("");

      const apiBase = getApiBaseUrl();
      let accumulated = "";

      try {
        await streamChatResponse(
          apiBase,
          {
            topic,
            difficulty,
            tutor_mode: mode,
            messages: nextMessages,
          },
          (chunk) => {
            accumulated += chunk;
            setStreamingText(accumulated);
          },
          controller.signal,
        );

        if (accumulated.trim().length > 0) {
          setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
        }
        setStreamingText("");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError((e as Error).message || "Something went wrong.");
        setStreamingText("");
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [topic, difficulty],
  );

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || streaming) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const next = [...messages, userMessage];
    setMessages(next);
    setDraft("");
    await runStream(next, "socratic");
  };

  const handleHint = async () => {
    if (streaming || messages.length === 0) return;
    const userMessage: ChatMessage = { role: "user", content: HINT_USER_LINE };
    const next = [...messages, userMessage];
    setMessages(next);
    await runStream(next, "hint");
  };

  const handleGiveUp = async () => {
    if (streaming || messages.length === 0) return;
    const userMessage: ChatMessage = { role: "user", content: EXPLAIN_USER_LINE };
    const next = [...messages, userMessage];
    setMessages(next);
    await runStream(next, "explanation");
  };

  const busy = streaming;

  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <Sidebar
        topic={topic}
        difficulty={difficulty}
        onTopicChange={setTopic}
        onDifficultyChange={setDifficulty}
      />

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-chat">
            {messages.length === 0 && !streamingText && !streaming ? (
              <p className="mt-8 text-center text-lg text-muted">
                What would you like to explore today?
              </p>
            ) : null}

            {messages.map((m, i) => (
              <MessageBubble key={`${i}-${m.role}-${m.content.slice(0, 24)}`} message={m} />
            ))}

            {(streaming || streamingText.length > 0) && (
              <StreamingBubble text={streamingText} streaming={streaming} />
            )}

            {error ? (
              <p className="rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <div ref={endRef} />
          </div>
        </div>

        <footer className="border-t border-border bg-canvas/95 px-4 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-chat flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleHint}
                disabled={busy || messages.length === 0}
                className="rounded-control border border-hint/50 bg-hint/10 px-4 py-2 text-sm font-medium text-hint transition hover:bg-hint/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Give me a hint 💡
              </button>
              <button
                type="button"
                onClick={handleGiveUp}
                disabled={busy || messages.length === 0}
                className="rounded-control border border-danger/50 bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                I give up — just tell me 🏳️
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="sr-only" htmlFor="chat-input">
                Message to tutor
              </label>
              <textarea
                id="chat-input"
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={busy}
                placeholder="Ask a question or describe where you're stuck…"
                className="min-h-[3rem] flex-1 resize-y rounded-control border border-border bg-surface px-3 py-2 text-[15px] text-ink placeholder:text-muted outline-none ring-accent/0 transition focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={busy || !draft.trim()}
                className="h-11 shrink-0 rounded-control bg-accent px-5 text-sm font-semibold text-ink shadow-soft transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-muted">
              Runs against <code className="font-mono text-hint">{getApiBaseUrl()}</code> — set{" "}
              <code className="font-mono text-hint">NEXT_PUBLIC_API_BASE_URL</code> to change it.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
