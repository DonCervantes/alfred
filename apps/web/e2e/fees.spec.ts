import { test, expect } from "@playwright/test";

const E2E_WALLET = "GTESTE2EWALLET000000000000000000000000000000000000000";

async function mockSignedInApis(page: import("@playwright/test").Page) {
  await page.route("**/api/auth/session", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        user: {
          id: "e2e-user",
          stellarAddress: E2E_WALLET,
          did: `did:stellar:testnet:${E2E_WALLET}`,
          vaultAddress: "CVAULTE2E000000000000000000000000000000000000000000",
          needsOnboarding: false,
        },
      }),
    });
  });

  await page.route("**/horizon-testnet.stellar.org/accounts/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        balances: [{ asset_type: "native", balance: "100.0000000" }],
      }),
    });
  });

  await page.route("**/api/fees/quote", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        enabled: true,
        amount: "1000000",
        amountDisplay: "0.1",
        decimals: 7,
        asset: "USDC",
      }),
    });
  });

  await page.route("**/api/credentials**", async (route) => {
    const url = route.request().url();
    if (url.includes("/templates")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          templates: [
            {
              id: "alfred",
              type: "AlfredCredential",
              label: { en: "ALFRED", es: "ALFRED" },
              fields: [
                {
                  key: "subject",
                  label: { en: "Subject", es: "Asunto" },
                  input: "text",
                },
              ],
            },
          ],
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, credentials: [], items: [] }),
    });
  });

  await page.route("**/api/org**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, members: [] }),
    });
  });
}

test.describe("issuance fee quote", () => {
  test("shows 0.1 USDC fee after mock sign-in", async ({ page }) => {
    await mockSignedInApis(page);

    await page.goto("/");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Continuar con Google" }).click();

    await expect(page.getByText(/Fee de emisión/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/0\.1 USDC/i)).toBeVisible();
  });
});
