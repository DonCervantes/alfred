import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
    locale: "es-MX",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command:
      "pnpm exec vite build && pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
    url: BASE,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ...process.env,
      VITE_E2E_MOCK: "1",
      VITE_API_URL: "http://127.0.0.1:8787",
      VITE_POLLAR_PUBLISHABLE_KEY: "pub_testnet_e2e_mock",
    },
  },
});
