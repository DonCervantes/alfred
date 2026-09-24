import { test, expect } from "@playwright/test";

test.describe("education vertical", () => {
  test("landing shows CTA to app", async ({ page }) => {
    await page.goto("/edu");

    await expect(page.getByText("Educación").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Credenciales de estudio/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Abrir app educación" }),
    ).toBeVisible();
  });

  test("app page opens from CTA", async ({ page }) => {
    await page.goto("/edu");
    await page.getByRole("link", { name: "Abrir app educación" }).click();
    await expect(page).toHaveURL(/\/edu\/app/);
    await expect(
      page.getByRole("heading", { name: /Credenciales educativas/i }),
    ).toBeVisible();
  });
});
