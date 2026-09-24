# Architecture

```
[Browser / Pages]
       │  Pollar OAuth + sign txs
       ▼
[Worker API + D1] ── encrypted VC blobs
       │
       ▼
[Soroban]  DID registry · vault factory · per-holder vaults
```

1. **Pages** — React app (login, wizard, vault, verify).  
2. **Worker** — session cookies, prepare/confirm XDRs, encrypt claims, public verify.  
3. **Contracts** — DID lifecycle + VC hash/status per vault.  
4. **Pollar** — auth + optional fee-bump / deferred funding.

Details expand in whitepaper (`docs/WHITEPAPER.md`) and **ALF-050** protocol excerpt.
