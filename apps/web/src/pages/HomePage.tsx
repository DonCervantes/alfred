import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../i18n/LocaleProvider";
import { SignInSheet } from "../components/SignInSheet";
import { CreateAlfredWizard } from "../components/CreateAlfredWizard";
import { VaultPanel } from "../components/VaultPanel";
import { IssuerDashboard } from "../components/IssuerDashboard";
import { OrgMembersPanel } from "../components/OrgMembersPanel";
import { DocumentSealPanel } from "../components/DocumentSealPanel";
import { isE2eMock, useAlfredPollar } from "../providers/pollar-hooks";

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
  const hasPollarKey =
    Boolean(import.meta.env.VITE_POLLAR_PUBLISHABLE_KEY) || isE2eMock();

  if (!hasPollarKey) {
    return <HomeWithoutPollar />;
  }

  return <HomeWithPollar />;
}

function HomeWithoutPollar() {
  const { locale, setLocale, tr } = useLocale();
  return (
    <Shell locale={locale} setLocale={setLocale} marketing>
      <MarketingHero
        tr={tr}
        cta={
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">
            {tr("auth.missingKey")}
          </p>
        }
      />
    </Shell>
  );
}

function HomeWithPollar() {
  const { locale, setLocale, tr } = useLocale();
  const { isAuthenticated, verified, wallet, login, logout, refreshWalletBalance } =
    useAlfredPollar();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<AlfredProfile | null>(null);
  const [documentHashSeed, setDocumentHashSeed] = useState<string | null>(null);

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

  // Detect spendable XLM on testnet (account can exist with 0 balance).
  useEffect(() => {
    if (!wallet?.address) {
      setActivated(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `https://horizon-testnet.stellar.org/accounts/${wallet.address}`,
        );
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as {
          balances?: { asset_type?: string; balance?: string }[];
        };
        const native = body.balances?.find((b) => b.asset_type === "native");
        const bal = native?.balance != null ? Number.parseFloat(native.balance) : 0;
        if (!cancelled && bal >= 1) setActivated(true);
      } catch {
        // keep deferred until activate succeeds
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wallet?.address]);

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
    <Shell locale={locale} setLocale={setLocale} marketing={!isAuthenticated}>
      {isAuthenticated && wallet ? (
        <AppStage>
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
                  {tr("auth.activateFirst")}
                </p>
              ) : null}
            </div>

            {sessionReady && (!activated || profile?.needsOnboarding) ? (
              <button
                type="button"
                onClick={() => void activateWallet()}
                disabled={activating}
                className={`w-full max-w-md rounded-[var(--radius)] px-7 py-3.5 text-base font-medium shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 ${
                  activated
                    ? "bg-white text-[var(--text)] ring-1 ring-black/10"
                    : "bg-[var(--accent)] text-white"
                }`}
              >
                {activating
                  ? tr("auth.activating")
                  : activated
                    ? tr("auth.refund")
                    : tr("auth.activate")}
              </button>
            ) : null}

            {activateError ? (
              <p className="max-w-md text-center text-sm text-[var(--danger)]" role="alert">
                {activateError}
              </p>
            ) : null}

            {sessionReady && activated && profile?.needsOnboarding && wallet?.address ? (
              <CreateAlfredWizard
                walletAddress={wallet.address}
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
            activated &&
            profile &&
            !profile.needsOnboarding &&
            profile.vaultAddress &&
            wallet?.address ? (
              <>
                <VaultPanel
                  selfAddress={wallet.address}
                  documentHashSeed={documentHashSeed}
                />
                <DocumentSealPanel
                  onHashReady={(hash) => setDocumentHashSeed(hash)}
                />
                <IssuerDashboard />
                <OrgMembersPanel selfAddress={wallet.address} />
              </>
            ) : null}

            <button
              type="button"
              onClick={() => void signOut()}
              className="text-sm text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text)] hover:underline"
            >
              {tr("cta.signOut")}
            </button>
          </div>
        </AppStage>
      ) : (
        <MarketingHero
          tr={tr}
          cta={
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSheetOpen(true);
                }}
                className="rounded-[var(--radius)] bg-[var(--accent)] px-8 py-3.5 text-base font-semibold text-white shadow-[0_12px_32px_rgba(0,113,227,0.28)] transition hover:brightness-110 active:scale-[0.98]"
              >
                {tr("cta.continue")}
              </button>
              <p className="text-sm text-[var(--text-secondary)]">
                {tr("auth.poweredBy")}
              </p>
            </div>
          }
        />
      )}

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
  marketing = false,
}: {
  children: ReactNode;
  locale: "en" | "es";
  setLocale: (locale: "en" | "es") => void;
  marketing?: boolean;
}) {
  const { tr } = useLocale();
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: marketing
            ? "radial-gradient(1100px 640px at 18% -8%, rgba(0,113,227,0.22), transparent 58%), radial-gradient(900px 520px at 92% 18%, rgba(52,199,89,0.10), transparent 52%), linear-gradient(165deg, #fbfbfd 0%, #f0f3f8 42%, #e8ecf3 100%)"
            : "radial-gradient(1200px 600px at 50% -10%, rgba(0,113,227,0.10), transparent 55%), linear-gradient(180deg, #ffffff 0%, #f5f5f7 55%, #ececf0 100%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <a
          href="/"
          className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-[var(--text)]"
        >
          <img
            src="/alfred-mark.svg"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span>ALFRED</span>
        </a>
        <div className="flex items-center gap-3">
          <Link
            to="/edu"
            className="text-sm text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text)] hover:underline"
          >
            {tr("nav.education")}
          </Link>
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Language"
          >
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
        </div>
      </header>

      {children}
    </main>
  );
}

