/** Credential issue / list / revoke (ALF-034) + templates (ALF-060). */

import {
  applyTemplateClaims,
  canonicalize,
  CREDENTIAL_TEMPLATES,
  getDefaultTemplate,
  getTemplateById,
  type CredentialPayload,
} from "@alfred/shared";
import { Hono } from "hono";
import { isSession, requireSession } from "../lib/auth";
import { getEncryptedBlob, putEncryptedBlob } from "../lib/blobs";
import {
  decryptAesGcmWithFallback,
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
  insertAuditEvent,
  listAuditEvents,
} from "../lib/credentials-db";
import {
  buildCollectIssueFeeXdr,
  buildVaultIssueXdr,
  buildVaultRevokeXdr,
  bytesToHex,
  formatTokenAmount,
  getFactoryFee,
  hexToBytes,
  randomBytes,
  u8ToBuffer,
} from "../lib/soroban";
import { getUserById, getUserByStellarAddress } from "../lib/users";
import { canIssue } from "../lib/org";

type Bindings = {
  SESSION_SECRET?: string;
  CREDENTIAL_ENCRYPTION_KEY?: string;
  CREDENTIAL_ENCRYPTION_KEY_PREV?: string;
  STELLAR_NETWORK?: string;
  STELLAR_VC_VAULT_FACTORY?: string;
  STELLAR_USDC_SAC?: string;
  DB?: D1Database;
  VC_BLOBS?: R2Bucket;
};

const G_ADDR = /^G[A-Z0-9]{55}$/;
const VC_HEX = /^[0-9a-fA-F]{64}$/;

export const credentialsRoutes = new Hono<{ Bindings: Bindings }>();

function metaPublic(
  row: {
    vc_id: string;
    type: string | null;
    content_hash: string;
    status: string;
    network: string;
    created_at: string;
    updated_at: string;
    holder_user_id: string;
    issuer_user_id: string | null;
    revoke_reason?: string | null;
  },
  extra?: { holderAddress?: string | null },
) {
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
    revokeReason: row.revoke_reason ?? null,
    ...(extra?.holderAddress !== undefined
      ? { holderAddress: extra.holderAddress }
      : {}),
  };
}

credentialsRoutes.get("/", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const db = c.env.DB!;
  const role = c.req.query("role") === "issuer" ? "issuer" : "holder";
  if (role === "issuer") {
    const rows = await listCredentialsForIssuer(db, session.uid, {
      status: c.req.query("status") ?? undefined,
      type: c.req.query("type") ?? undefined,
      q: c.req.query("q") ?? undefined,
    });
    return c.json({
      ok: true,
      role: "issuer",
      credentials: rows.map((row) =>
        metaPublic(row, { holderAddress: row.holder_address }),
      ),
    });
  }
  const rows = await listCredentialsForHolder(db, session.uid);
  return c.json({
    ok: true,
    role: "holder",
    credentials: rows.map((row) => metaPublic(row)),
  });
});

/** ALF-060 — built-in templates (must be registered before /:vcId). */
credentialsRoutes.get("/templates", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  return c.json({
    ok: true,
    templates: CREDENTIAL_TEMPLATES.map((t) => ({
      id: t.id,
      type: t.type,
      labelKey: t.labelKey,
      fields: t.fields,
    })),
  });
});

credentialsRoutes.get("/export.csv", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const db = c.env.DB!;
  const role = c.req.query("role") === "holder" ? "holder" : "issuer";
  const rows =
    role === "issuer"
      ? await listCredentialsForIssuer(db, session.uid, {
          status: c.req.query("status") ?? undefined,
          type: c.req.query("type") ?? undefined,
          q: c.req.query("q") ?? undefined,
        })
      : await listCredentialsForHolder(db, session.uid);

  const header =
    "vcId,type,status,holderAddress,createdAt,updatedAt,revokeReason,network\n";
  const lines = rows.map((r) => {
    const holder =
      "holder_address" in r
        ? ((r as { holder_address?: string | null }).holder_address ?? "")
        : "";
    return [
      r.vc_id,
      r.type ?? "",
      r.status,
      holder,
      r.created_at,
      r.updated_at,
      r.revoke_reason ?? "",
      r.network,
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",");
  });

  await insertAuditEvent(db, {
    actorUserId: session.uid,
    actorAddress: session.addr,
    action: "credential.export.csv",
    entityType: "credentials",
    detail: `role=${role};count=${rows.length}`,
  });

  return new Response(header + lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alfred-${role}.csv"`,
    },
  });
});

