/**
 * Stellar helpers + generated Soroban bindings (ALF-026).
 */

export const STELLAR_NETWORK = "testnet" as const;

export const NETWORK_PASSPHRASE_TESTNET =
  "Test SDF Network ; September 2015";

export interface AlfredContractIds {
  didRegistry?: string;
  vcVaultFactory?: string;
  vcVaultWasmHash?: string;
  /** Example vault deployed via factory smoke test (deployer-owned). */
  sampleVault?: string;
}

export const contractIds: AlfredContractIds = {
  didRegistry: "CCLOO56UFL7623QRZSV5YZQLAPQ65RMMEACT6CLKF4HWNFW3QTLF2M3Q",
  vcVaultFactory: "CAMHSVEVALQ4UORC6WXBX3L7I4YGFL7FTBBML4DJZCN637I4NXJLIZIY",
  vcVaultWasmHash:
    "cad67800c8e178ae1442226c1b2848007fea9c1df6e8d3a30b006e41c7b78bfc",
  sampleVault: "CDP4M3WY6KB5QWJHG3UGCCWDNJZGDQE47P25FMQKKQHMXNSBYDA6K44G",
};

export {
  Client as DidRegistryClient,
  networks as didRegistryNetworks,
  RegistryError,
  type DidKey,
  type DidRecord,
  type DidService,
} from "./did-registry/src/index.ts";

export {
  Client as VcVaultClient,
  VaultError,
  VcStatus,
  IssuanceMode,
  type VcRecord,
  type IssueArgs,
} from "./vc-vault/src/index.ts";

export {
  Client as VcVaultFactoryClient,
  networks as vcVaultFactoryNetworks,
  FactoryError,
  type FeeConfig,
} from "./vc-vault-factory/src/index.ts";
