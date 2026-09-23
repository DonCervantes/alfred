# Deployments

Contract IDs are recorded here after `stellar contract deploy` (ALF-025).

## Testnet

| Contract | Version | ID / WASM hash | Deployed |
|----------|---------|----------------|----------|
| `alfred-did-registry` | 0.0.0 | `CCLOO56UFL7623QRZSV5YZQLAPQ65RMMEACT6CLKF4HWNFW3QTLF2M3Q` | 2026-09-23 |
| | | WASM `42f55ea98fda88bff5c5b147a42d838e7f711b413172491eaf863835221e4718` | |
| `alfred-vc-vault` (template WASM) | 0.0.0 | WASM `cad67800c8e178ae1442226c1b2848007fea9c1df6e8d3a30b006e41c7b78bfc` | 2026-09-23 |
| `alfred-vc-vault-factory` | 0.0.0 | `CAMHSVEVALQ4UORC6WXBX3L7I4YGFL7FTBBML4DJZCN637I4NXJLIZIY` | 2026-09-23 |
| | | WASM `18b23d5c185cb37794a3e97bef8243e1465e79ea58a7de6356beedfcad47dc72` | |
| Sample vault (factory smoke) | — | `CDP4M3WY6KB5QWJHG3UGCCWDNJZGDQE47P25FMQKKQHMXNSBYDA6K44G` | 2026-09-23 |

Network passphrase: `Test SDF Network ; September 2015`  
Deployer / admin: `alfred-deployer` → `GBFT6GJIARFHVGP2MUSFFFZHV62IED6KPNX7H4ANJBW5QS2NE4JP5O4J`

Issue fee: **disabled on-chain** (`quote_issue_fee = 0`).  
Script ready: `contracts/scripts/set-usdc-fee.ps1` (Circle testnet USDC SAC  
`CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`, default **0.1 USDC**).  
Run when you want fees live; issuers need USDC + trustline.

### Links

- DID registry: https://stellar.expert/explorer/testnet/contract/CCLOO56UFL7623QRZSV5YZQLAPQ65RMMEACT6CLKF4HWNFW3QTLF2M3Q
- Vault factory: https://stellar.expert/explorer/testnet/contract/CAMHSVEVALQ4UORC6WXBX3L7I4YGFL7FTBBML4DJZCN637I4NXJLIZIY
- Sample vault: https://stellar.expert/explorer/testnet/contract/CDP4M3WY6KB5QWJHG3UGCCWDNJZGDQE47P25FMQKKQHMXNSBYDA6K44G
- Lab (factory): https://lab.stellar.org/r/testnet/contract/CAMHSVEVALQ4UORC6WXBX3L7I4YGFL7FTBBML4DJZCN637I4NXJLIZIY
