# Threat model v0

Source of truth in the repo: [`docs/THREAT-MODEL.md`](../../THREAT-MODEL.md).

Summary for readers of this book:

- Scope: **testnet MVP** (Pollar + Workers + Pages + Soroban).  
- Acceptable on testnet: Friendbot activate, D1 ciphertext, in-memory rate limits, fee = 0.  
- Not acceptable on mainnet without fixes: Friendbot paths, single admin key, no key-rotation plan.

P0 incidents: leaked `SESSION_SECRET` / encryption key / Pollar `sec_*`, unexpected admin change, wrong verify status vs chain.

Operator steps: [Operator runbook](../reference/operator.md).
