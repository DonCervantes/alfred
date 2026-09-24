# ALF-053 — Dogfood testnet (5 usuarios)

**Goal:** 5 personas reales completan el flujo MVP en testnet sin ayuda “mágica” del operador.  
**App:** https://alfred-web-283.pages.dev  
**API:** https://alfred.cruzcervantesdanieladrianelias.workers.dev/api/health  

**Exit (from master spec):** success rate ≥ ~95% on happy path; blockers logged with repro.

---

## 0. Prep del operador (antes de invitar)

Haz esto **una vez** en [dashboard.pollar.xyz](https://dashboard.pollar.xyz):

### Domains
- [ ] `https://alfred-web-283.pages.dev` en redirect URIs + allowed origins  
- [ ] `http://localhost:3000` si alguien prueba en local  

### Treasury → Auth Policy (crítico)
Permite firmas Soroban para:

| Contract | Methods |
|----------|---------|
| `alfred-did-registry` (`CCLOO56U…`) | `register` |
| `alfred-vc-vault-factory` (`CAMHSVE…`) | `deploy`, `collect_issue_fee` (fee **off** = 0; Pollar wallets suelen no tener trustline USDC) |
| `alfred-vc-vault` (cada vault C…) | `issue`, `revoke` |
| USDC SAC (si fee > 0) | transfer vía collect |

### Treasury → Account Funding
- [ ] Modo **Deferred**  
- [ ] Saldo XLM testnet en funding / sponsorship (o confiar en Friendbot fallback del API)  

### Smoke propio (tú = User 0)
Completa la sección 1 abajo **antes** de invitar a nadie. Si tú fallas, no invites.

---

## 1. Script por usuario (~10–15 min)

Envía a cada tester:

> Entra a https://alfred-web-283.pages.dev  
> Usa Google o GitHub.  
> Anota errores tal cual (texto rojo o detalle monoespaciado).

| # | Paso | Esperado | ✓/✗ | Notas |
|---|------|----------|-----|-------|
| 1 | Abrir Pages | Landing ALFRED + Continuar | | |
| 2 | Login Pollar (Google/GitHub) | Vuelve a la app, “Sesión iniciada” | | |
| 3 | Activar / Refondear billetera | “Billetera activada” (puede usar Friendbot) | | |
| 4 | Crear mi ALFRED | DID + vault on-chain; wizard ✓ | | |
| 5 | Emitir credencial a **ti mismo** | Aparece en “Tu vault” como `valid` | | |
| 6 | Compartir enlace | URL `/v/…` | | |
| 7 | Abrir enlace (incógnito OK) | “Credencial válida” + claims | | |
| 8 | Revocar | Status `revoked` | | |
| 9 | (Opcional) Emitir a **otro** tester (su `G…`) | Ellos la ven en su lista | | |

### Datos a copiar (por usuario)

```
Fecha:
Nombre / handle:
G-address:
DID:
Vault C-address:
Verify URL:
Errores:
```

Explorers:

- Cuenta: `https://stellar.expert/explorer/testnet/account/<G…>`  
- Vault: `https://stellar.expert/explorer/testnet/contract/<C…>`  

---

## 2. Matriz de 5 usuarios

| User | Login | Activate | Create ALFRED | Issue self | Share/verify | Revoke | Issue cross | Blocker |
|------|-------|----------|---------------|------------|--------------|--------|-------------|---------|
| U0 (tú) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| U1 | — | — | — | — | — | — | | Cerrado sin más testers |
| U2 | — | — | — | — | — | — | | Cerrado sin más testers |
| U3 | — | — | — | — | — | — | | Cerrado sin más testers |
| U4 | — | — | — | — | — | — | | Cerrado sin más testers |

> **2026-09-24 — ALF-053 Done:** U0 happy path completo (hasta revoke). Operador cierra ticket; U1–U4 opcionales si llegan después.

**Pass:** ≥ 4/5 completan pasos 1–8 sin intervención del operador.  
**Fail:** cualquier paso roto para ≥ 2 usuarios con el mismo error.

---

## 3. Fallos conocidos / qué mirar

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| `Account not found` al crear ALFRED | Auth Policy / fondeo / cache axios (ya parcheado) | Refondear; revisar Auth Policy |
| Pollar `SOROBAN_AUTH` / `NOT_ALLOWED` | Falta método en Auth Policy | Añadir `register` / `deploy` / `issue` / `revoke` |
| `HOLDER_NO_VAULT` al emitir a otro | El holder no hizo “Crear mi ALFRED” | Que complete onboarding primero |
| Fee USDC / `trustline entry is missing` | Fee > 0 y la G-account Pollar no tiene trustline USDC | Dejar fee=0 (`set-usdc-fee.ps1 -Amount 0`) — default dogfood. Solo reactivar fee si Pollar añade trustline+USDC al fondear |
| Verify link 404/410 | Token mal / expiró (72h default) | Re-compartir |
| Sesión no pega (Pages) | Cookie / CORS / API URL | Confirmar `VITE_API_URL` = workers.dev en el build de Pages |

API rápido:

```text
https://alfred.cruzcervantesdanieladrianelias.workers.dev/api/health
https://alfred.cruzcervantesdanieladrianelias.workers.dev/api/health?account=G…
```

---

## 4. Mensaje corto para invitados (ES)

```
Hola — ¿me ayudas 10 min con ALFRED (testnet)?

1) Entra: https://alfred-web-283.pages.dev
2) Continuar con Google/GitHub
3) Activar billetera → Crear mi ALFRED
4) Emite una credencial a ti mismo → Compartir enlace → ábrelo
5) Si algo falla, mándame captura del error rojo

No necesitas crypto ni XLM; es testnet.
```

---

## 5. Cierre ALF-053

Cuando la matriz esté llena:

- [x] Pegar resumen (pass/fail + top 3 bugs) aquí abajo  
- [x] Abrir tickets/fixes para blockers  
- [x] Marcar **ALF-053 = Done** en `docs/TICKETS.md`  
- [x] Desbloquear **ALF-054** (pitch/whitepaper freeze)

### Resumen (rellenar al terminar)

```
Fecha fin: 2026-09-24
Pass rate: U0 happy path completo (login → activate → DID/vault → issue → share/verify → revoke).
  Invites U1–U4: operador cierra ticket; ampliar matriz si llegan más testers.
Top bugs:
1. Landing: mark SVG a tamaño hero tapaba el copy (fix deploy 2026-09-24).
2. Build Pages: VITE_API_URL localhost vía .env.local (mitigado: .env.production + .env.development.local).
3. E2e verify: mock de ruta Playwright (pathname /api/verify/) — arreglado.
Decisiones:
- Fee on-chain = 0 durante dogfood.
- ALF-053 cerrado por operador; ALF-054 desbloqueado.
```
