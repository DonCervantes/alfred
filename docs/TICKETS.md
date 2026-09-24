# ALFRED — Ticket Backlog (Build)

**Board legend:** `Todo` · `Blocked` · `In Progress` · `Done`  
**Priority:** P0 = MVP crítico · P1 = importante · P2 = nice / stretch  

Responde `docs/WHAT-WE-NEED.md` / las preguntas del chat antes de desbloquear tickets marcados **Blocked (needs answers)**.

### Decisiones cerradas (ALF-001 parcial)

| Decisión | Valor | Notas |
|----------|-------|-------|
| **MVP scope** | **A — DID + Vault VC** | Emitir / listar / revocar / verificar. B y C = stretch tickets ALF-060+ / ALF-070+ si hay tiempo. |
| **Red Stellar** | **Testnet** | Mainnet después del dogfood. |
| **Wallet Pollar** | **G ahora; C cuando Passkeys** | Ambas deseadas; Passkey no está en dashboard aún → MVP con G. |
| **Funding Pollar** | **Deferred** | Activación post-evento (ej. KYC). Seguir guía Deferred Flow de Pollar + webhooks. |
| **Locale UI** | **Detectar navegador** | Fallback: `es`. Cookie de preferencia pisa el header. |
| **Dominio** | **`*.pages.dev` por ahora** | Conectar dominio custom después. |
| **Marca / tagline** | **ALFRED + tagline** | EN: *Credentials you can prove.* · ES: *Credenciales que puedes probar.* |
| **Fee on-chain MVP** | **USDC por emisión** | Factory fee en testnet (setup trustline + quote). Más realista; más trabajo en ALF-023/025. |

**ALF-001 status:** decisiones de producto **cerradas**. |

---

## Epic 0 — Kickoff & accounts

