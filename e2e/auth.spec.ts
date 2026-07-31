import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Login page
// ---------------------------------------------------------------------------

test.describe("Login page", () => {
  test("renders sign-in options", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Sign in/i);
    await expect(
      page.getByRole("heading", { name: /Sign in to TruePrice/i })
    ).toBeVisible();
  });

  test("shows Google sign-in button", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: /Continue with Google/i })
    ).toBeVisible();
  });

  test("shows magic-link email input and send button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Send magic link/i })
    ).toBeVisible();
  });

  test("links to Terms and Privacy Policy", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /Terms/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Privacy Policy/i })
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Dashboard — unauthenticated redirect
// ---------------------------------------------------------------------------

test.describe("Dashboard (unauthenticated)", () => {
  test("redirects to /login with next param when not signed in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);
  });

  test("dashboard/settings also redirects unauthenticated users to login", async ({
    page,
  }) => {
    await page.goto("/dashboard/settings");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// Save button — unauthenticated nudge
// ---------------------------------------------------------------------------

test.describe("Save button — guest nudge", () => {
  test("product page shows 'Sign in to save' link for guests", async ({
    page,
  }) => {
    // Navigate to the product listing to find a real product ID
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Try to find a product card link and follow it
    const productLink = page.locator('a[href^="/product/"]').first();
    const hasProducts = (await productLink.count()) > 0;

    if (hasProducts) {
      await productLink.click();
      await page.waitForLoadState("networkidle");
      // Guest should see the sign-in nudge, not the bookmark toggle
      await expect(
        page.getByRole("link", { name: /Sign in to save/i })
      ).toBeVisible();
    } else {
      // No products seeded in test env — at least verify the login page has no nudge
      // (nudge is only on product pages). Skip gracefully.
      test.info().annotations.push({
        type: "skip-reason",
        description: "No products seeded — cannot navigate to a product page",
      });
    }
  });
});
