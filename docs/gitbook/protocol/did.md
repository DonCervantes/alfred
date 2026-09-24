# DID registry

Contract: `alfred-did-registry` (testnet ID in [Contract IDs](../reference/contracts.md)).

MVP flow:

- `register` — controller binds a DID id + auth material placeholder  
- `get` / update / deactivate — lifecycle (see contract ABI)

DID URI form (testnet): `did:stellar:testnet:<hex>`

Controller authority is the holder’s Stellar address from Pollar.
