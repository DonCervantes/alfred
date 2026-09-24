# VC vaults & factory

| Contract | Role |
|----------|------|
| `alfred-vc-vault-factory` | `deploy(owner, salt)` → per-holder vault; `is_vault`; fee config |
| `alfred-vc-vault` | `issue` / `revoke` / `get_vc` / `verify_vc` / list |

On issue:

1. API encrypts canonical claims → storage key  
2. SHA-256 content hash anchored on-chain with `vc_id`  
3. Status `valid` / `revoked` drives public verify

Factory stores optional link to fee collection (`collect_issue_fee`).
