# Document seal

Hash a file **in the browser** (SHA-256). The hex is written into the credential claim `documentHash` when you issue (Alfred / Education templates).

| Step | Where |
|------|--------|
| Upload / hash | Home → **Document seal** |
| Claim filled | Issue form → `documentHash` |
| Re-check file | Seal panel → paste expected hash → Verify |
| On-chain | Vault stores content hash of the VC payload (includes the claim) |

Not a substitute for legal e-signature. Detached Ed25519 of the file hash is optional later.

App: https://alfred-web-283.pages.dev (signed in).
