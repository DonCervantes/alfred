import { test, expect } from "@playwright/test";

test.describe("legal drafts", () => {
  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: /Política de privacidad|Privacy Policy/i }),
    ).toBeVisible();
    await expect(page.getByText(/Borrador|Draft/i).first()).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(
      page.getByRole("heading", { name: /Términos de uso|Terms of Use/i }),
    ).toBeVisible();
  });
});
