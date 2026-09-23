/**
 * Placeholder for Stellar CLI TypeScript bindings (ALF-026)
 * and transaction builders (DID register, vault deploy, issue).
 */

export const STELLAR_NETWORK = "testnet" as const;

export const NETWORK_PASSPHRASE_TESTNET =
  "Test SDF Network ; September 2015";

/** Filled after ALF-025 deploy */
export interface AlfredContractIds {
  didRegistry?: string;
  vcVaultFactory?: string;
  vcVaultWasmHash?: string;
}

export const contractIds: AlfredContractIds = {};
