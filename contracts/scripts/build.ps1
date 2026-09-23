# Build ALFRED Soroban contracts (ALF-024)
# Usage:
#   .\scripts\build.ps1
#   .\scripts\build.ps1 alfred-did-registry

param(
  [string]$Package = "all"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root
$env:CARGO_TARGET_DIR = Join-Path $Root "target"

function Build-One([string]$Name) {
  Write-Host "==> Building $Name"
  stellar contract build --package $Name
}

if ($Package -eq "all") {
  Build-One "alfred-did-registry"
  Build-One "alfred-vc-vault"
  Build-One "alfred-vc-vault-factory"
} else {
  Build-One $Package
}

Write-Host "Done. WASM under target/wasm32v1-none/release/"
