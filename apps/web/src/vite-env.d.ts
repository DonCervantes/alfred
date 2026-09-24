/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLLAR_PUBLISHABLE_KEY: string;
  readonly VITE_API_URL?: string;
  /** Set to "1" for Playwright smoke (stub Pollar, no OAuth). */
  readonly VITE_E2E_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
