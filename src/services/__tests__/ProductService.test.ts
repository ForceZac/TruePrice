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
  mockCategoryFindMany,
  mockCostBreakdownFindMany,
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
  mockCategoryFindMany: vi.fn(),
  mockCostBreakdownFindMany: vi.fn(),
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
      findMany: mockCategoryFindMany,
      create: vi.fn().mockResolvedValue({ id: "cat-other", name: "Other", slug: "other" }),
    },
    costBreakdown: {
      findMany: mockCostBreakdownFindMany,
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
  getStaleRetailProducts,
  updateRetailPrice,
  getProductWithBreakdown,
  getCoverageData,
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

// ─── getStaleRetailProducts ───────────────────────────────────────────────────

describe("getStaleRetailProducts", () => {
  beforeEach(() => {
    mockProductFindMany.mockReset();
  });

  it("returns empty array when no stale products exist", async () => {
    mockProductFindMany.mockResolvedValue([]);
    const result = await getStaleRetailProducts();
    expect(result).toEqual([]);
  });

  it("returns products with non-null UPCs", async () => {
    mockProductFindMany.mockResolvedValue([
      { id: "p1", upc: "012345678901" },
      { id: "p2", upc: "012345678902" },
    ]);
    const result = await getStaleRetailProducts();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "p1", upc: "012345678901" });
  });

  it("filters out rows where upc is null (Prisma type guard)", async () => {
    // Prisma guarantees upc is non-null via the where clause, but the TS type
    // is string | null — confirm our filter handles it defensively.
    mockProductFindMany.mockResolvedValue([
      { id: "p1", upc: "012345678901" },
      { id: "p2", upc: null },
    ]);
    const result = await getStaleRetailProducts();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
  });

  it("queries with the correct where clause shape", async () => {
    mockProductFindMany.mockResolvedValue([]);
    await getStaleRetailProducts();
    const call = mockProductFindMany.mock.calls[0][0];
    expect(call.where.upc).toEqual({ not: null });
    expect(call.where.OR).toBeDefined();
    expect(call.select).toEqual({ id: true, upc: true });
  });
});

// ─── updateRetailPrice ────────────────────────────────────────────────────────

describe("updateRetailPrice", () => {
  beforeEach(() => {
    mockProductUpdate.mockReset();
    mockProductUpdate.mockResolvedValue({});
  });

  it("updates retailPriceCents and lastLookedUp when priceCents is provided", async () => {
    await updateRetailPrice("prod-1", 1499);
    expect(mockProductUpdate).toHaveBeenCalledOnce();
    const call = mockProductUpdate.mock.calls[0][0];
    expect(call.where.id).toBe("prod-1");
    expect(call.data.retailPriceCents).toBe(1499);
    expect(call.data.lastLookedUp).toBeInstanceOf(Date);
  });

  it("only updates lastLookedUp when priceCents is null", async () => {
    await updateRetailPrice("prod-2", null);
    expect(mockProductUpdate).toHaveBeenCalledOnce();
    const call = mockProductUpdate.mock.calls[0][0];
    expect(call.where.id).toBe("prod-2");
    expect(call.data).not.toHaveProperty("retailPriceCents");
    expect(call.data.lastLookedUp).toBeInstanceOf(Date);
  });
});

// ─── getProductWithBreakdown ──────────────────────────────────────────────────

describe("getProductWithBreakdown", () => {
  beforeEach(() => {
    mockProductFindUnique.mockReset();
  });

  it("returns null when the product does not exist", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    const result = await getProductWithBreakdown("nonexistent");
    expect(result).toBeNull();
  });

  it("returns product with name, category, and costBreakdowns", async () => {
    const breakdown = { totalCostCents: 500, retailPriceCents: 1999, markupPercent: 299.8 };
    mockProductFindUnique.mockResolvedValue({
      id: "prod-1",
      name: "Test Product",
      category: { name: "Electronics" },
      costBreakdowns: [breakdown],
    });

    const result = await getProductWithBreakdown("prod-1");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test Product");
    expect(result!.category.name).toBe("Electronics");
    expect(result!.costBreakdowns[0].totalCostCents).toBe(500);
    expect(result!.costBreakdowns[0].markupPercent).toBeCloseTo(299.8);
  });

  it("queries by id with correct select shape", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    await getProductWithBreakdown("prod-99");
    const call = mockProductFindUnique.mock.calls[0][0];
    expect(call.where.id).toBe("prod-99");
    expect(call.select.costBreakdowns).toBeDefined();
    expect(call.select.category).toBeDefined();
  });
});

// ─── getCoverageData ──────────────────────────────────────────────────────────

describe("getCoverageData", () => {
  beforeEach(() => {
    mockProductFindMany.mockReset();
    mockCostBreakdownFindMany.mockReset();
    mockCategoryFindMany.mockReset();
  });

  it("returns zero totals when no products exist", async () => {
    mockProductFindMany.mockResolvedValue([]);
    mockCostBreakdownFindMany.mockResolvedValue([]);
    mockCategoryFindMany.mockResolvedValue([]);

    const result = await getCoverageData();
    expect(result.total).toBe(0);
    expect(result.tiers).toEqual({ HIGH: 0, MEDIUM: 0, LOW: 0, none: 0 });
    expect(result.categories).toEqual([]);
  });

  it("counts tier distribution correctly", async () => {
    mockProductFindMany.mockResolvedValue([
      { id: "p1", categoryId: "cat-1" },
      { id: "p2", categoryId: "cat-1" },
      { id: "p3", categoryId: "cat-1" },
      { id: "p4", categoryId: "cat-1" },
    ]);
    mockCostBreakdownFindMany.mockResolvedValue([
      { productId: "p1", confidence: "HIGH" },
      { productId: "p2", confidence: "MEDIUM" },
      { productId: "p3", confidence: "LOW" },
      // p4 has no breakdown → none
    ]);
    mockCategoryFindMany.mockResolvedValue([
      { id: "cat-1", name: "Electronics", slug: "electronics" },
    ]);

    const result = await getCoverageData();
    expect(result.total).toBe(4);
    expect(result.tiers.HIGH).toBe(1);
    expect(result.tiers.MEDIUM).toBe(1);
    expect(result.tiers.LOW).toBe(1);
    expect(result.tiers.none).toBe(1);
  });

  it("groups products by category correctly", async () => {
    mockProductFindMany.mockResolvedValue([
      { id: "p1", categoryId: "cat-1" },
      { id: "p2", categoryId: "cat-2" },
    ]);
    mockCostBreakdownFindMany.mockResolvedValue([
      { productId: "p1", confidence: "HIGH" },
    ]);
    mockCategoryFindMany.mockResolvedValue([
      { id: "cat-1", name: "Electronics", slug: "electronics" },
      { id: "cat-2", name: "Food", slug: "food-beverage" },
    ]);

    const result = await getCoverageData();
    const elec = result.categories.find((c) => c.slug === "electronics")!;
    const food = result.categories.find((c) => c.slug === "food-beverage")!;
    expect(elec.total).toBe(1);
    expect(elec.high).toBe(1);
    expect(food.total).toBe(1);
    expect(food.noEstimate).toBe(1);
  });
});
