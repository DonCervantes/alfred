# Trust model

| Asset | Control |
|-------|---------|
| Session | HttpOnly cookie + HMAC (`SESSION_SECRET`) |
| VC payload | AES-256-GCM off-chain; hash on-chain |
| Sponsorship | Pollar Auth Policy + deferred funding |
| Admin keys | Deployer identity — harden before mainnet |

**Honesty:** ALFRED does not claim anonymity. Metadata on Stellar is public.

Full write-up: [Threat model v0](threat-model.md) (synced from repo `docs/THREAT-MODEL.md`).
