import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const { mockProductFindMany, mockCostBreakdownFindMany } = vi.hoisted(() => ({
  mockProductFindMany: vi.fn(),
  mockCostBreakdownFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    product: { findMany: mockProductFindMany },
    costBreakdown: { findMany: mockCostBreakdownFindMany },
  },
}));

import {
  getTrending,
  getMostShocking,
  getTrendingIds,
} from "../DiscoveryService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeProduct(
  id: string,
  viewCount: number,
  markupPercent: number | null = 400,
  confidence: string | null = "HIGH"
) {
  return {
    id,
    name: `Product ${id}`,
    viewCount,
    category: { name: "Electronics", slug: "electronics" },
    costBreakdowns: markupPercent !== null ? [{ markupPercent, confidence }] : [],
  };
}

function makeBreakdown(
  productId: string,
  markupPercent: number,
  retailPriceCents = 9999,
  totalCostCents = 1500
) {
  return {
    markupPercent,
    retailPriceCents,
    totalCostCents,
    confidence: "HIGH",
    product: {
      id: productId,
      name: `Product ${productId}`,
      category: { name: "Electronics", slug: "electronics" },
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockProductFindMany.mockReset();
  mockCostBreakdownFindMany.mockReset();
});

describe("getTrending", () => {
  it("returns products ordered by viewCount desc (highest first)", async () => {
    mockProductFindMany.mockResolvedValue([
      makeProduct("a", 100),
      makeProduct("b", 50),
      makeProduct("c", 10),
    ]);

    const result = await getTrending(3, 7);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("a");
    expect(result[1].id).toBe("b");
    expect(result[2].id).toBe("c");
  });

  it("maps viewCount and markupPercent onto result", async () => {
    mockProductFindMany.mockResolvedValue([makeProduct("x", 42, 620, "HIGH")]);

    const [item] = await getTrending(1, 7);

    expect(item.viewCount).toBe(42);
    expect(item.markupPercent).toBe(620);
    expect(item.confidence).toBe("HIGH");
  });

  it("returns null markupPercent when product has no cost breakdown", async () => {
    mockProductFindMany.mockResolvedValue([makeProduct("y", 5, null, null)]);

    const [item] = await getTrending(1, 7);

    expect(item.markupPercent).toBeNull();
    expect(item.confidence).toBeNull();
  });

  it("queries with viewCount > 0 filter", async () => {
    mockProductFindMany.mockResolvedValue([]);

    await getTrending(10, 7);

    expect(mockProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { viewCount: { gt: 0 } },
      })
    );
  });
});

describe("getMostShocking", () => {
  it("returns breakdowns mapped to ShockingProduct shape", async () => {
    mockCostBreakdownFindMany.mockResolvedValue([
      makeBreakdown("p1", 850, 19999, 2200),
      makeBreakdown("p2", 620, 9999, 1500),
    ]);

    const result = await getMostShocking(2);

    expect(result).toHaveLength(2);
    expect(result[0].markupPercent).toBe(850);
    expect(result[0].totalCostCents).toBe(2200);
    expect(result[1].markupPercent).toBe(620);
  });

  it("queries only HIGH-confidence breakdowns", async () => {
    mockCostBreakdownFindMany.mockResolvedValue([]);

    await getMostShocking(3);

    expect(mockCostBreakdownFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ confidence: "HIGH" }),
      })
    );
  });
});

describe("getTrendingIds", () => {
  it("returns a Set of product IDs", async () => {
    mockProductFindMany.mockResolvedValue([
      { id: "id1" },
      { id: "id2" },
      { id: "id3" },
    ]);

    const ids = await getTrendingIds(20, 7);

    expect(ids).toBeInstanceOf(Set);
    expect(ids.has("id1")).toBe(true);
    expect(ids.has("id2")).toBe(true);
    expect(ids.has("id3")).toBe(true);
    expect(ids.has("unknown")).toBe(false);
  });

  it("returns an empty Set when no trending products exist", async () => {
    mockProductFindMany.mockResolvedValue([]);

    const ids = await getTrendingIds(20, 7);

    expect(ids.size).toBe(0);
  });
});
