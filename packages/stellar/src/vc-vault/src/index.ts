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

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





export interface VcRecord {
  content_hash: Buffer;
  issued_ledger: u32;
  issuer: string;
  status: VcStatus;
  updated_ledger: u32;
  uri: Option<string>;
  vc_id: Buffer;
}

export enum VcStatus {
  Active = 1,
  Revoked = 2,
}


export interface IssueArgs {
  content_hash: Buffer;
  uri: Option<string>;
  vc_id: Buffer;
}

export enum IssuanceMode {
  Open = 0,
  Allowlist = 1,
}

export const VaultError = {
  1: {message:"VcAlreadyExists"},
  2: {message:"VcNotFound"},
  3: {message:"VcRevoked"},
  4: {message:"NotAuthorized"},
  5: {message:"IssuerDenied"},
  6: {message:"IssuerNotAllowed"},
  7: {message:"UriTooLong"},
  8: {message:"UriInvalid"},
  9: {message:"BatchTooLarge"},
  10: {message:"VaultFull"},
  11: {message:"HashMismatch"},
  12: {message:"EmptyBatch"}
}

export type DataKey = {tag: "Record", values: readonly [Buffer]} | {tag: "Denied", values: readonly [string]} | {tag: "Allowed", values: readonly [string]};

export interface Client {
  /**
   * Construct and simulate a issue transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  issue: ({issuer, vc_id, content_hash, uri}: {issuer: string, vc_id: Buffer, content_hash: Buffer, uri: Option<string>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_vc transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_vc: ({vc_id}: {vc_id: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Option<VcRecord>>>

  /**
   * Construct and simulate a revoke transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  revoke: ({caller, vc_id}: {caller: string, vc_id: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a vc_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  vc_count: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_owner: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a verify_vc transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns true iff VC exists, is Active, and `content_hash` matches.
   */
  verify_vc: ({vc_id, content_hash}: {vc_id: Buffer, content_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a batch_issue transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  batch_issue: ({issuer, items}: {issuer: string, items: Array<IssueArgs>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a deny_issuer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  deny_issuer: ({issuer}: {issuer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_factory transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_factory: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a list_vc_ids transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_vc_ids: (options?: MethodOptions) => Promise<AssembledTransaction<Array<Buffer>>>

  /**
   * Construct and simulate a allow_issuer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  allow_issuer: ({issuer}: {issuer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a undeny_issuer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  undeny_issuer: ({issuer}: {issuer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a disallow_issuer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  disallow_issuer: ({issuer}: {issuer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_issuance_mode transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_issuance_mode: (options?: MethodOptions) => Promise<AssembledTransaction<IssuanceMode>>

  /**
   * Construct and simulate a set_issuance_mode transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_issuance_mode: ({mode}: {mode: IssuanceMode}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {owner, factory}: {owner: string, factory: Option<string>},
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
    return ContractClient.deploy({owner, factory}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAACFZjUmVjb3JkAAAABwAAAAAAAAAMY29udGVudF9oYXNoAAAD7gAAACAAAAAAAAAADWlzc3VlZF9sZWRnZXIAAAAAAAAEAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAABnN0YXR1cwAAAAAH0AAAAAhWY1N0YXR1cwAAAAAAAAAOdXBkYXRlZF9sZWRnZXIAAAAAAAQAAAAAAAAAA3VyaQAAAAPoAAAAEAAAAAAAAAAFdmNfaWQAAAAAAAPuAAAAIA==",
        "AAAAAwAAAAAAAAAAAAAACFZjU3RhdHVzAAAAAgAAAAAAAAAGQWN0aXZlAAAAAAABAAAAAAAAAAdSZXZva2VkAAAAAAI=",
        "AAAAAQAAAAAAAAAAAAAACUlzc3VlQXJncwAAAAAAAAMAAAAAAAAADGNvbnRlbnRfaGFzaAAAA+4AAAAgAAAAAAAAAAN1cmkAAAAD6AAAABAAAAAAAAAABXZjX2lkAAAAAAAD7gAAACA=",
        "AAAAAwAAAAAAAAAAAAAADElzc3VhbmNlTW9kZQAAAAIAAAAlQW55IGlzc3VlciBleGNlcHQgZGVueWxpc3QgbWF5IGlzc3VlLgAAAAAAAARPcGVuAAAAAAAAACNPbmx5IGFsbG93bGlzdGVkIGlzc3VlcnMgbWF5IGlzc3VlLgAAAAAJQWxsb3dsaXN0AAAAAAAAAQ==",
        "AAAABAAAAAAAAAAAAAAAClZhdWx0RXJyb3IAAAAAAAwAAAAAAAAAD1ZjQWxyZWFkeUV4aXN0cwAAAAABAAAAAAAAAApWY05vdEZvdW5kAAAAAAACAAAAAAAAAAlWY1Jldm9rZWQAAAAAAAADAAAAAAAAAA1Ob3RBdXRob3JpemVkAAAAAAAABAAAAAAAAAAMSXNzdWVyRGVuaWVkAAAABQAAAAAAAAAQSXNzdWVyTm90QWxsb3dlZAAAAAYAAAAAAAAAClVyaVRvb0xvbmcAAAAAAAcAAAAAAAAAClVyaUludmFsaWQAAAAAAAgAAAAAAAAADUJhdGNoVG9vTGFyZ2UAAAAAAAAJAAAAAAAAAAlWYXVsdEZ1bGwAAAAAAAAKAAAAAAAAAAxIYXNoTWlzbWF0Y2gAAAALAAAAAAAAAApFbXB0eUJhdGNoAAAAAAAM",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAwAAAAEAAAAAAAAABlJlY29yZAAAAAAAAQAAA+4AAAAgAAAAAQAAAAAAAAAGRGVuaWVkAAAAAAABAAAAEwAAAAEAAAAAAAAAB0FsbG93ZWQAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAAFaXNzdWUAAAAAAAAEAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAABXZjX2lkAAAAAAAD7gAAACAAAAAAAAAADGNvbnRlbnRfaGFzaAAAA+4AAAAgAAAAAAAAAAN1cmkAAAAD6AAAABAAAAAA",
        "AAAAAAAAAAAAAAAGZ2V0X3ZjAAAAAAABAAAAAAAAAAV2Y19pZAAAAAAAA+4AAAAgAAAAAQAAA+gAAAfQAAAACFZjUmVjb3Jk",
        "AAAAAAAAAAAAAAAGcmV2b2tlAAAAAAACAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAAAAAABXZjX2lkAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAAAAAAAAIdmNfY291bnQAAAAAAAAAAQAAAAQ=",
        "AAAAAAAAAAAAAAAJZ2V0X293bmVyAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAEJSZXR1cm5zIHRydWUgaWZmIFZDIGV4aXN0cywgaXMgQWN0aXZlLCBhbmQgYGNvbnRlbnRfaGFzaGAgbWF0Y2hlcy4AAAAAAAl2ZXJpZnlfdmMAAAAAAAACAAAAAAAAAAV2Y19pZAAAAAAAA+4AAAAgAAAAAAAAAAxjb250ZW50X2hhc2gAAAPuAAAAIAAAAAEAAAAB",
        "AAAAAAAAAAAAAAALYmF0Y2hfaXNzdWUAAAAAAgAAAAAAAAAGaXNzdWVyAAAAAAATAAAAAAAAAAVpdGVtcwAAAAAAA+oAAAfQAAAACUlzc3VlQXJncwAAAAAAAAA=",
        "AAAAAAAAAAAAAAALZGVueV9pc3N1ZXIAAAAAAQAAAAAAAAAGaXNzdWVyAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAALZ2V0X2ZhY3RvcnkAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAAAAAAAALbGlzdF92Y19pZHMAAAAAAAAAAAEAAAPqAAAD7gAAACA=",
        "AAAAAAAAAAAAAAAMYWxsb3dfaXNzdWVyAAAAAQAAAAAAAAAGaXNzdWVyAAAAAAATAAAAAA==",
        "AAAAAAAAAEpEZXBsb3kgYSB2YXVsdCBmb3IgYG93bmVyYC4gT3B0aW9uYWwgYGZhY3RvcnlgIGxpbmtzIGZlZSBjb2xsZWN0aW9uIGxhdGVyLgAAAAAADV9fY29uc3RydWN0b3IAAAAAAAACAAAAAAAAAAVvd25lcgAAAAAAABMAAAAAAAAAB2ZhY3RvcnkAAAAD6AAAABMAAAAA",
        "AAAAAAAAAAAAAAANdW5kZW55X2lzc3VlcgAAAAAAAAEAAAAAAAAABmlzc3VlcgAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAPZGlzYWxsb3dfaXNzdWVyAAAAAAEAAAAAAAAABmlzc3VlcgAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAARZ2V0X2lzc3VhbmNlX21vZGUAAAAAAAAAAAAAAQAAB9AAAAAMSXNzdWFuY2VNb2Rl",
        "AAAAAAAAAAAAAAARc2V0X2lzc3VhbmNlX21vZGUAAAAAAAABAAAAAAAAAARtb2RlAAAH0AAAAAxJc3N1YW5jZU1vZGUAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    issue: this.txFromJSON<null>,
        get_vc: this.txFromJSON<Option<VcRecord>>,
        revoke: this.txFromJSON<null>,
        vc_count: this.txFromJSON<u32>,
        get_owner: this.txFromJSON<string>,
        verify_vc: this.txFromJSON<boolean>,
        batch_issue: this.txFromJSON<null>,
        deny_issuer: this.txFromJSON<null>,
        get_factory: this.txFromJSON<Option<string>>,
        list_vc_ids: this.txFromJSON<Array<Buffer>>,
        allow_issuer: this.txFromJSON<null>,
        undeny_issuer: this.txFromJSON<null>,
        disallow_issuer: this.txFromJSON<null>,
        get_issuance_mode: this.txFromJSON<IssuanceMode>,
        set_issuance_mode: this.txFromJSON<null>
  }
}