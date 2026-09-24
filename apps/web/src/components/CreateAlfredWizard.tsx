import { useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { useAlfredPollar } from "../providers/pollar-hooks";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787";
const HORIZON = "https://horizon-testnet.stellar.org";

type Profile = {
  did: string | null;
  vaultAddress: string | null;
};

type Props = {
  onDone: (profile: Profile) => void;
  walletAddress: string;
};

async function spendableXlm(address: string): Promise<number> {
  try {
    const res = await fetch(`${HORIZON}/accounts/${address}`);
    if (!res.ok) return 0;
    const body = (await res.json()) as {
      balances?: { asset_type?: string; balance?: string }[];
    };
    const native = body.balances?.find((b) => b.asset_type === "native");
    return native?.balance != null ? Number.parseFloat(native.balance) : 0;
  } catch {
    return 0;
  }
}

export function CreateAlfredWizard({ onDone, walletAddress }: Props) {
  const { tr } = useLocale();
  const { signAndSubmitTx } = useAlfredPollar();
  const [step, setStep] = useState<"idle" | "did" | "vault" | "done">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [did, setDid] = useState<string | null>(null);
  const [vaultAddress, setVaultAddress] = useState<string | null>(null);

  async function ensureFunded() {
    await fetch(`${API_URL}/api/activate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey: walletAddress }),
    });
  }

  async function submitXdr(unsignedXdr: string): Promise<string | null> {
    const outcome = await signAndSubmitTx(unsignedXdr);
    if (outcome && typeof outcome === "object" && "status" in outcome) {
      const status = (outcome as { status?: string }).status;
      if (status === "error" || status === "failed") {
        const details =
          (outcome as { details?: string }).details ||
          (outcome as { error?: string }).error ||
          "submit failed";
        throw new Error(details);
      }
      const hash =
        (outcome as { hash?: string }).hash ||
        (outcome as { txHash?: string }).txHash ||
        null;
      return hash;
    }
    return null;
  }

  async function runDid() {
    setStep("did");
    const prep = await fetch(`${API_URL}/api/did/prepare-register`, {
      method: "POST",
      credentials: "include",
    });
    const data = (await prep.json()) as {
      ok?: boolean;
      alreadyRegistered?: boolean;
      did?: string;
      didIdHex?: string;
      unsignedXdr?: string;
      code?: string;
      detail?: string;
    };
    if (!prep.ok || !data.ok) {
      throw new Error(
        `prepare:${data.detail || data.code || "prepare DID failed"}`,
      );
    }
    if (data.alreadyRegistered && data.did) {
      setDid(data.did);
      return data.did;
    }
    if (!data.unsignedXdr || !data.did || !data.didIdHex) {
      throw new Error("prepare:missing DID XDR");
    }
    let txHash: string | null;
    try {
      txHash = await submitXdr(data.unsignedXdr);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`sign:${msg}`);
    }
    const conf = await fetch(`${API_URL}/api/did/confirm`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        did: data.did,
        didIdHex: data.didIdHex,
        txHash,
      }),
    });
    const confData = (await conf.json()) as { ok?: boolean; code?: string };
    if (!conf.ok || !confData.ok) {
      throw new Error(confData.code || "confirm DID failed");
    }
    setDid(data.did);
    return data.did;
  }

  async function runVault() {
    setStep("vault");
    const prep = await fetch(`${API_URL}/api/vault/prepare-deploy`, {
      method: "POST",
      credentials: "include",
    });
    const data = (await prep.json()) as {
      ok?: boolean;
      alreadyDeployed?: boolean;
      vaultAddress?: string;
      predictedVault?: string | null;
      unsignedXdr?: string;
      saltHex?: string;
      code?: string;
      detail?: string;
    };
    if (!prep.ok || !data.ok) {
      throw new Error(
        `prepare:${data.detail || data.code || "prepare vault failed"}`,
      );
    }
    if (data.alreadyDeployed && data.vaultAddress) {
      setVaultAddress(data.vaultAddress);
      return data.vaultAddress;
    }
    if (!data.unsignedXdr) {
      throw new Error("prepare:missing vault XDR");
    }
    let txHash: string | null;
    try {
      txHash = await submitXdr(data.unsignedXdr);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`sign:${msg}`);
    }
    const vault = data.predictedVault || data.vaultAddress || null;
    if (!vault) {
      throw new Error("missing predicted vault address");
    }
    const conf = await fetch(`${API_URL}/api/vault/confirm`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vaultAddress: vault,
        saltHex: data.saltHex,
        txHash,
      }),
    });
    const confData = (await conf.json()) as { ok?: boolean; code?: string };
    if (!conf.ok || !confData.ok) {
      throw new Error(confData.code || "confirm vault failed");
    }
    setVaultAddress(vault);
    return vault;
  }

  async function start() {
    setError(null);
    setDetail(null);
    setBusy(true);
    try {
      await ensureFunded();
      const bal = await spendableXlm(walletAddress);
      if (bal < 1) {
        setError(tr("onboard.accountNotFound"));
        setStep("idle");
        return;
      }
      const d = await runDid();
      const v = await runVault();
      setStep("done");
      onDone({ did: d, vaultAddress: v });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const isPrepare = raw.startsWith("prepare:");
      const isSign = raw.startsWith("sign:");
      const msg = raw.replace(/^(prepare|sign):/, "");
      setDetail(msg);

      if (
        (msg.includes("Account not found") ||
          msg.includes("ACCOUNT_NOT_FOUND")) &&
        isPrepare
      ) {
        setError(tr("onboard.accountNotFound"));
      } else if (
        msg.includes("Account not found") ||
        msg.includes("ACCOUNT_NOT_FOUND") ||
        msg.includes("SOROBAN_AUTH") ||
        msg.includes("NOT_ALLOWED") ||
        isSign
      ) {
        setError(tr("onboard.pollarSignFailed"));
      } else if (msg.includes("SOROBAN_AUTH") || msg.includes("NOT_ALLOWED")) {
        setError(tr("onboard.pollarAuthPolicy"));
      } else {
        setError(msg || tr("onboard.error"));
      }
      setStep("idle");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[var(--radius)] bg-[var(--surface)] px-5 py-5 text-left shadow-sm ring-1 ring-black/5">
      <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
        {tr("onboard.title")}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
        {tr("onboard.supporting")}
      </p>

      <ul className="mt-4 space-y-2 text-sm text-[var(--text)]">
        <li>
          {step === "did" || did ? "●" : "○"} {tr("onboard.stepDid")}
          {did ? (
            <span className="mt-1 block truncate font-mono text-xs text-[var(--text-secondary)]">
              {did}
            </span>
          ) : null}
        </li>
        <li>
          {step === "vault" || vaultAddress ? "●" : "○"} {tr("onboard.stepVault")}
          {vaultAddress ? (
            <span className="mt-1 block truncate font-mono text-xs text-[var(--text-secondary)]">
              {vaultAddress}
            </span>
          ) : null}
        </li>
      </ul>

      {error ? (
        <div className="mt-3 space-y-1" role="alert">
          <p className="text-sm text-[var(--danger)]">{error}</p>
          {detail ? (
            <p className="break-all font-mono text-[10px] text-[var(--text-secondary)]">
              {detail}
            </p>
          ) : null}
        </div>
      ) : null}

      {step !== "done" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void start()}
          className="mt-5 w-full rounded-[var(--radius)] bg-[var(--accent)] px-7 py-3.5 text-base font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? tr("onboard.working") : tr("onboard.cta")}
        </button>
      ) : (
        <p className="mt-4 text-sm font-medium text-[var(--success)]">
          {tr("onboard.done")}
        </p>
      )}
    </div>
  );
}
