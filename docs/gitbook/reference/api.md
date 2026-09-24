# HTTP API

Base: `https://alfred.cruzcervantesdanieladrianelias.workers.dev`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/health` | — | Liveness (+ optional `?account=G…`) |
| GET | `/api/fees/quote` | — | USDC issue fee quote |
| POST | `/api/auth/session` | Pollar bridge | Sets HttpOnly session |
| GET | `/api/auth/me` | Session | Profile / DID / vault |
| POST | `/api/activate` | Session | Deferred / Friendbot fund |
| POST | `/api/did/prepare-register` | Session | Unsigned XDR |
| POST | `/api/vault/prepare-deploy` | Session | Unsigned XDR |
| POST | `/api/credentials/prepare-issue` | Session | XDR + fee fields |
| POST | `/api/credentials/confirm` | Session | Mark valid after submit |
| POST | `/api/credentials/:id/prepare-revoke` | Session | |
| POST | `/api/credentials/:id/share` | Session | Presentation token |
| GET | `/api/verify/:token` | — | Public verify |

All mutating Soroban flows: **prepare → Pollar `signAndSubmitTx` → confirm**.
