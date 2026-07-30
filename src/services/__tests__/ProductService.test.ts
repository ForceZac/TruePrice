import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockProductFindFirst,
  mockProductFindMany,
  mockProductFindUnique,
  mockProductUpdate,
  mockProductUpsert,
  mockProductCreate,
  mockCategoryFindFirst,
  mockCategoryFindUnique,
  mockMaterialFindMany,
  mockProductMaterialCreateMany,
} = vi.hoisted(() => ({
  mockProductFindFirst: vi.fn(),
  mockProductFindMany: vi.fn(),
  mockProductFindUnique: vi.fn(),
  mockProductUpdate: vi.fn(),
  mockProductUpsert: vi.fn(),
  mockProductCreate: vi.fn(),
  mockCategoryFindFirst: vi.fn(),
  mockCategoryFindUnique: vi.fn(),
  mockMaterialFindMany: vi.fn(),
  mockProductMaterialCreateMany: vi.fn(),
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
      findFirst: mockProductFindFirst,
      findMany: mockProductFindMany,
      findUnique: mockProductFindUnique,
      update: mockProductUpdate,
      upsert: mockProductUpsert,
      create: mockProductCreate,
    },
    productCategory: {
      findFirst: mockCategoryFindFirst,
      findUnique: mockCategoryFindUnique,
      create: vi.fn().mockResolvedValue({ id: "cat-other", name: "Other", slug: "other" }),
    },
    material: {
      findMany: mockMaterialFindMany,
    },
    productMaterial: {
      createMany: mockProductMaterialCreateMany,
    },
  },
}));

// Mock BarcodeService for external lookups
const { mockLookupByBarcode } = vi.hoisted(() => ({
  mockLookupByBarcode: vi.fn(),
}));

vi.mock("@/services/BarcodeService", () => ({
  lookupByBarcode: mockLookupByBarcode,
}));

import {
  lookupProduct,
  searchProducts,
  getProductById,
} from "@/services/ProductService";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockCategory = { id: "cat-1", name: "Food & Beverage", slug: "food-beverage", overheadPercent: 0.3 };

const mockDbProduct = (overrides = {}) => ({
  id: "prod-1",
  name: "Test Chocolate Bar",
  brand: "TestBrand",
  description: "A test chocolate bar",
  imageUrl: "https://images.openfoodfacts.org/img.jpg",
  categoryId: "cat-1",
  category: mockCategory,
  ingredients: "Sugar, Cocoa butter",
  weightGrams: 100,
  countryOfOrigin: "CH",
  upc: "012345678901",
  ean: null,
  source: "openfoodfacts",
  sourceId: "prod-1-off",
  lastLookedUp: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const mockExternalData = () => ({
  name: "Test Chocolate Bar",
  brand: "TestBrand",
  description: "A test chocolate bar",
  imageUrl: "https://images.openfoodfacts.org/img.jpg",
  category: "Chocolates",
  ingredients: "Sugar, Cocoa butter",
  weightGrams: 100,
  countryOfOrigin: "CH",
  source: "openfoodfacts",
  sourceId: "prod-1-off",
});

// ─── lookupProduct ────────────────────────────────────────────────────────────

describe("lookupProduct", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockProductFindFirst.mockReset();
    mockProductUpdate.mockReset();
    mockProductUpsert.mockReset();
    mockCategoryFindFirst.mockReset();
    mockCategoryFindUnique.mockReset();
    mockMaterialFindMany.mockReset();
    mockProductMaterialCreateMany.mockReset();
    mockLookupByBarcode.mockReset();
    mockProductMaterialCreateMany.mockResolvedValue({ count: 0 });
  });

  it("returns cached product on cache hit (UPC)", async () => {
    const product = mockDbProduct();
    mockProductFindFirst.mockResolvedValue(product);
    mockProductUpdate.mockResolvedValue(product);

    const result = await lookupProduct("012345678901");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test Chocolate Bar");
    expect(result!.upc).toBe("012345678901");
    // Should NOT call external API on cache hit
    expect(mockLookupByBarcode).not.toHaveBeenCalled();
  });

  it("touches lastLookedUp on cache hit", async () => {
    const product = mockDbProduct();
    mockProductFindFirst.mockResolvedValue(product);
    mockProductUpdate.mockResolvedValue(product);

    await lookupProduct("012345678901");
    expect(mockProductUpdate).toHaveBeenCalledOnce();
    const updateCall = mockProductUpdate.mock.calls[0][0];
    expect(updateCall.data.lastLookedUp).toBeInstanceOf(Date);
  });

  it("returns null when cache misses and external API returns nothing", async () => {
    mockProductFindFirst.mockResolvedValue(null);
    mockLookupByBarcode.mockResolvedValue(null);

    const result = await lookupProduct("012345678901");
    expect(result).toBeNull();
  });

  it("caches and returns external product on cache miss", async () => {
    const product = mockDbProduct();
    mockProductFindFirst.mockResolvedValue(null);
    mockLookupByBarcode.mockResolvedValue(mockExternalData());
    mockCategoryFindFirst.mockResolvedValue(mockCategory);
    mockCategoryFindUnique.mockResolvedValue(mockCategory);
    mockProductUpsert.mockResolvedValue(product);
    mockMaterialFindMany.mockResolvedValue([]);

    const result = await lookupProduct("012345678901");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test Chocolate Bar");
    expect(mockLookupByBarcode).toHaveBeenCalledWith("012345678901");
    expect(mockProductUpsert).toHaveBeenCalledOnce();
  });

  it("classifies 12-digit barcode as UPC", async () => {
    mockProductFindFirst.mockResolvedValue(null);
    mockLookupByBarcode.mockResolvedValue(mockExternalData());
    mockCategoryFindFirst.mockResolvedValue(mockCategory);
    mockCategoryFindUnique.mockResolvedValue(mockCategory);
    mockProductUpsert.mockResolvedValue(mockDbProduct());
    mockMaterialFindMany.mockResolvedValue([]);

    await lookupProduct("012345678901"); // 12 digits = UPC-A
    const upsertCall = mockProductUpsert.mock.calls[0][0];
    expect(upsertCall.where).toEqual({ upc: "012345678901" });
  });

  it("classifies 13-digit barcode as EAN", async () => {
    const ean13Product = mockDbProduct({ upc: null, ean: "0123456789012" });
    mockProductFindFirst.mockResolvedValue(null);
    mockLookupByBarcode.mockResolvedValue(mockExternalData());
    mockCategoryFindFirst.mockResolvedValue(mockCategory);
    mockCategoryFindUnique.mockResolvedValue(mockCategory);
    mockProductUpsert.mockResolvedValue(ean13Product);
    mockMaterialFindMany.mockResolvedValue([]);

    await lookupProduct("0123456789012"); // 13 digits = EAN-13
    const upsertCall = mockProductUpsert.mock.calls[0][0];
    expect(upsertCall.where).toEqual({ ean: "0123456789012" });
  });

  it("strips whitespace from barcode before lookup", async () => {
    const product = mockDbProduct();
    mockProductFindFirst.mockResolvedValue(product);
    mockProductUpdate.mockResolvedValue(product);

    await lookupProduct("  012345678901  ");
    const findCall = mockProductFindFirst.mock.calls[0][0];
    const orClauses = findCall.where.OR;
    expect(orClauses.some((c: Record<string, unknown>) => c.upc === "012345678901")).toBe(true);
  });
});

