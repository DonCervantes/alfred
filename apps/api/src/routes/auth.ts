/** Auth routes: session bridge after Pollar login (ALF-031). */

import { Hono } from "hono";
import {
  clearSessionCookie,
  newSessionId,
  readCookie,
  SESSION_COOKIE,
  sessionCookieValue,
  sessionExpiryUnix,
  shouldRefreshSession,
  signSession,
  verifySession,
} from "../lib/session";
import {
  createSessionRow,
  extendSessionExpiry,
  getUserById,
  getValidSession,
  revokeSession,
  upsertUserByPollar,
} from "../lib/users";

type Bindings = {
  SESSION_SECRET?: string;
  DB?: D1Database;
};

type Variables = {
  session?: { sid: string; uid: string; addr: string };
};

const STELLAR_G = /^G[A-Z0-9]{55}$/;

export const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Create ALFRED session after client Pollar auth.
 * Body: { publicKey, pollarUserId?, locale? }
 */
authRoutes.post("/session", async (c) => {
  const secret = c.env.SESSION_SECRET;
  const db = c.env.DB;
  if (!secret) {
    return c.json({ ok: false, code: "MISSING_SESSION_SECRET" }, 500);
  }
  if (!db) {
    return c.json({ ok: false, code: "MISSING_DB" }, 500);
  }

  let body: {
    publicKey?: string;
    pollarUserId?: string;
    locale?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const publicKey = body.publicKey?.trim();
  if (!publicKey || !STELLAR_G.test(publicKey)) {
    return c.json({ ok: false, code: "INVALID_PUBLIC_KEY" }, 400);
  }

  const pollarUserId =
    body.pollarUserId?.trim() || `stellar:${publicKey}`;
  const locale =
    body.locale === "en" || body.locale === "es" ? body.locale : undefined;

  const user = await upsertUserByPollar(db, {
    pollarUserId,
    stellarAddress: publicKey,
    locale,
  });

  const sid = newSessionId();
  const exp = sessionExpiryUnix();
  const expiresAtIso = new Date(exp * 1000).toISOString().replace(/\.\d{3}Z$/, "");

  await createSessionRow(db, {
    sessionId: sid,
    userId: user.id,
    stellarAddress: publicKey,
    expiresAtIso,
  });

  const token = await signSession(secret, {
    sid,
    uid: user.id,
    addr: publicKey,
    exp,
  });

  c.header("Set-Cookie", sessionCookieValue(token));

  return c.json({
    ok: true,
    user: {
      id: user.id,
      stellarAddress: publicKey,
      did: user.did,
      vaultAddress: user.vault_address,
      locale: user.locale,
      needsOnboarding: !user.did || !user.vault_address,
    },
  });
});

authRoutes.post("/logout", async (c) => {
  const secret = c.env.SESSION_SECRET;
  const db = c.env.DB;
  const raw = readCookie(c.req.header("Cookie"), SESSION_COOKIE);

  if (secret && db && raw) {
    const payload = await verifySession(secret, raw);
    if (payload) {
      await revokeSession(db, payload.sid);
    }
  }

  c.header("Set-Cookie", clearSessionCookie());
  return c.json({ ok: true });
});

/** Lightweight me for ALF-032 stub — full profile later. */
authRoutes.get("/me", async (c) => {
  const secret = c.env.SESSION_SECRET;
  const db = c.env.DB;
  if (!secret || !db) {
    return c.json({ ok: false, code: "SERVER_MISCONFIGURED" }, 500);
  }

  const raw = readCookie(c.req.header("Cookie"), SESSION_COOKIE);
  if (!raw) {
    return c.json({ ok: false, code: "UNAUTHENTICATED" }, 401);
  }

  const payload = await verifySession(secret, raw);
  if (!payload) {
    c.header("Set-Cookie", clearSessionCookie());
    return c.json({ ok: false, code: "INVALID_SESSION" }, 401);
  }

  const row = await getValidSession(db, payload.sid);
  if (!row) {
    c.header("Set-Cookie", clearSessionCookie());
    return c.json({ ok: false, code: "SESSION_REVOKED" }, 401);
  }

  const user = await getUserById(db, payload.uid);
  if (!user) {
    return c.json({ ok: false, code: "USER_NOT_FOUND" }, 401);
  }

  // ALF-100: sliding refresh — extend cookie + D1 row when near expiry
  if (shouldRefreshSession(payload)) {
    const exp = sessionExpiryUnix();
    const expiresAtIso = new Date(exp * 1000)
      .toISOString()
      .replace(/\.\d{3}Z$/, "");
    await extendSessionExpiry(db, payload.sid, expiresAtIso);
    const token = await signSession(secret, {
      sid: payload.sid,
      uid: payload.uid,
      addr: payload.addr,
      exp,
    });
    c.header("Set-Cookie", sessionCookieValue(token));
  }

  return c.json({
    ok: true,
    user: {
      id: user.id,
      stellarAddress: user.stellar_address,
      did: user.did,
      vaultAddress: user.vault_address,
      locale: user.locale,
      needsOnboarding: !user.did || !user.vault_address,
    },
  });
});
