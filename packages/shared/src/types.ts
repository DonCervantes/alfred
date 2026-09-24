export type Locale = "en" | "es";

export const DEFAULT_LOCALE: Locale = "es";
export const SUPPORTED_LOCALES: Locale[] = ["en", "es"];

export type CredentialStatus = "pending" | "valid" | "revoked" | "unknown";

export interface AlfredUserProfile {
  id: string;
  stellarAddress: string;
  did?: string;
  vaultAddress?: string;
  locale: Locale;
}

export interface CredentialMeta {
  vcId: string;
  type: string | null;
  contentHash: string;
  status: CredentialStatus | string;
  network: string;
  createdAt: string;
  updatedAt: string;
  holderUserId: string;
  issuerUserId: string | null;
}
