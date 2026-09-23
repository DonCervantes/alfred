# ALFRED

Credenciales verificables en Stellar — con UX de producto, no de explorer.

**Credentials you can prove. / Credenciales que puedes probar.**

---

## Stack

| Piece | Choice |
|-------|--------|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Vite · React 19 · Tailwind v4 → Cloudflare Pages |
| API | Hono · Cloudflare Workers |
| Contracts | Rust / Soroban · Stellar CLI |
| Login | Pollar (`@pollar/react`) |
| Docs | `docs/` → GitBook later |

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
apps/web          # Product UI
apps/api          # Workers API (Hono)
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

### Contracts

```powershell
cd contracts
.\scripts\build.ps1
cargo test --workspace
```

---

## Docs

| Document | Contents |
|----------|----------|
| [docs/TICKETS.md](docs/TICKETS.md) | Build backlog |
| [docs/deployments/testnet.md](docs/deployments/testnet.md) | Live contract IDs |
| [docs/ALFRED-MASTER-SPEC.md](docs/ALFRED-MASTER-SPEC.md) | PRD · TRD · UX · plan |
| [docs/CLOUDFLARE-SETUP.md](docs/CLOUDFLARE-SETUP.md) | Wrangler · D1 · R2 · Pages |
| [docs/POLLAR-SETUP.md](docs/POLLAR-SETUP.md) | Pollar checklist |
| [docs/STELLAR-CLI-SETUP.md](docs/STELLAR-CLI-SETUP.md) | CLI + deployer |
| [docs/PITCH-DECK.md](docs/PITCH-DECK.md) | Pitch |
| [docs/WHITEPAPER.md](docs/WHITEPAPER.md) | Whitepaper |

---

## Status

`v0.2.0` — Pollar login + activate, DID/vault/factory on **testnet**, TS bindings.  
Next: `wrangler login` → D1/R2/Pages ([docs/CLOUDFLARE-SETUP.md](docs/CLOUDFLARE-SETUP.md)) → session API.
