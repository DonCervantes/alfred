import type { Locale } from "../types.js";
import { en } from "./en.js";
import { es } from "./es.js";

export type MessageKey = keyof typeof en;

const dictionaries = { en, es } as const;

export function detectLocale(acceptLanguage?: string | null): Locale {
  if (!acceptLanguage) return "es";
  const primary = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
  if (primary.startsWith("en")) return "en";
  if (primary.startsWith("es")) return "es";
  return "es";
}

export function t(locale: Locale, key: MessageKey): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
}

export { en, es };
