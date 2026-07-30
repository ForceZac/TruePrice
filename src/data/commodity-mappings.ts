/**
 * Commodity Mappings — Material to Commodity API Key
 *
 * Maps internal Material names (matching Material.name in DB) to commodity API keys
 * and the conversion factor needed to normalize API prices to USD per kg.
 *
 * API source: API Ninjas Commodity Price (api-ninjas.com)
 * - 10,000 req/month free tier
 * - Coverage: metals, agricultural commodities, energy
 * - Gaps: polyester, polycarbonate, PET, PVC — these use synthetic/derived estimates
 *
 * For materials not covered by the commodity API, we use `apiKey: null` and rely
 * on manually maintained fallback prices in FALLBACK_PRICES_USD_PER_KG.
 */

export interface CommodityMapping {
  /** Matches Material.name in DB */
  materialName: string;
  /** API symbol/key used in commodity price API; null = no API coverage */
  apiKey: string | null;
  /** Unit the API returns prices in (e.g. "USD/lb", "USD/ton", "USD/kg") */
  sourceUnit: string;
  /**
   * Multiply the raw API price by this factor to get USD per kg.
   * e.g. for "USD/lb": conversionToKg = 2.20462 (1 lb = 0.453592 kg → 1/0.453592 ≈ 2.20462)
   */
  conversionToKg: number;
  /** Broad category tag */
  category: "textile" | "metal" | "plastic" | "food" | "other";
  /**
   * Fallback price in USD/kg used when the API is unavailable or doesn't cover this material.
   * Updated manually from industry sources. Always prefer live API data when available.
   */
  fallbackUsdPerKg: number;
}

/**
 * Conversion constants for reference:
 *   1 metric ton (MT) = 1,000 kg  → USD/MT × 0.001 = USD/kg
 *   1 lb              = 0.453592 kg → USD/lb × 2.20462 = USD/kg
 *   1 oz (troy)       = 0.0311035 kg → USD/troy oz × 32.1507 = USD/kg
 *   1 bushel wheat    ≈ 27.216 kg  → USD/bushel × 0.036743 = USD/kg
 *   1 bushel corn     ≈ 25.4 kg    → USD/bushel × 0.039370 = USD/kg
 *   1 bushel soybeans ≈ 27.216 kg  → USD/bushel × 0.036743 = USD/kg
 */

