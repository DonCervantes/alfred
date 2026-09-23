# ALFRED — Master Product Spec

**Version:** 0.1.0-draft  
**Date:** 2026-09-23  
**Status:** Draft for build kickoff  
**Languages:** Product UI copy ES + EN · Spec body primarily ES with EN UI strings  

---

## Table of contents

1. [PRD — Product Requirements](#1-prd--product-requirements)
2. [TRD — Technical Requirements](#2-trd--technical-requirements)
3. [UX / UI — Apple Product Language](#3-ux--ui--apple-product-language)
4. [End-to-end platform flow](#4-end-to-end-platform-flow)
5. [Backend schematic](#5-backend-schematic)
6. [Implementation plan](#6-implementation-plan)

---

# 1. PRD — Product Requirements

## 1.1 Vision

**ALFRED** is consumer-grade infrastructure for **decentralized identity** and **Verifiable Credentials (VCs)** on **Stellar / Soroban**.

Inspired by ACTA’s on-chain model (DID registry + per-holder vault), ALFRED differentiates with:

| Dimension | ACTA (reference) | ALFRED |
|-----------|------------------|--------|
| Login | Wallet-first (Freighter) | **Pollar** social login + embedded Stellar wallet |
| UX | Developer / demo oriented | **Apple-like product** (calm, precise, minimal) |
| Docs | Developer docs site | **GitBook** product + protocol docs |
| Hosting | Typical Vercel/Node | **Cloudflare** (Pages + Workers) |
| Brand | ACTA | ALFRED — human name, trust, quiet authority |

**One-liner (EN):** *Credentials you can prove — without teaching anyone crypto.*  
**One-liner (ES):** *Credenciales que puedes probar — sin enseñarle crypto a nadie.*

## 1.2 Problem

- Institutions issue credentials (employment, education, credit, licenses) that live in silos PDFs / portals.
- Verifiers cannot trust copies; revocation is opaque.
- Blockchain VC stacks force users through seed phrases and browser extensions → drop-off.
- Existing Stellar VC stacks are powerful but feel like developer tools, not products people love.

## 1.3 Solution

ALFRED provides:

1. **Sign in** with familiar providers via **Pollar** (creates/manages embedded Stellar wallet).
2. **DID** `did:stellar` registered on-chain (ALFRED DID registry).
3. **Personal vault** (Soroban contract instance per holder) for issue / store / revoke / verify VCs.
4. **Issuer & verifier surfaces** with Apple-grade UI.
5. **Public docs** on GitBook; **app** on Cloudflare.

## 1.4 Goals (MVP — 8 weeks)

| Goal | Metric |
|------|--------|
| Holder can create DID + vault on testnet | < 60s from Pollar login |
| Issuer can issue a VC into a vault | Success rate ≥ 95% in dogfood |
| Verifier can verify VC status on-chain | Single-screen flow |
| Zero PII plaintext on-chain | Audit checklist pass |
| Deploy preview + prod on Cloudflare | CI green |
| Docs published on GitBook | PRD excerpt + quickstart live |

## 1.5 Non-goals (MVP)

- Mainnet production fees / USDC billing automation  
- Mobile native apps  
- Full W3C VC Linked Data crypto suite parity (start with JSON payloads + on-chain hash/status)  
- Multi-chain  
- Token launch  
- Complex governance DAOs (spikes later)

## 1.6 Personas

| Persona | Need | ALFRED surface |
|---------|------|----------------|
| **Holder** (end user) | Own credentials, share proofs | App → Vault |
| **Issuer** (org / employer) | Issue & revoke trusted VCs | App → Issue |
| **Verifier** (lender, HR, border) | Check validity without calling issuer | App → Verify / public link |
| **Operator** (ALFRED team) | Deploy contracts, monitor | CLI + Cloudflare dashboard |

## 1.7 User stories (MVP)

1. As a **holder**, I sign in with Google/Apple via Pollar and get a Stellar wallet without knowing XLM.
2. As a **holder**, I create my ALFRED DID and vault in one guided flow.
3. As an **issuer**, I issue a credential to a holder’s vault (or push request).
4. As a **holder**, I list credentials and open a detail view with status.
5. As a **holder**, I revoke a credential I control / request issuer revoke.
6. As a **verifier**, I open a share link and see valid / revoked / unknown — no account required for read-only verify.
7. As a **developer**, I read GitBook and integrate ALFRED Workers API.

## 1.8 Functional requirements

### FR-AUTH
- Pollar SDK login (social + optional external wallet adapter later).
- Session cookie / JWT issued by ALFRED Worker after Pollar identity proof.
- Logout clears session; does not destroy on-chain DID.

### FR-DID
- Register `did:stellar` via ALFRED `did-registry` contract.
- Read DID document reconstruction off registry record.
- Transfer controller / deactivate (post-MVP soft-hide in UI).

### FR-VAULT
- Factory deploys per-holder `vc-vault`.
- Issue, get, list, revoke, verify_vc.
- Open issuance or allowlist mode (config flag; MVP: open on testnet with issuer denylist).

### FR-ISSUE
- Form: recipient (address / DID), VC type, claims JSON, expiry.
- Store **hash + ciphertext pointer** on-chain; full payload in Workers KV/R2 (encrypted).

### FR-VERIFY
- Public verify page: input VC id or presentation token.
- Shows status from chain + optional decrypted claims if authorized.

### FR-ADMIN (internal)
- Feature flags, contract IDs, network toggle (testnet only in MVP UI).

## 1.9 Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | TTI landing < 2.5s on mid mobile; Worker p95 < 300ms for read APIs |
| Security | Secrets only in Cloudflare Secrets; no PII on-chain; HTTPS only |
| A11y | WCAG 2.2 AA for core flows |
| i18n | ES + EN from day 1 |
| Availability | Cloudflare edge; graceful degrade if RPC down |
| Observability | Workers Analytics + structured logs |

## 1.10 Success metrics (north star)

- **Activation:** % of Pollar logins that complete DID+vault  
- **Issuance:** VCs issued / week (dogfood → early partners)  
- **Verification:** verifies / issued ratio  
- **Trust:** zero critical security incidents  

## 1.11 Competitive positioning

ALFRED sits between **fragile PDF credentials** and **developer-only VC chains**. Closest protocol reference: ACTA. Closest UX reference: Apple Wallet / Apple ID privacy sheets — not crypto dashboards.

---

# 2. TRD — Technical Requirements

## 2.1 Architecture overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Browser UI │────▶│ Cloudflare Pages │────▶│ Cloudflare Workers  │
│  (React)    │     │  (static/SSR)    │     │  API + session      │
└──────┬──────┘     └──────────────────┘     └──────────┬──────────┘
       │ Pollar SDK                                     │
       ▼                                                ▼
┌─────────────┐                              ┌─────────────────────┐
│ Pollar      │                              │ D1 / KV / R2        │
│ (auth+wallet│                              │ metadata, encrypted │
│  sponsorship│                              │ VC payloads, sessions│
└──────┬──────┘                              └─────────────────────┘
       │                                                
       ▼                                                
┌─────────────────────────────────────────────────────┐
│ Stellar Testnet / Mainnet                           │
│  • alfred-did-registry (Soroban)                    │
│  • alfred-vc-vault-factory (Soroban)                │
│  • alfred-vc-vault instances (Soroban)              │
│  RPC + Horizon                                      │
└─────────────────────────────────────────────────────┘
```

Docs: **GitBook** synced from `docs/gitbook/`.

## 2.2 Stack

| Layer | Choice | Why |
|-------|--------|-----|
| UI | React 19 + Vite or Next on CF (OpenNext / `@opennextjs/cloudflare`) | Edge deploy |
| Styling | Tailwind v4 + CSS variables; light-first Apple aesthetic | Speed + control |
| Auth / wallet | `@pollar/react` + `@pollar/core` | Social → Stellar without seed UX |
| Contracts | Rust + `soroban-sdk` + **Stellar CLI** | Same path as ACTA, owned by us |
| API | Cloudflare Workers (Hono or itty-router) | Edge, cheap, global |
| DB | D1 (relational metadata) + KV (sessions) + R2 (encrypted blobs) | CF-native |
| CI | GitHub Actions → `wrangler deploy` + `stellar contract deploy` | Reproducible |
| Docs | GitBook | Product + protocol narrative |

## 2.3 Smart contracts (ALFRED owned)

Deployed **only** via Stellar CLI scripts in `contracts/`.

### `alfred-did-registry`
- `register`, `update`, `transfer_controller`, `deactivate`, `get`
- Optimistic concurrency on update
- Spec: `did:stellar` compatible (align with open method docs; ALFRED may publish `did:stellar` profile notes)

### `alfred-vc-vault-factory`
- `deploy(owner, salt)` → deterministic vault address
- `is_vault`, fee config hooks (disabled on testnet MVP)
- Admin nominate/accept

### `alfred-vc-vault`
- Per-holder instance
- `issue`, `batch_issue`, `revoke`, `get_vc`, `list_vc_ids`, `verify_vc`, `vc_count`
- Optional `deny_issuer` / `allow_issuer`
- Stores: `vc_id`, status, issuer, issued_at, content_hash, uri (optional)

**Hard rule:** claim plaintext never required on-chain; `content_hash` is canonical integrity check.

## 2.4 Off-chain data model (D1 sketch)

```sql
users (
  id TEXT PK,
  pollar_user_id TEXT UNIQUE,
  stellar_address TEXT,
  did TEXT,
  vault_address TEXT,
  locale TEXT,
  created_at TEXT
)

credentials_meta (
  id TEXT PK,
  vc_id TEXT UNIQUE,
  holder_user_id TEXT,
  issuer_user_id TEXT,
  type TEXT,
  content_hash TEXT,
  r2_key TEXT,          -- encrypted payload
  status TEXT,          -- mirrors chain: valid|revoked
  network TEXT,
  created_at TEXT
)

presentation_links (
  token TEXT PK,
  vc_id TEXT,
  holder_user_id TEXT,
  expires_at TEXT,
  revoked_at TEXT
)
```

## 2.5 API surface (Workers)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/session` | Pollar proof | Create ALFRED session |
| POST | `/api/auth/logout` | Session | Clear session |
| GET | `/api/me` | Session | Profile + DID + vault |
| POST | `/api/did/register` | Session | Build + return unsigned tx / or sponsored path |
| POST | `/api/vault/deploy` | Session | Factory deploy |
| POST | `/api/credentials/issue` | Session (issuer) | Encrypt store + issue tx |
| GET | `/api/credentials` | Session | List for holder |
| GET | `/api/credentials/:vcId` | Session / presentation | Detail |
| POST | `/api/credentials/:vcId/revoke` | Session | Revoke |
| POST | `/api/presentations` | Session | Create share token |
| GET | `/api/verify/:token` | Public | Verify presentation |

Exact signing model: **client signs** via Pollar wallet adapter; Worker prepares XDR / simulation. Sponsorship via Pollar fee-bump where configured.

## 2.6 Environment variables

```
POLLAR_PUBLISHABLE_KEY=
POLLAR_SECRET_KEY=
SESSION_SECRET=
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=
DID_REGISTRY_ID=
VC_VAULT_FACTORY_ID=
VC_VAULT_WASM_HASH=
CREDENTIAL_ENCRYPTION_KEY=
```

## 2.7 Security requirements

- Encrypt VC payloads (AES-GCM) before R2; key in Workers Secrets.
- HMAC webhook verification if Pollar webhooks used.
- CSP, secure cookies (`HttpOnly`, `Secure`, `SameSite=Lax`).
- Rate limit issue/verify endpoints.
- Threat model doc in GitBook before mainnet.

## 2.8 Stellar CLI toolchain

```bash
# Build
stellar contract build

# Optimize
stellar contract optimize --wasm ...

# Deploy (example)
stellar contract deploy \
  --wasm target/.../alfred_did_registry.optimized.wasm \
  --source alfred-deployer \
  --network testnet
```

Scripts live in `contracts/scripts/` wrapping CLI for CI.

## 2.9 Testing

| Layer | Tool |
|-------|------|
| Contracts | `cargo test` |
| Workers | Vitest + Miniflare |
| UI | Playwright critical paths |
| E2E testnet | Nightly dogfood checklist |

## 2.10 Compliance posture

- GDPR-minded: export/delete off-chain user data; on-chain is immutable → minimize personal data written.
- No regulated credit bureau claims in MVP marketing without counsel.

---

# 3. UX / UI — Apple Product Language

## 3.1 Design principles

1. **One job per screen** — never a crypto dashboard.
2. **Brand first** — “ALFRED” is the hero signal on first viewport.
3. **Calm materiality** — soft light, depth via blur/opacity, not neon gradients.
4. **Motion with purpose** — 2–3 intentional transitions (sheet present, success check, page fade).
5. **Crypto invisible** — addresses truncated; network as quiet footnote; no gas jargon.
6. **Bilingual by design** — every string keyed `en` / `es`.

**Anti-patterns (forbidden in MVP UI):** purple glow Web3 themes, dense tables as home, floating promo badges on hero, emoji-as-UI, “Connect Wallet” as primary CTA (use **Continue** / **Sign in** via Pollar).

## 3.2 Visual system

| Token | Value (light) | Notes |
|-------|---------------|-------|
| `--bg` | `#F5F5F7` | Apple marketing gray |
| `--surface` | `#FFFFFF` | Cards only when interactive |
| `--text` | `#1D1D1F` | Primary |
| `--text-secondary` | `#6E6E73` | Supporting |
| `--accent` | `#0071E3` | Apple-like blue CTA |
| `--success` | `#34C759` | |
| `--danger` | `#FF3B30` | |
| `--radius` | `18px` | Large continuous corners |
| `--font-display` | System SF / `ui-sans-serif` stack | Expressive but familiar |
| `--font-body` | Same family, regular | |

Dark mode: post-MVP; ship light-first.

## 3.3 Information architecture

```
/                   Marketing (brand + one CTA)
/signin             Pollar modal host
/app                Holder home (vault summary)
/app/credentials    List
/app/credentials/:id
/app/issue          Issuer flow
/app/verify         Verifier tool
/v/:token           Public verify (no chrome clutter)
/settings           Locale, account
```

## 3.4 Key screens — copy ES / EN

### Marketing hero
| ES | EN |
|----|----|
| **ALFRED** | **ALFRED** |
| Credenciales verificables, con la calma de un producto que sí entiendes. | Verifiable credentials, with the calm of a product you already understand. |
| Continuar | Continue |

### Sign in
| ES | EN |
|----|----|
| Entra a ALFRED | Sign in to ALFRED |
| Usamos Pollar para crear tu billetera Stellar sin frases semilla. | We use Pollar to create your Stellar wallet — no seed phrases. |
| Continuar con Apple / Google | Continue with Apple / Google |

### First-run (DID + Vault)
| ES | EN |
|----|----|
| Configura tu identidad | Set up your identity |
| Un paso. Una identidad. Un vault solo tuyo. | One step. One identity. A vault that’s only yours. |
| Crear mi ALFRED | Create my ALFRED |

### Vault empty
| ES | EN |
|----|----|
| Aún no hay credenciales | No credentials yet |
| Cuando alguien te emita una, aparecerá aquí. | When someone issues one to you, it will show up here. |

### Issue
| ES | EN |
|----|----|
| Emitir credencial | Issue credential |
| Destinatario | Recipient |
| Tipo | Type |
| Datos | Claims |
| Emitir | Issue |
| Listo. La credencial está en su vault. | Done. The credential is in their vault. |

### Verify (public)
| ES | EN |
|----|----|
| Verificación | Verification |
| Válida | Valid |
| Revocada | Revoked |
| No encontrada | Not found |
| Comprobado en Stellar | Checked on Stellar |

## 3.5 Motion spec

1. **Page enter:** 200ms fade + 8px rise (`ease-out`).  
2. **Success:** SF-like check draw 400ms.  
3. **Sheet (issue confirm):** spring present from bottom on mobile; centered dialog desktop.

## 3.6 Accessibility

- Focus rings visible (2px accent).  
- Don’t rely on color alone for Valid/Revoked — include text + icon.  
- Hit targets ≥ 44px.

## 3.7 UX metrics

- First-run completion ≥ 70% of sign-ins.  
- Issue flow ≤ 4 fields before submit.  
- Public verify: understand status in < 5 seconds (guerrilla test).

---

# 4. End-to-end platform flow

## 4.1 Happy path — Holder activation

```
1. User opens alfred.app
2. Taps Continue → Pollar Auth Modal (Apple/Google)
3. Pollar creates/loads embedded Stellar wallet (testnet)
4. ALFRED Worker creates session (pollar_user_id ↔ stellar_address)
5. First-run wizard:
   a. Prepare did-registry.register tx → user signs via Pollar
   b. Prepare factory.deploy tx → user signs
   c. Worker stores did + vault_address in D1
6. Land on /app empty vault
```

## 4.2 Happy path — Issue credential

```
1. Issuer signed in (same ALFRED app, issuer mode)
2. Fills recipient + claims
3. Worker:
   a. Canonicalize claims → content_hash
   b. Encrypt payload → R2
   c. Build vault.issue(...) XDR
4. Issuer signs via Pollar
5. Confirm on RPC; Worker mirrors status in D1
6. Holder sees credential in list (poll or websocket later)
```

## 4.3 Happy path — Share & verify

```
1. Holder opens credential → Create link
2. Worker inserts presentation_links token (TTL)
3. Holder shares URL /v/:token
4. Verifier opens (no login):
   a. Worker loads meta + calls verify_vc / get_vc on chain
   b. Optionally reveals authorized claims
5. UI shows Valid | Revoked | Expired
```

## 4.4 Revocation

```
Issuer or holder (policy TBD) → revoke tx → chain status → D1 update → verify links reflect revoked
```

## 4.5 Failure paths

| Failure | UX |
|---------|----|
| Pollar auth cancel | Stay on marketing; no error shame |
| RPC timeout | “Stellar está lento. Reintentar.” / “Stellar is slow. Try again.” |
| Insufficient sponsorship | Operator alert; user sees “No pudimos completar. Reintenta en unos minutos.” |
| Wrong network | Block with quiet switch instruction |

## 4.6 Sequence diagram (issue)

```
Holder/Issuer UI → Worker: POST /credentials/issue
Worker → R2: put encrypted
Worker → UI: unsigned XDR + sim
UI → Pollar: sign
Pollar → Stellar: submit (+ fee bump)
UI → Worker: confirm tx hash
Worker → D1: status=valid
```

---

# 5. Backend schematic

## 5.1 Packages (monorepo)

```
alfred/
  apps/
    web/                 # Cloudflare Pages UI
    api/                 # Cloudflare Worker API
  contracts/
    alfred-did-registry/
    alfred-vc-vault/
    alfred-vc-vault-factory/
    scripts/             # stellar CLI wrappers
  packages/
    shared/              # types, i18n keys, zod schemas
    stellar/             # tx builders, contract bindings
  docs/
    ALFRED-MASTER-SPEC.md
    WHAT-WE-NEED.md
    PITCH-DECK.md
    WHITEPAPER.md
    gitbook/             # published docs source
```

## 5.2 Worker modules

```
api/
  src/
    index.ts             # Hono app
    routes/auth.ts
    routes/did.ts
    routes/vault.ts
    routes/credentials.ts
    routes/verify.ts
    lib/session.ts
    lib/pollar.ts
    lib/crypto.ts        # AES-GCM
    lib/stellar.ts       # RPC client
    lib/db.ts            # D1
```

## 5.3 Trust boundaries

| Boundary | Trust |
|----------|-------|
| Browser | Untrusted |
| Pollar | Trusted for auth/wallet UX; verify assertions server-side |
| Worker | Trusted computing base for secrets |
| Stellar | Source of truth for DID/VC status |
| D1/R2 | Source of truth for encrypted payloads & UX metadata |

## 5.4 Contract ↔ Worker binding

Generate TypeScript bindings from WASM with Stellar CLI (`stellar contract bindings typescript`) into `packages/stellar`.

---

# 6. Implementation plan

## Phase 0 — Foundations (Week 0–1)

- [x] Repo + master docs  
- [ ] Fill `WHAT-WE-NEED.md` answers  
- [ ] Pollar app + keys  
- [ ] Cloudflare account + empty Pages/Worker  
- [ ] Stellar CLI + `alfred-deployer` testnet  
- [ ] GitBook space skeleton  

**Exit:** all secrets in 1Password / CF Secrets; “hello world” Worker deployed.

## Phase 1 — Contracts (Week 1–3)

- [ ] Scaffold Rust workspace (did-registry, vault, factory)  
- [ ] Unit tests ported/adapted from proven VC vault patterns  
- [ ] `scripts/build.sh` + `deploy.sh` via Stellar CLI  
- [ ] Deploy testnet; record IDs in `docs/deployments/testnet.md`  
- [ ] Generate TS bindings  

**Exit:** `get` DID + `issue/verify` vault works from CLI.

## Phase 2 — API + Auth (Week 3–4)

- [ ] Pollar session bridge  
- [ ] D1 schema migrations  
- [ ] DID register + vault deploy endpoints  
- [ ] Credential issue/list/revoke + R2 encryption  

**Exit:** curl/Postman E2E without polished UI.

## Phase 3 — Apple-like Web App (Week 4–6)

- [ ] Marketing + i18n ES/EN  
- [ ] Sign-in + first-run wizard  
- [ ] Vault list/detail  
- [ ] Issue + public verify  
- [ ] Motion + a11y pass  

**Exit:** dogfood on testnet with 5 users.

## Phase 4 — Docs & harden (Week 6–7)

- [ ] GitBook: quickstart, protocol, security  
- [ ] Playwright smoke  
- [ ] Rate limits, CSP, threat model v0  
- [ ] Operator runbook  

## Phase 5 — Launch candidate (Week 8)

- [ ] Partner issuer pilot  
- [ ] Mainnet checklist (optional hold)  
- [ ] Pitch materials freeze (deck + whitepaper v1)  

## Milestones & owners (fill names)

| Milestone | Owner | Date |
|-----------|-------|------|
| M1 Contracts on testnet | | |
| M2 Auth + API | | |
| M3 UI dogfood | | |
| M4 Public preview | | |

## Risks

| Risk | Mitigation |
|------|------------|
| Pollar API changes | Pin SDK; wrap adapter |
| Soroban fees / sponsorship drain | Alerts; deferred funding |
| Scope creep (vertical products) | Lock MVP = DID+Vault only |
| PII leakage | Hash-only chain policy + review |

## Definition of Done (MVP)

- User can sign in with Pollar, create DID+vault, receive/issue/revoke/verify a VC on testnet.  
- App deployed on Cloudflare; docs on GitBook.  
- UI passes bilingual + Apple-principle review checklist.  
- No plaintext PII in contract storage.

---

## Appendix A — Glossary

| Term | Meaning |
|------|---------|
| DID | Decentralized Identifier |
| VC | Verifiable Credential |
| Vault | Per-holder Soroban contract storing VC status/hashes |
| Pollar | Embedded wallet + social onboarding for Stellar |
| Holder / Issuer / Verifier | W3C VC roles |

## Appendix B — References

- ACTA contracts model (inspiration, not dependency)  
- Pollar docs: https://docs.pollar.xyz  
- Stellar CLI / Soroban docs  
- W3C Verifiable Credentials Data Model  

---

*End of ALFRED Master Spec v0.1.0-draft*
