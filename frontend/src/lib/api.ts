/**
 * Resolve the API base for browser requests.
 *
 * - If `NEXT_PUBLIC_API_BASE_URL` is set (trimmed), use it with no trailing slash.
 *   Use an absolute URL (e.g. `http://127.0.0.1:8000`) when the FastAPI app runs
 *   on another origin during local development.
 * - Otherwise use the same-origin relative prefix `/api` (production default).
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "/api";
}

/**
 * Build a full URL for a FastAPI route that lives under `/api/...` on the backend.
 *
 * @param routePath Path after `/api/` without a leading slash, e.g. `chat/stream`.
 */
export function getApiRequestUrl(routePath: string): string {
  const base = getApiBaseUrl();
  const path = routePath.replace(/^\/+/, "");
  if (/^https?:\/\//i.test(base)) {
    return `${base}/api/${path}`;
  }
  const prefix = base.replace(/\/$/, "");
  return `${prefix}/${path}`.replace(/\/+/g, "/");
}
