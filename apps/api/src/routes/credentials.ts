/** Credential issue / list / revoke (ALF-034). */

import { canonicalize, type CredentialPayload } from "@alfred/shared";
import { Hono } from "hono";
import { isSession, requireSession } from "../lib/auth";
import { getEncryptedBlob, putEncryptedBlob } from "../lib/blobs";
import {
  decryptAesGcm,
  encryptAesGcm,
  sha256Bytes,
  sha256Hex,
} from "../lib/crypto";
import {
  getCredentialByVcId,
  insertCredentialPending,
  listCredentialsForHolder,
  listCredentialsForIssuer,
  markCredentialRevoked,
  markCredentialValid,
  createPresentationLink,
} from "../lib/credentials-db";
import {
  buildVaultIssueXdr,
  buildVaultRevokeXdr,
  bytesToHex,
  hexToBytes,
  randomBytes,
  u8ToBuffer,
} from "../lib/soroban";
import { getUserById, getUserByStellarAddress } from "../lib/users";

type Bindings = {
  SESSION_SECRET?: string;
  CREDENTIAL_ENCRYPTION_KEY?: string;
  STELLAR_NETWORK?: string;
  DB?: D1Database;
  VC_BLOBS?: R2Bucket;
};

const G_ADDR = /^G[A-Z0-9]{55}$/;
const VC_HEX = /^[0-9a-fA-F]{64}$/;

export const credentialsRoutes = new Hono<{ Bindings: Bindings }>();

function metaPublic(row: {
  vc_id: string;
  type: string | null;
  content_hash: string;
  status: string;
  network: string;
  created_at: string;
  updated_at: string;
  holder_user_id: string;
  issuer_user_id: string | null;
}) {
  return {
    vcId: row.vc_id,
    type: row.type,
    contentHash: row.content_hash,
    status: row.status,
    network: row.network,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    holderUserId: row.holder_user_id,
    issuerUserId: row.issuer_user_id,
  };
}

credentialsRoutes.get("/", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const db = c.env.DB!;
  const role = c.req.query("role") === "issuer" ? "issuer" : "holder";
  const rows =
    role === "issuer"
      ? await listCredentialsForIssuer(db, session.uid)
      : await listCredentialsForHolder(db, session.uid);
  return c.json({
    ok: true,
    credentials: rows.map(metaPublic),
  });
});

credentialsRoutes.get("/:vcId", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const vcId = c.req.param("vcId");
  if (!VC_HEX.test(vcId)) {
    return c.json({ ok: false, code: "INVALID_VC_ID" }, 400);
  }

  const row = await getCredentialByVcId(c.env.DB!, vcId.toLowerCase());
  if (!row) return c.json({ ok: false, code: "NOT_FOUND" }, 404);

  const allowed =
    row.holder_user_id === session.uid || row.issuer_user_id === session.uid;
  if (!allowed) return c.json({ ok: false, code: "FORBIDDEN" }, 403);

  let claims: unknown = null;
  const key = c.env.CREDENTIAL_ENCRYPTION_KEY;
  if (key && row.r2_key && c.req.query("includeClaims") === "1") {
    try {
      const blob = await getEncryptedBlob(
        { VC_BLOBS: c.env.VC_BLOBS, DB: c.env.DB! },
        row.r2_key,
      );
      if (blob) {
        const json = await decryptAesGcm(blob, key);
        claims = JSON.parse(json) as unknown;
      }
    } catch {
      claims = null;
    }
  }

  return c.json({ ok: true, credential: metaPublic(row), claims });
});

