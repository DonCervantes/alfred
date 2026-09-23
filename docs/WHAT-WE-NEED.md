# Qué necesitamos para empezar a construir ALFRED

Checklist de inputs, cuentas y decisiones. Sin estos ítems no podemos desplegar ni integrar de punta a punta.

---

## 1. Decisiones de producto (responder ya)

| # | Pregunta | Opciones sugeridas | Tu respuesta |
|---|----------|--------------------|--------------|
| 1 | **MVP scope** | A) Solo DID + Vault VC (como ACTA core) · B) + Issuer portal · C) + 1 producto vertical (ej. historial crediticio) | **A** (cerrado). B/C = stretch tickets ALF-060+ / ALF-070+ si hay tiempo |
| 2 | **Red Stellar inicial** | Testnet (recomendado) → Mainnet después | **Testnet** (cerrado) |
| 3 | **Tipo de wallet Pollar** | G-account clásica · C-account smart wallet · ambas | **Ambas** (cerrado) |
| 4 | **Funding mode Pollar** | Immediate · Deferred (post-KYC) | **Deferred** (cerrado) |
| 5 | **Idioma por defecto UI** | `es` · `en` · detectar navegador | **Detectar navegador** (fallback `es`) (cerrado) |
| 6 | **Dominio** | ¿Tienes dominio? Ej. `alfred.build`, `getalfred.app` | **Aún no** → `*.pages.dev` (cerrado) |
| 7 | **Nombre legal / marca** | Solo “ALFRED” o tagline (ej. *Credentials, quietly verified*) | **ALFRED** + EN *Credentials you can prove.* / ES *Credenciales que puedes probar.* (cerrado) |
| 8 | **Fee on-chain** | Gratis en testnet · XLM · USDC por emisión de VC | **USDC por emisión** (cerrado) |

---

## 2. Cuentas y accesos (crear / compartir)

### Stellar CLI & keys
- [ ] `stellar` CLI instalado (`stellar --version`)
- [ ] Cuenta deployer testnet (`stellar keys generate alfred-deployer --network testnet`)
- [ ] Fondos testnet (Friendbot)
- [ ] Decisión: ¿quién custodia la secret key del deployer? (1Password / KMS / Cloudflare Secrets)

### Pollar (login + wallet embebida) — https://pollar.xyz
- [ ] Cuenta en [dashboard.pollar.xyz](https://dashboard.pollar.xyz)
- [ ] App creada: **ALFRED**
- [ ] Publishable key (testnet) → `POLLAR_PUBLISHABLE_KEY`
- [ ] Secret key (solo server) → `POLLAR_SECRET_KEY`
- [ ] Dominios allowlisted (`localhost:3000`, preview Cloudflare, prod)
- [ ] Auth providers activados (Google / Apple / email OTP)
- [ ] Branding del modal alineado a ALFRED (colores, logo)

### Cloudflare (deploy)
- [ ] Cuenta Cloudflare
- [ ] Workers + Pages habilitados
- [ ] `wrangler` login
- [ ] Plan: Pages (frontend) + Workers (API) + D1 o KV / R2 según TRD
- [ ] Dominio + DNS en Cloudflare (cuando exista)

### GitBook (docs públicas)
- [ ] Espacio GitBook “ALFRED Docs”
- [ ] Sync con `docs/gitbook/` del repo (o export manual)
- [ ] Dominio docs: `docs.alfred.*`

### GitHub
- [ ] Org o user donde vivirá el monorepo (`alfred-protocol` / `alfred-hq`)
- [ ] Repo privado o público (recomendación MVP: privado → público al launch)

---

## 3. Assets de marca (Apple-like)

- [ ] Logo (SVG + PNG) — preferible wordmark tipográfico limpio
- [ ] Icono app (1024×1024)
- [ ] Paleta: decidir **light-first** (Apple Marketing) vs dark-first
- [ ] Tipografías: SF Pro no es licenciable en web → alternativas: **Inter Display no**; usar **Geist**, **Söhne**, **Neue Haas Grotesk**, o **SF Pro vía sistema** + fallback
- [ ] 3–5 fotos / renders de producto (vacío ok al inicio; usamos sistema tipográfico + motion)
- [ ] Copy tone: calm, precise, no hype crypto

---

## 4. Compliance & legal (mínimo viable)

- [ ] Jurisdicción de la entidad
- [ ] Privacy Policy + Terms (borrador)
- [ ] Política de datos en VC: **nunca PII en claro on-chain** (hashes / ciphertext)
- [ ] ¿KYC requerido en MVP? (si sí → Deferred funding en Pollar)

---

## 5. Para el día 1 de código (mínimo absoluto)

Con solo esto arrancamos:

1. Confirmación MVP = **A (DID + Vault + issue/list/revoke VC)**  
2. Pollar publishable + secret (testnet)  
3. Stellar CLI + deployer funded en testnet  
4. Cuenta Cloudflare + wrangler  
5. Respuestas de la tabla de decisiones (§1)

El resto (GitBook, dominio, logo final) puede llegar en paralelo.

---

## 6. Lo que NO necesitamos aún

- Mainnet keys  
- Auditoría formal  
- Token / tokenomics  
- App store nativa  
- Equipo grande (1–2 builders bastan para MVP)
