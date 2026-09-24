# ALFRED — Mainnet readiness checklist (ALF-103)

**Status:** testnet only. Do **not** flip public copy or Pollar app to mainnet until every gate below is checked.

## Product / legal

- [ ] Privacy Policy + Terms published and linked from web (drafts: `/privacy`, `/terms` — counsel before mainnet)
- [ ] Jurisdiction / entity decided
- [ ] No PII in cleartext on-chain (hashes / ciphertext only) — re-audit issue claims

## Pollar

- [ ] Separate **mainnet** Pollar app (or network switch) with production keys
- [ ] Auth Policy allowlist audited (least privilege: `register`, `deploy`, `issue`, `revoke`, `collect_issue_fee` if fee > 0)
- [ ] Deferred funding without Friendbot; real USDC / sponsorship plan
- [ ] Domains: production web + API origins only
- [ ] Passkeys / C-accounts when dashboard offers them (ALF-002c)

## Stellar / contracts

- [ ] Redeploy DID registry + vault factory + vault WASM to **mainnet**
- [ ] Document IDs in `docs/deployments/mainnet.md`
- [ ] Multisig or hardware wallet for admin (not solo `alfred-deployer` laptop key)
- [ ] Fee config intentional (USDC SAC mainnet issuer / amount)
- [ ] Auth Policy contract IDs updated to mainnet C-addresses

## Cloudflare / API

- [ ] Friendbot / free activate paths **off**
- [ ] `STELLAR_NETWORK=mainnet` + RPC endpoints
- [ ] Secrets rotated for prod (`SESSION_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`, Pollar `sec_*`)
- [ ] Session TTL / rate limits reviewed under load
- [ ] Custom domain + TLS (not only `*.pages.dev`)
- [ ] Backup / export plan for D1 credential meta + blobs

## Security

- [ ] External review or at least threat-model pass against [`THREAT-MODEL.md`](./THREAT-MODEL.md)
- [ ] Incident runbook rehearsed ([`OPERATOR-RUNBOOK.md`](./OPERATOR-RUNBOOK.md))
- [ ] Encryption key rotation procedure tested on staging ([§ key rotation](./OPERATOR-RUNBOOK.md))

## Exit

When all boxes are checked: publish mainnet URLs in README, freeze testnet as “playground”, and announce carefully.
