import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  detectLocale,
  t,
  type Locale,
  type MessageKey,
} from "@alfred/shared";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  tr: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const COOKIE = "alfred-locale";

function readCookieLocale(): Locale | null {
  const match = document.cookie.match(/(?:^|; )alfred-locale=(en|es)/);
  return (match?.[1] as Locale | undefined) ?? null;
}

function writeCookieLocale(locale: Locale) {
  document.cookie = `${COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return readCookieLocale() ?? detectLocale(navigator.language);
  });

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        writeCookieLocale(next);
        setLocaleState(next);
      },
      tr: (key) => t(locale, key),
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
