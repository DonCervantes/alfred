import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLocale } from "../i18n/LocaleProvider";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787";

type VerifyResult = {
  ok?: boolean;
  status?: string;
  type?: string | null;
  contentHash?: string;
  onChainValid?: boolean | null;
  holderDid?: string | null;
  holderAddress?: string | null;
  issuedAt?: string;
  payload?: {
    claims?: Record<string, unknown>;
    type?: string;
  } | null;
  code?: string;
};

export function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const { locale, setLocale, tr } = useLocale();
  const [data, setData] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/verify/${token}`);
        const json = (await res.json()) as VerifyResult;
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          setError(json.code || tr("verify.failed"));
          setData(null);
        } else {
          setData(json);
        }
      } catch {
        if (!cancelled) setError(tr("verify.failed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tr]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(0,113,227,0.10), transparent 55%), linear-gradient(180deg, #ffffff 0%, #f5f5f7 55%, #ececf0 100%)",
        }}
      />
      <header className="relative z-10 flex items-center justify-end gap-2 px-6 py-5 sm:px-10">
        <button
          type="button"
          onClick={() => setLocale("es")}
          className={`rounded-full px-3 py-1 text-sm transition ${
            locale === "es"
              ? "bg-[var(--text)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text)]"
          }`}
        >
          ES
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`rounded-full px-3 py-1 text-sm transition ${
            locale === "en"
              ? "bg-[var(--text)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text)]"
          }`}
        >
          EN
        </button>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg flex-col items-center justify-center px-6 pb-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--text)]">
          {tr("verify.title")}
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          {tr("verify.supporting")}
        </p>

        <div className="mt-8 w-full rounded-[var(--radius)] bg-[var(--surface)] px-5 py-5 text-left shadow-sm ring-1 ring-black/5">
          {loading ? (
            <p className="text-sm text-[var(--text-secondary)]">
              {tr("verify.loading")}
            </p>
          ) : error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : data ? (
            <div className="space-y-3 text-sm">
              <Row label={tr("verify.status")} value={data.status ?? "—"} />
              <Row label={tr("verify.type")} value={data.type ?? "—"} />
              <Row
                label={tr("verify.onChain")}
                value={
                  data.onChainValid === true
                    ? tr("verify.valid")
                    : data.onChainValid === false
                      ? tr("verify.invalid")
                      : tr("verify.unknown")
                }
              />
              {data.holderDid ? (
                <Row label={tr("verify.holderDid")} value={data.holderDid} mono />
              ) : null}
              {data.payload?.claims ? (
                <div>
                  <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
                    {tr("verify.claims")}
                  </p>
                  <pre className="mt-1 overflow-x-auto rounded bg-black/[0.03] p-3 font-mono text-[11px] text-[var(--text)]">
                    {JSON.stringify(data.payload.claims, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <a
          href="/"
          className="mt-8 text-sm text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text)] hover:underline"
        >
          {tr("brand.name")}
        </a>
      </section>
    </main>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
        {label}
      </p>
      <p
        className={`mt-0.5 break-all text-[var(--text)] ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
