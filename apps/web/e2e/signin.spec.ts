import { test, expect } from "@playwright/test";

test.describe("signin sheet (mock Pollar)", () => {
  test("landing opens Continuar → Google/GitHub", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("ALFRED").first()).toBeVisible();
    await page.getByRole("button", { name: "Continuar" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Entra a ALFRED")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Continuar con Google" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Continuar con GitHub" }),
    ).toBeVisible();
  });
});
