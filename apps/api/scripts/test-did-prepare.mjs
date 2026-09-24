/** One-off: test DID prepare for a given G address. Run: pnpm exec wrangler types && node --experimental-vm-modules */
import { Buffer } from "buffer";
import {
  DidRegistryClient,
  NETWORK_PASSPHRASE_TESTNET,
} from "@alfred/stellar";

const RPC = "https://soroban-testnet.stellar.org";
const addr = process.argv[2] || "GBSPPXA7ERKJJYXFFK33HFAMCQS2ZDDVVT5SZ2J2Y74FEBZZKXUDERJL";
const contractId = "CCLOO56UFL7623QRZSV5YZQLAPQ65RMMEACT6CLKF4HWNFW3QTLF2M3Q";

const client = new DidRegistryClient({
  contractId,
  networkPassphrase: NETWORK_PASSPHRASE_TESTNET,
  rpcUrl: RPC,
  publicKey: addr,
});

const didId = Buffer.from(crypto.getRandomValues(new Uint8Array(16)));
const initial_record = {
  controller: addr,
  authentication: [{ public_key_multibase: `zAlfred${addr.slice(1, 40)}` }],
  assertion_method: [],
  key_agreement: [],
  services: [],
  metadata_uri: undefined,
  metadata_hash: undefined,
  version: 0,
  created_ledger: 0,
  updated_ledger: 0,
  deactivated: false,
};

try {
  const assembled = await client.register({ did_id: didId, initial_record });
  console.log("sim error", assembled.simulation?.error ?? null);
  console.log("error", assembled.error ?? null);
  console.log("has toXDR", typeof assembled.toXDR === "function");
  if (typeof assembled.toXDR === "function") {
    const xdr = assembled.toXDR();
    console.log("OK xdr length", xdr.length);
  }
} catch (e) {
  console.error("THROW", e instanceof Error ? e.message : e);
}
