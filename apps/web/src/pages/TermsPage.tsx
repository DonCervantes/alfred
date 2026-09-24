import { Link } from "react-router-dom";
import { useLocale } from "../i18n/LocaleProvider";

export function TermsPage() {
  const { locale, setLocale, tr } = useLocale();

  return (
    <main className="relative min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, #fbfbfd 0%, #f0f3f8 50%, #e8ecf3 100%)",
        }}
      />
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="font-semibold tracking-tight text-[var(--text)]">
          ALFRED
        </Link>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setLocale("es")}
            className={`rounded-full px-3 py-1 text-sm ${
              locale === "es"
                ? "bg-[var(--text)] text-white"
                : "text-[var(--text-secondary)]"
            }`}
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`rounded-full px-3 py-1 text-sm ${
              locale === "en"
                ? "bg-[var(--text)] text-white"
                : "text-[var(--text-secondary)]"
            }`}
          >
            EN
          </button>
        </div>
      </header>

      <article className="relative z-10 mx-auto max-w-2xl px-6 pb-24 pt-8">
        <p className="text-[11px] font-medium tracking-[0.2em] text-[var(--text-secondary)] uppercase">
          {tr("legal.draftBadge")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--text)]">
          {tr("legal.termsTitle")}
        </h1>
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          {tr("legal.updated")}
        </p>
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-[var(--text)]">
          <p>{tr("legal.terms.p1")}</p>
          <p>{tr("legal.terms.p2")}</p>
          <p>{tr("legal.terms.p3")}</p>
          <p>{tr("legal.terms.p4")}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {tr("legal.notAdvice")}
          </p>
        </div>
        <p className="mt-10">
          <Link
            to="/privacy"
            className="text-sm text-[var(--accent)] underline-offset-4 hover:underline"
          >
            {tr("legal.privacyTitle")}
          </Link>
        </p>
      </article>
    </main>
  );
}
