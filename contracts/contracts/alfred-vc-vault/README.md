# alfred-vc-vault

Per-holder Verifiable Credential vault for ALFRED.

Plaintext claims stay off-chain; on-chain stores `content_hash` (+ optional `https://` URI).

## ABI

| Function | Auth | Description |
|----------|------|-------------|
| `__constructor(owner, factory?)` | owner | Init vault |
| `issue(issuer, vc_id, content_hash, uri?)` | issuer | Store Active VC |
| `batch_issue(issuer, items)` | issuer | Up to 10 issues |
| `revoke(caller, vc_id)` | issuer or owner | Tombstone Active → Revoked |
| `get_vc` / `list_vc_ids` / `vc_count` | — | Reads |
| `verify_vc(vc_id, content_hash)` | — | Active + hash match |
| `set_issuance_mode` / `allow_issuer` / `deny_issuer` | owner | Open vs allowlist |

## Build / test

```powershell
cd contracts
cargo test -p alfred-vc-vault
stellar contract build --package alfred-vc-vault
```

Deploy instances via `alfred-vc-vault-factory` (ALF-023), or standalone for smoke tests.
