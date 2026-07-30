import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks (hoisted so they're available before imports) ──────────────────────

const {
  mockProductFindUnique,
  mockCostBreakdownCreate,
  mockCostBreakdownFindFirst,
  mockLaborRateFindUnique,
} = vi.hoisted(() => ({
  mockProductFindUnique: vi.fn(),
  mockCostBreakdownCreate: vi.fn(),
  mockCostBreakdownFindFirst: vi.fn(),
  mockLaborRateFindUnique: vi.fn(),
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
      findUnique: mockProductFindUnique,
    },
    costBreakdown: {
      create: mockCostBreakdownCreate,
      findFirst: mockCostBreakdownFindFirst,
    },
    laborRate: {
      findUnique: mockLaborRateFindUnique,
    },
  },
}));

import { estimateCost, getCachedBreakdown } from "@/services/CostEstimationService";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const now = new Date("2026-07-30T12:00:00Z");
const oldPrice = new Date("2026-07-28T00:00:00Z"); // 60h ago — stale
const freshPrice = new Date("2026-07-30T06:00:00Z"); // 6h ago — fresh

const mockCategory = (overrides = {}) => ({
  id: "cat-1",
  name: "Clothing & Textiles",
  slug: "clothing-textiles",
  overheadPercent: 0.35,
  description: null,
  createdAt: now,
  ...overrides,
});

const mockMaterial = (name: string, pricePerKgCents: number, fetchedAt = freshPrice) => ({
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
      source: "api-ninjas",
      fetchedAt,
      createdAt: now,
    },
  ],
});

