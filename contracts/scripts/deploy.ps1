# Deploy helper (ALF-024 / ALF-025)
# Usage (PowerShell):
#   .\scripts\deploy.ps1 alfred-did-registry testnet alfred-deployer

param(
  [Parameter(Mandatory = $true)][string]$Package,
  [string]$Network = "testnet",
  [string]$Source = "alfred-deployer"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

stellar contract build --package $Package
$wasm = Get-ChildItem -Recurse -Filter "$Package*.wasm" target | Where-Object { $_.FullName -match "release" -and $_.Name -notmatch "optimized" } | Select-Object -First 1
if (-not $wasm) {
  # stellar uses underscore crate names in wasm often
  $wasm = Get-ChildItem -Path "target" -Recurse -Filter "*.wasm" | Where-Object { $_.FullName -match "release" } | Select-Object -First 1
}

Write-Host "Deploying $Package from $($wasm.FullName) to $Network as $Source"
stellar contract deploy --wasm $wasm.FullName --source $Source --network $Network
