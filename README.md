# ALFRED

Credenciales verificables en Stellar — con UX de producto, no de explorer.

**Credentials you can prove — without teaching anyone crypto.**

---

## Stack

| Piece | Choice |
|-------|--------|
| Contracts | Rust / Soroban · deploy via **Stellar CLI** |
| Login / wallet | **[Pollar](https://pollar.xyz)** (`@pollar/react`) |
| App + API | **Cloudflare** Pages + Workers |
| Docs | **GitBook** (source in `docs/`) |
| UI language | Apple-like · **ES + EN** |

---

## Docs (start here)

| Document | Contents |
|----------|----------|
| [docs/WHAT-WE-NEED.md](docs/WHAT-WE-NEED.md) | Checklist to unblock build day 1 |
| [docs/ALFRED-MASTER-SPEC.md](docs/ALFRED-MASTER-SPEC.md) | PRD · TRD · UX/UI · E2E · Backend · Implementation plan |
| [docs/PITCH-DECK.md](docs/PITCH-DECK.md) | Business plan + pitch slide outline |
| [docs/WHITEPAPER.md](docs/WHITEPAPER.md) | Protocol / product whitepaper |

---

## Repo layout (target)

```
apps/web          # UI
apps/api          # Cloudflare Worker
contracts/        # Soroban workspace
packages/         # shared types, stellar bindings
docs/             # product + protocol docs
```

Scaffolding lands after `WHAT-WE-NEED` decisions are filled.

---

## Inspiration & differentiation

ALFRED is inspired by ACTA-class Stellar VC infrastructure (DID registry + per-holder vaults), rebuilt as **our** contracts and productized with Pollar + Cloudflare + Apple-like UX.

---

## Status

`v0.1.0-draft` — documentation kickoff. Implementation starts when Pollar + Stellar deployer + Cloudflare are ready.
