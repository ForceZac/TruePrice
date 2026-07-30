/**
 * CommodityService — the ONLY module that fetches commodity prices from external APIs.
 *
 * API used: API Ninjas Commodity Price (api-ninjas.com)
 *   - Free tier: 10,000 req/month
 *   - Endpoint: GET https://api.api-ninjas.com/v1/commodityprice?name=<symbol>
 *   - Response: { name: string, price: number, updated: number }
 *
 * Coverage gaps (no API key): polyester, nylon, wool, silk, elastane, linen,
 * polycarbonate, plastics, milk powder, rice, citric acid, water, glass, paper, leather.
 * These fall back to the static fallbackUsdPerKg values in commodity-mappings.ts.
 *
 * Staleness threshold: 48 hours. Prices older than this are served but flagged stale.
 */

import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { rawPriceToCentsPerKg } from "@/lib/unit-conversion";
import {
  COMMODITY_MAPPINGS,
  getMappingByMaterialName,
  getMappingsWithApiKey,
  type CommodityMapping,
} from "@/data/commodity-mappings";

export interface PriceResult {
  materialId: string;
  materialName: string;
  pricePerKgCents: number;
  source: string;
  fetchedAt: Date;
  stale: boolean;
}

/** How old a cached price can be before we flag it stale (ms). */
const STALENESS_THRESHOLD_MS = 48 * 60 * 60 * 1000;

/** API Ninjas commodity price endpoint */
const API_NINJAS_BASE = "https://api.api-ninjas.com/v1/commodityprice";

// ─── Internal: API Ninjas fetch ──────────────────────────────────────────────

interface ApiNinjasResponse {
  name: string;
  price: number;
  updated: number; // unix timestamp
}

