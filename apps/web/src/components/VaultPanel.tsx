import { usePollar } from "@pollar/react";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787";

type Cred = {
  vcId: string;
  type: string | null;
  status: string;
  contentHash: string;
  createdAt: string;
};

type Props = {
  selfAddress: string;
};

async function submitXdr(
  signAndSubmitTx: (xdr: string) => Promise<unknown>,
  unsignedXdr: string,
): Promise<string | null> {
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
    return (
      (outcome as { hash?: string }).hash ||
      (outcome as { txHash?: string }).txHash ||
      null
    );
  }
  return null;
}

export function VaultPanel({ selfAddress }: Props) {
  const { tr } = useLocale();
  const { signAndSubmitTx } = usePollar();
  const [creds, setCreds] = useState<Cred[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [holderAddress, setHolderAddress] = useState(selfAddress);
  const [credType, setCredType] = useState("AlfredCredential");
  const [claimSubject, setClaimSubject] = useState("");
  const [claimNote, setClaimNote] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/credentials`, {
        credentials: "include",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        credentials?: Cred[];
      };
      if (res.ok && data.ok) setCreds(data.credentials ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setHolderAddress(selfAddress);
  }, [selfAddress]);

  async function issue() {
    setError(null);
    setShareUrl(null);
    setBusy(true);
    try {
      const prep = await fetch(`${API_URL}/api/credentials/prepare-issue`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holderAddress: holderAddress.trim(),
          type: credType.trim() || "AlfredCredential",
          claims: {
            subject: claimSubject.trim() || undefined,
            note: claimNote.trim() || undefined,
          },
        }),
      });
      const data = (await prep.json()) as {
        ok?: boolean;
        unsignedXdr?: string;
        vcId?: string;
        code?: string;
        detail?: string;
      };
      if (!prep.ok || !data.ok || !data.unsignedXdr || !data.vcId) {
        throw new Error(data.detail || data.code || "prepare issue failed");
      }
      const txHash = await submitXdr(signAndSubmitTx, data.unsignedXdr);
      const conf = await fetch(`${API_URL}/api/credentials/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vcId: data.vcId, txHash }),
      });
      const confData = (await conf.json()) as { ok?: boolean; code?: string };
      if (!conf.ok || !confData.ok) {
        throw new Error(confData.code || "confirm issue failed");
      }
      setClaimSubject("");
      setClaimNote("");
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("SOROBAN_AUTH") || msg.includes("NOT_ALLOWED")
          ? tr("vault.pollarAuthPolicy")
          : msg || tr("vault.error"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function revoke(vcId: string) {
    setError(null);
    setBusy(true);
    try {
      const prep = await fetch(
        `${API_URL}/api/credentials/${vcId}/prepare-revoke`,
        { method: "POST", credentials: "include" },
      );
      const data = (await prep.json()) as {
        ok?: boolean;
        unsignedXdr?: string;
        code?: string;
        detail?: string;
      };
      if (!prep.ok || !data.ok || !data.unsignedXdr) {
        throw new Error(data.detail || data.code || "prepare revoke failed");
      }
      const txHash = await submitXdr(signAndSubmitTx, data.unsignedXdr);
      const conf = await fetch(
        `${API_URL}/api/credentials/${vcId}/confirm-revoke`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash }),
        },
      );
      const confData = (await conf.json()) as { ok?: boolean; code?: string };
      if (!conf.ok || !confData.ok) {
        throw new Error(confData.code || "confirm revoke failed");
      }
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || tr("vault.error"));
    } finally {
      setBusy(false);
    }
  }

  async function share(vcId: string) {
    setError(null);
    setShareUrl(null);
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/credentials/${vcId}/share`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ttlHours: 72 }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        path?: string;
        code?: string;
      };
      if (!res.ok || !data.ok || !data.path) {
        throw new Error(data.code || "share failed");
      }
      setShareUrl(`${window.location.origin}${data.path}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || tr("vault.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-4 text-left">
      <div className="rounded-[var(--radius)] bg-[var(--surface)] px-5 py-5 shadow-sm ring-1 ring-black/5">
        <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
          {tr("vault.issueTitle")}
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {tr("vault.issueSupporting")}
        </p>
        <label className="mt-4 block text-xs text-[var(--text-secondary)]">
          {tr("vault.holder")}
          <input
            value={holderAddress}
            onChange={(e) => setHolderAddress(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 font-mono text-xs text-[var(--text)]"
            spellCheck={false}
          />
        </label>
        <label className="mt-3 block text-xs text-[var(--text-secondary)]">
          {tr("vault.type")}
          <input
            value={credType}
            onChange={(e) => setCredType(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--text)]"
          />
        </label>
        <label className="mt-3 block text-xs text-[var(--text-secondary)]">
          {tr("vault.subject")}
          <input
            value={claimSubject}
            onChange={(e) => setClaimSubject(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--text)]"
          />
        </label>
        <label className="mt-3 block text-xs text-[var(--text-secondary)]">
          {tr("vault.note")}
          <input
            value={claimNote}
            onChange={(e) => setClaimNote(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--text)]"
          />
        </label>
        <button
          type="button"
          disabled={busy}
          onClick={() => void issue()}
          className="mt-4 w-full rounded-[var(--radius)] bg-[var(--accent)] px-7 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? tr("vault.working") : tr("vault.issueCta")}
        </button>
      </div>

      <div className="rounded-[var(--radius)] bg-[var(--surface)] px-5 py-5 shadow-sm ring-1 ring-black/5">
        <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
          {tr("vault.listTitle")}
        </p>
        {loading ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {tr("vault.loading")}
          </p>
        ) : creds.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {tr("vault.empty")}
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {creds.map((c) => (
              <li
                key={c.vcId}
                className="border-t border-black/5 pt-3 first:border-0 first:pt-0"
              >
                <p className="text-sm font-medium text-[var(--text)]">
                  {c.type || "VC"} · {c.status}
                </p>
                <p className="mt-1 truncate font-mono text-[10px] text-[var(--text-secondary)]">
                  {c.vcId}
                </p>
                {c.status === "valid" ? (
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void share(c.vcId)}
                      className="text-xs text-[var(--accent)] underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      {tr("vault.share")}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void revoke(c.vcId)}
                      className="text-xs text-[var(--danger)] underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      {tr("vault.revoke")}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {shareUrl ? (
          <p className="mt-3 break-all text-xs text-[var(--success)]">
            {tr("vault.shareReady")}:{" "}
            <a href={shareUrl} className="underline">
              {shareUrl}
            </a>
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
