/** Vault factory deploy prepare/confirm (ALF-033). */

import { Hono } from "hono";
import { isSession, requireSession } from "../lib/auth";
import { buildVaultDeployXdr, hexToBytes, randomBytes } from "../lib/soroban";
import { updateUserVault } from "../lib/users";

type Bindings = {
  SESSION_SECRET?: string;
  DB?: D1Database;
  STELLAR_VC_VAULT_FACTORY?: string;
};

const CONTRACT_C = /^C[A-Z0-9]{55}$/;

export const vaultRoutes = new Hono<{ Bindings: Bindings }>();

vaultRoutes.post("/prepare-deploy", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;

  if (session.user.vault_address) {
    return c.json({
      ok: true,
      alreadyDeployed: true,
      vaultAddress: session.user.vault_address,
    });
  }

  const factoryId = c.env.STELLAR_VC_VAULT_FACTORY;
  if (!factoryId) {
    return c.json({ ok: false, code: "MISSING_FACTORY" }, 500);
  }

  try {
    const salt = randomBytes(32);
    const built = await buildVaultDeployXdr({
      factoryId,
      owner: session.addr,
      salt,
    });
  return c.json({
    ok: true,
    alreadyDeployed: false,
    unsignedXdr: built.unsignedXdr,
    saltHex: built.saltHex,
    predictedVault: built.predictedVault ?? null,
    factoryId,
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : "prepare failed";
    return c.json({ ok: false, code: "PREPARE_FAILED", detail: message }, 500);
  }
});

vaultRoutes.post("/confirm", async (c) => {
  const session = await requireSession(c);
  if (!isSession(session)) return session;
  const db = c.env.DB!;

  let body: { vaultAddress?: string; saltHex?: string; txHash?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const vaultAddress = body.vaultAddress?.trim();
  if (!vaultAddress || !CONTRACT_C.test(vaultAddress)) {
    return c.json({ ok: false, code: "INVALID_VAULT_ADDRESS" }, 400);
  }

  if (body.saltHex) {
    try {
      hexToBytes(body.saltHex);
    } catch {
      return c.json({ ok: false, code: "INVALID_SALT" }, 400);
    }
  }

  await updateUserVault(db, session.uid, vaultAddress);
  return c.json({
    ok: true,
    vaultAddress,
    txHash: body.txHash ?? null,
  });
});
