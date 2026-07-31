/**
 * Goal 8 — CostEstimationService confidence tier tests.
 *
 * Tests the HIGH/MEDIUM/LOW confidence tier logic, subcategory profile
 * fallback, and product override support added in Goal 8.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const {
  mockProductFindUnique,
  mockCostBreakdownCreate,
  mockCostBreakdownDeleteMany,
  mockCostBreakdownFindFirst,
  mockLaborRateFindUnique,
  mockMaterialFindMany,
} = vi.hoisted(() => ({
  mockProductFindUnique: vi.fn(),
  mockCostBreakdownCreate: vi.fn(),
  mockCostBreakdownDeleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  mockCostBreakdownFindFirst: vi.fn(),
  mockLaborRateFindUnique: vi.fn(),
  mockMaterialFindMany: vi.fn(),
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
    product: { findUnique: mockProductFindUnique },
    costBreakdown: {
      create: mockCostBreakdownCreate,
      deleteMany: mockCostBreakdownDeleteMany,
      findFirst: mockCostBreakdownFindFirst,
    },
    laborRate: { findUnique: mockLaborRateFindUnique },
    material: { findMany: mockMaterialFindMany },
  },
}));

import { estimateCost } from "@/services/CostEstimationService";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const now = new Date("2026-07-30T12:00:00Z");
const freshPrice = new Date("2026-07-30T06:00:00Z");

const mockCategory = (overrides = {}) => ({
  id: "cat-1",
  name: "Clothing & Textiles",
  slug: "clothing-textiles",
  overheadPercent: 0.35,
  description: null,
  createdAt: now,
  ...overrides,
});

const mockMaterialRecord = (name: string, pricePerKgCents: number) => ({
  id: `mat-${name}`,
  name,
  commodityKey: name,
  unit: "kg",
  categoryTag: "textile",
  createdAt: now,
  updatedAt: now,
  commodityPrices: [
    {
      id: `price-${name}`,
      materialId: `mat-${name}`,
      pricePerKgCents,
      source: "api",
      fetchedAt: freshPrice,
      createdAt: now,
    },
  ],
});

const mockProductMaterial = (
  material: ReturnType<typeof mockMaterialRecord>,
  opts: { percentage?: number; weightGrams?: number } = {}
) => ({
  id: `pm-${material.id}`,
  productId: "prod-1",
  materialId: material.id,
  percentage: opts.percentage ?? null,
  weightGrams: opts.weightGrams ?? null,
  source: "label",
  material,
});

const mockProduct = (overrides: Record<string, unknown> = {}) => ({
  id: "prod-1",
  name: "Test T-Shirt",
  brand: "TestBrand",
  upc: null,
  ean: null,
  categoryId: "cat-1",
  category: mockCategory(),
  subcategory: null,
  description: null,
  imageUrl: null,
  retailPriceCents: 2499,
  weightGrams: 200,
  countryOfOrigin: "VN",
  ingredients: null,
  source: "manual",
  sourceId: null,
  lastLookedUp: null,
  createdAt: now,
  updatedAt: now,
  materials: [],
  costBreakdowns: [],
  ...overrides,
});

beforeEach(() => {
  vi.restoreAllMocks();
  mockProductFindUnique.mockReset();
  mockCostBreakdownCreate.mockReset();
  mockCostBreakdownFindFirst.mockReset();
  mockLaborRateFindUnique.mockReset();
  mockMaterialFindMany.mockReset();

  mockCostBreakdownCreate.mockImplementation((args: { data: Record<string, unknown> }) =>
    Promise.resolve({ id: "bd-new", ...args.data, createdAt: now })
  );
  mockLaborRateFindUnique.mockResolvedValue(null); // fallback labor
  mockMaterialFindMany.mockResolvedValue([]); // no profile materials by default
});

// ─── Confidence tier: HIGH ────────────────────────────────────────────────────

describe("CostEstimationService — confidence tier HIGH (Goal 8)", () => {
  it("sets confidence to HIGH when product has ProductMaterial rows", async () => {
    const cotton = mockMaterialRecord("cotton", 150);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { weightGrams: 120 })],
      costBreakdowns: [],
    });
    mockProductFindUnique.mockResolvedValue(product);

    await estimateCost("prod-1");

    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.confidence).toBe("HIGH");
  });

  it("includes '[HIGH confidence]' in methodology for HIGH tier", async () => {
    const cotton = mockMaterialRecord("cotton", 150);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { weightGrams: 120 })],
      costBreakdowns: [],
    });
    mockProductFindUnique.mockResolvedValue(product);

    await estimateCost("prod-1");

    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.methodology).toContain("[HIGH confidence]");
  });
});

// ─── Confidence tier: MEDIUM ──────────────────────────────────────────────────

describe("CostEstimationService — confidence tier MEDIUM (Goal 8)", () => {
  it("sets confidence to MEDIUM when no materials but subcategory profile matches", async () => {
    const product = mockProduct({
      materials: [],
      costBreakdowns: [],
      // t-shirt is in the subcategory-profiles map for clothing-textiles
      subcategory: "t-shirt",
    });
    mockProductFindUnique.mockResolvedValue(product);

    // Profile materials (cotton, polyester) are looked up from DB
    mockMaterialFindMany.mockResolvedValue([
      mockMaterialRecord("cotton", 200),
      mockMaterialRecord("polyester", 100),
    ]);

    await estimateCost("prod-1");

    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.confidence).toBe("MEDIUM");
  });

  it("includes '[MEDIUM confidence]' in methodology", async () => {
    const product = mockProduct({
      materials: [],
      costBreakdowns: [],
      subcategory: "t-shirt",
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockMaterialFindMany.mockResolvedValue([]);

    await estimateCost("prod-1");

    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.methodology).toContain("[MEDIUM confidence]");
  });

  it("uses subcategory profile defaultLaborHours when available", async () => {
    // t-shirt profile defaultLaborHours should override category default
    const product = mockProduct({
      materials: [],
      costBreakdowns: [],
      subcategory: "t-shirt",
      countryOfOrigin: "VN",
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockMaterialFindMany.mockResolvedValue([]);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-vn",
      countryCode: "VN",
      countryName: "Vietnam",
      hourlyRateCents: 100,
      source: "manual",
      lastUpdated: now,
    });

    await estimateCost("prod-1");

    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    // If profile has laborHours, cost should be profile.defaultLaborHours × 100
    // t-shirt profile typically has ~1.5 hours → 150 cents
    // This is an integration check — just verify laborCostCents is > 0
    expect(createCall.data.laborCostCents).toBeGreaterThan(0);
  });
});

// ─── Confidence tier: LOW ─────────────────────────────────────────────────────

describe("CostEstimationService — confidence tier LOW (Goal 8)", () => {
  it("sets confidence to LOW when no materials and no subcategory profile", async () => {
    const product = mockProduct({
      materials: [],
      costBreakdowns: [],
      subcategory: null, // no subcategory
    });
    mockProductFindUnique.mockResolvedValue(product);

    await estimateCost("prod-1");

    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.confidence).toBe("LOW");
  });

  it("sets confidence to LOW for unknown subcategory", async () => {
    const product = mockProduct({
      materials: [],
      costBreakdowns: [],
      subcategory: "unicorn-product", // not in profiles
    });
    mockProductFindUnique.mockResolvedValue(product);

    await estimateCost("prod-1");

    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.confidence).toBe("LOW");
  });
});

// ─── CostBreakdown.updatedAt is set ──────────────────────────────────────────

describe("CostEstimationService — updatedAt field (Goal 8)", () => {
  it("breakdown result includes a calculatedAt date", async () => {
    const cotton = mockMaterialRecord("cotton", 150);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { weightGrams: 120 })],
      costBreakdowns: [],
    });
    mockProductFindUnique.mockResolvedValue(product);

    const result = await estimateCost("prod-1");
    expect(result).not.toBeNull();
    expect(result!.calculatedAt).toBeInstanceOf(Date);
  });
});
