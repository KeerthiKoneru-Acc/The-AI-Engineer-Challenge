"""
FastAPI backend for the Socratic Tutor: OpenAI chat with optional streaming.

Exposes JSON chat for simple clients and a plain-text streaming endpoint
for the Next.js frontend (Fetch + ReadableStream).
"""

from __future__ import annotations

import os
from typing import AsyncIterator, Literal, Self

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI, OpenAI
from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator

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


# Core behavior for all modes; topic, difficulty, and tutor_mode add context below.
_SOCRATIC_CORE = """You are a Socratic tutor. Your goal is to help the student discover 
answers themselves through guided questioning.

Rules:
- NEVER give the answer directly unless the user explicitly gives up
- Always respond with a probing question or a small hint
- Acknowledge what the student got right before correcting mistakes
- Adapt your language to the selected difficulty level
- If the topic is CS, use code examples in markdown code blocks
- When the user clicks "I give up", switch to a clear, direct explanation
"""


def build_system_prompt(topic: str, difficulty: str, tutor_mode: TutorMode) -> str:
    """
    Compose the system message for the Socratic tutor.

    The model always receives the core Socratic rules above, plus session context
    (subject and difficulty). ``tutor_mode`` tightens hint turns or enables full
    explanations after the learner uses the give-up control in the UI.
    """
    if topic not in TOPICS:
        topic = "General"
    if difficulty not in DIFFICULTIES:
        difficulty = "Intermediate"

    context = (
        f"\n**Session context:** Subject: **{topic}**. Difficulty: **{difficulty}** — "
        "match vocabulary, step size, and how much you scaffold to this level.\n"
        "Use Markdown when it helps (headings, lists, emphasis).\n"
    )

    if topic == "CS":
        context += (
            "The subject is **CS**: prefer short, illustrative code snippets in fenced "
            "markdown blocks (with a language tag) when a concrete example clarifies your question or hint.\n"
        )

    if tutor_mode == "explanation":
        return (
            _SOCRATIC_CORE
            + context
            + "\n**Active mode — direct explanation:** The user has used the give-up control. "
            "Follow the rule about giving up: switch to a **clear, direct explanation**. "
            "You may state the full answer and walk through the reasoning step by step."
        )

    if tutor_mode == "hint":
        return (
            _SOCRATIC_CORE
            + context
            + "\n**This turn — hint request:** The user asked for a hint. Give only a **small** nudge "
            "(one probing question or one tiny step). Do **not** state the complete solution or final answer."
        )

    return (
        _SOCRATIC_CORE
        + context
        + "\n**Default mode:** Follow all rules strictly. Do not reveal the full answer or complete solution "
        "unless the user has explicitly given up."
    )


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1)


class StreamChatRequest(BaseModel):
    """
    Request body for streaming chat (``POST /api/chat/stream`` or ``POST /chat/stream``).

    Send either ``messages`` (full history) or a single ``message`` for one user turn.
    ``mode`` is accepted as an alias for ``tutor_mode`` (e.g. ``socratic``, ``hint``, ``explanation``).
    """

    model_config = ConfigDict(populate_by_name=True)

    topic: str = "Math"
    difficulty: str = "Intermediate"
    tutor_mode: TutorMode = Field(
        default="socratic",
        validation_alias=AliasChoices("tutor_mode", "mode"),
    )
    messages: list[ChatMessage] | None = None
    message: str | None = None

    @model_validator(mode="after")
    def _messages_from_single_turn(self) -> Self:
        if self.messages:
            if len(self.messages) < 1:
                raise ValueError("messages must be a non-empty list when provided")
            return self
        if self.message is not None and self.message.strip():
            self.messages = [ChatMessage(role="user", content=self.message.strip())]
            return self
        raise ValueError("Provide either messages (non-empty) or message")


class ChatRequest(BaseModel):
    message: str


def _openai_messages_from_request(body: StreamChatRequest) -> list[dict[str, str]]:
    msgs = body.messages
    assert msgs is not None
    system = build_system_prompt(body.topic, body.difficulty, body.tutor_mode)
    out: list[dict[str, str]] = [{"role": "system", "content": system}]
    for m in msgs:
        out.append({"role": m.role, "content": m.content})
    return out


def _stream_chat_response(body: StreamChatRequest) -> StreamingResponse:
    """Shared streaming handler for both ``/api/chat/stream`` and ``/chat/stream``."""
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
            yield f"\n\n[Stream error: {e!s}]"

    return StreamingResponse(
        token_iter(),
        media_type="text/plain; charset=utf-8",
    )


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat")
@app.post("/chat")
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
@app.post("/chat/stream")
def chat_stream(body: StreamChatRequest):
    """
    Stream assistant tokens as **plain UTF-8 text** (not SSE).

    Registered at **both** ``/api/chat/stream`` and ``/chat/stream`` so gateways that
    strip the ``/api`` prefix (common in some serverless setups) still route correctly.

    The frontend reads ``response.body`` via ``ReadableStream`` and appends chunks.
    """
    return _stream_chat_response(body)
