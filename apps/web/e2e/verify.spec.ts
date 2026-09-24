import { test, expect } from "@playwright/test";

function mockVerify(page: import("@playwright/test").Page, body: unknown, status = 200) {
  return page.route(
    (url) => url.pathname.includes("/api/verify/"),
    async (route) => {
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    },
  );
}

test.describe("public verify page", () => {
  test("valid credential (API mocked)", async ({ page }) => {
    await mockVerify(page, {
      ok: true,
      status: "valid",
      type: "AlfredCredential",
      onChainValid: true,
      holderDid: "did:stellar:testnet:GTESTVERIFYHOLDER0001",
      issuedAt: "2026-09-24T12:00:00.000Z",
      network: "testnet",
      payload: {
        type: "AlfredCredential",
        issuedAt: "2026-09-24T12:00:00.000Z",
        claims: { name: "Ada Lovelace", role: "Issuer smoke" },
      },
    });

    await page.goto("/v/smoke-valid-token");

    await expect(page.getByText("Credencial válida")).toBeVisible();
    await expect(page.getByText("Ada Lovelace")).toBeVisible();
    await expect(page.getByText("confirmada on-chain")).toBeVisible();
  });

  test("failed verify shows alert", async ({ page }) => {
    await mockVerify(page, { ok: false, code: "NOT_FOUND" }, 404);

    await page.goto("/v/smoke-missing-token");

    await expect(page.getByRole("alert")).toContainText(
      "No se pudo verificar este enlace.",
    );
    await expect(page.getByText("NOT_FOUND")).toBeVisible();
  });
});
