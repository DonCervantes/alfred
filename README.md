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
| Login | Pollar (`@pollar/react`) — next |
| Docs | `docs/` → GitBook later |

---

## Repo layout

```
apps/web          # Product UI (Apple-like landing scaffold)
apps/api          # Workers API (health skeleton)
packages/shared   # i18n ES/EN + shared types
packages/stellar  # Contract IDs / bindings (placeholder)
contracts/        # Soroban workspace (hello scaffolds → real DID/vault next)
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
stellar contract build --package alfred-did-registry
```

Deployer identity: `alfred-deployer` (testnet) — see `docs/STELLAR-CLI-SETUP.md`.

---

## Docs

| Document | Contents |
|----------|----------|
| [docs/TICKETS.md](docs/TICKETS.md) | Build backlog |
| [docs/ALFRED-MASTER-SPEC.md](docs/ALFRED-MASTER-SPEC.md) | PRD · TRD · UX · plan |
| [docs/POLLAR-SETUP.md](docs/POLLAR-SETUP.md) | Pollar checklist |
| [docs/STELLAR-CLI-SETUP.md](docs/STELLAR-CLI-SETUP.md) | CLI + deployer |
| [docs/PITCH-DECK.md](docs/PITCH-DECK.md) | Pitch |
| [docs/WHITEPAPER.md](docs/WHITEPAPER.md) | Whitepaper |

---

## Status

`v0.1.0` — monorepo scaffold (ALF-010). Next: Cloudflare login (ALF-004), Pollar in UI, real contracts (ALF-020+).
