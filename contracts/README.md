# Contracts workspace

Soroban contracts for ALFRED (Stellar CLI / `soroban-sdk` 26).

## Packages

| Crate | Role |
|-------|------|
| `alfred-did-registry` | On-chain DID registry |
| `alfred-vc-vault` | Per-holder VC vault |
| `alfred-vc-vault-factory` | Deploy vaults + USDC issue fee |

Live IDs: [`docs/deployments/testnet.md`](../docs/deployments/testnet.md)

## Scripts (ALF-024)

```powershell
cd contracts
.\scripts\build.ps1
.\scripts\deploy.ps1 -Package alfred-did-registry
.\scripts\deploy.ps1 -Package alfred-vc-vault-factory
.\scripts\set-usdc-fee.ps1          # ALF-023b (0.1 USDC default)
.\scripts\set-usdc-fee.ps1 -Amount 0  # disable fee
```

Bash build: `./scripts/build.sh [package|all]`

## Test

```powershell
$env:CARGO_TARGET_DIR = "$PWD\target"
cargo test -p alfred-did-registry
cargo test -p alfred-vc-vault
# factory tests need vault WASM built first:
.\scripts\build.ps1 alfred-vc-vault
cargo test -p alfred-vc-vault-factory
```
