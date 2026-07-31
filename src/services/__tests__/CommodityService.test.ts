import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted — use vi.hoisted to create mock fns that are available in the factory
const { mockCreate, mockFindMany, mockCommodityFindMany, mockFindFirst, mockFindUnique } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindMany: vi.fn(),
  mockCommodityFindMany: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    COMMODITY_API_KEY: undefined,
    CRON_SECRET: "test-secret",
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost/test",
    RE_ESTIMATION_TTL_DAYS: 7,
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    material: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
    },
    commodityPrice: {
      create: mockCreate,
      findFirst: mockFindFirst,
      findMany: mockCommodityFindMany,
    },
  },
}));

import {
  fetchPrices,
  fetchPrice,
  getCachedPrice,
  getAllCachedPrices,
  seedFallbackPrices,
  detectStalePrices,
} from "@/services/CommodityService";
import { COMMODITY_MAPPINGS } from "@/data/commodity-mappings";
import { serverEnv as env } from "@/lib/env.server";

// Stable test material — pick the first mapping
const FIRST_MAPPING = COMMODITY_MAPPINGS[0];

const mockDbMaterial = (name: string, id = "mat-1") => ({
  id,
  name,
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mockDbPrice = (materialId: string, ageMs = 0) => ({
  id: "price-1",
  materialId,
  pricePerKgCents: 250,
  source: "api-ninjas",
  fetchedAt: new Date(Date.now() - ageMs),
  createdAt: new Date(),
  material: mockDbMaterial("cotton", materialId),
});

// ─── fetchPrices ──────────────────────────────────────────────────────────────

describe("fetchPrices", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockFindMany.mockReset();
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({});
    (env as Record<string, unknown>).COMMODITY_API_KEY = undefined;
  });

  it("performs a single batch DB lookup (no N+1)", async () => {
    mockFindMany.mockResolvedValue([]);
    await fetchPrices();
    // findMany must be called exactly once regardless of COMMODITY_MAPPINGS length
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const call = mockFindMany.mock.calls[0][0];
    expect(call.where.name.in).toHaveLength(COMMODITY_MAPPINGS.length);
  });

  it("returns 0 when no materials are in DB", async () => {
    mockFindMany.mockResolvedValue([]);
    const count = await fetchPrices();
    expect(count).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("uses fallback price when COMMODITY_API_KEY is not set", async () => {
    const mat = mockDbMaterial(FIRST_MAPPING.materialName);
    mockFindMany.mockResolvedValue([mat]);

    const count = await fetchPrices();
    expect(count).toBe(1);
    expect(mockCreate).toHaveBeenCalledOnce();

    const { data } = mockCreate.mock.calls[0][0];
    expect(data.materialId).toBe(mat.id);
    expect(data.pricePerKgCents).toBeGreaterThan(0);
    // No API key → source is "fallback" or "fallback-no-key"
    expect(data.source).toMatch(/^fallback/);
  });

  it("uses API price when COMMODITY_API_KEY is set and material has apiKey", async () => {
    (env as Record<string, unknown>).COMMODITY_API_KEY = "test-api-key";

    // Pick a mapping that has an apiKey
    const apiMapping = COMMODITY_MAPPINGS.find((m) => m.apiKey !== null);
    if (!apiMapping) return;

    const mat = mockDbMaterial(apiMapping.materialName);
    mockFindMany.mockResolvedValue([mat]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ name: apiMapping.apiKey, price: 1.5, updated: Date.now() }),
      })
    );

    const count = await fetchPrices();
    expect(count).toBe(1);
    const { data } = mockCreate.mock.calls[0][0];
    expect(data.source).toBe("api-ninjas");
    expect(data.pricePerKgCents).toBeGreaterThan(0);
  });

  it("falls back to static price when API returns an error for a material", async () => {
    (env as Record<string, unknown>).COMMODITY_API_KEY = "test-api-key";

    const apiMapping = COMMODITY_MAPPINGS.find((m) => m.apiKey !== null);
    if (!apiMapping) return;

    const mat = mockDbMaterial(apiMapping.materialName);
    mockFindMany.mockResolvedValue([mat]);

    // API returns HTTP error → fetchFromApiNinjas returns null
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    const count = await fetchPrices();
    expect(count).toBe(1);
    const { data } = mockCreate.mock.calls[0][0];
    expect(data.source).toBe("fallback");
  });

  it("skips materials not found in DB", async () => {
    // findMany returns only one material even though 30+ mappings exist
    const mat = mockDbMaterial(FIRST_MAPPING.materialName);
    mockFindMany.mockResolvedValue([mat]);

    const count = await fetchPrices();
    expect(count).toBe(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

// ─── fetchPrice ───────────────────────────────────────────────────────────────

describe("fetchPrice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockFindUnique.mockReset();
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({});
  });

  it("returns null for a material not in COMMODITY_MAPPINGS", async () => {
    const result = await fetchPrice("not-a-real-material-xyz");
    expect(result).toBeNull();
  });

  it("returns null when material is not in DB", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await fetchPrice(FIRST_MAPPING.materialName);
    expect(result).toBeNull();
  });

  it("returns PriceResult on success (fallback, no API key)", async () => {
    const mat = mockDbMaterial(FIRST_MAPPING.materialName);
    mockFindUnique.mockResolvedValue(mat);

    const result = await fetchPrice(FIRST_MAPPING.materialName);
    expect(result).not.toBeNull();
    expect(result!.materialId).toBe(mat.id);
    expect(result!.materialName).toBe(FIRST_MAPPING.materialName);
    expect(result!.pricePerKgCents).toBeGreaterThan(0);
    expect(result!.stale).toBe(false);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("sets source to 'fallback-no-key' for materials with apiKey but no env key", async () => {
    const apiMapping = COMMODITY_MAPPINGS.find((m) => m.apiKey !== null);
    if (!apiMapping) return;

    mockFindUnique.mockResolvedValue(mockDbMaterial(apiMapping.materialName));
    const result = await fetchPrice(apiMapping.materialName);
    expect(result!.source).toBe("fallback-no-key");
  });
});

// ─── getCachedPrice ───────────────────────────────────────────────────────────

describe("getCachedPrice", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockFindFirst.mockReset();
  });

  it("returns null when no price record exists", async () => {
    mockFindFirst.mockResolvedValue(null);
    const result = await getCachedPrice("mat-1");
    expect(result).toBeNull();
  });

  it("returns PriceResult with stale=false for a fresh price", async () => {
    mockFindFirst.mockResolvedValue(mockDbPrice("mat-1", 0));
    const result = await getCachedPrice("mat-1");
    expect(result).not.toBeNull();
    expect(result!.stale).toBe(false);
    expect(result!.pricePerKgCents).toBe(250);
    expect(result!.source).toBe("api-ninjas");
  });

  it("returns stale=true when price is older than 48 hours", async () => {
    const fortyNineHoursMs = 49 * 60 * 60 * 1000;
    mockFindFirst.mockResolvedValue(mockDbPrice("mat-1", fortyNineHoursMs));
    const result = await getCachedPrice("mat-1");
    expect(result!.stale).toBe(true);
  });

  it("returns stale=false when price is 47 hours old", async () => {
    const fortySevenHoursMs = 47 * 60 * 60 * 1000;
    mockFindFirst.mockResolvedValue(mockDbPrice("mat-1", fortySevenHoursMs));
    const result = await getCachedPrice("mat-1");
    expect(result!.stale).toBe(false);
  });

  it("returns the materialName from the joined material record", async () => {
    mockFindFirst.mockResolvedValue(mockDbPrice("mat-1", 0));
    const result = await getCachedPrice("mat-1");
    expect(result!.materialName).toBe("cotton");
  });
});

