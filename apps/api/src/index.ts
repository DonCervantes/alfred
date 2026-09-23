import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  STELLAR_NETWORK: string;
  POLLAR_SECRET_KEY?: string;
  SESSION_SECRET?: string;
};

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

export default app;
