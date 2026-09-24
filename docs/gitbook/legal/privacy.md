# Privacy Policy (draft)

**Status:** Draft for **Stellar testnet** preview · Not legal advice · Last updated: 2026-09-24

ALFRED (“we”) operates the testnet app at `alfred-web-283.pages.dev` and related API workers.

## What we process

| Data | Purpose |
|------|---------|
| Pollar auth identity (social provider, wallet address) | Sign-in, session |
| Stellar address, DID, vault contract ID | Product features |
| Credential metadata + **encrypted** claim payloads | Issue / list / verify / revoke |
| Presentation tokens | Time-limited public verify links |
| Technical logs (IP for rate limits, errors) | Abuse prevention, ops |

We do **not** put cleartext PII on-chain. On-chain data is identifiers, status, and **hashes**.

## Controllers / processors

- **ALFRED operator** — Cloudflare Workers + D1 (encrypted blobs).  
- **Pollar** — login and custodial wallet (see Pollar’s policies).  
- **Stellar / network operators** — public ledger data.

## Retention

- Sessions: about **7 days** (sliding refresh).  
- Credentials / ciphertext: until revoked or operator deletion.  
- Presentation links: TTL (default ~72h).

## Your choices

- Sign out; stop using the testnet app.  
- Request deletion of off-chain rows by contacting the operator (testnet best-effort).  
- On-chain records cannot be erased from the public ledger.

## Contact

Operator contact for this preview: repository / project maintainers (see GitHub `DonCervantes/alfred`).

Replace this draft with counsel-reviewed text before mainnet or collecting real user PII at scale.
