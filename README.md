# ALFRED

Credenciales verificables en Stellar — con UX de producto, no de explorer.

**Credentials you can prove. / Credenciales que puedes probar.**

---

## Live demo (testnet)

| Surface | URL |
|---------|-----|
| **Web (Pages)** | https://alfred-web-283.pages.dev |
| **API (Worker)** | https://alfred.cruzcervantesdanieladrianelias.workers.dev |
| API health | https://alfred.cruzcervantesdanieladrianelias.workers.dev/api/health |

Login: Pollar (Google / social) → optional **Activar billetera** (Deferred funding).  
Setup notes: [`docs/CLOUDFLARE-SETUP.md`](docs/CLOUDFLARE-SETUP.md) · [`docs/POLLAR-SETUP.md`](docs/POLLAR-SETUP.md)  
**Dogfood (ALF-053):** [`docs/DOGFOOD.md`](docs/DOGFOOD.md)  
**Security (ALF-052):** [`docs/THREAT-MODEL.md`](docs/THREAT-MODEL.md) · [`docs/OPERATOR-RUNBOOK.md`](docs/OPERATOR-RUNBOOK.md)  
**GitBook (ALF-005):** https://odyssey-15.gitbook.io/alfred-docs/ · [`docs/gitbook/`](docs/gitbook/)

---

## Stack