const mockProductMaterial = (
  material: ReturnType<typeof mockMaterial>,
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
  upc: "012345678901",
  ean: null,
  categoryId: "cat-1",
  category: mockCategory(),
  description: null,
  imageUrl: null,
  retailPriceCents: 4000, // $40.00
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

const mockBreakdown = (overrides: Record<string, unknown> = {}) => ({
  id: "bd-1",
  productId: "prod-1",
  materialCostCents: 200,
  laborCostCents: 120,
  overheadCostCents: 70,
  shippingCostCents: 150,
  totalCostCents: 540,
  retailPriceCents: 4000,
  markupPercent: 640.74,
  confidenceScore: 0.85,
  confidenceReason: "all 2 materials have commodity prices",
  methodology: "Material cost: commodity prices × material weights (2/2 materials priced). Labor: VN manufacturing labor rate. Overhead: material cost × category overhead %. Shipping: flat-rate tier (200g actual weight, intercontinental ×1.5).",
  calculatedAt: now,
  createdAt: now,
  ...overrides,
});

// ─── estimateCost ─────────────────────────────────────────────────────────────

describe("estimateCost", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockProductFindUnique.mockReset();
    mockCostBreakdownCreate.mockReset();
    mockCostBreakdownFindFirst.mockReset();
    mockLaborRateFindUnique.mockReset();

    // Default: create returns a valid breakdown
    mockCostBreakdownCreate.mockImplementation((args: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: "bd-new", ...args.data, createdAt: now })
    );
  });

  it("returns null when product does not exist", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    const result = await estimateCost("nonexistent");
    expect(result).toBeNull();
  });

  it("returns cached breakdown when it is fresh", async () => {
    const cached = mockBreakdown({ calculatedAt: now });
    const cotton = mockMaterial("cotton", 150, freshPrice); // freshPrice < calculatedAt = now? No, freshPrice is 6h before now

    // Actually: freshPrice (06:00) is before now (12:00), so it IS fresh relative to the breakdown at now
    // The breakdown was calculated at 12:00, price last fetched at 06:00 — price predates breakdown → fresh
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 0.6 })],
      costBreakdowns: [cached],
    });
    mockProductFindUnique.mockResolvedValue(product);

    const result = await estimateCost("prod-1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("bd-1");
    // Should NOT have called create
    expect(mockCostBreakdownCreate).not.toHaveBeenCalled();
  });

  it("recomputes when a material price is newer than the cached breakdown", async () => {
    const newerPrice = new Date("2026-07-30T13:00:00Z"); // 1h after now (breakdown at 12:00)
    const cotton = mockMaterial("cotton", 150, newerPrice);
    const cached = mockBreakdown({ calculatedAt: now }); // calculated at 12:00

    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 0.6 })],
      costBreakdowns: [cached],
      countryOfOrigin: null, // triggers fallback labor
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    expect(mockCostBreakdownCreate).toHaveBeenCalledOnce();
  });

  it("computes when there is no cached breakdown", async () => {
    const cotton = mockMaterial("cotton", 150);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 0.6 })],
      costBreakdowns: [],
      countryOfOrigin: "VN",
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-1",
      countryCode: "VN",
      countryName: "Vietnam",
      hourlyRateCents: 80,
      source: "manual",
      lastUpdated: now,
    });

    const result = await estimateCost("prod-1");
    expect(result).not.toBeNull();
    expect(mockCostBreakdownCreate).toHaveBeenCalledOnce();
  });

  it("calculates material cost using weightGrams on ProductMaterial", async () => {
    const cotton = mockMaterial("cotton", 200); // 200 cents/kg
    const pm = mockProductMaterial(cotton, { weightGrams: 120 }); // 120g = 0.12kg
    // expected: 0.12 × 200 = 24 cents

    const product = mockProduct({
      materials: [pm],
      costBreakdowns: [],
      countryOfOrigin: null,
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.materialCostCents).toBe(24);
  });

  it("calculates material cost using percentage × product weight when no weightGrams", async () => {
    const cotton = mockMaterial("cotton", 500); // 500 cents/kg
    const pm = mockProductMaterial(cotton, { percentage: 0.6 }); // 60% of 200g = 120g = 0.12kg
    // expected: 0.12 × 500 = 60 cents

    const product = mockProduct({
      materials: [pm],
      costBreakdowns: [],
      weightGrams: 200,
      countryOfOrigin: null,
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.materialCostCents).toBe(60);
  });

  it("uses category-average material cost when no materials are linked", async () => {
    // clothing-textiles avg = 200 cents
    const product = mockProduct({
      materials: [],
      costBreakdowns: [],
      countryOfOrigin: null,
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.materialCostCents).toBe(200);
  });

  it("uses labor rate from DB for known country of origin", async () => {
    const cotton = mockMaterial("cotton", 100);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 0.6 })],
      costBreakdowns: [],
      countryOfOrigin: "VN",
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-vn",
      countryCode: "VN",
      countryName: "Vietnam",
      hourlyRateCents: 80,
      source: "manual",
      lastUpdated: now,
    });

    await estimateCost("prod-1");
    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    // clothing-textiles mfg hours = 1.5; VN rate = 80 cents/hr → 1.5 × 80 = 120 cents
    expect(createCall.data.laborCostCents).toBe(120);
    expect(mockLaborRateFindUnique).toHaveBeenCalledWith({ where: { countryCode: "VN" } });
  });

  it("falls back to global-average labor rate when country is unknown", async () => {
    const cotton = mockMaterial("cotton", 100);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 0.6 })],
      costBreakdowns: [],
      countryOfOrigin: null,
    });
    mockProductFindUnique.mockResolvedValue(product);

    await estimateCost("prod-1");
    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    // clothing-textiles: 1.5 hrs × 300 cents = 450 cents
    expect(createCall.data.laborCostCents).toBe(450);
    expect(mockLaborRateFindUnique).not.toHaveBeenCalled();
  });

  it("falls back to global-average labor rate when country has no DB entry", async () => {
    const cotton = mockMaterial("cotton", 100);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 0.6 })],
      costBreakdowns: [],
      countryOfOrigin: "XX", // unknown country code
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.laborCostCents).toBe(450); // fallback
  });

  it("calculates overhead as materialCost × overheadPercent", async () => {
    const cotton = mockMaterial("cotton", 500);
    // percentage 0.6 of 200g = 120g = 0.12kg; 0.12 × 500 = 60 cents material cost
    const pm = mockProductMaterial(cotton, { percentage: 0.6 });
    const product = mockProduct({
      materials: [pm],
      costBreakdowns: [],
      countryOfOrigin: null,
      // category overheadPercent = 0.35 (clothing-textiles)
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    // overhead = 60 × 0.35 = 21 cents
    expect(createCall.data.overheadCostCents).toBe(21);
  });

  it("calculates domestic shipping (US origin)", async () => {
    const cotton = mockMaterial("cotton", 100);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 1.0 })],
      costBreakdowns: [],
      countryOfOrigin: "US",
      weightGrams: 200, // 100–500g tier → base 100 cents, domestic
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-us",
      countryCode: "US",
      countryName: "United States",
      hourlyRateCents: 1500,
      source: "manual",
      lastUpdated: now,
    });

    await estimateCost("prod-1");
    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.shippingCostCents).toBe(100); // domestic, 100–500g
  });

  it("applies intercontinental multiplier for non-US origin", async () => {
    const cotton = mockMaterial("cotton", 100);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 1.0 })],
      costBreakdowns: [],
      countryOfOrigin: "VN",
      weightGrams: 200, // 100–500g tier → base 100, × 1.5 = 150 cents
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-vn",
      countryCode: "VN",
      countryName: "Vietnam",
      hourlyRateCents: 80,
      source: "manual",
      lastUpdated: now,
    });

    await estimateCost("prod-1");
    const createCall = mockCostBreakdownCreate.mock.calls[0][0];
    expect(createCall.data.shippingCostCents).toBe(150); // intercontinental
  });

  it("calculates markup correctly", async () => {
    const cotton = mockMaterial("cotton", 500);
    // 200g product, 100% cotton: 0.2kg × 500 = 100 cents material
    const pm = mockProductMaterial(cotton, { percentage: 1.0 });
    const product = mockProduct({
      materials: [pm],
      costBreakdowns: [],
      countryOfOrigin: "VN",
      retailPriceCents: 4000,
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-vn",
      countryCode: "VN",
      countryName: "Vietnam",
      hourlyRateCents: 80,
      source: "manual",
      lastUpdated: now,
    });

    await estimateCost("prod-1");
    const data = mockCostBreakdownCreate.mock.calls[0][0].data;
    const expectedMarkup = ((4000 - data.totalCostCents) / data.totalCostCents) * 100;
    expect(data.markupPercent).toBeCloseTo(expectedMarkup, 5);
  });

  it("sets markupPercent to null when there is no retail price", async () => {
    const cotton = mockMaterial("cotton", 100);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 1.0 })],
      costBreakdowns: [],
      countryOfOrigin: null,
      retailPriceCents: null,
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    const data = mockCostBreakdownCreate.mock.calls[0][0].data;
    expect(data.markupPercent).toBeNull();
  });

  it("assigns high confidence when all materials are priced and weight is known", async () => {
    const cotton = mockMaterial("cotton", 200, freshPrice);
    const polyester = mockMaterial("polyester", 150, freshPrice);
    const product = mockProduct({
      materials: [
        mockProductMaterial(cotton, { percentage: 0.6 }),
        mockProductMaterial(polyester, { percentage: 0.4 }),
      ],
      costBreakdowns: [],
      weightGrams: 200,
      countryOfOrigin: "VN",
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-vn",
      countryCode: "VN",
      hourlyRateCents: 80,
      countryName: "Vietnam",
      source: "manual",
      lastUpdated: now,
    });

    await estimateCost("prod-1");
    const data = mockCostBreakdownCreate.mock.calls[0][0].data;
    expect(data.confidenceScore).toBeGreaterThanOrEqual(0.8);
    expect(data.confidenceReason).toContain("all 2 materials have commodity prices");
  });

  it("assigns medium confidence when only some materials are priced", async () => {
    const cotton = mockMaterial("cotton", 200);
    const noPriceMat = {
      ...mockMaterial("polyester", 0),
      commodityPrices: [], // no price
    };
    const product = mockProduct({
      materials: [
        mockProductMaterial(cotton, { percentage: 0.6 }),
        mockProductMaterial(noPriceMat, { percentage: 0.4 }),
      ],
      costBreakdowns: [],
      weightGrams: 200,
      countryOfOrigin: "VN",
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-vn",
      countryCode: "VN",
      hourlyRateCents: 80,
      countryName: "Vietnam",
      source: "manual",
      lastUpdated: now,
    });

    await estimateCost("prod-1");
    const data = mockCostBreakdownCreate.mock.calls[0][0].data;
    // 1/2 priced: 0.5 + 0.5 × 0.4 = 0.7
    expect(data.confidenceScore).toBeGreaterThanOrEqual(0.5);
    expect(data.confidenceScore).toBeLessThan(0.8);
    expect(data.confidenceReason).toContain("1 of 2 materials have commodity prices");
  });

  it("assigns low confidence when no materials are linked (uses category avg)", async () => {
    const product = mockProduct({
      materials: [],
      costBreakdowns: [],
      weightGrams: 200,
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    const data = mockCostBreakdownCreate.mock.calls[0][0].data;
    expect(data.confidenceScore).toBeLessThanOrEqual(0.3);
    expect(data.confidenceReason).toContain("no material data");
  });

  it("deducts from confidence when prices are stale", async () => {
    const cotton = mockMaterial("cotton", 200, oldPrice); // stale (>48h)
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 0.6 })],
      costBreakdowns: [],
      weightGrams: 200,
      countryOfOrigin: "VN",
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-vn",
      countryCode: "VN",
      hourlyRateCents: 80,
      countryName: "Vietnam",
      source: "manual",
      lastUpdated: now,
    });

    await estimateCost("prod-1");
    const data = mockCostBreakdownCreate.mock.calls[0][0].data;
    expect(data.confidenceReason).toContain("stale");
  });

  it("persists the breakdown to the DB", async () => {
    const cotton = mockMaterial("cotton", 100);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 0.6 })],
      costBreakdowns: [],
      countryOfOrigin: null,
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    expect(mockCostBreakdownCreate).toHaveBeenCalledOnce();
    const data = mockCostBreakdownCreate.mock.calls[0][0].data;
    expect(data.productId).toBe("prod-1");
    expect(data.totalCostCents).toBeGreaterThan(0);
    expect(data.calculatedAt).toBeInstanceOf(Date);
    expect(data.methodology).toBeTruthy();
  });

  it("uses default 250g weight when product has no weightGrams", async () => {
    const cotton = mockMaterial("cotton", 1000); // 1000 cents/kg
    // percentage 0.6 × 250g (default) = 150g = 0.15kg → 0.15 × 1000 = 150 cents
    const pm = mockProductMaterial(cotton, { percentage: 0.6 });
    const product = mockProduct({
      materials: [pm],
      costBreakdowns: [],
      weightGrams: null, // no weight
      countryOfOrigin: null,
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue(null);

    await estimateCost("prod-1");
    const data = mockCostBreakdownCreate.mock.calls[0][0].data;
    expect(data.materialCostCents).toBe(150);
    expect(data.confidenceReason).toContain("weight estimated");
  });

  it("sums total correctly from components", async () => {
    const cotton = mockMaterial("cotton", 100);
    const product = mockProduct({
      materials: [mockProductMaterial(cotton, { percentage: 0.6 })],
      costBreakdowns: [],
      countryOfOrigin: "VN",
      retailPriceCents: 5000,
    });
    mockProductFindUnique.mockResolvedValue(product);
    mockLaborRateFindUnique.mockResolvedValue({
      id: "lr-vn",
      countryCode: "VN",
      countryName: "Vietnam",
      hourlyRateCents: 80,
      source: "manual",
      lastUpdated: now,
    });

    await estimateCost("prod-1");
    const data = mockCostBreakdownCreate.mock.calls[0][0].data;
    expect(data.totalCostCents).toBe(
      data.materialCostCents +
        data.laborCostCents +
        data.overheadCostCents +
        data.shippingCostCents
    );
  });
});

// ─── getCachedBreakdown ───────────────────────────────────────────────────────

describe("getCachedBreakdown", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCostBreakdownFindFirst.mockReset();
  });

  it("returns null when no estimate has been computed", async () => {
    mockCostBreakdownFindFirst.mockResolvedValue(null);
    const result = await getCachedBreakdown("prod-1");
    expect(result).toBeNull();
  });

  it("returns the most recent cached breakdown", async () => {
    const bd = mockBreakdown();
    mockCostBreakdownFindFirst.mockResolvedValue(bd);

    const result = await getCachedBreakdown("prod-1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("bd-1");
    expect(result!.productId).toBe("prod-1");
    expect(result!.totalCostCents).toBe(540);
    expect(result!.confidenceScore).toBe(0.85);
  });

  it("queries by productId with latest first order", async () => {
    mockCostBreakdownFindFirst.mockResolvedValue(null);
    await getCachedBreakdown("prod-42");
    const call = mockCostBreakdownFindFirst.mock.calls[0][0];
    expect(call.where.productId).toBe("prod-42");
    expect(call.orderBy.calculatedAt).toBe("desc");
  });
});