credentialsRoutes.post("/prepare-issue", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;

  const encKey = c.env.CREDENTIAL_ENCRYPTION_KEY;
  const db = c.env.DB;
  if (!encKey || !db) {
    return c.json({ ok: false, code: "SERVER_MISCONFIGURED" }, 500);
  }

  let body: {
    holderAddress?: string;
    type?: string;
    claims?: Record<string, unknown>;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const holderAddress = body.holderAddress?.trim();
  const type = (body.type ?? "AlfredCredential").trim().slice(0, 64);
  const claims = body.claims && typeof body.claims === "object" ? body.claims : {};

  if (!holderAddress || !G_ADDR.test(holderAddress)) {
    return c.json({ ok: false, code: "INVALID_HOLDER" }, 400);
  }

  const holder = await getUserByStellarAddress(db, holderAddress);
  if (!holder?.vault_address) {
    return c.json({ ok: false, code: "HOLDER_NO_VAULT" }, 400);
  }

  const network = c.env.STELLAR_NETWORK ?? "testnet";
  const vcId = randomBytes(32);
  const vcIdHex = bytesToHex(vcId);

  const payload: CredentialPayload = {
    type,
    claims,
    issuedAt: new Date().toISOString(),
    holderAddress,
    issuerAddress: session.addr,
  };
  const canonical = canonicalize(payload);
  const contentHashU8 = await sha256Bytes(canonical);
  const contentHashHex = await sha256Hex(canonical);
  const contentHash = u8ToBuffer(contentHashU8);

  const r2Key = `vc/${network}/${holder.id}/${vcIdHex}.enc`;
  const ciphertext = await encryptAesGcm(canonical, encKey);
  await putEncryptedBlob(
    { VC_BLOBS: c.env.VC_BLOBS, DB: db },
    r2Key,
    ciphertext,
  );

  await insertCredentialPending(db, {
    vcIdHex,
    holderUserId: holder.id,
    issuerUserId: session.uid,
    type,
    contentHashHex,
    r2Key,
    network,
  });

  try {
    const built = await buildVaultIssueXdr({
      vaultId: holder.vault_address,
      issuer: session.addr,
      vcId,
      contentHash,
    });
    return c.json({
      ok: true,
      unsignedXdr: built.unsignedXdr,
      vcId: vcIdHex,
      contentHash: contentHashHex,
      vaultAddress: holder.vault_address,
      r2Key,
      type,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "prepare failed";
    return c.json({ ok: false, code: "PREPARE_FAILED", detail: message }, 500);
  }
});

credentialsRoutes.post("/confirm", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;

  let body: { vcId?: string; txHash?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const vcId = body.vcId?.trim().toLowerCase();
  if (!vcId || !VC_HEX.test(vcId)) {
    return c.json({ ok: false, code: "INVALID_VC_ID" }, 400);
  }

  const row = await getCredentialByVcId(c.env.DB!, vcId);
  if (!row) return c.json({ ok: false, code: "NOT_FOUND" }, 404);
  if (
    row.issuer_user_id !== session.uid &&
    row.holder_user_id !== session.uid
  ) {
    return c.json({ ok: false, code: "FORBIDDEN" }, 403);
  }

  await markCredentialValid(c.env.DB!, vcId);
  return c.json({ ok: true, vcId, txHash: body.txHash ?? null, status: "valid" });
});

credentialsRoutes.post("/:vcId/prepare-revoke", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;

  const vcId = c.req.param("vcId").toLowerCase();
  if (!VC_HEX.test(vcId)) {
    return c.json({ ok: false, code: "INVALID_VC_ID" }, 400);
  }

  const row = await getCredentialByVcId(c.env.DB!, vcId);
  if (!row) return c.json({ ok: false, code: "NOT_FOUND" }, 404);

  const allowed =
    row.holder_user_id === session.uid || row.issuer_user_id === session.uid;
  if (!allowed) return c.json({ ok: false, code: "FORBIDDEN" }, 403);

  const holder = await getUserById(c.env.DB!, row.holder_user_id);
  if (!holder?.vault_address) {
    return c.json({ ok: false, code: "HOLDER_NO_VAULT" }, 400);
  }

  try {
    const built = await buildVaultRevokeXdr({
      vaultId: holder.vault_address,
      caller: session.addr,
      vcId: hexToBytes(vcId),
    });
    return c.json({
      ok: true,
      unsignedXdr: built.unsignedXdr,
      vcId,
      vaultAddress: holder.vault_address,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "prepare failed";
    return c.json({ ok: false, code: "PREPARE_FAILED", detail: message }, 500);
  }
});

credentialsRoutes.post("/:vcId/confirm-revoke", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;

  const vcId = c.req.param("vcId").toLowerCase();
  if (!VC_HEX.test(vcId)) {
    return c.json({ ok: false, code: "INVALID_VC_ID" }, 400);
  }

  const row = await getCredentialByVcId(c.env.DB!, vcId);
  if (!row) return c.json({ ok: false, code: "NOT_FOUND" }, 404);
  if (
    row.holder_user_id !== session.uid &&
    row.issuer_user_id !== session.uid
  ) {
    return c.json({ ok: false, code: "FORBIDDEN" }, 403);
  }

  let body: { txHash?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // optional body
  }

  await markCredentialRevoked(c.env.DB!, vcId);
  return c.json({
    ok: true,
    vcId,
    status: "revoked",
    txHash: body.txHash ?? null,
  });
});

/** ALF-035: create a short-lived presentation link for a VC you hold. */
credentialsRoutes.post("/:vcId/share", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;

  const vcId = c.req.param("vcId").toLowerCase();
  if (!VC_HEX.test(vcId)) {
    return c.json({ ok: false, code: "INVALID_VC_ID" }, 400);
  }

  const row = await getCredentialByVcId(c.env.DB!, vcId);
  if (!row) return c.json({ ok: false, code: "NOT_FOUND" }, 404);
  if (row.holder_user_id !== session.uid) {
    return c.json({ ok: false, code: "FORBIDDEN" }, 403);
  }
  if (row.status !== "valid") {
    return c.json({ ok: false, code: "NOT_VALID" }, 400);
  }

  let ttlHours = 72;
  try {
    const body = (await c.req.json()) as { ttlHours?: number };
    if (typeof body.ttlHours === "number" && body.ttlHours > 0) {
      ttlHours = Math.min(body.ttlHours, 24 * 30);
    }
  } catch {
    // default ttl
  }

  const tokenBytes = crypto.getRandomValues(new Uint8Array(24));
  const token = [...tokenBytes]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const expiresAt = new Date(Date.now() + ttlHours * 3600_000).toISOString();

  await createPresentationLink(c.env.DB!, {
    token,
    vcIdHex: vcId,
    holderUserId: session.uid,
    expiresAtIso: expiresAt,
  });

  return c.json({
    ok: true,
    token,
    expiresAt,
    path: `/v/${token}`,
  });
});
