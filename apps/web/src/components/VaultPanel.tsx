import {
  CREDENTIAL_TEMPLATES,
  getDefaultTemplate,
  getTemplateById,
  type CredentialTemplate,
} from "@alfred/shared";
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

function emptyClaims(template: CredentialTemplate): Record<string, string> {
  const next: Record<string, string> = {};
  for (const f of template.fields) next[f.key] = "";
  return next;
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
  const [templates, setTemplates] = useState<CredentialTemplate[]>([
    ...CREDENTIAL_TEMPLATES,
  ]);
  const [templateId, setTemplateId] = useState(getDefaultTemplate().id);
  const [claimValues, setClaimValues] = useState<Record<string, string>>(() =>
    emptyClaims(getDefaultTemplate()),
  );
  const [feeQuote, setFeeQuote] = useState<{
    enabled: boolean;
    amountDisplay: string;
  } | null>(null);
  const [statusHint, setStatusHint] = useState<string | null>(null);

  const activeTemplate =
    getTemplateById(templateId) ??
    templates.find((t) => t.id === templateId) ??
    getDefaultTemplate();

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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/api/credentials/templates`, {
          credentials: "include",
        });
        const data = (await res.json()) as {
          ok?: boolean;
          templates?: CredentialTemplate[];
        };
        if (!cancelled && res.ok && data.ok && data.templates?.length) {
          setTemplates(data.templates);
        }
      } catch {
        // fall back to shared bundle
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/api/fees/quote`);
        const data = (await res.json()) as {
          ok?: boolean;
          enabled?: boolean;
          amountDisplay?: string;
        };
        if (!cancelled && res.ok && data.ok) {
          setFeeQuote({
            enabled: Boolean(data.enabled),
            amountDisplay: data.amountDisplay ?? "0",
          });
        }
      } catch {
        // quote is best-effort
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function selectTemplate(id: string) {
    setTemplateId(id);
    const tpl =
      getTemplateById(id) ??
      templates.find((t) => t.id === id) ??
      getDefaultTemplate();
    setClaimValues(emptyClaims(tpl));
  }

  async function issue() {
    setError(null);
    setShareUrl(null);
    setStatusHint(null);
    setBusy(true);
    try {
      const claims: Record<string, string> = {};
      for (const field of activeTemplate.fields) {
        const v = claimValues[field.key]?.trim() ?? "";
        if (v) claims[field.key] = v;
      }

      const prep = await fetch(`${API_URL}/api/credentials/prepare-issue`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holderAddress: holderAddress.trim(),
          templateId: activeTemplate.id,
          claims,
        }),
      });
      const data = (await prep.json()) as {
        ok?: boolean;
        unsignedXdr?: string;
        feeCollectXdr?: string | null;
        fee?: { enabled?: boolean; amountDisplay?: string };
        vcId?: string;
        code?: string;
        detail?: string;
        field?: string;
      };
      if (!prep.ok || !data.ok || !data.unsignedXdr || !data.vcId) {
        if (data.code === "MISSING_CLAIM" || data.code === "INVALID_CLAIM") {
          throw new Error(tr("vault.tpl.missingClaim"));
        }
        if (data.code === "NOT_ISSUER") {
          throw new Error(tr("org.notIssuer"));
        }
        throw new Error(data.detail || data.code || "prepare issue failed");
      }
      if (data.fee) {
        setFeeQuote({
          enabled: Boolean(data.fee.enabled),
          amountDisplay: data.fee.amountDisplay ?? "0",
        });
      }
      if (data.feeCollectXdr) {
        setStatusHint(tr("vault.feeCollecting"));
        await submitXdr(signAndSubmitTx, data.feeCollectXdr);
      }
      setStatusHint(tr("vault.working"));
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
      setClaimValues(emptyClaims(activeTemplate));
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("SOROBAN_AUTH") || msg.includes("NOT_ALLOWED")
          ? tr("vault.pollarAuthPolicy")
          : msg || tr("vault.error"),
      );
    } finally {
      setStatusHint(null);
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
          {tr("vault.template")}
          <select
            value={templateId}
            onChange={(e) => selectTemplate(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--text)]"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {tr(t.labelKey)}
              </option>
            ))}
          </select>
        </label>
        {activeTemplate.fields.map((field) => (
          <label
            key={field.key}
            className="mt-3 block text-xs text-[var(--text-secondary)]"
          >
            {tr(field.labelKey)}
            {field.required ? " *" : ""}
            <input
              type={field.input === "date" ? "date" : "text"}
              value={claimValues[field.key] ?? ""}
              onChange={(e) =>
                setClaimValues((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
              className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--text)]"
            />
          </label>
        ))}
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          {tr("vault.feeLabel")}:{" "}
          <span className="font-medium text-[var(--text)]">
            {feeQuote == null
              ? "…"
              : feeQuote.enabled
                ? tr("vault.feeUsdc").replace(
                    "{amount}",
                    feeQuote.amountDisplay,
                  )
                : tr("vault.feeFree")}
          </span>
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void issue()}
          className="mt-4 w-full rounded-[var(--radius)] bg-[var(--accent)] px-7 py-3 text-sm font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {busy
            ? statusHint || tr("vault.working")
            : tr("vault.issueCta")}
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
