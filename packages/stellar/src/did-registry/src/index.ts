import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof globalThis !== "undefined") {
  //@ts-ignore Buffer exists
  (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer =
    (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCLOO56UFL7623QRZSV5YZQLAPQ65RMMEACT6CLKF4HWNFW3QTLF2M3Q",
  }
} as const


export interface DidKey {
  public_key_multibase: string;
}


export interface DidRecord {
  assertion_method: Array<DidKey>;
  authentication: Array<DidKey>;
  controller: string;
  created_ledger: u32;
  deactivated: boolean;
  key_agreement: Array<DidKey>;
  metadata_hash: Option<Buffer>;
  metadata_uri: Option<string>;
  services: Array<DidService>;
  updated_ledger: u32;
  version: u32;
}


export interface DidService {
  id_suffix: string;
  service_endpoint: string;
  service_type: string;
}

export const RegistryError = {
  1: {message:"DidAlreadyExists"},
  2: {message:"DidNotFound"},
  3: {message:"VersionMismatch"},
  4: {message:"DidDeactivated"},
  5: {message:"InvalidAuthKeyCount"},
  6: {message:"InvalidAssertionKeyCount"},
  7: {message:"InvalidKeyAgreementCount"},
  8: {message:"InvalidServiceCount"},
  9: {message:"DuplicateKey"},
  10: {message:"KeyTooLong"},
  11: {message:"KeyEmpty"},
  12: {message:"ServiceTypeTooLong"},
  13: {message:"ServiceIdTooLong"},
  14: {message:"ServiceIdInvalidFormat"},
  15: {message:"ServiceEndpointInvalid"},
  16: {message:"MetadataUriInvalid"},
  17: {message:"NoProposedAdmin"},
  18: {message:"ServiceTypeEmpty"},
  19: {message:"VersionOverflow"},
  20: {message:"MetadataInconsistent"},
  21: {message:"DuplicateServiceId"}
}

export type DidDataKey = {tag: "Record", values: readonly [Buffer]};

export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({did_id}: {did_id: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Option<DidRecord>>>

  /**
   * Construct and simulate a update transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  update: ({did_id, expected_version, next_record}: {did_id: Buffer, expected_version: u32, next_record: DidRecord}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  register: ({did_id, initial_record}: {did_id: Buffer, initial_record: DidRecord}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a deactivate transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  deactivate: ({did_id, expected_version}: {did_id: Buffer, expected_version: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a accept_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  accept_admin: (options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a propose_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  propose_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a transfer_controller transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_controller: ({did_id, expected_version, new_controller}: {did_id: Buffer, expected_version: u32, new_controller: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABkRpZEtleQAAAAAAAQAAAAAAAAAUcHVibGljX2tleV9tdWx0aWJhc2UAAAAQ",
        "AAAAAQAAAAAAAAAAAAAACURpZFJlY29yZAAAAAAAAAsAAAAAAAAAEGFzc2VydGlvbl9tZXRob2QAAAPqAAAH0AAAAAZEaWRLZXkAAAAAAAAAAAAOYXV0aGVudGljYXRpb24AAAAAA+oAAAfQAAAABkRpZEtleQAAAAAAAAAAAApjb250cm9sbGVyAAAAAAATAAAAAAAAAA5jcmVhdGVkX2xlZGdlcgAAAAAABAAAAAAAAAALZGVhY3RpdmF0ZWQAAAAAAQAAAAAAAAANa2V5X2FncmVlbWVudAAAAAAAA+oAAAfQAAAABkRpZEtleQAAAAAAAAAAAA1tZXRhZGF0YV9oYXNoAAAAAAAD6AAAA+4AAAAgAAAAAAAAAAxtZXRhZGF0YV91cmkAAAPoAAAAEAAAAAAAAAAIc2VydmljZXMAAAPqAAAH0AAAAApEaWRTZXJ2aWNlAAAAAAAAAAAADnVwZGF0ZWRfbGVkZ2VyAAAAAAAEAAAAAAAAAAd2ZXJzaW9uAAAAAAQ=",
        "AAAAAQAAAAAAAAAAAAAACkRpZFNlcnZpY2UAAAAAAAMAAAAAAAAACWlkX3N1ZmZpeAAAAAAAABAAAAAAAAAAEHNlcnZpY2VfZW5kcG9pbnQAAAAQAAAAAAAAAAxzZXJ2aWNlX3R5cGUAAAAQ",
        "AAAABAAAAAAAAAAAAAAADVJlZ2lzdHJ5RXJyb3IAAAAAAAAVAAAAAAAAABBEaWRBbHJlYWR5RXhpc3RzAAAAAQAAAAAAAAALRGlkTm90Rm91bmQAAAAAAgAAAAAAAAAPVmVyc2lvbk1pc21hdGNoAAAAAAMAAAAAAAAADkRpZERlYWN0aXZhdGVkAAAAAAAEAAAAAAAAABNJbnZhbGlkQXV0aEtleUNvdW50AAAAAAUAAAAAAAAAGEludmFsaWRBc3NlcnRpb25LZXlDb3VudAAAAAYAAAAAAAAAGEludmFsaWRLZXlBZ3JlZW1lbnRDb3VudAAAAAcAAAAAAAAAE0ludmFsaWRTZXJ2aWNlQ291bnQAAAAACAAAAAAAAAAMRHVwbGljYXRlS2V5AAAACQAAAAAAAAAKS2V5VG9vTG9uZwAAAAAACgAAAAAAAAAIS2V5RW1wdHkAAAALAAAAAAAAABJTZXJ2aWNlVHlwZVRvb0xvbmcAAAAAAAwAAAAAAAAAEFNlcnZpY2VJZFRvb0xvbmcAAAANAAAAAAAAABZTZXJ2aWNlSWRJbnZhbGlkRm9ybWF0AAAAAAAOAAAAAAAAABZTZXJ2aWNlRW5kcG9pbnRJbnZhbGlkAAAAAAAPAAAAAAAAABJNZXRhZGF0YVVyaUludmFsaWQAAAAAABAAAAAAAAAAD05vUHJvcG9zZWRBZG1pbgAAAAARAAAAAAAAABBTZXJ2aWNlVHlwZUVtcHR5AAAAEgAAAAAAAAAPVmVyc2lvbk92ZXJmbG93AAAAABMAAAAAAAAAFE1ldGFkYXRhSW5jb25zaXN0ZW50AAAAFAAAAAAAAAASRHVwbGljYXRlU2VydmljZUlkAAAAAAAV",
        "AAAAAgAAAAAAAAAAAAAACkRpZERhdGFLZXkAAAAAAAEAAAABAAAAAAAAAAZSZWNvcmQAAAAAAAEAAAPuAAAAEA==",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAABmRpZF9pZAAAAAAD7gAAABAAAAABAAAD6AAAB9AAAAAJRGlkUmVjb3JkAAAA",
        "AAAAAAAAAAAAAAAGdXBkYXRlAAAAAAADAAAAAAAAAAZkaWRfaWQAAAAAA+4AAAAQAAAAAAAAABBleHBlY3RlZF92ZXJzaW9uAAAABAAAAAAAAAALbmV4dF9yZWNvcmQAAAAH0AAAAAlEaWRSZWNvcmQAAAAAAAAA",
        "AAAAAAAAAAAAAAAIcmVnaXN0ZXIAAAACAAAAAAAAAAZkaWRfaWQAAAAAA+4AAAAQAAAAAAAAAA5pbml0aWFsX3JlY29yZAAAAAAH0AAAAAlEaWRSZWNvcmQAAAAAAAAA",
        "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAKZGVhY3RpdmF0ZQAAAAAAAgAAAAAAAAAGZGlkX2lkAAAAAAPuAAAAEAAAAAAAAAAQZXhwZWN0ZWRfdmVyc2lvbgAAAAQAAAAA",
        "AAAAAAAAAAAAAAAMYWNjZXB0X2FkbWluAAAAAAAAAAA=",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAANcHJvcG9zZV9hZG1pbgAAAAAAAAEAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAATdHJhbnNmZXJfY29udHJvbGxlcgAAAAADAAAAAAAAAAZkaWRfaWQAAAAAA+4AAAAQAAAAAAAAABBleHBlY3RlZF92ZXJzaW9uAAAABAAAAAAAAAAObmV3X2NvbnRyb2xsZXIAAAAAABMAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Option<DidRecord>>,
        update: this.txFromJSON<null>,
        register: this.txFromJSON<null>,
        get_admin: this.txFromJSON<string>,
        deactivate: this.txFromJSON<null>,
        accept_admin: this.txFromJSON<null>,
        propose_admin: this.txFromJSON<null>,
        transfer_controller: this.txFromJSON<null>
  }
}