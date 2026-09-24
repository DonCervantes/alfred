# Product overview

ALFRED is identity infrastructure that feels like a **product**, not an explorer.

| Principle | Meaning |
|-----------|---------|
| Brand-first UX | Quiet, bilingual ES/EN surface |
| Wallet abstraction | Pollar social login → Stellar account |
| Verify without an account | Public `/v/:token` presentation links |
| Hash on-chain | Claims encrypted off-chain (D1 today) |

Tagline: **Credentials you can prove.** / **Credenciales que puedes probar.**

## Surfaces (testnet)

| Path | Role |
|------|------|
| `/` | Holder vault, issue, issuer dashboard, document seal |
| `/edu` · `/edu/app` | Education vertical (mock + live ALFRED) |
| `/v/:token` | Public verify |
| `/privacy` · `/terms` | Legal drafts |

## Shipped beyond MVP A

- Credential **templates** (Alfred / Employment / Education)
- **Issuer** history, allowlist roles, batch revoke, CSV / audit
- **Document seal**: local SHA-256 → claim `documentHash` on issue
- Session **7d** + sliding refresh; durable API rate limits (D1)

Tickets: repo `docs/TICKETS.md` (Epics 6–10).
