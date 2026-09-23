# Deploy ALFRED contracts to Stellar (ALF-024 / ALF-025)
#
# Usage:
#   .\scripts\deploy.ps1 -Package alfred-did-registry
#   .\scripts\deploy.ps1 -Package alfred-vc-vault-factory
#   .\scripts\deploy.ps1 -Package alfred-vc-vault -Owner G... -Factory C...
#
# Env (optional):
#   ALFRED_ADMIN   — admin/owner address (default: alfred-deployer pubkey)
#   ALFRED_SOURCE  — signing identity (default: alfred-deployer)
#   ALFRED_NETWORK — network (default: testnet)

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("alfred-did-registry", "alfred-vc-vault", "alfred-vc-vault-factory")]
  [string]$Package,

  [string]$Network = $(if ($env:ALFRED_NETWORK) { $env:ALFRED_NETWORK } else { "testnet" }),
  [string]$Source = $(if ($env:ALFRED_SOURCE) { $env:ALFRED_SOURCE } else { "alfred-deployer" }),
  [string]$Admin = $env:ALFRED_ADMIN,
  [string]$Owner = "",
  [string]$Factory = "",
  [string]$VaultWasmHash = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root
$env:CARGO_TARGET_DIR = Join-Path $Root "target"

if (-not $Admin) {
  $Admin = (stellar keys address $Source).Trim()
}
if (-not $Owner) { $Owner = $Admin }

function Wasm-Path([string]$CrateUnderscore) {
  $p = Join-Path $Root "target\wasm32v1-none\release\$CrateUnderscore.wasm"
  if (-not (Test-Path $p)) {
    throw "Missing WASM: $p — run .\scripts\build.ps1 first"
  }
  return $p
}

Write-Host "==> Building $Package"
stellar contract build --package $Package

switch ($Package) {
  "alfred-did-registry" {
    $wasm = Wasm-Path "alfred_did_registry"
    Write-Host "==> Deploying DID registry (admin=$Admin)"
    stellar contract deploy --wasm $wasm --source $Source --network $Network -- `
      --admin $Admin
  }
  "alfred-vc-vault" {
    $wasm = Wasm-Path "alfred_vc_vault"
    $factoryArg = if ($Factory) { $Factory } else { "null" }
    Write-Host "==> Deploying standalone vault (owner=$Owner factory=$factoryArg)"
    stellar contract deploy --wasm $wasm --source $Source --network $Network -- `
      --owner $Owner --factory $factoryArg
  }
  "alfred-vc-vault-factory" {
    # Ensure vault WASM is built + uploaded so factory stores the hash
    Write-Host "==> Building + uploading alfred-vc-vault WASM"
    stellar contract build --package alfred-vc-vault
    $vaultWasm = Wasm-Path "alfred_vc_vault"
    if (-not $VaultWasmHash) {
      $VaultWasmHash = (stellar contract upload --wasm $vaultWasm --source $Source --network $Network).Trim()
    }
    Write-Host "==> Vault WASM hash: $VaultWasmHash"
    $wasm = Wasm-Path "alfred_vc_vault_factory"
    Write-Host "==> Deploying factory (admin=$Admin)"
    stellar contract deploy --wasm $wasm --source $Source --network $Network -- `
      --admin $Admin --vault_wasm_hash $VaultWasmHash
  }
}

Write-Host "Record the contract ID in docs/deployments/testnet.md"
