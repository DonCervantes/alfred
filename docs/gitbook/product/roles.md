# Roles

Aligned with the W3C Verifiable Credentials Data Model:

| Role | Job in ALFRED |
|------|----------------|
| **Holder** | Owns a DID + vault; receives, lists, shares, revokes |
| **Issuer** | Issues into a holder’s vault (may be self-issue) |
| **Verifier** | Opens a share link or calls verify API — no wallet required for public status |
| **Operator** | Deploys contracts, runs Workers, Pollar Auth Policy, sponsorship |

Pollar abstracts keys for holders/issuers; **on-chain status** remains authoritative for validity and revocation.
