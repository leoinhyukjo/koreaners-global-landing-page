import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

// ─── Types ────────────────────────────────────────────────────

export interface SyncAuthResult {
  authenticated: boolean;
  error?: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ─── authenticateSync ─────────────────────────────────────────

/**
 * 3-layer authentication for internal sync API routes.
 *
 * Layer 1 — Authorization header:  `Authorization: Bearer <SYNC_SECRET>`
 * Layer 2 — Request body field:    `{ secret: "<SYNC_SECRET>", ... }`
 * Layer 3 — Same-origin:           origin/referer matches `https://<host>`
 *                                  or starts with `http://localhost`
 *
 * @param request    Incoming Next.js request
 * @param bodySecret Optional pre-parsed `secret` string from the request body.
 *                   Pass this when the caller has already consumed `request.json()`.
 */
export function authenticateSync(
  request: NextRequest,
  bodySecret?: string,
): SyncAuthResult {
  const secret = process.env.SYNC_SECRET;

  // Layer 1: Authorization: Bearer <SYNC_SECRET>
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const [scheme, token] = authHeader.split(" ");
      if (scheme === "Bearer" && token && safeEqual(token, secret)) {
        return { authenticated: true };
      }
    }
  }

  // Layer 2: Request body secret field
  if (secret && bodySecret && safeEqual(bodySecret, secret)) {
    return { authenticated: true };
  }

  // Layer 3: Same-origin (admin page calls from browser)
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (host) {
    const allowedOrigin = `https://${host}`;

    if (origin === allowedOrigin || referer?.startsWith(allowedOrigin)) {
      return { authenticated: true };
    }

    // Allow localhost for development
    if (
      origin?.startsWith("http://localhost") ||
      referer?.startsWith("http://localhost")
    ) {
      return { authenticated: true };
    }
  }

  if (!secret) {
    console.error("[sync-auth] SYNC_SECRET environment variable is not set");
  }

  return { authenticated: false, error: "Unauthorized" };
}
