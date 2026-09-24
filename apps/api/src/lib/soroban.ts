/** Build Soroban invoke XDRs for DID register + vault deploy (ALF-033). */

import { Buffer } from "buffer";
import {
  DidRegistryClient,
  VcVaultClient,
  VcVaultFactoryClient,
  NETWORK_PASSPHRASE_TESTNET,
} from "@alfred/stellar";

const RPC = "https://soroban-testnet.stellar.org";

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
  const client = new DidRegistryClient({
    contractId: input.contractId,
    networkPassphrase: NETWORK_PASSPHRASE_TESTNET,
    rpcUrl: RPC,
    publicKey: input.controller,
  });

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

  const assembled = await client.register({
    did_id: input.didId,
    initial_record,
  });

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
  const client = new VcVaultFactoryClient({
    contractId: input.factoryId,
    networkPassphrase: NETWORK_PASSPHRASE_TESTNET,
    rpcUrl: RPC,
    publicKey: input.owner,
  });

  const assembled = await client.deploy({
    owner: input.owner,
    salt: input.salt,
  });

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
  const client = new VcVaultClient({
    contractId: input.vaultId,
    networkPassphrase: NETWORK_PASSPHRASE_TESTNET,
    rpcUrl: RPC,
    publicKey: input.issuer,
  });

  const assembled = await client.issue({
    issuer: input.issuer,
    vc_id: input.vcId,
    content_hash: input.contentHash,
    uri: input.uri ?? undefined,
  });

  return { unsignedXdr: toUnsignedXdr(assembled) };
}

export async function buildVaultRevokeXdr(input: {
  vaultId: string;
  caller: string;
  vcId: Buffer;
}): Promise<{ unsignedXdr: string }> {
  const client = new VcVaultClient({
    contractId: input.vaultId,
    networkPassphrase: NETWORK_PASSPHRASE_TESTNET,
    rpcUrl: RPC,
    publicKey: input.caller,
  });

  const assembled = await client.revoke({
    caller: input.caller,
    vc_id: input.vcId,
  });

  return { unsignedXdr: toUnsignedXdr(assembled) };
}

export async function verifyVcOnChain(input: {
  vaultId: string;
  vcId: Buffer;
  contentHash: Buffer;
}): Promise<boolean | null> {
  try {
    const client = new VcVaultClient({
      contractId: input.vaultId,
      networkPassphrase: NETWORK_PASSPHRASE_TESTNET,
      rpcUrl: RPC,
      publicKey: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    });
    const assembled = await client.verify_vc({
      vc_id: input.vcId,
      content_hash: input.contentHash,
    });
    return typeof assembled.result === "boolean" ? assembled.result : null;
  } catch {
    return null;
  }
}

/** Helper: Buffer from Uint8Array for stellar clients. */
export function u8ToBuffer(u8: Uint8Array): Buffer {
  return Buffer.from(u8);
}
