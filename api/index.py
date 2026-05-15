"""
FastAPI backend for the Socratic Tutor: OpenAI chat with optional streaming.

Exposes JSON chat for simple clients and a plain-text streaming endpoint
for the Next.js frontend (Fetch + ReadableStream).
"""

from __future__ import annotations

import os
from typing import AsyncIterator, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI, OpenAI
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="Socratic Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_sync_client: OpenAI | None = None
_async_client: AsyncOpenAI | None = None


def _api_key() -> str | None:
    return os.getenv("OPENAI_API_KEY")


def _model() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def get_sync_client() -> OpenAI:
    global _sync_client
    if _sync_client is None:
        key = _api_key()
        if not key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
        _sync_client = OpenAI(api_key=key)
    return _sync_client


def get_async_client() -> AsyncOpenAI:
    global _async_client
    if _async_client is None:
        key = _api_key()
        if not key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
        _async_client = AsyncOpenAI(api_key=key)
    return _async_client


TOPICS = ("Math", "CS", "History", "Science", "Language")
DIFFICULTIES = ("Beginner", "Intermediate", "Expert")
TutorMode = Literal["socratic", "hint", "explanation"]


def build_system_prompt(topic: str, difficulty: str, tutor_mode: TutorMode) -> str:
    """
    Compose the system message for the Socratic tutor.

    ``tutor_mode`` adjusts behavior for normal dialogue, hint-only nudges,
    or full explanations after the learner opts in.
    """
    if topic not in TOPICS:
        topic = "General"
    if difficulty not in DIFFICULTIES:
        difficulty = "Intermediate"

    base = (
        f"You are a patient Socratic tutor helping with **{topic}**. "
        f"The learner is at **{difficulty}** level. "
        "Lead with questions and short prompts that guide their reasoning. "
        "Use Markdown when it helps (headings, lists, emphasis). "
        "For code or formulas, use fenced code blocks with a language tag. "
        "Stay calm, encouraging, and precise."
    )

    if tutor_mode == "hint":
        return (
            base
            + " **This turn:** The learner asked for a hint. Give a *small* nudge—"
            "enough to unblock their thinking—without stating the full answer or "
            "final result. Prefer a question or a single partial step."
        )
    if tutor_mode == "explanation":
        return (
            base
            + " **This turn:** The learner asked you to stop the Socratic back-and-forth "
            "and explain directly. Give a clear, complete explanation with reasoning "
            "and, where relevant, the final answer."
        )
    return (
        base
        + " **Unless** the learner explicitly asks for the answer, avoid giving away "
        "the complete solution immediately; help them discover it."
    )


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1)


class StreamChatRequest(BaseModel):
    """Request body for ``POST /api/chat/stream``."""

    topic: str = "Math"
    difficulty: str = "Intermediate"
    tutor_mode: TutorMode = "socratic"
    messages: list[ChatMessage] = Field(..., min_length=1)


class ChatRequest(BaseModel):
    message: str


def _openai_messages_from_request(body: StreamChatRequest) -> list[dict[str, str]]:
    system = build_system_prompt(body.topic, body.difficulty, body.tutor_mode)
    out: list[dict[str, str]] = [{"role": "system", "content": system}]
    for m in body.messages:
        out.append({"role": m.role, "content": m.content})
    return out


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat")
def chat(request: ChatRequest):
    """Non-streaming JSON chat (legacy / simple clients)."""
    if not _api_key():
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    try:
        client = get_sync_client()
        response = client.chat.completions.create(
            model=_model(),
            messages=[
                {
                    "role": "system",
                    "content": build_system_prompt("Math", "Intermediate", "socratic"),
                },
                {"role": "user", "content": request.message},
            ],
        )
        return {"reply": response.choices[0].message.content}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling OpenAI API: {e!s}")


@app.post("/api/chat/stream")
async def chat_stream(body: StreamChatRequest):
    """
    Stream assistant tokens as **plain UTF-8 text** (not SSE).

    The frontend reads ``response.body`` via ``ReadableStream`` and appends chunks.
    """
    if not _api_key():
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    messages = _openai_messages_from_request(body)

    async def token_iter() -> AsyncIterator[str]:
        try:
            aclient = get_async_client()
            stream = await aclient.chat.completions.create(
                model=_model(),
                messages=messages,
                stream=True,
            )
            async for chunk in stream:
                choice = chunk.choices[0]
                if choice.delta and choice.delta.content:
                    yield choice.delta.content
        except Exception as e:
            # After headers are sent we cannot switch to JSON; surface error as text.
            yield f"\n\n[Stream error: {e!s}]"

    return StreamingResponse(
        token_iter(),
        media_type="text/plain; charset=utf-8",
    )
