/** Public presentation verify (ALF-035). */

import { Hono } from "hono";
import { getEncryptedBlob } from "../lib/blobs";
import { decryptAesGcm } from "../lib/crypto";
import {
  getCredentialByVcId,
  getPresentationLink,
} from "../lib/credentials-db";
import { hexToBytes, verifyVcOnChain } from "../lib/soroban";
import { getUserById } from "../lib/users";

type Bindings = {
  CREDENTIAL_ENCRYPTION_KEY?: string;
  DB?: D1Database;
  VC_BLOBS?: R2Bucket;
};

export const verifyRoutes = new Hono<{ Bindings: Bindings }>();

verifyRoutes.get("/:token", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ ok: false, code: "SERVER_MISCONFIGURED" }, 500);

  const token = c.req.param("token");
  if (!token || token.length < 16) {
    return c.json({ ok: false, code: "INVALID_TOKEN" }, 400);
  }

  const link = await getPresentationLink(db, token);
  if (!link || link.revoked_at) {
    return c.json({ ok: false, code: "LINK_NOT_FOUND" }, 404);
  }
  if (link.expires_at && Date.parse(link.expires_at) < Date.now()) {
    return c.json({ ok: false, code: "LINK_EXPIRED" }, 410);
  }

  const meta = await getCredentialByVcId(db, link.vc_id);
  if (!meta) {
    return c.json({ ok: false, code: "CREDENTIAL_MISSING" }, 404);
  }

  const holder = await getUserById(db, meta.holder_user_id);
  let onChain: boolean | null = null;
  if (holder?.vault_address) {
    onChain = await verifyVcOnChain({
      vaultId: holder.vault_address,
      vcId: hexToBytes(meta.vc_id),
      contentHash: hexToBytes(meta.content_hash),
    });
  }

  let payload: unknown = null;
  const encKey = c.env.CREDENTIAL_ENCRYPTION_KEY;
  if (encKey && meta.r2_key) {
    try {
      const blob = await getEncryptedBlob(
        { VC_BLOBS: c.env.VC_BLOBS, DB: db },
        meta.r2_key,
      );
      if (blob) {
        payload = JSON.parse(await decryptAesGcm(blob, encKey)) as unknown;
      }
    } catch {
      payload = null;
    }
  }

  return c.json({
    ok: true,
    status: meta.status,
    type: meta.type,
    contentHash: meta.content_hash,
    network: meta.network,
    onChainValid: onChain,
    holderDid: holder?.did ?? null,
    holderAddress: holder?.stellar_address ?? null,
    issuedAt: meta.created_at,
    payload,
  });
});
