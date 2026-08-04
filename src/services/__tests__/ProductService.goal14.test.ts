/**
 * Goal 14 additions to ProductService:
 *   - getAllProductIds() — returns all product IDs for sitemap generation
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const { mockProductFindMany } = vi.hoisted(() => ({
  mockProductFindMany: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost/test",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  },
}));

vi.mock("@/services/BarcodeService", () => ({
  lookupByBarcode: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findMany: mockProductFindMany,
    },
  },
}));

import { getAllProductIds } from "../ProductService";

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAllProductIds", () => {
  it("returns an array of product IDs", async () => {
    mockProductFindMany.mockResolvedValue([
      { id: "prod-1" },
      { id: "prod-2" },
      { id: "prod-3" },
    ]);

    const ids = await getAllProductIds();
    expect(ids).toEqual(["prod-1", "prod-2", "prod-3"]);
  });

  it("returns empty array when no products exist", async () => {
    mockProductFindMany.mockResolvedValue([]);
    const ids = await getAllProductIds();
    expect(ids).toEqual([]);
  });

  it("queries only the id field (lightweight select)", async () => {
    mockProductFindMany.mockResolvedValue([{ id: "abc" }]);
    await getAllProductIds();
    expect(mockProductFindMany).toHaveBeenCalledWith({ select: { id: true } });
  });
});
