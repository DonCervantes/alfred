import { CREDENTIAL_TEMPLATES } from "@alfred/shared";
import { usePollar } from "@pollar/react";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787";

type IssuedCred = {
  vcId: string;
  type: string | null;
  status: string;
  createdAt: string;
  holderAddress?: string | null;
  revokeReason?: string | null;
};

type AuditEvent = {
  id: string;
  action: string;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
};

function truncate(addr: string, head = 6, tail = 4) {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

async function submitXdr(
  signAndSubmitTx: (xdr: string) => Promise<unknown>,
  unsignedXdr: string,
): Promise<string | null> {
  const outcome = await signAndSubmitTx(unsignedXdr);
  if (outcome && typeof outcome === "object" && "status" in outcome) {
    const status = (outcome as { status?: string }).status;
    if (status === "error" || status === "failed") {
      throw new Error(
        (outcome as { details?: string }).details ||
          (outcome as { error?: string }).error ||
          "submit failed",
      );
    }
    return (
      (outcome as { hash?: string }).hash ||
      (outcome as { txHash?: string }).txHash ||
      null
    );
  }
  return null;
}

export function IssuerDashboard() {
  const { tr, locale } = useLocale();
  const { signAndSubmitTx } = usePollar();
  const [creds, setCreds] = useState<IssuedCred[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "issuer" });
      if (status !== "all") params.set("status", status);
      if (type !== "all") params.set("type", type);
      if (appliedQ.trim()) params.set("q", appliedQ.trim());
      const [credRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/api/credentials?${params}`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/credentials/audit?limit=12`, {
          credentials: "include",
        }),
      ]);
      const data = (await credRes.json()) as {
        ok?: boolean;
        credentials?: IssuedCred[];
      };
      const auditData = (await auditRes.json()) as {
        ok?: boolean;
        events?: AuditEvent[];
      };
      if (credRes.ok && data.ok) setCreds(data.credentials ?? []);
      if (auditRes.ok && auditData.ok) setAudit(auditData.events ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [status, type, appliedQ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const typeOptions = Array.from(
    new Set([
      ...CREDENTIAL_TEMPLATES.map((t) => t.type),
      ...creds.map((c) => c.type).filter((t): t is string => Boolean(t)),
    ]),
  );

  const selectedIds = Object.entries(selected)
    .filter(([, on]) => on)
    .map(([id]) => id);

  async function batchRevoke() {
    if (selectedIds.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const prep = await fetch(
        `${API_URL}/api/credentials/prepare-batch-revoke`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vcIds: selectedIds,
            reason: reason.trim() || undefined,
          }),
        },
      );
      const data = (await prep.json()) as {
        ok?: boolean;
        reason?: string | null;
        items?: { vcId: string; unsignedXdr?: string; error?: string }[];
        code?: string;
      };
      if (!prep.ok || !data.ok || !data.items) {
        throw new Error(data.code || tr("vault.error"));
      }
      for (const item of data.items) {
        if (!item.unsignedXdr) continue;
        const txHash = await submitXdr(signAndSubmitTx, item.unsignedXdr);
        await fetch(
          `${API_URL}/api/credentials/${item.vcId}/confirm-revoke`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              txHash,
              reason: data.reason ?? (reason.trim() || undefined),
            }),
          },
        );
      }
      setSelected({});
      setReason("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("vault.error"));
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    const params = new URLSearchParams({ role: "issuer" });
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    if (appliedQ.trim()) params.set("q", appliedQ.trim());
    try {
      const res = await fetch(
        `${API_URL}/api/credentials/export.csv?${params}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "alfred-issuer.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(tr("vault.error"));
    }
  }

  return (
    <div className="w-full max-w-md space-y-4 text-left">
      <div className="rounded-[var(--radius)] bg-[var(--surface)] px-5 py-5 shadow-sm ring-1 ring-black/5">
        <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
          {tr("issuer.title")}
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {tr("issuer.supporting")}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <label className="block text-xs text-[var(--text-secondary)]">
            {tr("issuer.status")}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-2 py-2 text-sm text-[var(--text)]"
            >
              <option value="all">{tr("issuer.statusAll")}</option>
              <option value="valid">valid</option>
              <option value="pending">pending</option>
              <option value="revoked">revoked</option>
            </select>
          </label>
          <label className="block text-xs text-[var(--text-secondary)]">
            {tr("vault.type")}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-2 py-2 text-sm text-[var(--text)]"
            >
              <option value="all">{tr("issuer.typeAll")}</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-2 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setAppliedQ(q);
            }}
            placeholder={tr("issuer.search")}
            className="min-w-0 flex-1 rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--text)]"
          />
          <button
            type="button"
            onClick={() => setAppliedQ(q)}
            className="shrink-0 rounded-[var(--radius)] bg-[var(--text)] px-3 py-2 text-xs font-medium text-white"
          >
            {tr("issuer.apply")}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void exportCsv()}
            className="rounded-[var(--radius)] px-3 py-2 text-xs font-medium text-[var(--accent)] ring-1 ring-[var(--accent)]/30"
          >
            {tr("issuer.exportCsv")}
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            {tr("vault.loading")}
          </p>
        ) : creds.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            {tr("issuer.empty")}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {creds.map((c) => (
              <li
                key={c.vcId}
                className="border-t border-black/5 pt-3 first:border-0 first:pt-0"
              >
                <label className="flex items-start gap-2">
                  {c.status === "valid" ? (
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={Boolean(selected[c.vcId])}
                      onChange={(e) =>
                        setSelected((prev) => ({
                          ...prev,
                          [c.vcId]: e.target.checked,
                        }))
                      }
                    />
                  ) : (
                    <span className="mt-1 w-4" />
                  )}
                  <span className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)]">
                      {c.type || "VC"} · {c.status}
                    </p>
                    {c.holderAddress ? (
                      <p className="mt-1 font-mono text-[11px] text-[var(--text-secondary)]">
                        {tr("issuer.holder")}: {truncate(c.holderAddress)}
                      </p>
                    ) : null}
                    <p className="mt-0.5 truncate font-mono text-[10px] text-[var(--text-secondary)]">
                      {c.vcId}
                    </p>
                    {c.revokeReason ? (
                      <p className="mt-1 text-[11px] text-[var(--danger)]">
                        {tr("issuer.reason")}: {c.revokeReason}
                      </p>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {selectedIds.length > 0 ? (
          <div className="mt-4 space-y-2 border-t border-black/5 pt-4">
            <label className="block text-xs text-[var(--text-secondary)]">
              {tr("issuer.reason")}
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--text)]"
                placeholder={tr("issuer.reasonPlaceholder")}
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void batchRevoke()}
              className="w-full rounded-[var(--radius)] bg-[var(--danger)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {tr("issuer.batchRevoke").replace(
                "{n}",
                String(selectedIds.length),
              )}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="rounded-[var(--radius)] bg-[var(--surface)] px-5 py-5 shadow-sm ring-1 ring-black/5">
        <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
          {tr("issuer.auditTitle")}
        </p>
        {audit.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {tr("issuer.auditEmpty")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {audit.map((e) => (
              <li key={e.id} className="text-xs text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text)]">
                  {e.action}
                </span>
                {e.entityId ? ` · ${e.entityId.slice(0, 10)}…` : ""}
                <span className="mt-0.5 block">
                  {formatDate(e.createdAt, locale)}
                  {e.detail ? ` — ${e.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string, locale: "en" | "es") {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(t);
}