export const COMMODITY_MAPPINGS: CommodityMapping[] = [
  // ─── Textiles ──────────────────────────────────────────────────────────────
  {
    materialName: "cotton",
    apiKey: "cotton",
    sourceUnit: "USD/lb",
    conversionToKg: 2.20462,
    category: "textile",
    fallbackUsdPerKg: 1.85,
  },
  {
    materialName: "polyester",
    apiKey: null, // Not on commodity exchanges — derived from PTA/MEG prices
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "textile",
    fallbackUsdPerKg: 1.20,
  },
  {
    materialName: "nylon",
    apiKey: null, // Derived from caprolactam (intermediate chemical)
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "textile",
    fallbackUsdPerKg: 2.50,
  },
  {
    materialName: "wool",
    apiKey: null, // Wool spot prices via AWEX (Australian Wool Exchange), not in free APIs
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "textile",
    fallbackUsdPerKg: 7.00,
  },
  {
    materialName: "silk",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "textile",
    fallbackUsdPerKg: 35.00,
  },
  {
    materialName: "elastane",
    apiKey: null, // Spandex/elastane — not on commodity exchanges
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "textile",
    fallbackUsdPerKg: 8.00,
  },
  {
    materialName: "linen",
    apiKey: null, // Flax/linen — limited commodity market data
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "textile",
    fallbackUsdPerKg: 3.50,
  },

  // ─── Metals ────────────────────────────────────────────────────────────────
  {
    materialName: "steel",
    apiKey: "steel",
    sourceUnit: "USD/ton",
    conversionToKg: 0.001,
    category: "metal",
    fallbackUsdPerKg: 0.85,
  },
  {
    materialName: "aluminum",
    apiKey: "aluminum",
    sourceUnit: "USD/ton",
    conversionToKg: 0.001,
    category: "metal",
    fallbackUsdPerKg: 2.30,
  },
  {
    materialName: "copper",
    apiKey: "copper",
    sourceUnit: "USD/ton",
    conversionToKg: 0.001,
    category: "metal",
    fallbackUsdPerKg: 9.50,
  },
  {
    materialName: "zinc",
    apiKey: "zinc",
    sourceUnit: "USD/ton",
    conversionToKg: 0.001,
    category: "metal",
    fallbackUsdPerKg: 2.80,
  },
  {
    materialName: "tin",
    apiKey: "tin",
    sourceUnit: "USD/ton",
    conversionToKg: 0.001,
    category: "metal",
    fallbackUsdPerKg: 26.00,
  },
  {
    materialName: "nickel",
    apiKey: "nickel",
    sourceUnit: "USD/ton",
    conversionToKg: 0.001,
    category: "metal",
    fallbackUsdPerKg: 16.00,
  },

  // ─── Plastics (all use fallback — no free commodity API coverage) ───────────
  {
    materialName: "polyethylene",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "plastic",
    fallbackUsdPerKg: 1.10,
  },
  {
    materialName: "polypropylene",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "plastic",
    fallbackUsdPerKg: 1.20,
  },
  {
    materialName: "pvc",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "plastic",
    fallbackUsdPerKg: 1.05,
  },
  {
    materialName: "pet",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "plastic",
    fallbackUsdPerKg: 1.00,
  },
  {
    materialName: "polycarbonate",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "plastic",
    fallbackUsdPerKg: 3.50,
  },

  // ─── Food ──────────────────────────────────────────────────────────────────
  {
    materialName: "sugar",
    apiKey: "sugar",
    sourceUnit: "USD/lb",
    conversionToKg: 2.20462,
    category: "food",
    fallbackUsdPerKg: 0.55,
  },
  {
    materialName: "wheat",
    apiKey: "wheat",
    sourceUnit: "USD/bushel",
    conversionToKg: 0.036743, // 1 bushel wheat ≈ 27.216 kg
    category: "food",
    fallbackUsdPerKg: 0.22,
  },
  {
    materialName: "cocoa butter",
    apiKey: "cocoa",
    sourceUnit: "USD/ton",
    conversionToKg: 0.001,
    category: "food",
    fallbackUsdPerKg: 9.00,
  },
  {
    materialName: "milk powder",
    apiKey: null, // Dairy derivatives not in free commodity APIs
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "food",
    fallbackUsdPerKg: 3.50,
  },
  {
    materialName: "corn",
    apiKey: "corn",
    sourceUnit: "USD/bushel",
    conversionToKg: 0.039370, // 1 bushel corn ≈ 25.4 kg
    category: "food",
    fallbackUsdPerKg: 0.18,
  },
  {
    materialName: "soybean oil",
    apiKey: "soybean oil",
    sourceUnit: "USD/lb",
    conversionToKg: 2.20462,
    category: "food",
    fallbackUsdPerKg: 1.20,
  },
  {
    materialName: "palm oil",
    apiKey: "palm oil",
    sourceUnit: "USD/ton",
    conversionToKg: 0.001,
    category: "food",
    fallbackUsdPerKg: 0.90,
  },
  {
    materialName: "coffee",
    apiKey: "coffee",
    sourceUnit: "USD/lb",
    conversionToKg: 2.20462,
    category: "food",
    fallbackUsdPerKg: 5.00,
  },
  {
    materialName: "rice",
    apiKey: null, // Rice futures limited in free APIs
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "food",
    fallbackUsdPerKg: 0.40,
  },
  {
    materialName: "citric acid",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "food",
    fallbackUsdPerKg: 1.20,
  },
  {
    materialName: "water",
    apiKey: null,
    sourceUnit: "USD/liter",
    conversionToKg: 1, // water ≈ 1 kg/liter
    category: "food",
    fallbackUsdPerKg: 0.001, // essentially free at industrial scale
  },

  // ─── Other ─────────────────────────────────────────────────────────────────
  {
    materialName: "rubber",
    apiKey: "rubber",
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "other",
    fallbackUsdPerKg: 1.60,
  },
  {
    materialName: "glass",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "other",
    fallbackUsdPerKg: 0.50,
  },
  {
    materialName: "paper",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "other",
    fallbackUsdPerKg: 0.70,
  },
  {
    materialName: "leather",
    apiKey: null,
    sourceUnit: "USD/kg",
    conversionToKg: 1,
    category: "other",
    fallbackUsdPerKg: 4.50,
  },
];

/** Lookup a mapping by material name (case-insensitive). */
export function getMappingByMaterialName(
  name: string
): CommodityMapping | undefined {
  const lower = name.toLowerCase().trim();
  return COMMODITY_MAPPINGS.find(
    (m) => m.materialName.toLowerCase() === lower
  );
}

/** Get all mappings that have a live API key. */
export function getMappingsWithApiKey(): CommodityMapping[] {
  return COMMODITY_MAPPINGS.filter((m) => m.apiKey !== null);
}
