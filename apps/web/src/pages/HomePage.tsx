import { useLocale } from "../i18n/LocaleProvider";

export function HomePage() {
  const { locale, setLocale, tr } = useLocale();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(0,113,227,0.12), transparent 55%), linear-gradient(180deg, #ffffff 0%, #f5f5f7 55%, #ececf0 100%)",
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

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col items-center justify-center px-6 pb-24 text-center sm:px-10">
        <p className="mb-6 text-[11px] font-medium tracking-[0.22em] text-[var(--text-secondary)] uppercase">
          Stellar · Testnet
        </p>
        <h1 className="text-6xl font-semibold tracking-tight text-[var(--text)] sm:text-7xl md:text-8xl">
          {tr("brand.name")}
        </h1>
        <p className="mt-6 max-w-xl text-2xl font-medium tracking-tight text-[var(--text)] sm:text-3xl">
          {tr("brand.tagline")}
        </p>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
          {tr("home.supporting")}
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            type="button"
            className="rounded-[var(--radius)] bg-[var(--accent)] px-7 py-3.5 text-base font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
          >
            {tr("cta.continue")}
          </button>
          <p className="text-sm text-[var(--text-secondary)]">
            Pollar · Cloudflare · Soroban
          </p>
        </div>
      </section>
    </main>
  );
}
