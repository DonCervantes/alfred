# Configure USDC issue fee on alfred-vc-vault-factory (ALF-023b)
#
# Usage:
#   .\scripts\set-usdc-fee.ps1
#   .\scripts\set-usdc-fee.ps1 -Amount 1000000   # 0.1 USDC (7 decimals)
#   .\scripts\set-usdc-fee.ps1 -Amount 0         # disable fee
#
# Also ensures classic USDC trustline on the signing account (for receiving fees).

param(
  [string]$FactoryId = "CAMHSVEVALQ4UORC6WXBX3L7I4YGFL7FTBBML4DJZCN637I4NXJLIZIY",
  [string]$UsdcSac = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  [string]$UsdcIssuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  [long]$Amount = 1000000, # 0.1 USDC
  [string]$Recipient = "",
  [string]$Network = "testnet",
  [string]$Source = "alfred-deployer",
  [switch]$SkipTrustline
)

$ErrorActionPreference = "Continue"

if (-not $Recipient) {
  $Recipient = (stellar keys address $Source).Trim()
}

Write-Host "Factory : $FactoryId"
Write-Host "USDC SAC: $UsdcSac"
Write-Host "Amount  : $Amount (base units, 7 decimals)"
Write-Host "Recipient: $Recipient"

if (-not $SkipTrustline) {
  Write-Host "==> Ensuring USDC trustline on $Source"
  stellar tx new change-trust `
    --source $Source `
    --network $Network `
    --line "USDC:$UsdcIssuer"
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "change-trust failed (exit $LASTEXITCODE). Retry with -SkipTrustline if trustline already exists."
  }
}

$ErrorActionPreference = "Stop"

if ($Amount -eq 0) {
  Write-Host "==> Disabling fee (amount=0)"
  stellar contract invoke `
    --id $FactoryId `
    --source $Source `
    --network $Network `
    -- `
    set_fee `
    --token null `
    --amount 0 `
    --recipient null
} else {
  # Stellar CLI 27 strips bare quotes around Address; use \"...\" so JSON string survives.
  $tokenArg = '\"' + $UsdcSac + '\"'
  $recipientArg = '\"' + $Recipient + '\"'
  Write-Host "==> set_fee"
  stellar contract invoke `
    --id $FactoryId `
    --source $Source `
    --network $Network `
    -- `
    set_fee `
    --token $tokenArg `
    --amount $Amount `
    --recipient $recipientArg
}

Write-Host "==> quote_issue_fee"
stellar contract invoke `
  --id $FactoryId `
  --source $Source `
  --network $Network `
  -- quote_issue_fee