async function fetchFromApiNinjas(
  apiKey: string,
  symbol: string
): Promise<number | null> {
  const url = `${API_NINJAS_BASE}?name=${encodeURIComponent(symbol)}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": apiKey },
    next: { revalidate: 0 }, // no caching at the fetch layer — we cache in DB
  });

  if (!res.ok) {
    console.error(`[CommodityService] API Ninjas ${symbol}: HTTP ${res.status}`);
    return null;
  }

  const data = (await res.json()) as ApiNinjasResponse;
  if (typeof data.price !== "number" || data.price <= 0) {
    console.warn(`[CommodityService] API Ninjas ${symbol}: unexpected response`, data);
    return null;
  }

  return data.price;
}

// ─── Internal: write prices to DB ────────────────────────────────────────────

async function persistPrice(
  materialId: string,
  pricePerKgCents: number,
  source: string,
  fetchedAt: Date
): Promise<void> {
  await prisma.commodityPrice.create({
    data: {
      materialId,
      pricePerKgCents,
      source,
      fetchedAt,
      createdAt: new Date(),
    },
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch and cache fresh prices for all materials that have a commodity API key.
 * For materials without API coverage, write the fallback price.
 *
 * Returns the count of prices refreshed.
 */
export async function fetchPrices(): Promise<number> {
  const apiKey = env.COMMODITY_API_KEY;
  const now = new Date();
  let refreshed = 0;

  // Batch lookup: one query instead of one per material
  const materialNames = COMMODITY_MAPPINGS.map((m) => m.materialName);
  const dbMaterials = await prisma.material.findMany({
    where: { name: { in: materialNames } },
  });
  const materialByName = new Map(dbMaterials.map((m) => [m.name, m]));

  for (const mapping of COMMODITY_MAPPINGS) {
    const material = materialByName.get(mapping.materialName);
    if (!material) continue;

    let pricePerKgCents: number;
    let source: string;

    if (mapping.apiKey && apiKey) {
      const rawPrice = await fetchFromApiNinjas(apiKey, mapping.apiKey);
      if (rawPrice !== null) {
        pricePerKgCents = rawPriceToCentsPerKg(rawPrice, mapping.conversionToKg);
        source = "api-ninjas";
      } else {
        // API returned null — fall back to static price
        pricePerKgCents = rawPriceToCentsPerKg(
          mapping.fallbackUsdPerKg,
          1 // fallback already in USD/kg
        );
        source = "fallback";
      }
    } else {
      // No API key or no API coverage for this material
      pricePerKgCents = rawPriceToCentsPerKg(mapping.fallbackUsdPerKg, 1);
      source = mapping.apiKey ? "fallback-no-key" : "fallback";
    }

    await persistPrice(material.id, pricePerKgCents, source, now);
    refreshed++;
  }

  return refreshed;
}

/**
 * Fetch and cache a fresh price for a single material by name.
 */
export async function fetchPrice(materialName: string): Promise<PriceResult | null> {
  const mapping = getMappingByMaterialName(materialName);
  if (!mapping) return null;

  const material = await prisma.material.findUnique({
    where: { name: mapping.materialName },
  });
  if (!material) return null;

  const apiKey = env.COMMODITY_API_KEY;
  const now = new Date();

  let pricePerKgCents: number;
  let source: string;

  if (mapping.apiKey && apiKey) {
    const rawPrice = await fetchFromApiNinjas(apiKey, mapping.apiKey);
    if (rawPrice !== null) {
      pricePerKgCents = rawPriceToCentsPerKg(rawPrice, mapping.conversionToKg);
      source = "api-ninjas";
    } else {
      pricePerKgCents = rawPriceToCentsPerKg(mapping.fallbackUsdPerKg, 1);
      source = "fallback";
    }
  } else {
    pricePerKgCents = rawPriceToCentsPerKg(mapping.fallbackUsdPerKg, 1);
    source = mapping.apiKey ? "fallback-no-key" : "fallback";
  }

  await persistPrice(material.id, pricePerKgCents, source, now);

  return {
    materialId: material.id,
    materialName: material.name,
    pricePerKgCents,
    source,
    fetchedAt: now,
    stale: false,
  };
}

/**
 * Read the most recent cached price for a material from the DB.
 * Returns null if no price has ever been fetched.
 * Sets stale=true if price is older than STALENESS_THRESHOLD_MS.
 */
export async function getCachedPrice(materialId: string): Promise<PriceResult | null> {
  const record = await prisma.commodityPrice.findFirst({
    where: { materialId },
    orderBy: { fetchedAt: "desc" },
    include: { material: true },
  });

  if (!record) return null;

  const ageMs = Date.now() - record.fetchedAt.getTime();
  return {
    materialId: record.materialId,
    materialName: record.material.name,
    pricePerKgCents: record.pricePerKgCents,
    source: record.source,
    fetchedAt: record.fetchedAt,
    stale: ageMs > STALENESS_THRESHOLD_MS,
  };
}

/**
 * Get cached prices for all materials in the DB.
 * Each material returns its most recent price only.
 */
export async function getAllCachedPrices(): Promise<PriceResult[]> {
  const materials = await prisma.material.findMany({
    include: {
      commodityPrices: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
    },
  });

  const now = Date.now();
  const results: PriceResult[] = [];

  for (const material of materials) {
    const latest = material.commodityPrices[0];
    if (!latest) continue;

    const ageMs = now - latest.fetchedAt.getTime();
    results.push({
      materialId: material.id,
      materialName: material.name,
      pricePerKgCents: latest.pricePerKgCents,
      source: latest.source,
      fetchedAt: latest.fetchedAt,
      stale: ageMs > STALENESS_THRESHOLD_MS,
    });
  }

  return results;
}

/**
 * Seed prices for all mapped materials using fallback values.
 * Used in tests and initial setup when no API key is available.
 */
export async function seedFallbackPrices(): Promise<number> {
  const now = new Date();

  // Batch lookup: one query instead of one per material
  const materialNames = COMMODITY_MAPPINGS.map((m) => m.materialName);
  const dbMaterials = await prisma.material.findMany({
    where: { name: { in: materialNames } },
  });
  const materialByName = new Map(dbMaterials.map((m) => [m.name, m]));

  let seeded = 0;
  for (const mapping of COMMODITY_MAPPINGS) {
    const material = materialByName.get(mapping.materialName);
    if (!material) continue;

    const pricePerKgCents = rawPriceToCentsPerKg(mapping.fallbackUsdPerKg, 1);
    await persistPrice(material.id, pricePerKgCents, "fallback-seed", now);
    seeded++;
  }

  return seeded;
}

// Re-export for convenience
export type { CommodityMapping };
export { getMappingByMaterialName, getMappingsWithApiKey };
