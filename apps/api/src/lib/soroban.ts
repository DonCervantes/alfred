/** Build Soroban invoke XDRs for DID register + vault deploy (ALF-033). */

import "./cf-fetch-patch";
import { Buffer } from "buffer";
import {
  DidRegistryClient,
  VcVaultClient,
  VcVaultFactoryClient,
  NETWORK_PASSPHRASE_TESTNET,
} from "@alfred/stellar";

const RPC = "https://soroban-testnet.stellar.org";

function clientOpts(contractId: string, publicKey?: string) {
  return {
    contractId,
    networkPassphrase: NETWORK_PASSPHRASE_TESTNET,
    rpcUrl: RPC,
    ...(publicKey ? { publicKey } : {}),
  };
}

export function randomBytes(n: number): Buffer {
  const u8 = crypto.getRandomValues(new Uint8Array(n));
  return Buffer.from(u8);
}

export function bytesToHex(buf: Buffer): string {
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Buffer {
  const clean = hex.replace(/^0x/, "");
  if (clean.length % 2 !== 0) throw new Error("bad hex");
  const out = Buffer.alloc(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/** Placeholder multibase auth key unique per address (MVP — replace with real key later). */
export function placeholderAuthKey(address: string): string {
  return `zAlfred${address.slice(1, 40)}`;
}

export function didUriFromId(didIdHex: string, network: string): string {
  const net =
    network === "public" || network === "mainnet" ? "public" : "testnet";
  return `did:stellar:${net}:${didIdHex}`;
}

function toUnsignedXdr(assembled: {
  built?: { toXDR: () => string } | null;
  toXDR?: () => string;
  result?: unknown;
  error?: { message?: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  simulation?: any;
}): string {
  if (assembled.simulation?.error) {
    throw new Error(assembled.simulation.error);
  }
  if (assembled.error?.message) {
    throw new Error(assembled.error.message);
  }
  if (typeof assembled.toXDR === "function") {
    return assembled.toXDR();
  }
  if (assembled.built) {
    return assembled.built.toXDR();
  }
  throw new Error("Transaction simulation produced no XDR");
}

export async function buildDidRegisterXdr(input: {
  contractId: string;
  controller: string;
  didId: Buffer;
}): Promise<{ unsignedXdr: string; didIdHex: string; did: string }> {
  const client = new DidRegistryClient(
    clientOpts(input.contractId, input.controller),
  );

  const initial_record = {
    controller: input.controller,
    authentication: [
      { public_key_multibase: placeholderAuthKey(input.controller) },
    ],
    assertion_method: [] as { public_key_multibase: string }[],
    key_agreement: [] as { public_key_multibase: string }[],
    services: [] as {
      id_suffix: string;
      service_type: string;
      service_endpoint: string;
    }[],
    metadata_uri: undefined,
    metadata_hash: undefined,
    version: 0,
    created_ledger: 0,
    updated_ledger: 0,
    deactivated: false,
  };

  const assembled = await client.register(
    {
      did_id: input.didId,
      initial_record,
    },
    { restore: false },
  );

  const didIdHex = bytesToHex(input.didId);
  return {
    unsignedXdr: toUnsignedXdr(assembled),
    didIdHex,
    did: didUriFromId(didIdHex, "testnet"),
  };
}

export async function buildVaultDeployXdr(input: {
  factoryId: string;
  owner: string;
  salt: Buffer;
}): Promise<{ unsignedXdr: string; saltHex: string; predictedVault?: string }> {
  const client = new VcVaultFactoryClient(
    clientOpts(input.factoryId, input.owner),
  );

  const assembled = await client.deploy(
    {
      owner: input.owner,
      salt: input.salt,
    },
    { restore: false },
  );

  const predicted =
    typeof assembled.result === "string" ? assembled.result : undefined;

  return {
    unsignedXdr: toUnsignedXdr(assembled),
    saltHex: bytesToHex(input.salt),
    predictedVault: predicted,
  };
}

export async function buildVaultIssueXdr(input: {
  vaultId: string;
  issuer: string;
  vcId: Buffer;
  contentHash: Buffer;
  uri?: string;
}): Promise<{ unsignedXdr: string }> {
  const client = new VcVaultClient(clientOpts(input.vaultId, input.issuer));

  const assembled = await client.issue(
    {
      issuer: input.issuer,
      vc_id: input.vcId,
      content_hash: input.contentHash,
      uri: input.uri ?? undefined,
    },
    { restore: false },
  );

  return { unsignedXdr: toUnsignedXdr(assembled) };
}

export async function buildVaultRevokeXdr(input: {
  vaultId: string;
  caller: string;
  vcId: Buffer;
}): Promise<{ unsignedXdr: string }> {
  const client = new VcVaultClient(clientOpts(input.vaultId, input.caller));

  const assembled = await client.revoke(
    {
      caller: input.caller,
      vc_id: input.vcId,
    },
    { restore: false },
  );

  return { unsignedXdr: toUnsignedXdr(assembled) };
}

function toBigInt(v: unknown): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number" && Number.isFinite(v)) return BigInt(Math.trunc(v));
  if (typeof v === "string" && v.trim() !== "") return BigInt(v);
  if (v != null && typeof (v as { toString?: () => string }).toString === "function") {
    const s = String(v);
    if (/^-?\d+$/.test(s)) return BigInt(s);
  }
  return 0n;
}

export type FactoryFeeQuote = {
  amount: bigint;
  token: string | null;
  recipient: string | null;
};

/** Read factory fee config (simulation). */
export async function getFactoryFee(
  factoryId: string,
): Promise<FactoryFeeQuote> {
  const client = new VcVaultFactoryClient(clientOpts(factoryId));
  const assembled = await client.get_fee({ restore: false });
  const fee = assembled.result as
    | { amount?: unknown; token?: string | null; recipient?: string | null }
    | undefined;
  return {
    amount: toBigInt(fee?.amount),
    token: fee?.token ?? null,
    recipient: fee?.recipient ?? null,
  };
}

/** Build XDR for `collect_issue_fee` (no-op when amount is 0 on-chain). */
export async function buildCollectIssueFeeXdr(input: {
  factoryId: string;
  payer: string;
}): Promise<{ unsignedXdr: string }> {
  const client = new VcVaultFactoryClient(
    clientOpts(input.factoryId, input.payer),
  );
  const assembled = await client.collect_issue_fee(
    { payer: input.payer },
    { restore: false },
  );
  return { unsignedXdr: toUnsignedXdr(assembled) };
}

/** USDC-style 7 decimals → display string. */
export function formatTokenAmount(amount: bigint, decimals = 7): string {
  const neg = amount < 0n;
  const abs = neg ? -amount : amount;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  const body = fracStr ? `${whole}.${fracStr}` : whole.toString();
  return neg ? `-${body}` : body;
}

export async function verifyVcOnChain(input: {
  vaultId: string;
  vcId: Buffer;
  contentHash: Buffer;
}): Promise<boolean | null> {
  try {
    const client = new VcVaultClient(clientOpts(input.vaultId));
    const assembled = await client.verify_vc(
      {
        vc_id: input.vcId,
        content_hash: input.contentHash,
      },
      { restore: false },
    );
    return typeof assembled.result === "boolean" ? assembled.result : null;
  } catch {
    return null;
  }
}

/** Helper: Buffer from Uint8Array for stellar clients. */
export function u8ToBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8);
}
