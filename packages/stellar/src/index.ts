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
}

export const contractIds: AlfredContractIds = {
  didRegistry: "CCLOO56UFL7623QRZSV5YZQLAPQ65RMMEACT6CLKF4HWNFW3QTLF2M3Q",
};

export {
  Client as DidRegistryClient,
  networks as didRegistryNetworks,
  RegistryError,
  type DidKey,
  type DidRecord,
  type DidService,
} from "./did-registry/src/index.ts";
