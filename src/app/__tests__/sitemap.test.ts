/**
 * Goal 14 — Sitemap tests.
 *
 * Verifies that the sitemap function returns entries for:
 * - the homepage
 * - the categories index
 * - individual category pages
 * - individual product pages
 */
import { describe, it, expect, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost/test",
    NEXT_PUBLIC_APP_URL: "https://trueprice.com",
  },
}));

vi.mock("@/services/CategoryService", () => ({
  getAllCategorySlugs: vi.fn().mockResolvedValue(["electronics", "clothing"]),
}));

vi.mock("@/services/ProductService", () => ({
  getAllProductIds: vi.fn().mockResolvedValue(["prod-abc", "prod-def"]),
}));

import sitemap from "../sitemap";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("sitemap", () => {
  it("includes the homepage", async () => {
    const entries = await sitemap();
    expect(entries.some((e) => e.url === "https://trueprice.com")).toBe(true);
  });

  it("includes the categories index page", async () => {
    const entries = await sitemap();
    expect(entries.some((e) => e.url === "https://trueprice.com/categories")).toBe(true);
  });

  it("includes one entry per category slug", async () => {
    const entries = await sitemap();
    expect(entries.some((e) => e.url === "https://trueprice.com/category/electronics")).toBe(true);
    expect(entries.some((e) => e.url === "https://trueprice.com/category/clothing")).toBe(true);
  });

  it("includes one entry per product ID", async () => {
    const entries = await sitemap();
    expect(entries.some((e) => e.url === "https://trueprice.com/product/prod-abc")).toBe(true);
    expect(entries.some((e) => e.url === "https://trueprice.com/product/prod-def")).toBe(true);
  });

  it("returns at least homepage + categories + 2 categories + 2 products", async () => {
    const entries = await sitemap();
    // 1 homepage + 1 categories + 2 category pages + 2 product pages = 6
    expect(entries.length).toBeGreaterThanOrEqual(6);
  });

  it("all entries have a url string", async () => {
    const entries = await sitemap();
    for (const entry of entries) {
      expect(typeof entry.url).toBe("string");
      expect(entry.url.startsWith("https://trueprice.com")).toBe(true);
    }
  });
});
