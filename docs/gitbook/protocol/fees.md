# Fees (USDC)

Issuance fee is configured on the **vault factory** (USDC SAC on testnet).

| State | Behavior |
|-------|----------|
| `quote_issue_fee = 0` | Free issue (**current dogfood default**) |
| amount > 0 | App calls `collect_issue_fee` then `vault.issue` |

**Current testnet:** fee **disabled**. Enabling USDC (e.g. 0.1) requires every issuer Pollar wallet to have a **USDC trustline** + balance; otherwise `collect_issue_fee` fails with `trustline entry is missing`.

API:

- `GET /api/fees/quote` — public quote (`enabled: false` when amount is 0)
- `POST /api/credentials/prepare-issue` — returns `fee` + optional `feeCollectXdr`

```powershell
cd contracts
.\scripts\set-usdc-fee.ps1 -Amount 0    # dogfood default
.\scripts\set-usdc-fee.ps1              # 0.1 USDC — only if Pollar wallets have USDC trustlines
```

Pollar Auth Policy must allow `collect_issue_fee` when fee > 0.