| Piece | Choice |
|-------|--------|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Vite · React 19 · Tailwind v4 → Cloudflare Pages |
| API | Hono · Cloudflare Workers + D1 |
| Contracts | Rust / Soroban · Stellar CLI |
| Login | Pollar (`@pollar/react`) |
| Docs | [ALFRED Docs (GitBook)](https://odyssey-15.gitbook.io/alfred-docs/) · source [`docs/gitbook/`](docs/gitbook/) |

---

## Testnet contracts

Network: `Test SDF Network ; September 2015`  
Full table: [`docs/deployments/testnet.md`](docs/deployments/testnet.md)

| Contract | ID |
|----------|-----|
| DID registry | `CCLOO56UFL7623QRZSV5YZQLAPQ65RMMEACT6CLKF4HWNFW3QTLF2M3Q` |
| VC vault factory | `CAMHSVEVALQ4UORC6WXBX3L7I4YGFL7FTBBML4DJZCN637I4NXJLIZIY` |
| Sample vault | `CDP4M3WY6KB5QWJHG3UGCCWDNJZGDQE47P25FMQKKQHMXNSBYDA6K44G` |
| Vault WASM hash | `cad67800c8e178ae1442226c1b2848007fea9c1df6e8d3a30b006e41c7b78bfc` |

### For users (read / try)

Explorer (Stellar Expert) — status, events, history:

- [DID registry](https://stellar.expert/explorer/testnet/contract/CCLOO56UFL7623QRZSV5YZQLAPQ65RMMEACT6CLKF4HWNFW3QTLF2M3Q)
- [Vault factory](https://stellar.expert/explorer/testnet/contract/CAMHSVEVALQ4UORC6WXBX3L7I4YGFL7FTBBML4DJZCN637I4NXJLIZIY)
- [Sample vault](https://stellar.expert/explorer/testnet/contract/CDP4M3WY6KB5QWJHG3UGCCWDNJZGDQE47P25FMQKKQHMXNSBYDA6K44G)

Stellar Lab — call `get` / `verify_vc` / `deploy` from the browser:

- [DID registry (Lab)](https://lab.stellar.org/r/testnet/contract/CCLOO56UFL7623QRZSV5YZQLAPQ65RMMEACT6CLKF4HWNFW3QTLF2M3Q)
- [Vault factory (Lab)](https://lab.stellar.org/r/testnet/contract/CAMHSVEVALQ4UORC6WXBX3L7I4YGFL7FTBBML4DJZCN637I4NXJLIZIY)
- [Sample vault (Lab)](https://lab.stellar.org/r/testnet/contract/CDP4M3WY6KB5QWJHG3UGCCWDNJZGDQE47P25FMQKKQHMXNSBYDA6K44G)

### For admins / operators

Deployer identity: **`alfred-deployer`**  
Address: `GBFT6GJIARFHVGP2MUSFFFZHV62IED6KPNX7H4ANJBW5QS2NE4JP5O4J`

- [Deployer account (Expert)](https://stellar.expert/explorer/testnet/account/GBFT6GJIARFHVGP2MUSFFFZHV62IED6KPNX7H4ANJBW5QS2NE4JP5O4J)
- Setup: [`docs/STELLAR-CLI-SETUP.md`](docs/STELLAR-CLI-SETUP.md)
- Build / deploy / USDC fee scripts: `contracts/scripts/` (`build.ps1`, `deploy.ps1`, `set-usdc-fee.ps1`)

Admin-only ops (via Lab or CLI, signed as `alfred-deployer`):

| Contract | Typical admin calls |
|----------|---------------------|
| DID registry | `propose_admin` / `accept_admin` / `get_admin` |
| Vault factory | `set_fee` / `set_vault_wasm_hash` / `propose_admin` / `quote_issue_fee` |
| Per-holder vault | Owner: `set_issuance_mode` / `allow_issuer` / `deny_issuer` |

Issue fee is **off** by default (`quote_issue_fee = 0`). Turn on with `.\contracts\scripts\set-usdc-fee.ps1`.

---

## Repo layout

```
apps/web          # Product UI → alfred-web Pages
apps/api          # Workers API (Hono) + D1 → alfred Worker
packages/shared   # i18n ES/EN + shared types
packages/stellar  # Contract IDs + generated bindings
contracts/        # Soroban: DID registry, VC vault, factory
docs/             # PRD, tickets, setup guides
```

---

## Development

```powershell
corepack enable
pnpm install
pnpm dev:web    # http://localhost:3000
pnpm dev:api    # http://127.0.0.1:8787
```

Copy `.env.example` → `apps/web/.env.local` and `apps/api/.dev.vars` (never commit secrets).

### E2E smoke (ALF-051)

```powershell
pnpm --filter @alfred/web exec playwright install chromium   # once
pnpm test:e2e
```

Uses `VITE_E2E_MOCK=1` (stub Pollar) + mocked `/api/verify`. No real OAuth.

### Contracts

```powershell
cd contracts
.\scripts\build.ps1
cargo test --workspace
```

### Deploy (Cloudflare)

```powershell
# API
cd apps/api
.\node_modules\.bin\wrangler.cmd deploy

# Web
cd apps/web
node .\node_modules\typescript\bin\tsc -b
node .\node_modules\vite\bin\vite.js build
.\node_modules\.bin\wrangler.cmd pages deploy dist --project-name=alfred-web --commit-dirty=true
```

---

## Docs

| Document | Contents |
|----------|----------|
| [docs/TICKETS.md](docs/TICKETS.md) | Build backlog |
| [docs/gitbook/](docs/gitbook/) | Public docs source (GitBook) |
| [docs/GITBOOK-SETUP.md](docs/GITBOOK-SETUP.md) | Connect / publish GitBook space |
| [docs/DOGFOOD.md](docs/DOGFOOD.md) | Dogfood 5 usuarios (ALF-053) |
| [docs/THREAT-MODEL.md](docs/THREAT-MODEL.md) | Threat model v0 |
| [docs/OPERATOR-RUNBOOK.md](docs/OPERATOR-RUNBOOK.md) | Ops / incidentes |
| [docs/deployments/testnet.md](docs/deployments/testnet.md) | Live contract IDs |
| [docs/ALFRED-MASTER-SPEC.md](docs/ALFRED-MASTER-SPEC.md) | PRD · TRD · UX · plan |
| [docs/CLOUDFLARE-SETUP.md](docs/CLOUDFLARE-SETUP.md) | Wrangler · D1 · Pages URLs |
| [docs/POLLAR-SETUP.md](docs/POLLAR-SETUP.md) | Pollar checklist |
| [docs/STELLAR-CLI-SETUP.md](docs/STELLAR-CLI-SETUP.md) | CLI + deployer |
| [docs/PITCH-DECK.md](docs/PITCH-DECK.md) | Pitch |
| [docs/WHITEPAPER.md](docs/WHITEPAPER.md) | Whitepaper |

---

## Status

`v0.3.0` — **Live on Cloudflare**: Pollar login + wallet activate on Pages, Worker API + D1, DID/vault/factory on Stellar **testnet**.

Next: session cookies (ALF-031), DID+vault first-run wizard, issue/verify product UI.
