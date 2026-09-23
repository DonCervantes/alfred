# alfred-vc-vault-factory

Deploys per-holder `alfred-vc-vault` instances and holds USDC (SAC) issue-fee config.

## ABI

| Function | Auth | Description |
|----------|------|-------------|
| `__constructor(admin, vault_wasm_hash)` | admin | Init |
| `deploy(owner, salt)` | owner | Deterministic vault address |
| `is_vault(address)` | — | Registry check |
| `set_fee(token?, amount, recipient?)` | admin | Configure issue fee (`0` = free) |
| `collect_issue_fee(payer)` | payer | Transfer fee (bundle with `vault.issue`) |
| `quote_issue_fee` | — | Current amount |
| `set_vault_wasm_hash` / admin rotate | admin | Upgrades / ops |

## Deploy order (testnet)

```powershell
$env:CARGO_TARGET_DIR = "$PWD\target"
stellar contract build --package alfred-vc-vault
# upload wasm → note hash
stellar contract install --wasm target/wasm32v1-none/release/alfred_vc_vault.wasm `
  --source alfred-deployer --network testnet

stellar contract build --package alfred-vc-vault-factory
stellar contract deploy --wasm target/wasm32v1-none/release/alfred_vc_vault_factory.wasm `
  --source alfred-deployer --network testnet -- `
  --admin GBFT… --vault_wasm_hash <hash>
```
