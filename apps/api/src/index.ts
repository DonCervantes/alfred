import "./lib/cf-fetch-patch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { checkRateLimit, securityHeaders } from "./lib/security";
import { authRoutes } from "./routes/auth";
import { credentialsRoutes } from "./routes/credentials";
import { didRoutes } from "./routes/did";
import { vaultRoutes } from "./routes/vault";
import { verifyRoutes } from "./routes/verify";
import { feesRoutes } from "./routes/fees";
import { orgRoutes } from "./routes/org";

type Bindings = {
  STELLAR_NETWORK: string;
  STELLAR_DID_REGISTRY?: string;
  STELLAR_VC_VAULT_FACTORY?: string;
  STELLAR_USDC_SAC?: string;
  POLLAR_SECRET_KEY?: string;
  SESSION_SECRET?: string;
  CREDENTIAL_ENCRYPTION_KEY?: string;
  CREDENTIAL_ENCRYPTION_KEY_PREV?: string;
  DB?: D1Database;
  VC_BLOBS?: R2Bucket;
};

const POLLAR_FUND_URL = "https://server.api.pollar.xyz/v1/wallets/fund";
const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  const path = new URL(c.req.url).pathname;
  if (path.startsWith("/api/")) {
    const rl = await checkRateLimit(c.req.raw, path, c.env.DB);
    c.header("X-RateLimit-Remaining", String(rl.remaining));
    c.header("X-RateLimit-Reset", String(Math.ceil(rl.resetAt / 1000)));
    if (!rl.ok) {
      return c.json({ ok: false, code: "RATE_LIMITED" }, 429);
    }
  }
  await next();
  for (const [k, v] of Object.entries(securityHeaders())) {
    c.header(k, v);
  }
});

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "";
      const allowed = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];
      if (allowed.includes(origin)) return origin;
      if (
        origin.endsWith(".pages.dev") &&
        (origin.includes("alfred-web") || origin.includes("alfred"))
      ) {
        return origin;
      }
      return "";
    },
    credentials: true,
  }),
);

app.get("/", (c) =>
  c.json({
    name: "alfred-api",
    status: "ok",
    network: c.env.STELLAR_NETWORK ?? "testnet",
  }),
);

