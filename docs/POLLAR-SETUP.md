# ALFRED — Pollar Setup Checklist (ALF-002)

Dashboard: https://dashboard.pollar.xyz  
Docs: https://docs.pollar.xyz  

**Target config (from ALF-001):** Testnet · G + C wallets · Deferred funding · USDC fees (app-side)

---

## Step 1 — Cuenta y app

- [x] Abrir https://dashboard.pollar.xyz
- [x] Sign in (Google / GitHub / email OTP)
- [x] Crear app: nombre **ALFRED** (o `alfred-testnet`)
- [x] Confirmar que la app está en entorno **Testnet**

---

## Step 2 — API Keys (testnet)

Build → **API Keys** → Generate

- [x] Publishable `pub_testnet_` creada (en `.env.local`, gitignored)
- [ ] **ROTATE secret** — se pegó en el chat; revocar y generar nueva `sec_testnet_`, actualizar solo `.env.local`
- [x] Nunca commitear keys; nunca volver a pegar la secret en el chat

```env
VITE_POLLAR_PUBLISHABLE_KEY=pub_testnet_...
POLLAR_SECRET_KEY=sec_testnet_...
```

---

## Step 3 — Domains / Redirect URIs (allowlist) — CRÍTICO para Google/GitHub

Build → **Domains**

Añade el origin **completo** (con `http://` y puerto). Sin esto, Google responde:

`APPLICATION_HAS_NO_REDIRECT_URIS`

- [ ] `http://localhost:3000`
- [ ] `http://127.0.0.1:3000`
- [ ] (Más adelante) URL `*.pages.dev` de Cloudflare

**Formato incorrecto (no sirve):** `localhost:3000` · `localhost` · `*`  
**Formato correcto:** `http://localhost:3000`

Si ya los habías añadido y sigue el error:
1. Bórralos y vuelve a agregarlos exactamente como arriba
2. Guarda / confirma en el dashboard
3. Recarga ALFRED y reintenta Google
4. Si el dashboard tiene un campo aparte **Redirect URIs**, añade los mismos valores

**✓ Step 3** — verificar de nuevo si aparece `APPLICATION_HAS_NO_REDIRECT_URIS`

---

## Step 4 — Authentication providers

Integrations → **Authentication**

- [x] Activar al menos **Google** (recomendado MVP)
- [x] Opcional: Apple / GitHub / email OTP
- [x] Completar OAuth client IDs si el dashboard lo pide

**✓ Step 4 listo**

---

## Step 5 — Chains / account model (G + C)

Build → **Chains** + Authentication

- [x] **Stellar** habilitado (testnet)
- [x] **G-accounts** vía login social (Google, etc.)
- [ ] **C-accounts / Passkey** — no disponible aún en dashboard → follow-up cuando Pollar lo active
- [x] Red: **Testnet**

**✓ Step 5 listo** (G ok; C pendiente de Passkeys)

---

## Step 6 — Deferred funding (crítico)

Treasury → **Funding Mode** / **Account Funding**

- [x] Funding mode = **Deferred**
- [x] Configurar / fondear **Account Funding** wallet (XLM testnet)
- [x] Revisar **Sponsorship** (fee-bump) con saldo testnet

**✓ Step 6 listo**

---

## Step 7 — Tokens / USDC (para fee de emisión ALFRED)

Treasury → **Tokens & Trustlines**

- [x] Añadir **USDC** (issuer correcto para testnet)
- [x] Confirmar trustline USDC en wallets nuevas al fondearse

**✓ Step 7 listo**

---

## Step 8 — Branding (Apple-like / ALFRED) — PENDIENTE

Build → **Branding**

- [ ] Nombre visible: **ALFRED**
- [ ] Accent ≈ `#0071E3`
- [ ] Logo cuando lo tengas

**⏭ Saltado a propósito** — no bloquea el build. Ticket: branding Pollar modal.

---

## Estado ALF-002

| Step | Status |
|------|--------|
| 1 App | ✓ |
| 2 API Keys | ✓ (rotar secret si aún no) |
| 3 Domains | ✓ |
| 4 Auth | ✓ |
| 5 Chains (G; C pending Passkey) | ✓ |
| 6 Deferred funding | ✓ |
| 7 USDC trustline | ✓ |
| 8 Branding | **Pendiente** |

---

## Step 9 — Smoke test deferred (después de keys)

Cuando el monorepo exista, o con curl:

```bash
curl -X POST https://server.api.pollar.xyz/v1/wallets/fund \
  -H "x-pollar-api-key: sec_testnet_XXX" \
  -H "Content-Type: application/json" \
  -d '{ "publicKey": "G..." }'
```

- [ ] Login de prueba → wallet creada sin fondear
- [ ] Fund manual → wallet activada
- [ ] Ver dirección en Stellar Expert testnet

---

## Registro interno (rellenar sin secrets)

| Campo | Valor |
|-------|-------|
| App name | |
| App ID (si aparece) | |
| Network | testnet |
| Funding mode | Deferred |
| Publishable prefix | `pub_testnet_` ✓/✗ |
| Secret creada | ✓/✗ (no pegar) |
| Domains | |
| Auth providers | |
| USDC trustline | ✓/✗ |
| Funding wallet topped up | ✓/✗ |

---

*ALF-002 completo cuando Steps 1–8 estén checkeados. ALF-002b = webhook/activate endpoint en nuestro Worker.*
