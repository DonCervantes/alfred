/** Basic CSP + per-IP rate limit for Cloudflare Workers (ALF-036). */

type Bucket = { count: number; resetAt: number };

/** Isolate-local; good enough for MVP dogfood. */
const buckets = new Map<string, Bucket>();

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

export function checkRateLimit(req: Request, path: string): {
  ok: boolean;
  remaining: number;
  resetAt: number;
} {
  const limit = limitForPath(path);
  const key = `${clientIp(req)}:${path.split("/").slice(0, 4).join("/")}`;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  // Soft GC: cap map size
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
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
