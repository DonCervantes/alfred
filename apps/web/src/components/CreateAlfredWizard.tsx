import { usePollar } from "@pollar/react";
import { useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787";

type Profile = {
  did: string | null;
  vaultAddress: string | null;
};

type Props = {
  onDone: (profile: Profile) => void;
};

export function CreateAlfredWizard({ onDone }: Props) {
  const { tr } = useLocale();
  const { signAndSubmitTx } = usePollar();
  const [step, setStep] = useState<"idle" | "did" | "vault" | "done">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [did, setDid] = useState<string | null>(null);
  const [vaultAddress, setVaultAddress] = useState<string | null>(null);

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
    setError(null);
    setBusy(true);
    setStep("did");
    try {
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
        throw new Error(data.detail || data.code || "prepare DID failed");
      }
      if (data.alreadyRegistered && data.did) {
        setDid(data.did);
        return data.did;
      }
      if (!data.unsignedXdr || !data.did || !data.didIdHex) {
        throw new Error("missing DID XDR");
      }
      const txHash = await submitXdr(data.unsignedXdr);
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
    } finally {
      setBusy(false);
    }
  }

  async function runVault() {
    setError(null);
    setBusy(true);
    setStep("vault");
    try {
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
        throw new Error(data.detail || data.code || "prepare vault failed");
      }
      if (data.alreadyDeployed && data.vaultAddress) {
        setVaultAddress(data.vaultAddress);
        return data.vaultAddress;
      }
      if (!data.unsignedXdr) {
        throw new Error("missing vault XDR");
      }
      const txHash = await submitXdr(data.unsignedXdr);
      const vault =
        data.predictedVault ||
        data.vaultAddress ||
        null;
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
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    setError(null);
    try {
      const d = await runDid();
      const v = await runVault();
      setStep("done");
      onDone({ did: d, vaultAddress: v });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes("SOROBAN_AUTH") || msg.includes("NOT_ALLOWED")
        ? tr("onboard.pollarAuthPolicy")
        : msg || tr("onboard.error"));
      setStep("idle");
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
        <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
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
