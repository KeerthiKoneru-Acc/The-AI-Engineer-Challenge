/**
 * Resolve the FastAPI base URL for browser requests.
 * Override with `NEXT_PUBLIC_API_BASE_URL` when the API is not on localhost:8000.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
  return raw.replace(/\/$/, "");
}
