import { usePollar } from "@pollar/react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale } from "../i18n/LocaleProvider";
import { SignInSheet } from "../components/SignInSheet";
import { CreateAlfredWizard } from "../components/CreateAlfredWizard";
import { VaultPanel } from "../components/VaultPanel";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8787";

function truncateAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

type AlfredProfile = {
  id: string;
  stellarAddress: string | null;
  did: string | null;
  vaultAddress: string | null;
  needsOnboarding?: boolean;
};

export function HomePage() {
  const hasPollarKey = Boolean(import.meta.env.VITE_POLLAR_PUBLISHABLE_KEY);

  if (!hasPollarKey) {
    return <HomeWithoutPollar />;
  }

  return <HomeWithPollar />;
}

function HomeWithoutPollar() {
  const { locale, setLocale, tr } = useLocale();
  return (
    <Shell locale={locale} setLocale={setLocale}>
      <Hero tr={tr}>
        <p className="max-w-sm text-sm text-[var(--text-secondary)]">
          {tr("auth.missingKey")}
        </p>
      </Hero>
    </Shell>
  );
}

function HomeWithPollar() {
  const { locale, setLocale, tr } = useLocale();
  const { isAuthenticated, verified, wallet, login, logout, refreshWalletBalance } =
    usePollar();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<AlfredProfile | null>(null);

  async function refreshProfile() {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });
      if (!res.ok) {
        setProfile(null);
        return;
      }
      const data = (await res.json()) as {
        ok?: boolean;
        user?: AlfredProfile;
      };
      if (data.ok && data.user) setProfile(data.user);
    } catch {
      setProfile(null);
    }
  }

  // ALF-031: bridge Pollar login → ALFRED HttpOnly session cookie
  useEffect(() => {
    if (!isAuthenticated || !verified || !wallet?.address) {
      setSessionReady(false);
      setProfile(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/session`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicKey: wallet.address,
            locale,
          }),
        });
        if (!cancelled) {
          setSessionReady(res.ok);
          if (res.ok) {
            setBusy(null);
            await refreshProfile();
          }
        }
      } catch {
        if (!cancelled) setSessionReady(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, verified, wallet?.address, locale]);

  async function startLogin(provider: "google" | "github") {
    setError(null);
    setBusy(provider);
    try {
      await Promise.resolve(login({ provider }));
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const message = raw.includes("APPLICATION_HAS_NO_REDIRECT_URIS")
        ? tr("auth.redirectUrisMissing")
        : raw || tr("auth.loginError");
      setError(message);
      setBusy(null);
    }
  }

  async function signOut() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // still clear Pollar client
    }
    setSessionReady(false);
    setActivated(false);
    setProfile(null);
    logout();
  }

  async function activateWallet() {
    if (!wallet?.address) return;
    setActivateError(null);
    setActivating(true);
    try {
      const res = await fetch(`${API_URL}/api/activate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: wallet.address }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        activated?: boolean;
        code?: string;
        detail?: string;
      };

      if (!res.ok || !data.ok) {
        if (data.code === "POLLAR_UNREACHABLE" || res.status === 503) {
          setActivateError(tr("auth.apiOffline"));
        } else if (data.code === "MISSING_POLLAR_SECRET") {
          setActivateError(tr("auth.missingSecret"));
        } else if (data.code === "WALLET_NOT_FOUND") {
          setActivateError(tr("auth.walletNotFound"));
        } else if (data.code === "WALLET_CREATION_FAILED" || data.code === "FUND_XLM_FAILED") {
          setActivateError(tr("auth.walletCreationFailed"));
        } else if (
          data.code === "INSUFFICIENT_FUNDS" ||
          res.status === 402 ||
          data.code?.includes("402")
        ) {
          setActivateError(tr("auth.treasuryEmpty"));
        } else {
          setActivateError(
            data.code
              ? `${tr("auth.activateError")} (${data.code})`
              : tr("auth.activateError"),
          );
        }
        return;
      }

      setActivated(true);
      try {
        await refreshWalletBalance();
      } catch {
        // balance refresh is best-effort after fund
      }
    } catch {
      setActivateError(tr("auth.apiOffline"));
    } finally {
      setActivating(false);
    }
  }

  return (
    <Shell locale={locale} setLocale={setLocale}>
      <Hero tr={tr}>
        {isAuthenticated && wallet ? (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <p className="text-sm font-medium text-[var(--success)]">
              {tr("auth.signedIn")}
            </p>
            <div className="w-full rounded-[var(--radius)] bg-[var(--surface)] px-5 py-4 text-left shadow-sm ring-1 ring-black/5">
              <p className="text-xs tracking-wide text-[var(--text-secondary)] uppercase">
                {tr("auth.wallet")}
              </p>
              <p className="mt-1 font-mono text-sm text-[var(--text)]">
                {truncateAddress(wallet.address)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {activated ? tr("auth.activated") : tr("auth.deferred")}
              </p>
              {sessionReady ? (
                <p className="mt-2 text-xs text-[var(--success)]">
                  {tr("auth.sessionReady")}
                </p>
              ) : null}
              {profile?.did ? (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  {tr("onboard.profileDid")}:{" "}
                  <span className="font-mono">{profile.did}</span>
                </p>
              ) : null}
              {profile?.vaultAddress ? (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {tr("onboard.profileVault")}:{" "}
                  <span className="font-mono">
                    {truncateAddress(profile.vaultAddress)}
                  </span>
                </p>
              ) : null}
              {!activated ? (
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {tr("auth.activateHint")}
                </p>
              ) : null}
            </div>

            {sessionReady && profile?.needsOnboarding ? (
              <CreateAlfredWizard
                onDone={(p) => {
                  setProfile((prev) =>
                    prev
                      ? {
                          ...prev,
                          did: p.did,
                          vaultAddress: p.vaultAddress,
                          needsOnboarding: false,
                        }
                      : prev,
                  );
                  void refreshProfile();
                }}
              />
            ) : null}

            {sessionReady &&
            profile &&
            !profile.needsOnboarding &&
            profile.vaultAddress &&
            wallet?.address ? (
              <VaultPanel selfAddress={wallet.address} />
            ) : null}

            {!activated ? (
              <button
                type="button"
                onClick={() => void activateWallet()}
                disabled={activating}
                className="w-full max-w-md rounded-[var(--radius)] bg-[var(--accent)] px-7 py-3.5 text-base font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {activating ? tr("auth.activating") : tr("auth.activate")}
              </button>
            ) : null}

            {activateError ? (
              <p className="max-w-md text-center text-sm text-[var(--danger)]" role="alert">
                {activateError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text)] hover:underline"
            >
              {tr("cta.signOut")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setSheetOpen(true);
              }}
              className="rounded-[var(--radius)] bg-[var(--accent)] px-7 py-3.5 text-base font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
            >
              {tr("cta.continue")}
            </button>
            <p className="text-sm text-[var(--text-secondary)]">
              {tr("auth.poweredBy")}
            </p>
          </div>
        )}
      </Hero>

      <SignInSheet
        open={sheetOpen && !isAuthenticated}
        busy={busy}
        error={error}
        onClose={() => {
          if (busy) return;
          setSheetOpen(false);
          setError(null);
        }}
        onGoogle={() => void startLogin("google")}
        onGithub={() => void startLogin("github")}
        tr={tr}
      />
    </Shell>
  );
}

function Shell({
  children,
  locale,
  setLocale,
}: {
  children: ReactNode;
  locale: "en" | "es";
  setLocale: (locale: "en" | "es") => void;
}) {
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

      {children}
    </main>
  );
}

function Hero({
  tr,
  children,
}: {
  tr: (key: Parameters<ReturnType<typeof useLocale>["tr"]>[0]) => string;
  children: ReactNode;
}) {
  return (
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
      <div className="mt-10 flex w-full flex-col items-center">{children}</div>
    </section>
  );
}
