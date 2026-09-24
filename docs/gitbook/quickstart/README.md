# Quickstart

Get a verified credential on **Stellar testnet** in ~10 minutes.

## 1. Open the app

https://alfred-web-283.pages.dev

## 2. Sign in

Use **Continuar** → Google or GitHub (Pollar).  
You get an embedded Stellar **G-address** — no seed phrase for MVP.

## 3. Activate wallet

Tap **Activar billetera** (Deferred funding / Friendbot fallback on testnet).  
Wait until the UI shows the wallet as activated.

## 4. Create my ALFRED

Runs on-chain:

1. Register DID in `alfred-did-registry`  
2. Deploy your vault via `alfred-vc-vault-factory`

## 5. Issue → share → verify

1. Emit a credential to yourself (or another holder’s `G…`).  
2. **Compartir enlace** → open `/v/:token` (incognito OK).  
3. Expect **Credencial válida** when status is active on-chain.

## 6. Revoke (optional)

Revoke from your vault list; the verify link should fail closed.

---

**ES:** Si algo falla, copia el error rojo y revisa Auth Policy en Pollar (`register`, `deploy`, `issue`, `revoke`). Guía de dogfood: repo `docs/DOGFOOD.md`.

Full narrative + screenshots land in **ALF-050**.
