export type Locale = "en" | "es";

export const DEFAULT_LOCALE: Locale = "es";
export const SUPPORTED_LOCALES: Locale[] = ["en", "es"];

export type CredentialStatus = "valid" | "revoked" | "unknown";

export interface AlfredUserProfile {
  id: string;
  stellarAddress: string;
  did?: string;
  vaultAddress?: string;
  locale: Locale;
}
