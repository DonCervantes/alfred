# ALFRED — Operator runbook (ALF-052)

Day-to-day ops for **testnet** preview. Pair with [`DOGFOOD.md`](./DOGFOOD.md) and [`THREAT-MODEL.md`](./THREAT-MODEL.md).

---

## 1. Live endpoints

| Piece | URL |
|-------|-----|
| Web | https://alfred-web-283.pages.dev |
| API health | https://alfred.cruzcervantesdanieladrianelias.workers.dev/api/health |
| Account probe | `…/api/health?account=G…` |
| Contracts | [`deployments/testnet.md`](./deployments/testnet.md) |

Dashboards: [Pollar](https://dashboard.pollar.xyz) · [Cloudflare](https://dash.cloudflare.com) · [Stellar Expert testnet](https://stellar.expert/explorer/testnet)

---

## 2. Daily / on-call checks (2 min)

1. Open `/api/health` → expect `ok`.  
2. Open Pages landing → brand + Continuar.  
3. If dogfood active: skim matrix in `DOGFOOD.md` for new blockers.  
4. Optional: `wrangler tail` on Worker while a tester hits Create / Issue.

---

## 3. Deploy

```powershell
# API
cd C:\Users\cruzc\Projects\alfred\apps\api
.\node_modules\.bin\wrangler.cmd deploy

# Web (set VITE_* for Pages build — never commit secrets)
cd C:\Users\cruzc\Projects\alfred\apps\web
pnpm build
npx wrangler pages deploy dist --project-name alfred-web-283
```

After web deploy: confirm `VITE_API_URL` points at workers.dev (broken CORS/session if wrong).

Secrets (API only, via wrangler / dashboard — **not** git):

- `POLLAR_SECRET_KEY`
- `SESSION_SECRET`
- `CREDENTIAL_ENCRYPTION_KEY`

---

## 4. Pollar Auth Policy (must stay green)

Allow Soroban methods:

| Contract | Methods |
|----------|---------|
| DID registry `CCLOO56U…` | `register` |
| Vault factory `CAMHSVE…` | `deploy`, `collect_issue_fee` (fee **off** until Pollar USDC trustlines) |
| Vault instances `C…` | `issue`, `revoke` |
| USDC SAC (si fee > 0) | transfer vía `collect_issue_fee` |

Domains / redirects must include Pages URL + localhost for local.

Funding: **Deferred**. Friendbot is Worker fallback for activate on testnet.

---

## 5. Triage (tester symptoms)

| Symptom | Check | Fix |
|---------|-------|-----|
| Login bounce / no session | Pollar domains; `VITE_API_URL`; cookie on Pages↔API | Fix allowlist; redeploy web |
| `Account not found` on Create | Balance via health?account=; Auth Policy; known SDK cache issue | Activate/Refondear; confirm policy; ensure cf-fetch-patch deployed |
| `SOROBAN_AUTH` / `NOT_ALLOWED` | Auth Policy methods | Add missing method |
| Activate fails | Friendbot rate; network | Retry; check Worker logs |
| `HOLDER_NO_VAULT` | Holder never ran Create ALFRED | Holder completes wizard |
| Verify 404 / expired | Token TTL (~72h) | Re-share from vault |
| Rate limit 429 | Abuse or shared IP | Wait window; raise limits only if needed |
| Claims decrypt error | Wrong/missing `CREDENTIAL_ENCRYPTION_KEY` | Restore secret; use `CREDENTIAL_ENCRYPTION_KEY_PREV` during rotation (ALF-102) |

---

## 6. Incident response (secrets / abuse)

### 6.1 Secret leaked (`sec_*`, `SESSION_SECRET`, encryption key)

1. **Rotate immediately** in Pollar / CF secrets.  
2. Redeploy Worker so new bindings apply.  
3. If session secret rotated → all users re-login.  
4. If encryption key rotated → follow **§6.5 Key rotation** (keep previous key briefly).  
5. Note time + surface (chat, screenshot, git) in a private log — **do not** paste the secret.

### 6.2 Suspected account takeover

1. Ask user to disconnect Pollar / revoke Google session.  
2. Rotate `SESSION_SECRET` if blast radius unclear.  
3. Check D1 / chain for unexpected issues/revokes from that `G…`.

### 6.3 Contract admin concern

1. Verify deployer identity still only on your machine.  
2. Read registry/factory admin on-chain; compare to `GBFT6GJI…` in deployments doc.  
3. Pause product messaging; do not issue “all clear” until admin matches.

### 6.4 Disable / pause product (soft)

- Remove Pages custom traffic (or unpublish latest deployment in CF).  
- Optionally tighten Auth Policy to empty methods (stops sponsored txs).  
- Leave verify read-only if chain+D1 still consistent — or take Pages down entirely.

### 6.5 Encryption key rotation (ALF-102)

Worker secrets:

| Secret | Role |
|--------|------|
| `CREDENTIAL_ENCRYPTION_KEY` | **Current** — used to encrypt new issues |
| `CREDENTIAL_ENCRYPTION_KEY_PREV` | **Previous** — decrypt-only fallback |

Procedure:

1. Generate new 32-byte key (hex 64 chars or base64).  
2. Set `CREDENTIAL_ENCRYPTION_KEY_PREV` = **today’s** current key.  
3. Set `CREDENTIAL_ENCRYPTION_KEY` = **new** key.  
4. Redeploy Worker.  
5. New issues encrypt with new key; old blobs still decrypt via PREV.  
6. After a quiet period (or after optional re-encrypt job — not built yet), clear `CREDENTIAL_ENCRYPTION_KEY_PREV`.  

Never delete the only key while ciphertext still depends on it.

---

## 7. Dogfood operator duties (ALF-053)

1. Do **not** remote-desktop / “fix it for them” unless documenting a blocker.  
2. Collect: Fecha, handle, G-address, DID, vault C, verify URL, error text.  
3. Fill matrix in `DOGFOOD.md`.  
4. Same error on ≥2 users → open a fix ticket before inviting more people.

Invite copy: section 4 of `DOGFOOD.md`.

---

## 8. Mainnet gate (do not skip)

- [ ] Friendbot / free activate paths off  
- [ ] Auth Policy reviewed + least privilege  
- [ ] Multisig or hardware for admin  
- [ ] Encryption key rotation plan ([runbook §6.5](./OPERATOR-RUNBOOK.md))  
- [ ] External security review  
- [ ] Privacy Policy + Terms published  
- [ ] Full list: [`MAINNET-CHECKLIST.md`](./MAINNET-CHECKLIST.md)  

Until then: **testnet only** in all public copy.

---

## 9. Blob storage (D1)

Encrypted VC payloads use AES-GCM via [`apps/api/src/lib/blobs.ts`](../apps/api/src/lib/blobs.ts) and live in D1 table `credential_blobs`.

**Decision (testnet):** stay on D1 — do **not** enable/pay for Cloudflare R2. Fine for dogfood volume.

`lib/blobs.ts` still has an optional `VC_BLOBS` (R2) branch for a future mainnet scale-up; binding stays commented in `wrangler.toml` and is out of scope until then.