app.get("/api/health", async (c) => {
  let dbOk: boolean | null = null;
  if (c.env.DB) {
    try {
      await c.env.DB.prepare("SELECT 1").first();
      dbOk = true;
    } catch {
      dbOk = false;
    }
  }

  const check = c.req.query("account")?.trim();
  let account: {
    address: string;
    rpc: "ok" | "missing" | "error";
    horizonBalance: number | null;
    detail?: string;
  } | null = null;

  if (check && /^G[A-Z0-9]{55}$/.test(check)) {
    let horizonBalance: number | null = null;
    try {
      const hr = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${check}`,
      );
      if (hr.ok) {
        const body = (await hr.json()) as {
          balances?: { asset_type?: string; balance?: string }[];
        };
        const native = body.balances?.find((b) => b.asset_type === "native");
        horizonBalance =
          native?.balance != null ? Number.parseFloat(native.balance) : 0;
      } else if (hr.status === 404) {
        horizonBalance = null;
      }
    } catch {
      horizonBalance = null;
    }

    let rpc: "ok" | "missing" | "error" = "error";
    let detail: string | undefined;
    try {
      const { rpc: SorobanRpc } = await import("@stellar/stellar-sdk");
      const server = new SorobanRpc.Server(
        "https://soroban-testnet.stellar.org",
      );
      await server.getAccount(check);
      rpc = "ok";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      detail = message.slice(0, 300);
      rpc = message.includes("not found") || message.includes("404")
        ? "missing"
        : "error";
    }

    account = { address: check, rpc, horizonBalance, detail };
  }

  return c.json({
    ok: true,
    service: "alfred-api",
    network: c.env.STELLAR_NETWORK ?? "testnet",
    didRegistry: c.env.STELLAR_DID_REGISTRY ?? null,
    vaultFactory: c.env.STELLAR_VC_VAULT_FACTORY ?? null,
    db: dbOk,
    account,
  });
});

app.route("/api/auth", authRoutes);
app.route("/api/did", didRoutes);
app.route("/api/vault", vaultRoutes);
app.route("/api/credentials", credentialsRoutes);
app.route("/api/verify", verifyRoutes);
app.route("/api/fees", feesRoutes);
app.route("/api/org", orgRoutes);

async function nativeXlmBalance(address: string): Promise<number | null> {
  try {
    const res = await fetch(`${HORIZON_TESTNET}/accounts/${address}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const body = (await res.json()) as {
      balances?: { asset_type?: string; balance?: string }[];
    };
    const native = body.balances?.find((b) => b.asset_type === "native");
    return native?.balance != null ? Number.parseFloat(native.balance) : 0;
  } catch {
    return null;
  }
}

/** Testnet only: ensure classic account has spendable XLM (Pollar can leave 0). */
async function ensureTestnetFunded(address: string): Promise<{
  ok: boolean;
  balance: number | null;
  via: "friendbot" | "horizon" | null;
  detail?: string;
}> {
  let balance = await nativeXlmBalance(address);
  if (balance != null && balance >= 1) {
    return { ok: true, balance, via: "horizon" };
  }

  try {
    const fb = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(address)}`);
    if (!fb.ok) {
      const text = await fb.text().catch(() => "");
      return {
        ok: false,
        balance,
        via: null,
        detail: text.slice(0, 200) || `friendbot ${fb.status}`,
      };
    }
  } catch (err) {
    return {
      ok: false,
      balance,
      via: null,
      detail: err instanceof Error ? err.message : "friendbot failed",
    };
  }

  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 800));
    balance = await nativeXlmBalance(address);
    if (balance != null && balance >= 1) {
      return { ok: true, balance, via: "friendbot" };
    }
  }
  return { ok: false, balance, via: "friendbot", detail: "balance still low" };
}

/**
 * Dogfood activation — Pollar fund + Friendbot fallback on testnet.
 * Pollar can mark a wallet "funded" while leaving 0 spendable XLM.
 */
app.post("/api/activate", async (c) => {
  const secret = c.env.POLLAR_SECRET_KEY;
  if (!secret) {
    return c.json(
      { ok: false, code: "MISSING_POLLAR_SECRET", success: false },
      500,
    );
  }

  let body: { publicKey?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, code: "INVALID_JSON", success: false }, 400);
  }

  const publicKey = body.publicKey?.trim();
  if (!publicKey || !/^G[A-Z0-9]{55}$/.test(publicKey)) {
    return c.json(
      { ok: false, code: "INVALID_PUBLIC_KEY", success: false },
      400,
    );
  }

  let pollarCode: string | undefined;
  let pollarOk = false;
  let alreadyFunded = false;

  try {
    const response = await fetch(POLLAR_FUND_URL, {
      method: "POST",
      headers: {
        "x-pollar-api-key": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicKey }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      code?: string;
    };
    pollarCode = payload.code;
    if (response.status === 409 || payload.code === "WALLET_ALREADY_FUNDED") {
      pollarOk = true;
      alreadyFunded = true;
    } else if (response.ok) {
      pollarOk = true;
    } else {
      pollarCode = payload.code ?? "FUND_FAILED";
    }
  } catch (err) {
    pollarCode = err instanceof Error ? err.message : "POLLAR_UNREACHABLE";
  }

  const network = c.env.STELLAR_NETWORK ?? "testnet";
  if (network === "testnet") {
    const funded = await ensureTestnetFunded(publicKey);
    if (!funded.ok) {
      return c.json(
        {
          ok: false,
          activated: false,
          code: pollarOk ? "NO_SPENDABLE_XLM" : pollarCode ?? "FUND_FAILED",
          detail: funded.detail,
          balance: funded.balance,
          success: false,
        },
        502,
      );
    }
    return c.json({
      ok: true,
      activated: true,
      alreadyFunded,
      balance: funded.balance,
      fundedVia: funded.via,
      code:
        funded.via === "friendbot"
          ? "FRIENDBOT_FUNDED"
          : pollarCode ?? "SERVER_WALLET_FUNDED",
    });
  }

  if (!pollarOk) {
    return c.json(
      {
        ok: false,
        activated: false,
        code: pollarCode ?? "FUND_FAILED",
        success: false,
      },
      502,
    );
  }

  return c.json({
    ok: true,
    activated: true,
    alreadyFunded,
    code: pollarCode ?? "SERVER_WALLET_FUNDED",
  });
});

export default app;
