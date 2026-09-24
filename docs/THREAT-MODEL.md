# ALFRED — Threat model v0 (ALF-052)

**Scope:** testnet MVP (Pollar + Workers + Pages + Soroban).  
**Out of scope:** mainnet audit, formal STRIDE worksheets, third-party pen-test.  
**Honesty:** ALFRED does **not** claim anonymity. On-chain metadata is public.

---

## 1. Assets

| Asset | Where | Sensitivity |
|-------|-------|-------------|
| Pollar session / `alfred_session` cookie | Browser + Worker HMAC | High — impersonation |
| `SESSION_SECRET`, `POLLAR_SECRET_KEY`, `CREDENTIAL_ENCRYPTION_KEY` | CF Worker secrets / `.dev.vars` | Critical |
| VC plaintext (claims) | Encrypted blob in D1 (AES-256-GCM); hash on-chain | High |
| Presentation tokens (`/v/:token`) | D1 + public URL | Medium — shared link |
| Deployer / admin G-key | Local stellar CLI identity | Critical (contract admin) |
| Auth Policy + funding (Pollar) | Pollar dashboard | High — tx griefing / drain |
| Contract IDs | `docs/deployments/testnet.md` | Public |

---

## 2. Trust boundaries

```
[User browser] ──HTTPS──► [Pages: alfred-web]
       │                         │
       │ Pollar OAuth            │ VITE_API_URL
       ▼                         ▼
[Pollar] ──session──► [Worker API] ──D1──► blobs / users / tokens
                           │
                           ├──Soroban RPC──► DID registry / factory / vaults
                           └──Friendbot──► activate (testnet only)
```

- **Browser** trusts Pages origin + Pollar modal.  
- **Worker** is the only component that holds encryption keys and verifies sessions.  
- **Chain** is source of truth for DID registry, vault ownership, VC hash + status.  
- **Pollar** controls who can sign sponsored Soroban txs (Auth Policy).

---

## 3. Threats → controls (current)

| ID | Threat | Impact | Control today | Residual / gap |
|----|--------|--------|---------------|----------------|
| T1 | Session cookie theft (XSS / shared device) | Account takeover | HttpOnly cookie, HMAC (`SESSION_SECRET`), CSP on API | 14d TTL is long; no rotation on privilege change |
| T2 | CSRF against cookie session | Unwanted issue/revoke | SameSite default + JSON APIs; Pages/API split origins | Confirm CORS allowlist stays tight |
| T3 | VC payload breach (D1 dump) | Claim disclosure | AES-256-GCM with `CREDENTIAL_ENCRYPTION_KEY` | Single key; no per-user KEK yet; R2 not used |
| T4 | Guessable / leaked share token | Unauthorized claim view | Random token; TTL (~72h); status from chain | Anyone with link sees claims while valid |
| T5 | Fake verify UI (phishing) | Social engineering | Canonical Pages domain; clear Valid/Revoked copy | No domain pinning / brand verification beyond URL |
| T6 | Malicious issuer spam | Noise / reputational harm | Rate limits on prepare-issue; issuer = authenticated addr | No org allowlist (stretch ALF-062) |
| T7 | Unauthorized Soroban methods | Wrong contract calls | Pollar Auth Policy allowlist (`register`/`deploy`/`issue`/`revoke`) | Misconfig = outage or over-permission |
| T8 | Funding / Friendbot griefing | XLM / rate burn | Deferred funding + activate rate limit; Friendbot testnet-only | Mainnet must disable Friendbot path |
| T9 | Deployer key compromise | Admin abuse on registry/factory | Single testnet key (`alfred-deployer`) | Need multisig / hardware before mainnet |
| T10 | RPC / Workers SDK quirks | Failed txs, confusing UX | `cf-fetch-patch` for axios cache; health probes | Monitor worker logs on dogfood |
| T11 | Rate-limit bypass | Abuse | Per-IP isolate Map (ALF-036) | Not durable across isolates; OK for dogfood only |
| T12 | Supply chain (deps / Pollar) | Key exfil / backdoor | Pin versions via pnpm lock; secrets never in git | No SBOM / automated audit yet |

---

## 4. Acceptable risk (testnet)

- Friendbot as activate fallback.  
- Ciphertext in D1 instead of R2.  
- In-memory rate limits.  
- Fee = 0 on factory.  
- Single deployer admin.

**Not acceptable on mainnet without fix:** Friendbot activate, long-lived single admin key, single encryption key without rotation plan, share links that always reveal full claims.

---

## 5. Incidents to treat as P0

1. `SESSION_SECRET` or `CREDENTIAL_ENCRYPTION_KEY` leaked (chat, commit, screenshot).  
2. Pollar `sec_*` leaked.  
3. Unexpected admin change on registry/factory.  
4. Mass revoke / issue not initiated by known users.  
5. Verify page serving wrong status vs chain.

Response steps → [`OPERATOR-RUNBOOK.md`](./OPERATOR-RUNBOOK.md).

---

## 6. Next hardening (post dogfood)

- Rotate Pollar secret if ever pasted in chat (see POLLAR-SETUP).  
- Shorter session TTL or sliding refresh.  
- Durable rate limit (KV / DO).  
- R2 + key rotation story.  
- Mainnet checklist: Auth Policy audit, no Friendbot, multisig admin, external review.
