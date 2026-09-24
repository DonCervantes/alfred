# Fees (USDC)

Issuance fee is configured on the **vault factory** (USDC SAC on testnet).

| State | Behavior |
|-------|----------|
| `quote_issue_fee = 0` | Free issue (current dogfood default) |
| amount > 0 | App calls `collect_issue_fee` then `vault.issue` |

API:

- `GET /api/fees/quote` — public quote  
- `POST /api/credentials/prepare-issue` — returns `fee` + optional `feeCollectXdr`

Enable on-chain (operator):

```powershell
cd contracts
.\scripts\set-usdc-fee.ps1              # default 0.1 USDC
.\scripts\set-usdc-fee.ps1 -Amount 0    # disable
```

Issuers need USDC trustline + balance; Pollar Auth Policy must allow `collect_issue_fee`.