// ─── getAllCachedPrices ────────────────────────────────────────────────────────

describe("getAllCachedPrices", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockFindMany.mockReset();
  });

  it("returns empty array when no materials exist", async () => {
    mockFindMany.mockResolvedValue([]);
    const results = await getAllCachedPrices();
    expect(results).toEqual([]);
  });

  it("skips materials with no price records", async () => {
    mockFindMany.mockResolvedValue([
      { ...mockDbMaterial("cotton", "mat-1"), commodityPrices: [] },
      {
        ...mockDbMaterial("polyester", "mat-2"),
        commodityPrices: [{ pricePerKgCents: 180, source: "fallback", fetchedAt: new Date() }],
      },
    ]);
    const results = await getAllCachedPrices();
    expect(results).toHaveLength(1);
    expect(results[0].materialName).toBe("polyester");
  });

  it("returns the most recent price per material", async () => {
    const now = new Date();
    mockFindMany.mockResolvedValue([
      {
        ...mockDbMaterial("cotton", "mat-1"),
        commodityPrices: [{ pricePerKgCents: 300, source: "api-ninjas", fetchedAt: now }],
      },
    ]);
    const results = await getAllCachedPrices();
    expect(results).toHaveLength(1);
    expect(results[0].pricePerKgCents).toBe(300);
    expect(results[0].stale).toBe(false);
  });

  it("marks stale prices correctly", async () => {
    const oldDate = new Date(Date.now() - 49 * 60 * 60 * 1000);
    mockFindMany.mockResolvedValue([
      {
        ...mockDbMaterial("cotton", "mat-1"),
        commodityPrices: [{ pricePerKgCents: 200, source: "fallback", fetchedAt: oldDate }],
      },
    ]);
    const results = await getAllCachedPrices();
    expect(results[0].stale).toBe(true);
  });
});