// ─── searchProducts ───────────────────────────────────────────────────────────

describe("searchProducts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockProductFindMany.mockReset();
  });

  it("returns empty array for blank query", async () => {
    const results = await searchProducts("");
    expect(results).toEqual([]);
    expect(mockProductFindMany).not.toHaveBeenCalled();
  });

  it("returns empty array for whitespace-only query", async () => {
    const results = await searchProducts("   ");
    expect(results).toEqual([]);
  });

  it("returns matching products", async () => {
    const product = mockDbProduct();
    mockProductFindMany.mockResolvedValue([product]);

    const results = await searchProducts("chocolate");
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Test Chocolate Bar");
    expect(results[0].category).toBe("Food & Beverage");
  });

  it("passes query to DB search with case-insensitive mode", async () => {
    mockProductFindMany.mockResolvedValue([]);
    await searchProducts("Chocolate");
    const call = mockProductFindMany.mock.calls[0][0];
    expect(call.where.OR[0].name.mode).toBe("insensitive");
    expect(call.where.OR[0].name.contains).toBe("Chocolate");
  });

  it("limits results to 20 by default", async () => {
    mockProductFindMany.mockResolvedValue([]);
    await searchProducts("test");
    const call = mockProductFindMany.mock.calls[0][0];
    expect(call.take).toBe(20);
  });

  it("returns empty array when no products match", async () => {
    mockProductFindMany.mockResolvedValue([]);
    const results = await searchProducts("nonexistent-product-xyz");
    expect(results).toEqual([]);
  });
});

// ─── getProductById ───────────────────────────────────────────────────────────

describe("getProductById", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockProductFindUnique.mockReset();
  });

  it("returns null for a non-existent ID", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    const result = await getProductById("nonexistent-id");
    expect(result).toBeNull();
  });

  it("returns ProductResult for an existing product", async () => {
    const product = mockDbProduct();
    mockProductFindUnique.mockResolvedValue(product);

    const result = await getProductById("prod-1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("prod-1");
    expect(result!.name).toBe("Test Chocolate Bar");
    expect(result!.brand).toBe("TestBrand");
    expect(result!.category).toBe("Food & Beverage");
    expect(result!.upc).toBe("012345678901");
  });

  it("looks up product by the provided ID", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    await getProductById("some-id");
    expect(mockProductFindUnique.mock.calls[0][0].where.id).toBe("some-id");
  });
});
