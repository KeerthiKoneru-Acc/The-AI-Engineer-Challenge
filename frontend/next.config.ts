import type { NextConfig } from "next";

/**
 * Where to send same-origin `/api/*` requests during `next dev` (proxy to uvicorn).
 * Override if FastAPI listens elsewhere, e.g. `FASTAPI_DEV_ORIGIN=http://localhost:9000`
 */
const fastapiDevOrigin =
  process.env.FASTAPI_DEV_ORIGIN?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  /** Strict mode helps catch hydration issues with markdown / highlighter. */
  reactStrictMode: true,
  /**
   * Dev-only reverse proxy: the UI can use relative `/api/...` (no NEXT_PUBLIC_*)
   * and still reach FastAPI on port 8000. In production, set `NEXT_PUBLIC_API_BASE_URL`
   * or configure your host’s rewrites to the API.
   */
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${fastapiDevOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
