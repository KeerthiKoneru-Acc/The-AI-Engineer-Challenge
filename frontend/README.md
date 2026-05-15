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
```

Create `frontend/.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` (or run the command below). **Restart `npm run dev` after changing env files** — Next only picks up `NEXT_PUBLIC_*` when the dev server starts.

```bash
echo 'NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000' > frontend/.env.local
```

If you omit `NEXT_PUBLIC_API_BASE_URL`, the browser calls same-origin paths like `/api/chat/stream`. During **`next dev` only**, `next.config.ts` **rewrites** those to `http://127.0.0.1:8000` (override with `FASTAPI_DEV_ORIGIN` if uvicorn uses another port). For **`next start`** or production, set `NEXT_PUBLIC_API_BASE_URL` or configure your host’s API rewrites.

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

Create a Vercel project with **root directory** set to `frontend`. You usually **do not** need `NEXT_PUBLIC_API_BASE_URL` in production if your deployment routes `/api/*` to the FastAPI backend on the same host. Set it only when the API lives on a different origin (value must include the scheme, no trailing slash).

The repo’s root `vercel.json` currently routes the whole project to the Python API; that layout is for the API-only template. Deploy this Next app as its own Vercel project or adjust your deployment config accordingly.
