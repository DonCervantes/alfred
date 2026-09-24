/** Session cookie + HMAC token helpers (ALF-031). */

export const SESSION_COOKIE = "alfred_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export type SessionPayload = {
  sid: string;
  uid: string;
  addr: string;
  exp: number;
};

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlJson(value: unknown): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(
  secret: string,
  payload: SessionPayload,
): Promise<string> {
  const body = b64urlJson(payload);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(
  secret: string,
  token: string,
): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sigB64] = parts;
  if (!body || !sigB64) return null;

  const key = await hmacKey(secret);
  const sig = fromB64url(sigB64);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    new TextEncoder().encode(body),
  );
  if (!ok) return null;

  try {
    const pad = "=".repeat((4 - (body.length % 4)) % 4);
    const json = atob(body.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.sid || !payload.uid || !payload.addr || !payload.exp) {
      return null;
    }
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function newSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function sessionExpiryUnix(): number {
  return Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
}

export function sessionCookieValue(token: string): string {
  // Cross-site Pages → Worker requires SameSite=None; Secure
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}

export function readCookie(
  header: string | undefined,
  name: string,
): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=") || null;
  }
  return null;
}

export { SESSION_TTL_SECONDS };
