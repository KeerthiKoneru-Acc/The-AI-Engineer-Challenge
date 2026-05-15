# Socratic Tutor (Next.js)

This is the web UI for the FastAPI tutor in `/api`. It streams replies with the Fetch API (`ReadableStream`), renders Markdown + syntax-highlighted code, and matches the visual system in `.cursor/rules/frontend-rule.mdc`.

## Prerequisites

- Node.js 20+ (LTS recommended)
- Backend running with `OPENAI_API_KEY` set (see `/api/README.md`)

## Install and run locally

From the **repository root**:

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local` if your API is not at `http://127.0.0.1:8000`.

In one terminal, start the API (from repo root):

```bash
uv sync
export OPENAI_API_KEY=sk-your-key
uv run uvicorn api.index:app --reload
```

In another, start Next.js:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying on Vercel

Create a Vercel project with **root directory** set to `frontend`. Add an environment variable `NEXT_PUBLIC_API_BASE_URL` pointing at your deployed FastAPI origin (including scheme, no trailing slash).

The repo’s root `vercel.json` currently routes the whole project to the Python API; that layout is for the API-only template. Deploy this Next app as its own Vercel project or adjust your deployment config accordingly.
