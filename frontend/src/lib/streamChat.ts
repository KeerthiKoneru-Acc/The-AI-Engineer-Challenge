import type { ChatMessage, Difficulty, Topic, TutorMode } from "@/lib/types";

export type StreamChatPayload = {
  topic: Topic;
  difficulty: Difficulty;
  tutor_mode: TutorMode;
  messages: ChatMessage[];
};

/**
 * Calls `POST /api/chat/stream` and delivers UTF-8 text chunks via `onDelta`.
 * Uses the Fetch API `ReadableStream` reader (required by frontend-rule).
 */
export async function streamChatResponse(
  apiBaseUrl: string,
  payload: StreamChatPayload,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Response has no readable body stream.");
  }

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      onDelta(decoder.decode(value, { stream: true }));
    }
  }
}
