/** Require valid ALFRED session from cookie. */

import type { Context } from "hono";
import {
  clearSessionCookie,
  readCookie,
  SESSION_COOKIE,
  verifySession,
} from "./session";
import { getUserById, getValidSession, type AlfredUser } from "./users";

export type SessionCtx = {
  sid: string;
  uid: string;
  addr: string;
  user: AlfredUser;
};

type Env = {
  SESSION_SECRET?: string;
  DB?: D1Database;
};

export async function requireSession(
  c: Context<{ Bindings: Env }>,
): Promise<SessionCtx | Response> {
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

  return {
    sid: payload.sid,
    uid: payload.uid,
    addr: row.stellar_address,
    user,
  };
}

export function isSession(value: SessionCtx | Response): value is SessionCtx {
  return !(value instanceof Response);
}