function AppStage({ children }: { children: ReactNode }) {
  return (
    <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col items-center px-6 pb-24 pt-6 text-center sm:px-10">
      <h1 className="alfred-fade text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl">
        ALFRED
      </h1>
      <div className="mt-8 flex w-full flex-col items-center alfred-fade">
        {children}
      </div>
    </section>
  );
}

function MarketingHero({
  tr,
  cta,
}: {
  tr: (key: Parameters<ReturnType<typeof useLocale>["tr"]>[0]) => string;
  cta: ReactNode;
}) {
  return (
    <section className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col justify-center px-6 pb-20 pt-6 sm:px-10">
      <HeroAtmosphere />

      <div className="alfred-fade relative mx-auto w-full max-w-3xl text-center">
        <h1 className="text-[4.75rem] leading-[0.88] font-semibold tracking-[-0.05em] text-[var(--text)] sm:text-[7rem] md:text-[8rem]">
          {tr("brand.name")}
        </h1>
        <p className="mx-auto mt-7 max-w-xl text-2xl font-medium tracking-tight text-[var(--text)] sm:text-3xl">
          {tr("brand.tagline")}
        </p>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
          {tr("home.supporting")}
        </p>
        <div className="mt-10 flex justify-center">{cta}</div>
      </div>
    </section>
  );
}

/** Soft light planes only — never a solid mark/card behind the copy. */
function HeroAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="alfred-rise absolute inset-x-[-20%] top-[-12%] h-[75%]"
        style={{
          background:
            "radial-gradient(ellipse 58% 52% at 50% 38%, rgba(0,113,227,0.14), transparent 72%)",
        }}
      />
      <div
        className="alfred-drift absolute -left-[18%] top-[32%] h-[46vmin] w-[46vmin] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(52,199,89,0.10), transparent 70%)",
        }}
      />
      <div
        className="alfred-drift absolute -right-[14%] top-[12%] h-[52vmin] w-[52vmin] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 55% 45%, rgba(0,113,227,0.09), transparent 72%)",
          animationDelay: "1.4s",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(251,251,253,0.65) 50%, rgba(240,243,248,0.95) 100%)",
        }}
      />
    </div>
  );
}
