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
    contractId: "CAMHSVEVALQ4UORC6WXBX3L7I4YGFL7FTBBML4DJZCN637I4NXJLIZIY",
  }
} as const


export interface FeeConfig {
  /**
 * Amount in token base units. `0` = free.
 */
amount: i128;
  recipient: Option<string>;
  /**
 * SAC / token contract (e.g. testnet USDC). `None` = fees disabled.
 */
token: Option<string>;
}

export const FactoryError = {
  1: {message:"NotAuthorized"},
  2: {message:"NoProposedAdmin"},
  3: {message:"FeeNotConfigured"},
  4: {message:"FeeAmountInvalid"},
  5: {message:"WasmHashMissing"},
  6: {message:"AlreadyVault"}
}

export type DataKey = {tag: "Vault", values: readonly [string]};

export interface Client {
  /**
   * Construct and simulate a deploy transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Deploy a new vault for `owner` with deterministic `salt`.
   * Constructor args: `(owner, Some(factory))`.
   */
  deploy: ({owner, salt}: {owner: string, salt: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_fee: (options?: MethodOptions) => Promise<AssembledTransaction<FeeConfig>>

  /**
   * Construct and simulate a set_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Configure USDC (or any SAC) fee charged via `collect_issue_fee`.
   * Pass `amount = 0` or `token = None` to disable.
   */
  set_fee: ({token, amount, recipient}: {token: Option<string>, amount: i128, recipient: Option<string>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a is_vault transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_vault: ({address}: {address: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a accept_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  accept_admin: (options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a propose_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  propose_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a quote_issue_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  quote_issue_fee: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a collect_issue_fee transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Collect the configured issue fee from `payer` (issuer). No-op if amount is 0.
   * Bundle this auth in the same transaction as `vault.issue`.
   */
  collect_issue_fee: ({payer}: {payer: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_vault_wasm_hash transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_vault_wasm_hash: (options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a set_vault_wasm_hash transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_vault_wasm_hash: ({vault_wasm_hash}: {vault_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, vault_wasm_hash}: {admin: string, vault_wasm_hash: Buffer},
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
    return ContractClient.deploy({admin, vault_wasm_hash}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAACUZlZUNvbmZpZwAAAAAAAAMAAAAnQW1vdW50IGluIHRva2VuIGJhc2UgdW5pdHMuIGAwYCA9IGZyZWUuAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAACXJlY2lwaWVudAAAAAAAA+gAAAATAAAAQVNBQyAvIHRva2VuIGNvbnRyYWN0IChlLmcuIHRlc3RuZXQgVVNEQykuIGBOb25lYCA9IGZlZXMgZGlzYWJsZWQuAAAAAAAABXRva2VuAAAAAAAD6AAAABM=",
        "AAAABAAAAAAAAAAAAAAADEZhY3RvcnlFcnJvcgAAAAYAAAAAAAAADU5vdEF1dGhvcml6ZWQAAAAAAAABAAAAAAAAAA9Ob1Byb3Bvc2VkQWRtaW4AAAAAAgAAAAAAAAAQRmVlTm90Q29uZmlndXJlZAAAAAMAAAAAAAAAEEZlZUFtb3VudEludmFsaWQAAAAEAAAAAAAAAA9XYXNtSGFzaE1pc3NpbmcAAAAABQAAAAAAAAAMQWxyZWFkeVZhdWx0AAAABg==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAAAQAAAAEAAAAAAAAABVZhdWx0AAAAAAAAAQAAABM=",
        "AAAAAAAAAGVEZXBsb3kgYSBuZXcgdmF1bHQgZm9yIGBvd25lcmAgd2l0aCBkZXRlcm1pbmlzdGljIGBzYWx0YC4KQ29uc3RydWN0b3IgYXJnczogYChvd25lciwgU29tZShmYWN0b3J5KSlgLgAAAAAAAAZkZXBsb3kAAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAEc2FsdAAAA+4AAAAgAAAAAQAAABM=",
        "AAAAAAAAAAAAAAAHZ2V0X2ZlZQAAAAAAAAAAAQAAB9AAAAAJRmVlQ29uZmlnAAAA",
        "AAAAAAAAAHBDb25maWd1cmUgVVNEQyAob3IgYW55IFNBQykgZmVlIGNoYXJnZWQgdmlhIGBjb2xsZWN0X2lzc3VlX2ZlZWAuClBhc3MgYGFtb3VudCA9IDBgIG9yIGB0b2tlbiA9IE5vbmVgIHRvIGRpc2FibGUuAAAAB3NldF9mZWUAAAAAAwAAAAAAAAAFdG9rZW4AAAAAAAPoAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAlyZWNpcGllbnQAAAAAAAPoAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAIaXNfdmF1bHQAAAABAAAAAAAAAAdhZGRyZXNzAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAMYWNjZXB0X2FkbWluAAAAAAAAAAA=",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAPdmF1bHRfd2FzbV9oYXNoAAAAA+4AAAAgAAAAAA==",
        "AAAAAAAAAAAAAAANcHJvcG9zZV9hZG1pbgAAAAAAAAEAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAPcXVvdGVfaXNzdWVfZmVlAAAAAAAAAAABAAAACw==",
        "AAAAAAAAAIhDb2xsZWN0IHRoZSBjb25maWd1cmVkIGlzc3VlIGZlZSBmcm9tIGBwYXllcmAgKGlzc3VlcikuIE5vLW9wIGlmIGFtb3VudCBpcyAwLgpCdW5kbGUgdGhpcyBhdXRoIGluIHRoZSBzYW1lIHRyYW5zYWN0aW9uIGFzIGB2YXVsdC5pc3N1ZWAuAAAAEWNvbGxlY3RfaXNzdWVfZmVlAAAAAAAAAQAAAAAAAAAFcGF5ZXIAAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAATZ2V0X3ZhdWx0X3dhc21faGFzaAAAAAAAAAAAAQAAA+4AAAAg",
        "AAAAAAAAAAAAAAATc2V0X3ZhdWx0X3dhc21faGFzaAAAAAABAAAAAAAAAA92YXVsdF93YXNtX2hhc2gAAAAD7gAAACAAAAAA" ]),
      options
    )
  }
  public readonly fromJSON = {
    deploy: this.txFromJSON<string>,
        get_fee: this.txFromJSON<FeeConfig>,
        set_fee: this.txFromJSON<null>,
        is_vault: this.txFromJSON<boolean>,
        get_admin: this.txFromJSON<string>,
        accept_admin: this.txFromJSON<null>,
        propose_admin: this.txFromJSON<null>,
        quote_issue_fee: this.txFromJSON<i128>,
        collect_issue_fee: this.txFromJSON<null>,
        get_vault_wasm_hash: this.txFromJSON<Buffer>,
        set_vault_wasm_hash: this.txFromJSON<null>
  }
}