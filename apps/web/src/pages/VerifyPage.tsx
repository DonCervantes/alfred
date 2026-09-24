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
  network?: string;
  payload?: {
    claims?: Record<string, unknown>;
    type?: string;
    issuedAt?: string;
  } | null;
  code?: string;
};

function truncateMid(value: string, head = 18, tail = 8) {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function formatIssuedAt(iso: string | undefined, locale: string) {
  if (!iso) return null;
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return iso;
  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function claimEntries(claims: Record<string, unknown> | undefined) {
  if (!claims) return [];
  return Object.entries(claims).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== "",
  );
}

export function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const { locale, setLocale, tr } = useLocale();
  const [data, setData] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setEntered(false);
      try {
        const res = await fetch(`${API_URL}/api/verify/${token}`);
        const json = (await res.json()) as VerifyResult;
        if (cancelled) return;
        if (!res.ok || !json.ok) {
          setError(json.code || tr("verify.failed"));
          setData(null);
        } else {
          setData(json);
          requestAnimationFrame(() => setEntered(true));
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

  const isValid =
    data?.status === "valid" && data.onChainValid !== false;
  const claims = claimEntries(data?.payload?.claims);
  const issuedLabel = formatIssuedAt(
    data?.payload?.issuedAt ?? data?.issuedAt,
    locale,
  );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 480px at 50% -8%, rgba(0,113,227,0.14), transparent 58%), radial-gradient(700px 400px at 80% 90%, rgba(52,199,89,0.08), transparent 50%), linear-gradient(180deg, #ffffff 0%, #f5f5f7 52%, #ebebef 100%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <a
          href="/"
          className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
        >
          {tr("brand.name")}
        </a>
        <div className="flex gap-1">
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
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col items-center justify-center px-6 pb-20">
        {loading ? (
          <p className="animate-pulse text-sm text-[var(--text-secondary)]">
            {tr("verify.loading")}
          </p>
        ) : error ? (
          <div className="w-full text-center">
            <p className="text-5xl font-semibold tracking-tight text-[var(--text)]">
              {tr("brand.name")}
            </p>
            <p className="mt-8 text-lg font-medium text-[var(--danger)]" role="alert">
              {tr("verify.failed")}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{error}</p>
          </div>
        ) : data ? (
          <div
            className={`w-full transition duration-700 ease-out ${
              entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <div className="text-center">
              <p className="text-[11px] font-medium tracking-[0.2em] text-[var(--text-secondary)] uppercase">
                {tr("verify.badge")}
              </p>
              <h1 className="mt-3 text-5xl font-semibold tracking-tight text-[var(--text)] sm:text-6xl">
                {tr("brand.name")}
              </h1>
              <p className="mt-3 text-base text-[var(--text-secondary)]">
                {tr("verify.supporting")}
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full transition delay-150 duration-500 ${
                  entered ? "scale-100 opacity-100" : "scale-75 opacity-0"
                } ${
                  isValid
                    ? "bg-[var(--success)]/15 text-[var(--success)]"
                    : "bg-[var(--danger)]/12 text-[var(--danger)]"
                }`}
                aria-hidden
              >
                {isValid ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7 7l10 10M17 7L7 17"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              <p
                className={`mt-4 text-2xl font-semibold tracking-tight ${
                  isValid ? "text-[var(--success)]" : "text-[var(--danger)]"
                }`}
              >
                {isValid ? tr("verify.verdictOk") : tr("verify.verdictBad")}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {data.type || "AlfredCredential"}
                {data.onChainValid === true
                  ? ` · ${tr("verify.onChainOk")}`
                  : data.onChainValid === false
                    ? ` · ${tr("verify.onChainBad")}`
                    : ""}
              </p>
            </div>

            <div className="mt-10 space-y-6 text-left">
              {claims.length > 0 ? (
                <div>
                  <p className="text-[11px] font-medium tracking-[0.18em] text-[var(--text-secondary)] uppercase">
                    {tr("verify.claims")}
                  </p>
                  <dl className="mt-3 divide-y divide-black/5 border-y border-black/5">
                    {claims.map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-baseline justify-between gap-4 py-3"
                      >
                        <dt className="shrink-0 text-sm text-[var(--text-secondary)] capitalize">
                          {key}
                        </dt>
                        <dd className="text-right text-sm font-medium text-[var(--text)] break-words">
                          {typeof value === "string" || typeof value === "number"
                            ? String(value)
                            : JSON.stringify(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              <div>
                <p className="text-[11px] font-medium tracking-[0.18em] text-[var(--text-secondary)] uppercase">
                  {tr("verify.details")}
                </p>
                <dl className="mt-3 space-y-3">
                  {data.holderDid ? (
                    <Detail
                      label={tr("verify.holderDid")}
                      value={truncateMid(data.holderDid, 22, 10)}
                      title={data.holderDid}
                    />
                  ) : null}
                  {issuedLabel ? (
                    <Detail label={tr("verify.issuedAt")} value={issuedLabel} />
                  ) : null}
                  {data.network ? (
                    <Detail
                      label={tr("verify.network")}
                      value={data.network}
                    />
                  ) : null}
                </dl>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Detail({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-[var(--text-secondary)]">{label}</dt>
      <dd
        className="mt-0.5 font-mono text-[12px] leading-relaxed text-[var(--text)]"
        title={title}
      >
        {value}
      </dd>
    </div>
  );
}
