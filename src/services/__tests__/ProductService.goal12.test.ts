/**
 * Goal 12 additions to ProductService:
 *   - searchProducts(query, limit, autocomplete=true) — slim projection
 *   - incrementViewCount(productId) — increments or no-ops
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const { mockProductFindMany, mockProductUpdateMany } = vi.hoisted(() => ({
  mockProductFindMany: vi.fn(),
  mockProductUpdateMany: vi.fn(),
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
    product: {
      findMany: mockProductFindMany,
      updateMany: mockProductUpdateMany,
    },
  },
}));

import { searchProducts, incrementViewCount } from "../ProductService";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeDbProduct(id: string, name: string) {
  return {
    id,
    name,
    brand: "ACME",
    description: "desc",
    imageUrl: null,
    weightGrams: null,
    countryOfOrigin: null,
    upc: null,
    ean: null,
    source: "open-food-facts",
    ingredients: null,
    retailPriceCents: null,
    lastLookedUp: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    category: { name: "Electronics", slug: "electronics" },
    costBreakdowns: [],
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockProductFindMany.mockReset();
  mockProductUpdateMany.mockReset();
});

describe("searchProducts (autocomplete mode)", () => {
  it("returns a result for each product in autocomplete mode", async () => {
    mockProductFindMany.mockResolvedValue([
      makeDbProduct("p1", "Widget A"),
      makeDbProduct("p2", "Widget B"),
    ]);

    const results = await searchProducts("widget", 6, true);

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe("p1");
    expect(results[1].id).toBe("p2");
  });

  it("autocomplete results omit description and ingredients", async () => {
    mockProductFindMany.mockResolvedValue([makeDbProduct("p1", "Widget A")]);

    const [result] = await searchProducts("widget", 6, true);

    expect(result.description).toBeNull();
    expect(result.ingredients).toBeNull();
  });

  it("returns empty array when query is blank regardless of autocomplete flag", async () => {
    const results = await searchProducts("  ", 6, true);

    expect(results).toEqual([]);
    expect(mockProductFindMany).not.toHaveBeenCalled();
  });
});

describe("incrementViewCount", () => {
  it("calls prisma.product.updateMany with increment by 1", async () => {
    mockProductUpdateMany.mockResolvedValue({ count: 1 });

    await incrementViewCount("prod-abc");

    expect(mockProductUpdateMany).toHaveBeenCalledWith({
      where: { id: "prod-abc" },
      data: { viewCount: { increment: 1 } },
    });
  });

  it("silently no-ops when product does not exist (count 0)", async () => {
    mockProductUpdateMany.mockResolvedValue({ count: 0 });

    // Should not throw
    await expect(incrementViewCount("missing-id")).resolves.toBeUndefined();
  });
});
