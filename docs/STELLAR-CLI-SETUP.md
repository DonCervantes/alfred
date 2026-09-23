# ALFRED — Stellar CLI Setup (ALF-003)

Network: **testnet** · Identity: **`alfred-deployer`**

**Status: Done** ✓

---

## Registro

| Campo | Valor |
|-------|-------|
| CLI version | `stellar 27.0.0` |
| Identity | `alfred-deployer` |
| Public address | `GBFT6GJIARFHVGP2MUSFFFZHV62IED6KPNX7H4ANJBW5QS2NE4JP5O4J` |
| Network | testnet (`Test SDF Network ; September 2015`) |
| Funded | ✓ Friendbot |
| Key path (local) | `~/.config/stellar/identity/alfred-deployer.toml` |

Explorer: https://stellar.expert/explorer/testnet/account/GBFT6GJIARFHVGP2MUSFFFZHV62IED6KPNX7H4ANJBW5QS2NE4JP5O4J

**No compartas ni commitees la secret key.**

---

## Qué se hizo

1. ✓ CLI ya instalado
2. ✓ Red `testnet` disponible (`stellar network ls`)
3. ✓ `stellar keys generate alfred-deployer --network testnet`
4. ✓ `stellar keys fund alfred-deployer --network testnet`

---

## Comandos útiles

```powershell
stellar --version
stellar keys address alfred-deployer
stellar keys fund alfred-deployer --network testnet   # si se queda sin XLM
stellar contract --help
```

---

## Siguiente

- **ALF-004** — Cloudflare + wrangler  
- **ALF-010** — Scaffold monorepo (puede ir en paralelo)  
- **ALF-020+** — Contratos Soroban con este deployer
