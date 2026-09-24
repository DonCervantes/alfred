import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRoutes } from "./routes/auth";
import { didRoutes } from "./routes/did";
import { vaultRoutes } from "./routes/vault";

type Bindings = {
  STELLAR_NETWORK: string;
  STELLAR_DID_REGISTRY?: string;
  STELLAR_VC_VAULT_FACTORY?: string;
  STELLAR_USDC_SAC?: string;
  POLLAR_SECRET_KEY?: string;
  SESSION_SECRET?: string;
  DB?: D1Database;
  VC_BLOBS?: R2Bucket;
};

const POLLAR_FUND_URL = "https://server.api.pollar.xyz/v1/wallets/fund";

const app = new Hono<{ Bindings: Bindings }>();

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
  return c.json({
    ok: true,
    service: "alfred-api",
    network: c.env.STELLAR_NETWORK ?? "testnet",
    didRegistry: c.env.STELLAR_DID_REGISTRY ?? null,
    vaultFactory: c.env.STELLAR_VC_VAULT_FACTORY ?? null,
    db: dbOk,
  });
});

app.route("/api/auth", authRoutes);
app.route("/api/did", didRoutes);
app.route("/api/vault", vaultRoutes);

function clientStatus(upstream: number): 400 | 401 | 402 | 403 | 404 | 409 | 500 | 503 {
  if (
    upstream === 400 ||
    upstream === 401 ||
    upstream === 402 ||
    upstream === 403 ||
    upstream === 404 ||
    upstream === 409 ||
    upstream === 503
  ) {
    return upstream;
  }
  return 500;
}

/**
 * Dogfood / deferred activation — simulates post-KYC funding.
 * Prefer calling after ALFRED session exists; publicKey still required.
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

  let response: Response;
  try {
    response = await fetch(POLLAR_FUND_URL, {
      method: "POST",
      headers: {
        "x-pollar-api-key": secret,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicKey }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "fetch failed";
    return c.json(
      {
        ok: false,
        activated: false,
        code: "POLLAR_UNREACHABLE",
        detail: message,
        success: false,
      },
      503,
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    code?: string;
    success?: boolean;
    content?: unknown;
  };

  if (response.status === 409 || payload.code === "WALLET_ALREADY_FUNDED") {
    return c.json({
      ok: true,
      activated: true,
      alreadyFunded: true,
      code: payload.code ?? "WALLET_ALREADY_FUNDED",
    });
  }

  if (!response.ok) {
    return c.json(
      {
        ok: false,
        activated: false,
        code: payload.code ?? "FUND_FAILED",
        upstreamStatus: response.status,
        success: false,
      },
      clientStatus(response.status),
    );
  }

  return c.json({
    ok: true,
    activated: true,
    alreadyFunded: false,
    code: payload.code ?? "SERVER_WALLET_FUNDED",
    content: payload.content,
  });
});

export default app;
