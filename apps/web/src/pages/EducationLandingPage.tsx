import { Link } from "react-router-dom";
import { useLocale } from "../i18n/LocaleProvider";

export function EducationLandingPage() {
  const { locale, setLocale, tr } = useLocale();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 20% -10%, rgba(0,113,227,0.18), transparent 55%), linear-gradient(165deg, #fbfbfd 0%, #eef3f9 100%)",
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

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center px-6 pb-20 text-center">
        <p className="text-[11px] font-medium tracking-[0.2em] text-[var(--text-secondary)] uppercase">
          {tr("edu.badge")}
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em] text-[var(--text)] sm:text-6xl">
          {tr("edu.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg text-[var(--text-secondary)]">
          {tr("edu.supporting")}
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/edu/app"
            className="rounded-[var(--radius)] bg-[var(--accent)] px-8 py-3.5 text-base font-semibold text-white"
          >
            {tr("edu.cta")}
          </Link>
          <Link
            to="/"
            className="text-sm text-[var(--text-secondary)] underline-offset-4 hover:underline"
          >
            {tr("edu.backHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
