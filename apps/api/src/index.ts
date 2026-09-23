import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  STELLAR_NETWORK: string;
  POLLAR_SECRET_KEY?: string;
  SESSION_SECRET?: string;
};

const POLLAR_FUND_URL = "https://server.api.pollar.xyz/v1/wallets/fund";

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
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

app.get("/api/health", (c) =>
  c.json({
    ok: true,
    service: "alfred-api",
    network: c.env.STELLAR_NETWORK ?? "testnet",
  }),
);

/**
 * Dogfood / deferred activation — simulates post-KYC funding.
 * Production: call this from a KYC webhook, not a public button without auth.
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
  if (!publicKey || !publicKey.startsWith("G")) {
    return c.json(
      { ok: false, code: "INVALID_PUBLIC_KEY", success: false },
      400,
    );
  }

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
    success?: boolean;
    content?: unknown;
  };

  // Already funded is OK for dogfood idempotency
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
        success: false,
      },
      response.status as 400 | 402 | 404 | 500 | 503,
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
