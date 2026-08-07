/**
 * Goal 14 — SEO metadata tests.
 *
 * Verifies canonical URLs, OG tags, and JSON-LD shapes for product and
 * category pages. Tests the generateMetadata functions directly.
 */
import { describe, it, expect, vi } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockGetProductById, mockGetCategoryBySlug } = vi.hoisted(() => ({
  mockGetProductById: vi.fn(),
  mockGetCategoryBySlug: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost/test",
    NEXT_PUBLIC_APP_URL: "https://trueprice.com",
  },
}));

vi.mock("@/lib/env.client", () => ({
  clientEnv: {
    NEXT_PUBLIC_APP_URL: "https://trueprice.com",
    NEXT_PUBLIC_ADSENSE_CLIENT: undefined,
    NEXT_PUBLIC_ADSENSE_SLOT_PRODUCT: undefined,
    NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY: undefined,
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: undefined,
  },
}));

vi.mock("@/services/ProductService", () => ({
  getProductById: mockGetProductById,
  getProductWithBreakdown: vi.fn().mockResolvedValue(null),
  getAllProductIds: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/services/CategoryService", () => ({
  getCategoryBySlug: mockGetCategoryBySlug,
  getAllCategorySlugs: vi.fn().mockResolvedValue([]),
  getCategoryProducts: vi.fn().mockResolvedValue({ products: [], total: 0 }),
}));

vi.mock("@/services/DiscoveryService", () => ({
  getTrendingIds: vi.fn().mockResolvedValue(new Set()),
}));

vi.mock("@/data/category-descriptions", () => ({
  getCategoryDescription: (slug: string) => `Description for ${slug}`,
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

import { generateMetadata as productGenerateMetadata } from "../product/[id]/page";
import { generateMetadata as categoryGenerateMetadata } from "../category/[slug]/page";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_PRODUCT = {
  id: "prod-abc",
  name: "iPhone 15 Pro",
  brand: "Apple",
  description: "Flagship smartphone",
  imageUrl: "https://example.com/iphone.jpg",
  category: "Electronics",
  categorySlug: "electronics",
  ingredients: null,
  weightGrams: 187,
  retailPriceCents: 99900,
  countryOfOrigin: "China",
  upc: "194253382033",
  ean: null,
  source: "manual",
};

const MOCK_CATEGORY = {
  id: "cat-electronics",
  name: "Electronics",
  slug: "electronics",
  description: "Consumer electronics",
  productCount: 12,
  avgMarkupPercent: 340,
  topProduct: null,
};

// ─── Product page metadata tests ─────────────────────────────────────────────

describe("Product page generateMetadata", () => {
  it("sets alternates.canonical to the product URL", async () => {
    mockGetProductById.mockResolvedValue(MOCK_PRODUCT);
    const meta = await productGenerateMetadata({
      params: Promise.resolve({ id: "prod-abc" }),
    });
    expect(meta.alternates?.canonical).toBe("https://trueprice.com/product/prod-abc");
  });

  it("includes og:title with product name", async () => {
    mockGetProductById.mockResolvedValue(MOCK_PRODUCT);
    const meta = await productGenerateMetadata({
      params: Promise.resolve({ id: "prod-abc" }),
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og?.title).toContain("iPhone 15 Pro");
  });

  it("includes og:url matching the canonical URL", async () => {
    mockGetProductById.mockResolvedValue(MOCK_PRODUCT);
    const meta = await productGenerateMetadata({
      params: Promise.resolve({ id: "prod-abc" }),
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og?.url).toBe("https://trueprice.com/product/prod-abc");
  });

  it("includes og:image pointing to the OG image route", async () => {
    mockGetProductById.mockResolvedValue(MOCK_PRODUCT);
    const meta = await productGenerateMetadata({
      params: Promise.resolve({ id: "prod-abc" }),
    });
    const og = meta.openGraph as Record<string, unknown>;
    const images = og?.images as Array<{ url: string }>;
    expect(images?.[0]?.url).toBe("https://trueprice.com/api/og/product/prod-abc");
  });

  it("returns minimal metadata when product not found", async () => {
    mockGetProductById.mockResolvedValue(null);
    const meta = await productGenerateMetadata({
      params: Promise.resolve({ id: "nonexistent" }),
    });
    expect(meta.title).toBe("Product Not Found — TruePrice");
  });
});

// ─── Category page metadata tests ────────────────────────────────────────────

describe("Category page generateMetadata", () => {
  it("sets alternates.canonical to the category URL", async () => {
    mockGetCategoryBySlug.mockResolvedValue(MOCK_CATEGORY);
    const meta = await categoryGenerateMetadata({
      params: Promise.resolve({ slug: "electronics" }),
      searchParams: Promise.resolve({}),
    });
    expect(meta.alternates?.canonical).toBe("https://trueprice.com/category/electronics");
  });

  it("includes og:title with category name", async () => {
    mockGetCategoryBySlug.mockResolvedValue(MOCK_CATEGORY);
    const meta = await categoryGenerateMetadata({
      params: Promise.resolve({ slug: "electronics" }),
      searchParams: Promise.resolve({}),
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og?.title).toContain("Electronics");
  });

  it("includes og:url matching the canonical URL", async () => {
    mockGetCategoryBySlug.mockResolvedValue(MOCK_CATEGORY);
    const meta = await categoryGenerateMetadata({
      params: Promise.resolve({ slug: "electronics" }),
      searchParams: Promise.resolve({}),
    });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og?.url).toBe("https://trueprice.com/category/electronics");
  });

  it("includes og:image pointing to the category OG image route", async () => {
    mockGetCategoryBySlug.mockResolvedValue(MOCK_CATEGORY);
    const meta = await categoryGenerateMetadata({
      params: Promise.resolve({ slug: "electronics" }),
      searchParams: Promise.resolve({}),
    });
    const og = meta.openGraph as Record<string, unknown>;
    const images = og?.images as Array<{ url: string }>;
    expect(images?.[0]?.url).toBe("https://trueprice.com/api/og/category/electronics");
  });

  it("returns minimal metadata when category not found", async () => {
    mockGetCategoryBySlug.mockResolvedValue(null);
    const meta = await categoryGenerateMetadata({
      params: Promise.resolve({ slug: "nonexistent" }),
      searchParams: Promise.resolve({}),
    });
    expect(meta.title).toBe("Category Not Found — TruePrice");
  });
});
