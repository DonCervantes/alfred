# ALFRED — Cloudflare Setup (ALF-004 / ALF-011)

**Status:** Config ready in repo · **Auth:** run `wrangler login` once on your machine

---

## 1. Login (you)

From the repo root (uses the API package’s wrangler):

```powershell
cd apps/api
pnpm exec wrangler login
pnpm exec wrangler whoami
```

A browser window opens; approve Cloudflare access. Confirm the account email appears in `whoami`.

---

## 2. Create remote resources

```powershell
cd apps/api

# D1 database
pnpm exec wrangler d1 create alfred-db

# R2 bucket (encrypted VC payloads later)
pnpm exec wrangler r2 bucket create alfred-vc-blobs
```

Copy the `database_id` printed by `d1 create` into `wrangler.toml` → `[[d1_databases]].database_id`.

Apply schema:

```powershell
# Local (Miniflare)
pnpm exec wrangler d1 migrations apply alfred-db --local

# Remote (after database_id is set)
pnpm exec wrangler d1 migrations apply alfred-db --remote
```

---

## 3. Deploy API (Worker)

```powershell
cd apps/api
pnpm exec wrangler secret put POLLAR_SECRET_KEY
pnpm exec wrangler secret put SESSION_SECRET
pnpm run deploy
```

Note the `*.workers.dev` URL. Add it to Pollar **Allowed redirect / API** origins when you wire production auth.

---

## 4. Deploy Web (Pages)

```powershell
cd apps/web
pnpm run build
pnpm exec wrangler pages project create alfred-web
pnpm exec wrangler pages deploy dist --project-name=alfred-web
```

Or connect the GitHub repo `DonCervantes/alfred` in the Cloudflare dashboard (build: `pnpm install && pnpm --filter @alfred/web build`, output `apps/web/dist`).

Set Pages env: `VITE_POLLAR_PUBLISHABLE_KEY`, `VITE_API_URL` (Worker URL).

---

## 5. Checklist

| Step | Done |
|------|------|
| `wrangler login` | ☐ |
| D1 `alfred-db` + migrations | ☐ |
| R2 `alfred-vc-blobs` | ☐ |
| Worker secrets + deploy | ☐ |
| Pages project + deploy | ☐ |
| Pollar domains updated for `*.pages.dev` / Worker | ☐ |

After this: **ALF-031** session cookies on the Worker.
