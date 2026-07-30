import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────────

const {
  mockCategoryFindMany,
  mockCategoryFindUnique,
  mockProductFindMany,
  mockCostBreakdownFindFirst,
} = vi.hoisted(() => ({
  mockCategoryFindMany: vi.fn(),
  mockCategoryFindUnique: vi.fn(),
  mockProductFindMany: vi.fn(),
  mockCostBreakdownFindFirst: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost/test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    productCategory: {
      findMany: mockCategoryFindMany,
      findUnique: mockCategoryFindUnique,
    },
    product: {
      findMany: mockProductFindMany,
    },
    costBreakdown: {
      findFirst: mockCostBreakdownFindFirst,
    },
  },
}));

import {
  getAllCategories,
  getCategoryBySlug,
  getCategoryProducts,
  getAllCategorySlugs,
} from "@/services/CategoryService";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeProduct(
  id: string,
  markupPercent: number | null
): {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  retailPriceCents: number | null;
  costBreakdowns: { totalCostCents: number; markupPercent: number | null }[];
} {
  return {
    id,
    name: `Product ${id}`,
    brand: null,
    imageUrl: null,
    retailPriceCents: 1000,
    costBreakdowns:
      markupPercent !== null
        ? [{ totalCostCents: 500, markupPercent }]
        : [],
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── getAllCategories ─────────────────────────────────────────────────────────

describe("getAllCategories", () => {
  it("returns categories with computed avgMarkupPercent", async () => {
    mockCategoryFindMany.mockResolvedValue([
      {
        id: "cat-1",
        name: "Electronics",
        slug: "electronics",
        description: "Gadgets",
        products: [
          { id: "p1", costBreakdowns: [{ markupPercent: 200 }] },
          { id: "p2", costBreakdowns: [{ markupPercent: 400 }] },
        ],
      },
    ]);

    const result = await getAllCategories();
    expect(result).toHaveLength(1);
    expect(result[0].avgMarkupPercent).toBe(300); // (200 + 400) / 2
  });

  it("returns null avgMarkupPercent when no products have estimates", async () => {
    mockCategoryFindMany.mockResolvedValue([
      {
        id: "cat-2",
        name: "Food",
        slug: "food-beverage",
        description: null,
        products: [{ id: "p3", costBreakdowns: [] }],
      },
    ]);

    const result = await getAllCategories();
    expect(result[0].avgMarkupPercent).toBeNull();
  });

  it("excludes products with null markupPercent from avg calculation", async () => {
    mockCategoryFindMany.mockResolvedValue([
      {
        id: "cat-3",
        name: "Clothing",
        slug: "clothing-textiles",
        description: null,
        products: [
          { id: "p4", costBreakdowns: [{ markupPercent: 300 }] },
          { id: "p5", costBreakdowns: [{ markupPercent: null }] }, // excluded
          { id: "p6", costBreakdowns: [] }, // excluded
        ],
      },
    ]);

    const result = await getAllCategories();
    expect(result[0].avgMarkupPercent).toBe(300);
  });
});

// ─── getCategoryProducts — sort order ─────────────────────────────────────────

describe("getCategoryProducts — sort and pagination", () => {
  beforeEach(() => {
    // Category lookup always resolves
    mockCategoryFindUnique.mockImplementation(({ where }: { where: { slug?: string; id?: string } }) => {
      if (where.slug === "electronics" || where.id === "cat-1") {
        return Promise.resolve({ id: "cat-1" });
      }
      return Promise.resolve(null);
    });
  });

  it("sorts products by markupPercent descending, nulls last", async () => {
    mockProductFindMany.mockResolvedValue([
      makeProduct("p-low", 50),
      makeProduct("p-null", null),
      makeProduct("p-high", 500),
      makeProduct("p-mid", 200),
      makeProduct("p-null2", null),
    ]);

    const { products } = await getCategoryProducts("electronics");
    const markups = products.map((p) => p.markupPercent);

    expect(markups).toEqual([500, 200, 50, null, null]);
  });

  it("sorts nulls after any product with an estimate", async () => {
    mockProductFindMany.mockResolvedValue([
      makeProduct("p-null", null),
      makeProduct("p-only", 42),
    ]);

    const { products } = await getCategoryProducts("electronics");
    expect(products[0].markupPercent).toBe(42);
    expect(products[1].markupPercent).toBeNull();
  });

  it("paginates correctly — page 1 returns first perPage items", async () => {
    const allProducts = Array.from({ length: 15 }, (_, i) =>
      makeProduct(`p-${i}`, (15 - i) * 10)
    );
    mockProductFindMany.mockResolvedValue(allProducts);

    const { products, total } = await getCategoryProducts("electronics", 1, 12);
    expect(products).toHaveLength(12);
    expect(total).toBe(15);
    // First item should have highest markup (15*10 = 150)
    expect(products[0].markupPercent).toBe(150);
  });

  it("paginates correctly — page 2 returns remaining items", async () => {
    const allProducts = Array.from({ length: 15 }, (_, i) =>
      makeProduct(`p-${i}`, (15 - i) * 10)
    );
    mockProductFindMany.mockResolvedValue(allProducts);

    const { products, total } = await getCategoryProducts("electronics", 2, 12);
    expect(products).toHaveLength(3);
    expect(total).toBe(15);
  });

  it("returns empty result for unknown category slug", async () => {
    mockCategoryFindUnique.mockResolvedValue(null);

    const { products, total } = await getCategoryProducts("unknown-slug");
    expect(products).toHaveLength(0);
    expect(total).toBe(0);
  });

  it("global sort applies across pages — lowest markup on page 2, not page 1", async () => {
    // 13 products: 12 with high markup, 1 with very low markup
    const products = [
      makeProduct("p-low", 1),
      ...Array.from({ length: 12 }, (_, i) => makeProduct(`p-high-${i}`, 500 + i)),
    ];
    mockProductFindMany.mockResolvedValue(products);

    const page1 = await getCategoryProducts("electronics", 1, 12);
    const page2 = await getCategoryProducts("electronics", 2, 12);

    // The low-markup product should be on page 2, not page 1
    const page1Markups = page1.products.map((p) => p.markupPercent);
    expect(page1Markups).not.toContain(1);
    expect(page2.products[0].markupPercent).toBe(1);
  });
});

// ─── getAllCategorySlugs ───────────────────────────────────────────────────────

describe("getAllCategorySlugs", () => {
  it("returns slugs in order", async () => {
    mockCategoryFindMany.mockResolvedValue([
      { slug: "electronics" },
      { slug: "food-beverage" },
    ]);

    const slugs = await getAllCategorySlugs();
    expect(slugs).toEqual(["electronics", "food-beverage"]);
  });
});

// ─── getCategoryBySlug ────────────────────────────────────────────────────────

describe("getCategoryBySlug", () => {
  it("returns null for an unknown slug", async () => {
    mockCategoryFindUnique.mockResolvedValue(null);
    mockCostBreakdownFindFirst.mockResolvedValue(null);

    const result = await getCategoryBySlug("does-not-exist");
    expect(result).toBeNull();
  });

  it("returns category with null topProduct when no estimates exist", async () => {
    mockCategoryFindUnique.mockResolvedValue({
      id: "cat-1",
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets",
      products: [],
    });
    mockCostBreakdownFindFirst.mockResolvedValue(null);

    const result = await getCategoryBySlug("electronics");
    expect(result).not.toBeNull();
    expect(result!.topProduct).toBeNull();
    expect(result!.avgMarkupPercent).toBeNull();
  });

  it("returns topProduct when a CostBreakdown exists", async () => {
    mockCategoryFindUnique.mockResolvedValue({
      id: "cat-1",
      name: "Electronics",
      slug: "electronics",
      description: null,
      products: [{ id: "p1", costBreakdowns: [{ markupPercent: 300 }] }],
    });
    mockCostBreakdownFindFirst.mockResolvedValue({
      totalCostCents: 500,
      markupPercent: 300,
      product: {
        id: "p1",
        name: "Widget",
        brand: "Acme",
        imageUrl: null,
        retailPriceCents: 2000,
      },
    });

    const result = await getCategoryBySlug("electronics");
    expect(result!.topProduct).toMatchObject({
      id: "p1",
      name: "Widget",
      markupPercent: 300,
    });
  });
});
