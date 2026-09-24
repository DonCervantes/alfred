/** Basic CSP + per-IP rate limit (ALF-036 / ALF-101). */

type Bucket = { count: number; resetAt: number };

/** Isolate-local fallback when D1 is unavailable. */
const memoryBuckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const LIMITS: Record<string, number> = {
  default: 120,
  "/api/auth/session": 30,
  "/api/activate": 20,
  "/api/credentials/prepare-issue": 40,
  "/api/credentials/templates": 60,
  "/api/org": 60,
  "/api/fees/quote": 60,
  "/api/did/prepare-register": 20,
  "/api/vault/prepare-deploy": 20,
  "/api/verify": 90,
};

function clientIp(req: Request): string {
  return (
    req.headers.get("CF-Connecting-IP") ||
    req.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function limitForPath(path: string): number {
  if (path.startsWith("/api/verify/")) return LIMITS["/api/verify"];
  return LIMITS[path] ?? LIMITS.default;
}

function checkMemory(key: string, limit: number): {
  ok: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  let bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    memoryBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (memoryBuckets.size > 5_000) {
    for (const [k, b] of memoryBuckets) {
      if (b.resetAt <= now) memoryBuckets.delete(k);
    }
  }
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/**
 * Durable rate limit via D1 when available (survives isolate churn).
 * Falls back to in-memory map otherwise.
 */
export async function checkRateLimit(
  req: Request,
  path: string,
  db?: D1Database,
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const limit = limitForPath(path);
  const key = `${clientIp(req)}:${path.split("/").slice(0, 4).join("/")}`;
  const now = Date.now();

  if (!db) return checkMemory(key, limit);

  try {
    const row = await db
      .prepare(
        `SELECT count, reset_at FROM rate_limit_buckets WHERE bucket_key = ?`,
      )
      .bind(key)
      .first<{ count: number; reset_at: number }>();

    let count = 0;
    let resetAt = now + WINDOW_MS;
    if (row && row.reset_at > now) {
      count = row.count;
      resetAt = row.reset_at;
    }

    count += 1;
    await db
      .prepare(
        `INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
         VALUES (?, ?, ?)
         ON CONFLICT(bucket_key) DO UPDATE SET
           count = excluded.count,
           reset_at = excluded.reset_at`,
      )
      .bind(key, count, resetAt)
      .run();

    // opportunistic GC of expired rows (best-effort)
    if (count === 1) {
      void db
        .prepare(`DELETE FROM rate_limit_buckets WHERE reset_at <= ?`)
        .bind(now)
        .run();
    }

    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  } catch {
    return checkMemory(key, limit);
  }
}

export function securityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": [
      "default-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "form-action 'none'",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}