// ─── seedFallbackPrices ───────────────────────────────────────────────────────

describe("seedFallbackPrices", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockFindMany.mockReset();
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({});
  });

  it("performs a single batch DB lookup (no N+1)", async () => {
    mockFindMany.mockResolvedValue([]);
    await seedFallbackPrices();
    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const call = mockFindMany.mock.calls[0][0];
    expect(call.where.name.in).toHaveLength(COMMODITY_MAPPINGS.length);
  });

  it("returns 0 when no materials are in DB", async () => {
    mockFindMany.mockResolvedValue([]);
    const count = await seedFallbackPrices();
    expect(count).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("seeds one price per material found in DB", async () => {
    const mat1 = mockDbMaterial(FIRST_MAPPING.materialName, "mat-1");
    const mat2 = mockDbMaterial(COMMODITY_MAPPINGS[1].materialName, "mat-2");
    mockFindMany.mockResolvedValue([mat1, mat2]);

    const count = await seedFallbackPrices();
    expect(count).toBe(2);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("stores source as 'fallback-seed'", async () => {
    mockFindMany.mockResolvedValue([mockDbMaterial(FIRST_MAPPING.materialName)]);
    await seedFallbackPrices();
    const { data } = mockCreate.mock.calls[0][0];
    expect(data.source).toBe("fallback-seed");
  });

  it("stores pricePerKgCents as a positive integer", async () => {
    mockFindMany.mockResolvedValue([mockDbMaterial(FIRST_MAPPING.materialName)]);
    await seedFallbackPrices();
    const { data } = mockCreate.mock.calls[0][0];
    expect(data.pricePerKgCents).toBeGreaterThan(0);
    expect(Number.isInteger(data.pricePerKgCents)).toBe(true);
  });
});

// ─── detectStalePrices ────────────────────────────────────────────────────────

describe("detectStalePrices", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockCommodityFindMany.mockReset();
  });

  it("returns empty array when no stale prices exist", async () => {
    mockCommodityFindMany.mockResolvedValue([]);
    const result = await detectStalePrices(25 * 60 * 60 * 1000);
    expect(result).toEqual([]);
  });

  it("returns material names for stale rows", async () => {
    mockCommodityFindMany.mockResolvedValue([
      { material: { name: "cotton" } },
      { material: { name: "polyester" } },
    ]);
    const result = await detectStalePrices(25 * 60 * 60 * 1000);
    expect(result).toEqual(["cotton", "polyester"]);
  });

  it("deduplicates material names when multiple stale rows share a material", async () => {
    mockCommodityFindMany.mockResolvedValue([
      { material: { name: "cotton" } },
      { material: { name: "cotton" } },
      { material: { name: "steel" } },
    ]);
    const result = await detectStalePrices(25 * 60 * 60 * 1000);
    expect(result).toEqual(["cotton", "steel"]);
  });

  it("passes the computed threshold date to prisma query", async () => {
    mockCommodityFindMany.mockResolvedValue([]);
    const thresholdMs = 10 * 60 * 60 * 1000; // 10 hours
    const before = Date.now();
    await detectStalePrices(thresholdMs);
    const after = Date.now();

    expect(mockCommodityFindMany).toHaveBeenCalledOnce();
    const { where } = mockCommodityFindMany.mock.calls[0][0];
    const cutoff: Date = where.fetchedAt.lt;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before - thresholdMs);
    expect(cutoff.getTime()).toBeLessThanOrEqual(after - thresholdMs + 100);
  });
});