| ID | Título | P | Status | Depends |
|----|--------|---|--------|---------|
| **ALF-001** | Completar decisiones de producto (MVP, red, Pollar, dominio, locale) | P0 | Done | — |
| **ALF-002** | Crear app Pollar (testnet) + keys + domains + auth + deferred + USDC | P0 | Done (branding pendiente) | ALF-001 |
| **ALF-002b** | Webhook / evento de activación deferred (`POST /api/activate`) | P0 | Done | ALF-002 |
| **ALF-002c** | Activar Passkey / C-accounts en Pollar cuando el dashboard lo ofrezca | P2 | Backlog | ALF-002 |
| **ALF-002d** | Branding modal Pollar (ALFRED, accent #0071E3, logo) | P2 | Todo | ALF-002 |
| **ALF-003** | Instalar Stellar CLI + generar `alfred-deployer` + Friendbot | P0 | Done | — |
| **ALF-004** | Cuenta Cloudflare + `wrangler login` + proyecto vacío Pages/Worker | P0 | Done | — |
| **ALF-005** | Crear espacio GitBook + estructura índice | P1 | Todo | ALF-001 |
| **ALF-006** | Assets de marca v0 (wordmark, colores, favicon) | P1 | Todo | ALF-001 |

---

## Epic 1 — Monorepo scaffold

| ID | Título | P | Status | Depends |
|----|--------|---|--------|---------|
| **ALF-010** | Scaffold monorepo (`apps/web`, `apps/api`, `contracts`, `packages`) | P0 | Done | ALF-001 |
| **ALF-011** | Config Cloudflare Worker (Hono) + D1 schema v0 | P0 | Done | ALF-004, ALF-010 |
| **ALF-012** | Config Pages/Vite React + Tailwind v4 + tokens Apple-like | P0 | Done | ALF-010 |
| **ALF-013** | i18n ES/EN (diccionarios + switcher) | P0 | Done | ALF-012 |
| **ALF-014** | `.env.example` + Secrets map (Pollar, Session, Stellar IDs) | P0 | Done | ALF-002, ALF-010 |
| **ALF-015** | CI GitHub Actions: lint + typecheck (skeleton) | P1 | Blocked | ALF-010 |

---

## Epic 2 — Smart contracts (Stellar CLI)

| ID | Título | P | Status | Depends |
|----|--------|---|--------|---------|
| **ALF-020** | Workspace Rust: `alfred-did-registry` scaffold + tests smoke | P0 | Done | ALF-003, ALF-010 |
| **ALF-021** | Implement DID register/update/get/deactivate | P0 | Done | ALF-020 |
| **ALF-022** | Workspace: `alfred-vc-vault` issue/revoke/get/list/verify | P0 | Done | ALF-020 |
| **ALF-023** | Workspace: `alfred-vc-vault-factory` deploy/is_vault + **fee USDC** | P0 | Done (fee=0) | ALF-022 |
| **ALF-023b** | Config testnet: USDC trustline, `set_fee_*`, quote en issue flow | P0 | Partial (script) | ALF-023, ALF-025 |
| **ALF-024** | Scripts `build` + `deploy` vía Stellar CLI | P0 | Done | ALF-021, ALF-023 |
| **ALF-025** | Deploy testnet + documentar IDs en `docs/deployments/testnet.md` | P0 | Done | ALF-003, ALF-024 |
| **ALF-026** | Generar TypeScript bindings → `packages/stellar` | P0 | Done | ALF-025 |

---

## Epic 3 — Auth & API

| ID | Título | P | Status | Depends |
|----|--------|---|--------|---------|
| **ALF-030** | Integrar `@pollar/react` Sign-in en Continuar / landing | P0 | Done | ALF-002, ALF-012 |
| **ALF-031** | `POST /api/auth/session` + cookies HttpOnly | P0 | Done | ALF-011, ALF-030 |
| **ALF-032** | `GET /api/me` (perfil, did, vault) | P0 | Done | ALF-031 |
| **ALF-033** | Endpoints DID register + Vault deploy (preparar XDR) | P0 | Done | ALF-026, ALF-032 |
| **ALF-034** | Issue/list/revoke + encrypt R2 + hash on-chain | P0 | Blocked | ALF-033 |
| **ALF-035** | Presentation links + `GET /api/verify/:token` público | P0 | Blocked | ALF-034 |
| **ALF-036** | Rate limits + CSP básicos | P1 | Blocked | ALF-031 |

---

## Epic 4 — UI producto (Apple-like)

| ID | Título | P | Status | Depends |
|----|--------|---|--------|---------|
| **ALF-040** | Landing marketing (brand hero + 1 CTA) | P0 | Blocked | ALF-013 |
| **ALF-041** | First-run wizard: Create my ALFRED (DID+Vault) | P0 | Done | ALF-033, ALF-030 |
| **ALF-042** | Vault list + empty state + detail | P0 | Blocked | ALF-034 |
| **ALF-043** | Flujo Issue (issuer) | P0 | Blocked | ALF-034 |
| **ALF-044** | Public verify `/v/:token` | P0 | Blocked | ALF-035 |
| **ALF-045** | Motion (page fade, success check, sheet) + a11y pass | P1 | Blocked | ALF-040–044 |
| **ALF-046** | Settings: locale ES/EN + logout | P1 | Blocked | ALF-032 |

---

## Epic 5 — Docs, harden, dogfood

| ID | Título | P | Status | Depends |
|----|--------|---|--------|---------|
| **ALF-050** | Publicar GitBook: quickstart + protocol excerpt | P1 | Blocked | ALF-005, ALF-025 |
| **ALF-051** | Playwright smoke (signin mock / verify page) | P1 | Blocked | ALF-044 |
| **ALF-052** | Threat model v0 + runbook operador | P1 | Blocked | ALF-034 |
| **ALF-053** | Dogfood testnet con 5 usuarios | P0 | Blocked | ALF-041–044 |
| **ALF-054** | Freeze pitch deck + whitepaper v1 (copy final) | P2 | Blocked | ALF-053 |

---

## Epic 6 — Stretch / futuras mejoras (solo si alcanza el tiempo)

> **No bloquean el MVP.** Se abren ahora para priorizar si sobra capacidad tras ALF-053.
> Camino natural: terminar **A** → stretch **B** (issuer portal) → stretch **C** (vertical).

### 6a — Opción B: Portal de issuer completo

| ID | Título | P | Status | Depends |
|----|--------|---|--------|---------|
| **ALF-060** | Plantillas de credencial (tipos + schema JSON reutilizable) | P2 | Backlog | ALF-053 |
| **ALF-061** | Dashboard issuer: historial de emisiones + filtros | P2 | Backlog | ALF-060 |
| **ALF-062** | Gestión de issuers (allowlist / roles org) | P2 | Backlog | ALF-061 |
| **ALF-063** | Revocación batch + motivo de revoke | P2 | Backlog | ALF-061 |
| **ALF-064** | Export CSV / audit log de emisiones | P2 | Backlog | ALF-061 |

### 6b — Opción C: Producto vertical (ej. historial crediticio)

| ID | Título | P | Status | Depends |
|----|--------|---|--------|---------|
| **ALF-070** | Elegir vertical + PRD corto (credit / employment / education) | P2 | Backlog | ALF-053 |
| **ALF-071** | App vertical scaffold (`apps/<vertical>`) sobre vault ALFRED | P2 | Backlog | ALF-070 |
| **ALF-072** | Flujos holder del vertical (list / share / verify UX) | P2 | Backlog | ALF-071 |
| **ALF-073** | Modo mock + modo real (como products-acta credit-history) | P2 | Backlog | ALF-072 |
| **ALF-074** | Landing del vertical + copy ES/EN | P2 | Backlog | ALF-072 |

---

## Orden de ataque recomendado (Sprint 0 → 1)

```
ALF-001 (preguntas)
  → ALF-003, ALF-004 (en paralelo)
  → ALF-002 (Pollar)
  → ALF-010 → ALF-011 + ALF-012
  → ALF-020…026 (contracts)
  → ALF-030…035 (API)
  → ALF-040…044 (UI)
  → ALF-053 (dogfood)
  → (si hay tiempo) ALF-060…064 (B) → ALF-070…074 (C)
```

## Cómo usar estos tickets

1. Responde las preguntas del chat (ALF-001).  
2. Marcamos tickets `Blocked → Todo`.  
3. Empezamos por **ALF-003 + ALF-004 + ALF-010** en la siguiente sesión de build.  
4. Opcional: abrir cada `ALF-XXX` como GitHub Issue cuando exista el remote.  
5. Stretch B/C solo después de dogfood MVP (**ALF-053**).

---

*Backlog v0.1 — alineado a `ALFRED-MASTER-SPEC.md` §6*
