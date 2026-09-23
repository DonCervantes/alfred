import type { ReactNode } from "react";
import type { useLocale } from "../i18n/LocaleProvider";

type Tr = ReturnType<typeof useLocale>["tr"];

type Props = {
  open: boolean;
  busy: "google" | "github" | null;
  error: string | null;
  onClose: () => void;
  onGoogle: () => void;
  onGithub: () => void;
  tr: Tr;
};

export function SignInSheet({
  open,
  busy,
  error,
  onClose,
  onGoogle,
  onGithub,
  tr,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={tr("auth.close")}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px] transition"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alfred-signin-title"
        className="relative z-10 w-full max-w-md animate-[sheet-in_280ms_ease-out] rounded-t-[28px] bg-[var(--surface)] px-6 pb-8 pt-5 shadow-2xl ring-1 ring-black/5 sm:rounded-[28px] sm:px-8 sm:pb-9 sm:pt-8"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-black/10 sm:hidden" />

        <h2
          id="alfred-signin-title"
          className="text-center text-[28px] font-semibold tracking-tight text-[var(--text)]"
        >
          {tr("cta.signIn")}
        </h2>
        <p className="mt-2 text-center text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {tr("auth.sheetSupporting")}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <ProviderButton
            label={tr("auth.continueGoogle")}
            busy={busy === "google"}
            disabled={busy !== null}
            onClick={onGoogle}
            icon={<GoogleMark />}
          />
          <ProviderButton
            label={tr("auth.continueGithub")}
            busy={busy === "github"}
            disabled={busy !== null}
            onClick={onGithub}
            icon={<GithubMark />}
          />
        </div>

        {error ? (
          <p className="mt-4 text-center text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <p className="mt-6 text-center text-xs leading-relaxed text-[var(--text-secondary)]">
          {tr("auth.sheetFootnote")}
        </p>

        <button
          type="button"
          onClick={onClose}
          disabled={busy !== null}
          className="mt-4 w-full py-2 text-sm font-medium text-[var(--accent)] disabled:opacity-40"
        >
          {tr("auth.close")}
        </button>
      </div>

      <style>{`
        @keyframes sheet-in {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function ProviderButton({
  label,
  icon,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5f5f7] text-[15px] font-medium text-[var(--text)] transition hover:bg-[#ebebed] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span>{busy ? "…" : label}</span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="#1d1d1f">
      <path d="M12 1C5.92 1 1 5.92 1 12c0 4.86 3.15 8.98 7.52 10.43.55.1.75-.24.75-.53 0-.26-.01-1.12-.02-2.03-3.06.67-3.71-1.3-3.71-1.3-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.7 1.14 1.7 1.14.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.44-.28-5-1.22-5-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3.02 1.12a10.5 10.5 0 0 1 5.5 0c2.1-1.42 3.02-1.12 3.02-1.12.6 1.51.22 2.63.11 2.91.7.77 1.13 1.75 1.13 2.95 0 4.22-2.57 5.15-5.01 5.42.4.34.75 1.02.75 2.06 0 1.49-.01 2.69-.01 3.05 0 .29.2.64.76.53A11.01 11.01 0 0 0 23 12c0-6.08-4.92-11-11-11z" />
    </svg>
  );
}