credentialsRoutes.get("/audit", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const limit = Number(c.req.query("limit") ?? "40");
  const events = await listAuditEvents(c.env.DB!, limit);
  return c.json({
    ok: true,
    events: events.map((e) => ({
      id: e.id,
      action: e.action,
      entityType: e.entity_type,
      entityId: e.entity_id,
      detail: e.detail,
      actorAddress: e.actor_address,
      createdAt: e.created_at,
    })),
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
        const json = await decryptAesGcmWithFallback(
          blob,
          key,
          c.env.CREDENTIAL_ENCRYPTION_KEY_PREV,
        );
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
    templateId?: string;
    claims?: Record<string, unknown>;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const holderAddress = body.holderAddress?.trim();
  if (!holderAddress || !G_ADDR.test(holderAddress)) {
    return c.json({ ok: false, code: "INVALID_HOLDER" }, 400);
  }

  const templateId = body.templateId?.trim();
  let resolved = getTemplateById(templateId);
  if (templateId && !resolved) {
    return c.json({ ok: false, code: "UNKNOWN_TEMPLATE" }, 400);
  }
  if (!resolved && body.type?.trim()) {
    resolved =
      CREDENTIAL_TEMPLATES.find((t) => t.type === body.type!.trim()) ??
      getDefaultTemplate();
  }
  if (!resolved) resolved = getDefaultTemplate();

  const applied = applyTemplateClaims(resolved, body.claims);
  if (!applied.ok) {
    return c.json(
      {
        ok: false,
        code: applied.code,
        field: applied.field,
      },
      400,
    );
  }

  const type = resolved.type;
  const claims = applied.claims;

  if (!(await canIssue(db, session.addr))) {
    return c.json({ ok: false, code: "NOT_ISSUER" }, 403);
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

    const factoryId = c.env.STELLAR_VC_VAULT_FACTORY;
    let fee: {
      amount: string;
      amountDisplay: string;
      decimals: number;
      asset: string;
      token: string | null;
      enabled: boolean;
    } = {
      amount: "0",
      amountDisplay: "0",
      decimals: 7,
      asset: "USDC",
      token: c.env.STELLAR_USDC_SAC ?? null,
      enabled: false,
    };
    let feeCollectXdr: string | null = null;

    if (factoryId) {
      try {
        const q = await getFactoryFee(factoryId);
        fee = {
          amount: q.amount.toString(),
          amountDisplay: formatTokenAmount(q.amount, 7),
          decimals: 7,
          asset: "USDC",
          token: q.token ?? c.env.STELLAR_USDC_SAC ?? null,
          enabled: q.amount > 0n,
        };
        if (q.amount > 0n) {
          const collect = await buildCollectIssueFeeXdr({
            factoryId,
            payer: session.addr,
          });
          feeCollectXdr = collect.unsignedXdr;
        }
      } catch (feeErr) {
        const message =
          feeErr instanceof Error ? feeErr.message : "fee quote failed";
        return c.json(
          { ok: false, code: "FEE_QUOTE_FAILED", detail: message },
          502,
        );
      }
    }

    return c.json({
      ok: true,
      unsignedXdr: built.unsignedXdr,
      feeCollectXdr,
      fee,
      vcId: vcIdHex,
      contentHash: contentHashHex,
      vaultAddress: holder.vault_address,
      r2Key,
      type,
      templateId: resolved.id,
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
  await insertAuditEvent(c.env.DB!, {
    actorUserId: session.uid,
    actorAddress: session.addr,
    action: "credential.issue.confirm",
    entityType: "credential",
    entityId: vcId,
  });
  return c.json({ ok: true, vcId, txHash: body.txHash ?? null, status: "valid" });
});

/** ALF-063: prepare multiple revokes (caller signs each XDR). */
credentialsRoutes.post("/prepare-batch-revoke", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;

  let body: { vcIds?: string[]; reason?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const reason = body.reason?.trim().slice(0, 280) || null;
  const vcIds = Array.from(
    new Set(
      (body.vcIds ?? [])
        .map((id) => id.trim().toLowerCase())
        .filter((id) => VC_HEX.test(id)),
    ),
  ).slice(0, 20);

  if (vcIds.length === 0) {
    return c.json({ ok: false, code: "EMPTY_BATCH" }, 400);
  }

  const items: {
    vcId: string;
    unsignedXdr?: string;
    error?: string;
  }[] = [];

  for (const vcId of vcIds) {
    const row = await getCredentialByVcId(c.env.DB!, vcId);
    if (!row) {
      items.push({ vcId, error: "NOT_FOUND" });
      continue;
    }
    if (
      row.holder_user_id !== session.uid &&
      row.issuer_user_id !== session.uid
    ) {
      items.push({ vcId, error: "FORBIDDEN" });
      continue;
    }
    if (row.status === "revoked") {
      items.push({ vcId, error: "ALREADY_REVOKED" });
      continue;
    }
    const holder = await getUserById(c.env.DB!, row.holder_user_id);
    if (!holder?.vault_address) {
      items.push({ vcId, error: "HOLDER_NO_VAULT" });
      continue;
    }
    try {
      const built = await buildVaultRevokeXdr({
        vaultId: holder.vault_address,
        caller: session.addr,
        vcId: hexToBytes(vcId),
      });
      items.push({ vcId, unsignedXdr: built.unsignedXdr });
    } catch {
      items.push({ vcId, error: "PREPARE_FAILED" });
    }
  }

  return c.json({ ok: true, reason, items });
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

  let body: { txHash?: string; reason?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // optional body
  }

  const reason = body.reason?.trim().slice(0, 280) || null;
  await markCredentialRevoked(c.env.DB!, vcId, reason);
  await insertAuditEvent(c.env.DB!, {
    actorUserId: session.uid,
    actorAddress: session.addr,
    action: "credential.revoke.confirm",
    entityType: "credential",
    entityId: vcId,
    detail: reason,
  });
  return c.json({
    ok: true,
    vcId,
    status: "revoked",
    revokeReason: reason,
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
