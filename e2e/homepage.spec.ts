import { test, expect } from "@playwright/test";

test("homepage renders with TruePrice branding", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/TruePrice/i);
  await expect(page.getByRole("heading", { name: /TruePrice/i })).toBeVisible();
});

test("homepage has a search input", async ({ page }) => {
  await page.goto("/");
  const searchInput = page.getByPlaceholder(/search/i);
  await expect(searchInput).toBeVisible();
});
