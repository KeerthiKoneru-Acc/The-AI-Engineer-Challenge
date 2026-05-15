# OpenAI Chat API Backend

This is a FastAPI-based backend service that powers the **Socratic Tutor** Next.js app. It uses the OpenAI Chat Completions API with topic/difficulty-aware prompts and optional **streaming** for the frontend.

## Prerequisites

- [`uv`](https://github.com/astral-sh/uv) package manager (`pip install uv`)
- `uv` will provision Python 3.12 automatically for this project, so no separate interpreter installation is required
- An OpenAI API key available as the `OPENAI_API_KEY` environment variable when you run the server

## Setup

All commands below assume you are running them from the repository root.

1. Install dependencies into a local virtual environment managed by `uv`:

```bash
uv sync
```

2. (Optional) Activate the virtual environment if you prefer to run commands manually:

```bash
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

`uv` will create the `.venv` directory automatically on first sync and download Python 3.12 if it's not already available.

## Running the Server

Start the FastAPI app with the dependencies managed by `uv`:

```bash
uv run uvicorn api.index:app --reload
```

This runs the app with `uvicorn` on `http://localhost:8000` with auto-reload enabled for development. The server will automatically restart when you make changes to the code.

**Note:** Make sure the `OPENAI_API_KEY` environment variable is set in your shell before launching the server. You can set it with:

```bash
export OPENAI_API_KEY=sk-your-key-here
```

If you encounter an "Address already in use" error, you may need to kill existing processes on port 8000:

```bash
lsof -ti:8000 | xargs kill -9
```

## API Endpoints

### Streaming chat (used by the Next.js UI)

- **URL**: `/api/chat/stream`
- **Method**: POST
- **Content-Type**: `application/json`
- **Response**: `text/plain` stream of UTF-8 token chunks (read with Fetch `ReadableStream`).

**Request body:**

```json
{
  "topic": "Math",
  "difficulty": "Intermediate",
  "tutor_mode": "socratic",
  "messages": [
    { "role": "user", "content": "Why does induction need a base case?" }
  ]
}
```

- `topic`: one of `Math`, `CS`, `History`, `Science`, `Language`
- `difficulty`: `Beginner`, `Intermediate`, or `Expert`
- `tutor_mode`: `socratic` (default guiding questions), `hint` (nudge without full answer), or `explanation` (direct teaching)
- `messages`: OpenAI-style chat history (`user` / `assistant` / `system`), at least one message

The model name defaults to `gpt-4o-mini` and can be overridden with the `OPENAI_MODEL` environment variable.

### Chat endpoint (JSON, non-streaming)

- **URL**: `/api/chat`
- **Method**: POST
- **Request Body**:
```json
{
  "message": "string"
}
```
- **Response**: JSON object with the AI's reply:
```json
{
  "reply": "string"
}
```

This endpoint keeps a simple JSON contract for scripts and quick tests; it uses a fixed Math / Intermediate Socratic system prompt for that single turn.

### Root Endpoint
- **URL**: `/`
- **Method**: GET
- **Response**: `{"status": "ok"}`

### Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response**: `{"status": "ok"}`

## API Documentation

Once the server is running, you can access the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## CORS Configuration

The API is configured to accept requests from any origin (`*`). This can be modified in the `index.py` file if you need to restrict access to specific domains.

## Error Handling

The API includes basic error handling for:
- Invalid API keys
- OpenAI API errors
- General server errors

All errors will return a 500 status code with an error message.

## Testing the API

Once your server is running, you can test the chat endpoint using curl:

```bash
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

You should receive a JSON response with the AI's reply:

```json
{
  "reply": "Hi! It's good to hear from you. What's on your mind today?..."
}
```

You can also test the health check endpoint:

```bash
curl http://127.0.0.1:8000/api/health
```