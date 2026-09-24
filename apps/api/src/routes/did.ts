/** DID register prepare/confirm (ALF-033). */

import { Hono } from "hono";
import { isSession, requireSession } from "../lib/auth";
import {
  buildDidRegisterXdr,
  hexToBytes,
  randomBytes,
} from "../lib/soroban";
import { updateUserDid } from "../lib/users";

type Bindings = {
  SESSION_SECRET?: string;
  DB?: D1Database;
  STELLAR_DID_REGISTRY?: string;
  STELLAR_NETWORK?: string;
};

export const didRoutes = new Hono<{ Bindings: Bindings }>();

didRoutes.post("/prepare-register", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;

  if (session.user.did) {
    return c.json({
      ok: true,
      alreadyRegistered: true,
      did: session.user.did,
    });
  }

  const contractId = c.env.STELLAR_DID_REGISTRY;
  if (!contractId) {
    return c.json({ ok: false, code: "MISSING_DID_REGISTRY" }, 500);
  }

  try {
    const didId = randomBytes(16);
    const built = await buildDidRegisterXdr({
      contractId,
      controller: session.addr,
      didId,
    });
    return c.json({
      ok: true,
      alreadyRegistered: false,
      unsignedXdr: built.unsignedXdr,
      didIdHex: built.didIdHex,
      did: built.did,
      contractId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "prepare failed";
    return c.json({ ok: false, code: "PREPARE_FAILED", detail: message }, 500);
  }
});

didRoutes.post("/confirm", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const db = c.env.DB!;

  let body: { did?: string; didIdHex?: string; txHash?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const did = body.did?.trim();
  if (!did || !did.startsWith("did:")) {
    return c.json({ ok: false, code: "INVALID_DID" }, 400);
  }

  // Optional: verify didIdHex length
  if (body.didIdHex && body.didIdHex.length !== 32) {
    return c.json({ ok: false, code: "INVALID_DID_ID" }, 400);
  }
  if (body.didIdHex) {
    try {
      hexToBytes(body.didIdHex);
    } catch {
      return c.json({ ok: false, code: "INVALID_DID_ID" }, 400);
    }
  }

  await updateUserDid(db, session.uid, did);
  return c.json({
    ok: true,
    did,
    txHash: body.txHash ?? null,
  });
});
