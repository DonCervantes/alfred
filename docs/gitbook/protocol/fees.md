# Fees (USDC)

Issuance fee is configured on the **vault factory** (USDC SAC on testnet).

| State | Behavior |
|-------|----------|
| `quote_issue_fee = 0` | Free issue |
| amount > 0 (**live: 0.1 USDC**) | App calls `collect_issue_fee` then `vault.issue` |

**Current testnet:** fee **disabled** (`amount = 0`). Enabling 0.1 USDC requires every issuer Pollar wallet to have a **USDC trustline** + balance; otherwise `collect_issue_fee` fails with `trustline entry is missing`.

```powershell
cd contracts
.\scripts\set-usdc-fee.ps1 -Amount 0    # dogfood default (recommended)
.\scripts\set-usdc-fee.ps1              # 0.1 USDC — only if Pollar wallets have USDC trustlines
```
