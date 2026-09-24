# ALFRED — Cloudflare Setup (ALF-004 / ALF-011)

**Status:** Worker + Pages live · D1 connected · secrets set

## Live URLs

| Service | URL |
|---------|-----|
| **API (Worker)** | https://alfred.cruzcervantesdanieladrianelias.workers.dev |
| Health | https://alfred.cruzcervantesdanieladrianelias.workers.dev/api/health |
| **Web (Pages)** | https://alfred-web-283.pages.dev |
| Latest Pages deploy | https://c99ce8ae.alfred-web-283.pages.dev |

---

## What exists

| Piece | Status |
|-------|--------|
| Worker `alfred` | Done |
| D1 `alfred-db` | Done |
| Secrets `POLLAR_SECRET_KEY` + `SESSION_SECRET` | Done |
| Pages `alfred-web` | Done |
| R2 | Optional later |

---

## Pollar (required for login on Pages)

In the Pollar dashboard → your app → domains / redirect URIs, add:

- `https://alfred-web-283.pages.dev`
- `https://alfred-web-283.pages.dev/` (if they require trailing slash)
- Keep `http://localhost:3000` for local dev

Also allow the API origin if Pollar has a CORS/API allowlist:

- `https://alfred.cruzcervantesdanieladrianelias.workers.dev`

---

## Redeploy

```powershell
# API
cd C:\Users\cruzc\Projects\alfred\apps\api
.\node_modules\.bin\wrangler.cmd deploy

# Web
cd C:\Users\cruzc\Projects\alfred\apps\web
node .\node_modules\typescript\bin\tsc -b
node .\node_modules\vite\bin\vite.js build
.\node_modules\.bin\wrangler.cmd pages deploy dist --project-name=alfred-web --commit-dirty=true
```
