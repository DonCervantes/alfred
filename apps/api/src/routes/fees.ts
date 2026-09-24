/** Factory issue-fee quote (ALF-023b). */

import { Hono } from "hono";
import { formatTokenAmount, getFactoryFee } from "../lib/soroban";

type Bindings = {
  STELLAR_VC_VAULT_FACTORY?: string;
  STELLAR_USDC_SAC?: string;
};

export const feesRoutes = new Hono<{ Bindings: Bindings }>();

feesRoutes.get("/quote", async (c) => {
  const factoryId = c.env.STELLAR_VC_VAULT_FACTORY;
  if (!factoryId) {
    return c.json({ ok: false, code: "FACTORY_NOT_CONFIGURED" }, 500);
  }

  try {
    const fee = await getFactoryFee(factoryId);
    const decimals = 7;
    return c.json({
      ok: true,
      amount: fee.amount.toString(),
      amountDisplay: formatTokenAmount(fee.amount, decimals),
      decimals,
      asset: "USDC",
      token: fee.token ?? c.env.STELLAR_USDC_SAC ?? null,
      recipient: fee.recipient,
      enabled: fee.amount > 0n,
      factoryId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "quote failed";
    return c.json({ ok: false, code: "QUOTE_FAILED", detail: message }, 502);
  }
});
