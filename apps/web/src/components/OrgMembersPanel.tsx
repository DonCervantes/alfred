import { useCallback, useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleProvider";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787";

type OrgRole = "admin" | "issuer" | "viewer";

type Member = {
  stellarAddress: string;
  role: OrgRole;
  label: string | null;
  createdAt: string;
};

type Me = {
  allowlistEnabled: boolean;
  role: OrgRole | null;
  canIssue: boolean;
  canManage: boolean;
};

function truncate(addr: string) {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

type Props = {
  selfAddress: string;
};

export function OrgMembersPanel({ selfAddress }: Props) {
  const { tr } = useLocale();
  const [me, setMe] = useState<Me | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState(selfAddress);
  const [role, setRole] = useState<OrgRole>("admin");
  const [label, setLabel] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, listRes] = await Promise.all([
        fetch(`${API_URL}/api/org/me`, { credentials: "include" }),
        fetch(`${API_URL}/api/org/members`, { credentials: "include" }),
      ]);
      const meData = (await meRes.json()) as Me & { ok?: boolean };
      const listData = (await listRes.json()) as {
        ok?: boolean;
        members?: Member[];
        allowlistEnabled?: boolean;
      };
      if (meRes.ok && meData.ok !== false) {
        setMe({
          allowlistEnabled: Boolean(meData.allowlistEnabled),
          role: meData.role,
          canIssue: Boolean(meData.canIssue),
          canManage: Boolean(meData.canManage),
        });
      }
      if (listRes.ok && listData.ok) {
        setMembers(listData.members ?? []);
      }
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
    setAddress(selfAddress);
  }, [selfAddress]);

  useEffect(() => {
    if (!me?.allowlistEnabled) setRole("admin");
  }, [me?.allowlistEnabled]);

  async function addMember() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/org/members`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stellarAddress: address.trim(),
          role: me?.allowlistEnabled ? role : "admin",
          label: label.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; code?: string };
      if (!res.ok || !data.ok) {
        if (data.code === "FORBIDDEN") throw new Error(tr("org.forbidden"));
        throw new Error(data.code || tr("org.error"));
      }
      setLabel("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("org.error"));
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(stellarAddress: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/api/org/members/${encodeURIComponent(stellarAddress)}`,
        { method: "DELETE", credentials: "include" },
      );
      const data = (await res.json()) as { ok?: boolean; code?: string };
      if (!res.ok || !data.ok) {
        if (data.code === "FORBIDDEN") throw new Error(tr("org.forbidden"));
        throw new Error(data.code || tr("org.error"));
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("org.error"));
    } finally {
      setBusy(false);
    }
  }

  const canManage = me?.canManage ?? false;

  return (
    <div className="w-full max-w-md rounded-[var(--radius)] bg-[var(--surface)] px-5 py-5 text-left shadow-sm ring-1 ring-black/5">
      <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
        {tr("org.title")}
      </p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {tr("org.supporting")}
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          {tr("vault.loading")}
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            {me?.allowlistEnabled ? tr("org.lockedMode") : tr("org.openMode")}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {tr("org.yourRole")}:{" "}
            <span className="font-medium text-[var(--text)]">
              {me?.role
                ? tr(`org.role.${me.role}` as "org.role.admin")
                : tr("org.noRole")}
            </span>
          </p>

          {!me?.allowlistEnabled ? (
            <p className="mt-3 text-xs text-[var(--accent)]">
              {tr("org.bootstrapHint")}
            </p>
          ) : null}

          {canManage ? (
            <div className="mt-4 space-y-2">
              <label className="block text-xs text-[var(--text-secondary)]">
                {tr("org.address")}
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 font-mono text-xs text-[var(--text)]"
                  spellCheck={false}
                />
              </label>
              {me?.allowlistEnabled ? (
                <label className="block text-xs text-[var(--text-secondary)]">
                  {tr("org.role")}
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as OrgRole)}
                    className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--text)]"
                  >
                    <option value="admin">{tr("org.role.admin")}</option>
                    <option value="issuer">{tr("org.role.issuer")}</option>
                    <option value="viewer">{tr("org.role.viewer")}</option>
                  </select>
                </label>
              ) : null}
              <label className="block text-xs text-[var(--text-secondary)]">
                {tr("org.label")}
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1 w-full rounded-[var(--radius)] border border-black/10 bg-white px-3 py-2 text-sm text-[var(--text)]"
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => void addMember()}
                className="w-full rounded-[var(--radius)] bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {tr("org.add")}
              </button>
            </div>
          ) : null}

          {members.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              {tr("org.empty")}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {members.map((m) => (
                <li
                  key={m.stellarAddress}
                  className="flex items-start justify-between gap-3 border-t border-black/5 pt-3 first:border-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)]">
                      {tr(`org.role.${m.role}` as "org.role.admin")}
                      {m.label ? ` · ${m.label}` : ""}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--text-secondary)]">
                      {truncate(m.stellarAddress)}
                    </p>
                  </div>
                  {canManage && me?.allowlistEnabled ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeMember(m.stellarAddress)}
                      className="shrink-0 text-xs text-[var(--danger)] underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      {tr("org.remove")}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error ? (
        <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
