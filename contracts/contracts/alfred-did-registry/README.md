# alfred-did-registry

On-chain DID registry for ALFRED (`did:stellar`-compatible record model).

## ABI

| Function | Auth | Description |
|----------|------|-------------|
| `__constructor(admin)` | admin | Set contract admin at deploy |
| `register(did_id, record)` | controller | Create DID |
| `update(did_id, expected_version, record)` | controller | Replace keys/services (optimistic concurrency) |
| `transfer_controller(...)` | controller | Change controller |
| `deactivate(did_id, expected_version)` | controller | Irreversible tombstone |
| `get(did_id)` | — | Read record |
| `propose_admin` / `accept_admin` / `get_admin` | admin | Admin rotation |

`did_id` is a 16-byte identifier. Off-chain, ALFRED maps it to a `did:stellar:…` URI.

## Build / test / deploy

```powershell
cd contracts
cargo test -p alfred-did-registry
stellar contract build --package alfred-did-registry
stellar contract deploy `
  --wasm target/wasm32v1-none/release/alfred_did_registry.wasm `
  --source alfred-deployer `
  --network testnet `
  -- `
  --admin GBFT6GJIARFHVGP2MUSFFFZHV62IED6KPNX7H4ANJBW5QS2NE4JP5O4J
```

Record the contract ID in `docs/deployments/testnet.md`.
