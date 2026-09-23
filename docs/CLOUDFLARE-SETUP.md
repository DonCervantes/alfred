# ALFRED — Cloudflare Setup (ALF-004 / ALF-011)

**Status:** D1 `alfred-db` created · schema applied · Worker `alfred` exists in account  
**Pending:** enable R2 (dashboard) · fix Git deploy commands · put secrets · Pages for web

---

## What ALFRED needs in Cloudflare (plain language)

Think of three pieces:

| Piece | What it is | Why |
|-------|------------|-----|
| **Worker (`alfred`)** | The API in the cloud | Login session, activate wallet, later DID/vault endpoints |
| **D1 (`alfred-db`)** | A small SQL database | Users, credential metadata, share links |
| **Pages (`alfred-web`)** | The website | The React UI people open in the browser |
| **R2** (later) | File storage | Encrypted credential blobs (optional until issue flow) |

The dashboard form you saw wires **GitHub → Worker**. That is only the API. The pretty UI is a separate Pages project.

---

## Done via MCP (already)

- Authenticated Cloudflare MCP
- Created D1: **`alfred-db`** (`18211217-bbe1-42e3-aaa2-6bdbc110e74e`)
- Applied tables: `users`, `credentials_meta`, `presentation_links`
- Updated `apps/api/wrangler.toml` (`name = "alfred"` + real `database_id`)
- R2 create blocked until you enable R2 in the dashboard (free tier is fine)

---

## Your remaining clicks (minimal)

### A) Finish the Worker deploy form (or cancel and redeploy)

If that “Set up your application” screen is still open:

| Field | Value |
|--------|--------|
| Project name | `alfred` |
| Build command | `pnpm install` |
| Deploy command | `pnpm --filter @alfred/api run deploy` |

Then **Deploy**. If it already failed, open the Worker → **Settings / Builds** and fix those commands, then **Retry**.

### B) Enable R2 (1 minute)

Dashboard → **R2** → enable / purchase free plan. Tell me when it’s on and I’ll create the bucket via MCP.

### C) Secrets (after Worker is live)

```powershell
cd C:\Users\cruzc\Projects\alfred\apps\api
pnpm exec wrangler secret put POLLAR_SECRET_KEY
pnpm exec wrangler secret put SESSION_SECRET
```

### D) Web UI (Pages) — later

We do this after the API URL works: create Pages project `alfred-web` pointing at `apps/web`.

---

## Check health

When deploy succeeds, open:

`https://alfred.<tu-cuenta>.workers.dev/api/health`

You should see `"ok": true` and `"db": true`.
