/**
 * Pollar branding for ALFRED (ALF-002d).
 *
 * Do NOT pass a partial `appConfig` to PollarProvider — that skips the remote
 * `/applications/config` fetch and can disable Google/GitHub login methods.
 * Name, accent, and logo are configured in the Pollar dashboard (see
 * docs/POLLAR-SETUP.md Step 8). Hosted assets for upload:
 *
 * - Mark:  /alfred-mark.svg
 * - Wordmark: /alfred-wordmark.svg
 * - Accent: #0071E3
 */
export const ALFRED_BRAND = {
  name: "ALFRED",
  accent: "#0071E3",
  markPath: "/alfred-mark.svg",
  wordmarkPath: "/alfred-wordmark.svg",
  /** Absolute URLs after Pages deploy (for Pollar dashboard logo field). */
  markUrl: "https://alfred-web-283.pages.dev/alfred-mark.svg",
  wordmarkUrl: "https://alfred-web-283.pages.dev/alfred-wordmark.svg",
} as const;
