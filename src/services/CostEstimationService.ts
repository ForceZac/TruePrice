/**
 * CostEstimationService — the ONLY module that calculates cost breakdowns.
 *
 * Computes material cost, labor cost, overhead, and shipping for a product,
 * caches the result in CostBreakdown, and handles cache invalidation when
 * commodity prices update.
 *
 * Algorithm:
 *   materialCost = Σ(materialWeightKg × commodityPricePerKgCents)
 *   laborCost    = manufacturingHoursEstimate × hourlyLaborRateCents
 *   overhead     = materialCost × category.overheadPercent
 *   shipping     = flat-rate table by weight + intercontinental multiplier
 *   total        = material + labor + overhead + shipping
 *   markup       = (retailPrice - total) / total × 100
 */

import { prisma } from "@/lib/db";
import { getSubcategoryProfile } from "@/data/subcategory-profiles";
import { getProductOverride } from "@/data/product-overrides";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Estimated manufacturing hours per unit by category slug (v1 defaults). */
const MANUFACTURING_HOURS: Record<string, number> = {
  "food-beverage": 0.05,
  "clothing-textiles": 1.5,
  electronics: 2.5,
  "cosmetics-personal-care": 0.2,
  "home-kitchen": 0.5,
};

const DEFAULT_MANUFACTURING_HOURS = 0.5;

/** Flat shipping rates in USD cents, keyed by max weight (grams). */
const SHIPPING_TIERS: Array<{ maxGrams: number; baseCents: number }> = [
  { maxGrams: 100, baseCents: 50 },
  { maxGrams: 500, baseCents: 100 },
  { maxGrams: 2000, baseCents: 250 },
  { maxGrams: Infinity, baseCents: 500 },
];

/** Intercontinental shipping multiplier (non-US origin). */
const INTERCONTINENTAL_MULTIPLIER = 1.5;

/** Global-average manufacturing labor rate in USD cents/hour (fallback). */
const FALLBACK_LABOR_RATE_CENTS = 300; // ~$3.00/hr

/** Category-average material cost in cents when no materials are linked. */
const CATEGORY_AVG_MATERIAL_COST_CENTS: Record<string, number> = {
  "food-beverage": 30,
  "clothing-textiles": 200,
  electronics: 1000,
  "cosmetics-personal-care": 150,
  "home-kitchen": 300,
};
const DEFAULT_AVG_MATERIAL_COST_CENTS = 200;

/** Assumed product weight in grams when the product has no weight data. */
const DEFAULT_WEIGHT_GRAMS = 250;

/** Price age (ms) after which we flag a commodity price as stale. */
const STALENESS_THRESHOLD_MS = 48 * 60 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfidenceTier = "HIGH" | "MEDIUM" | "LOW";

export interface CostBreakdownResult {
  id: string;
  productId: string;
  materialCostCents: number;
  laborCostCents: number;
  overheadCostCents: number;
  shippingCostCents: number;
  totalCostCents: number;
  retailPriceCents: number | null;
  markupPercent: number | null;
  confidenceScore: number;
  confidenceReason: string;
  /** Categorical confidence tier: HIGH = product-specific data, MEDIUM = subcategory profile, LOW = category average. */
  confidence: ConfidenceTier;
  methodology: string;
  calculatedAt: Date;
}

// ─── Leaderboard Types ────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string;
  totalCostCents: number;
  retailPriceCents: number | null;
  markupPercent: number | null;
  confidenceScore: number;
  confidence: ConfidenceTier;
  confidenceReason: string;
  product: {
    id: string;
    name: string;
    category: { name: string };
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return the top N products ranked by markup percentage (highest first).
 * Only products with a non-null markupPercent are included.
 */
export async function getTopMarkupProducts(limit: number): Promise<LeaderboardEntry[]> {
  const rows = await prisma.costBreakdown.findMany({
    where: { markupPercent: { not: null } },
    orderBy: { markupPercent: "desc" },
    take: limit,
    select: {
      id: true,
      totalCostCents: true,
      retailPriceCents: true,
      markupPercent: true,
      confidenceScore: true,
      confidence: true,
      confidenceReason: true,
      product: {
        select: {
          id: true,
          name: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    ...r,
    confidence: (r.confidence as ConfidenceTier) || "LOW",
  }));
}

/**
 * Estimate (or return cached) cost breakdown for a product.
 *
 * Re-computes when any linked material has a commodity price newer than the
 * cached breakdown's calculatedAt timestamp. Returns null if the product
 * does not exist.
 */
export async function estimateCost(
  productId: string
): Promise<CostBreakdownResult | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      materials: {
        include: {
          material: {
            include: {
              commodityPrices: {
                orderBy: { fetchedAt: "desc" },
                take: 1,
              },
            },
          },
        },
      },
      costBreakdowns: {
        orderBy: { calculatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!product) return null;

  const cached = product.costBreakdowns[0] ?? null;

  // Check freshness: breakdown is fresh if every linked material's latest
  // price predates the breakdown's calculatedAt.
  if (cached) {
    const allFresh = product.materials.every((pm) => {
      const latestPrice = pm.material.commodityPrices[0];
      return !latestPrice || latestPrice.fetchedAt <= cached.calculatedAt;
    });
    if (allFresh) return toResult(cached);
  }

  // ── Resolve product override (applied over DB data without modifying DB) ──

  const override = getProductOverride(product.upc, product.ean);
  const effectiveRetailPriceCents =
    override?.retailPriceCents ?? product.retailPriceCents ?? null;
  const effectiveSubcategory = override?.subcategory ?? product.subcategory ?? null;

  // ── Resolve material source: DB materials → override materials → subcategory profile ──

  const categorySlug = product.category.slug;
  const subcategoryProfile = getSubcategoryProfile(categorySlug, effectiveSubcategory);

  // When an override has explicit materials, we treat them as synthetic ProductMaterial rows
  // for cost computation. These are not linked to real DB Material records with prices;
  // instead we compute material cost from the subcategory profile path.
  const hasMaterialRows = product.materials.length > 0 && !override?.materials;
  const hasOverrideMaterials = (override?.materials?.length ?? 0) > 0;

  const weightGrams = product.weightGrams ?? subcategoryProfile?.defaultWeightGrams ?? DEFAULT_WEIGHT_GRAMS;
  const weightKnown = product.weightGrams != null;

  // ── Determine confidence tier ────────────────────────────────────────────

  let confidenceTier: ConfidenceTier;
  if (hasMaterialRows || hasOverrideMaterials) {
    confidenceTier = "HIGH";
  } else if (subcategoryProfile) {
    confidenceTier = "MEDIUM";
  } else {
    confidenceTier = "LOW";
  }

  // ── 1. Material cost ─────────────────────────────────────────────────────

  let materialCalc: MaterialCostResult;

  if (hasMaterialRows) {
    materialCalc = computeMaterialCost(product.materials, weightGrams, categorySlug);
  } else if (hasOverrideMaterials || subcategoryProfile) {
    // Build synthetic material list from override or subcategory profile
    const profileMix = hasOverrideMaterials
      ? override!.materials!
      : subcategoryProfile!.defaultMaterialMix;

    materialCalc = await computeProfileMaterialCost(profileMix, weightGrams, categorySlug);
  } else {
    materialCalc = computeMaterialCost([], weightGrams, categorySlug);
  }

  const { materialCostCents, pricedCount, totalCount, stalePriceCount, unpricedNames, usedCategoryAvg } =
    materialCalc;

  // ── 2. Labor cost ────────────────────────────────────────────────────────

  const effectiveLaborHours = subcategoryProfile?.defaultLaborHours ?? null;
  const laborCalc = await computeLaborCost(
    product.countryOfOrigin,
    categorySlug,
    effectiveLaborHours
  );
  const { laborCostCents, usedFallbackLabor } = laborCalc;

  // ── 3. Overhead ──────────────────────────────────────────────────────────

  const overheadCostCents = Math.round(
    materialCostCents * product.category.overheadPercent
  );

  // ── 4. Shipping ──────────────────────────────────────────────────────────

  const shippingCostCents = computeShippingCents(
    weightGrams,
    product.countryOfOrigin
  );

  // ── 5. Total + markup ────────────────────────────────────────────────────

  const totalCostCents =
    materialCostCents + laborCostCents + overheadCostCents + shippingCostCents;

  const markupPercent =
    effectiveRetailPriceCents != null
      ? ((effectiveRetailPriceCents - totalCostCents) / totalCostCents) * 100
      : null;

  // ── 6. Numeric confidence score (kept for backward compat) ───────────────

  const { score, reason } = computeConfidence({
    totalCount,
    pricedCount,
    unpricedNames,
    stalePriceCount,
    weightKnown,
    usedCategoryAvg,
    usedFallbackLabor,
  });

  // ── 7. Methodology string ────────────────────────────────────────────────

  const methodology = buildMethodology({
    totalCount,
    pricedCount,
    usedCategoryAvg,
    categoryName: product.category.name,
    countryOfOrigin: product.countryOfOrigin,
    usedFallbackLabor,
    weightGrams,
    weightKnown,
    confidenceTier,
    subcategory: effectiveSubcategory,
  });

  // ── 8. Persist ───────────────────────────────────────────────────────────

  const now = new Date();
  await prisma.costBreakdown.deleteMany({ where: { productId } });
  const breakdown = await prisma.costBreakdown.create({
    data: {
      productId,
      materialCostCents,
      laborCostCents,
      overheadCostCents,
      shippingCostCents,
      totalCostCents,
      retailPriceCents: effectiveRetailPriceCents ?? null,
      markupPercent: markupPercent ?? null,
      confidenceScore: score,
      confidenceReason: reason,
      confidence: confidenceTier,
      methodology,
      calculatedAt: now,
    },
  });

  console.log(
    `[CostEstimationService] productId=${productId} total=${totalCostCents}¢ confidence=${confidenceTier} score=${score.toFixed(2)}`
  );

  return toResult(breakdown);
}

/**
 * Return the IDs of products whose latest CostBreakdown.updatedAt is older
 * than staleDays days. Used by the cron/re-estimate route to build its queue.
 */
export async function getStaleBreakdownProductIds(staleDays: number): Promise<string[]> {
  const staleDate = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
  const staleBreakdowns = await prisma.costBreakdown.findMany({
    where: { updatedAt: { lt: staleDate } },
    distinct: ["productId"],
    select: { productId: true },
    orderBy: { updatedAt: "desc" },
  });
  return staleBreakdowns.map((b) => b.productId);
}

/**
 * Force re-estimation for a product: delete its cached breakdown and recompute.
 * Returns null if the product does not exist.
 */
export async function forceReEstimate(productId: string): Promise<CostBreakdownResult | null> {
  await prisma.costBreakdown.deleteMany({ where: { productId } });
  return estimateCost(productId);
}

/**
 * Return the most recent cached breakdown without recomputing.
 * Returns null if no estimate has been computed yet.
 */
export async function getCachedBreakdown(
  productId: string
): Promise<CostBreakdownResult | null> {
  const breakdown = await prisma.costBreakdown.findFirst({
    where: { productId },
    orderBy: { calculatedAt: "desc" },
  });
  return breakdown ? toResult(breakdown) : null;
}

// ─── Internal: material cost ──────────────────────────────────────────────────

interface MaterialCostResult {
  materialCostCents: number;
  pricedCount: number;
  totalCount: number;
  stalePriceCount: number;
  unpricedNames: string[];
  usedCategoryAvg: boolean;
}

type ProductMaterialWithPrice = {
  weightGrams: number | null;
  percentage: number | null;
  material: {
    name: string;
    commodityPrices: Array<{ pricePerKgCents: number; fetchedAt: Date }>;
  };
};

function computeMaterialCost(
  materials: ProductMaterialWithPrice[],
  productWeightGrams: number,
  categorySlug: string
): MaterialCostResult {
  if (materials.length === 0) {
    return {
      materialCostCents:
        CATEGORY_AVG_MATERIAL_COST_CENTS[categorySlug] ??
        DEFAULT_AVG_MATERIAL_COST_CENTS,
      pricedCount: 0,
      totalCount: 0,
      stalePriceCount: 0,
      unpricedNames: [],
      usedCategoryAvg: true,
    };
  }

  const productWeightKg = productWeightGrams / 1000;
  let materialCostCents = 0;
  let pricedCount = 0;
  let stalePriceCount = 0;
  const unpricedNames: string[] = [];
  const totalCount = materials.length;

  for (const pm of materials) {
    const latestPrice = pm.material.commodityPrices[0];

    if (!latestPrice) {
      unpricedNames.push(pm.material.name);
      continue;
    }

    const ageMs = Date.now() - latestPrice.fetchedAt.getTime();
    if (ageMs > STALENESS_THRESHOLD_MS) stalePriceCount++;

    // Derive weight for this material
    let matWeightKg: number;
    if (pm.weightGrams != null) {
      matWeightKg = pm.weightGrams / 1000;
    } else if (pm.percentage != null) {
      matWeightKg = pm.percentage * productWeightKg;
    } else {
      // No weight info — evenly split product weight across materials
      matWeightKg = productWeightKg / totalCount;
    }

    materialCostCents += Math.round(matWeightKg * latestPrice.pricePerKgCents);
    pricedCount++;
  }

  return {
    materialCostCents,
    pricedCount,
    totalCount,
    stalePriceCount,
    unpricedNames,
    usedCategoryAvg: false,
  };
}

// ─── Internal: profile-based material cost ────────────────────────────────────

/**
 * Compute material cost from a subcategory profile or override material mix.
 * Looks up DB commodity prices for each named material; falls back to
 * category average when no prices are found.
 */
async function computeProfileMaterialCost(
  mix: Array<{ materialName: string; percentage: number }>,
  productWeightGrams: number,
  categorySlug: string
): Promise<MaterialCostResult> {
  const names = mix.map((m) => m.materialName.toLowerCase());

  // Fetch materials and their latest commodity prices in one query
  const dbMaterials = await prisma.material.findMany({
    where: { name: { in: names, mode: "insensitive" } },
    include: {
      commodityPrices: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
    },
  });

  const materialByName = new Map(dbMaterials.map((m) => [m.name.toLowerCase(), m]));

  const productWeightKg = productWeightGrams / 1000;
  let materialCostCents = 0;
  let pricedCount = 0;
  let stalePriceCount = 0;
  const unpricedNames: string[] = [];
  const totalCount = mix.length;

  for (const entry of mix) {
    const dbMat = materialByName.get(entry.materialName.toLowerCase());
    const latestPrice = dbMat?.commodityPrices[0];

    if (!latestPrice) {
      unpricedNames.push(entry.materialName);
      continue;
    }

    const ageMs = Date.now() - latestPrice.fetchedAt.getTime();
    if (ageMs > STALENESS_THRESHOLD_MS) stalePriceCount++;

    const matWeightKg = entry.percentage * productWeightKg;
    materialCostCents += Math.round(matWeightKg * latestPrice.pricePerKgCents);
    pricedCount++;
  }

  // If we couldn't price anything, fall back to category average
  if (pricedCount === 0) {
    return {
      materialCostCents:
        CATEGORY_AVG_MATERIAL_COST_CENTS[categorySlug] ?? DEFAULT_AVG_MATERIAL_COST_CENTS,
      pricedCount: 0,
      totalCount,
      stalePriceCount,
      unpricedNames,
      usedCategoryAvg: true,
    };
  }

  return {
    materialCostCents,
    pricedCount,
    totalCount,
    stalePriceCount,
    unpricedNames,
    usedCategoryAvg: false,
  };
}

// ─── Internal: labor cost ─────────────────────────────────────────────────────

interface LaborCostResult {
  laborCostCents: number;
  usedFallbackLabor: boolean;
}

async function computeLaborCost(
  countryOfOrigin: string | null,
  categorySlug: string,
  laborHoursOverride: number | null = null
): Promise<LaborCostResult> {
  const mfgHours =
    laborHoursOverride ?? MANUFACTURING_HOURS[categorySlug] ?? DEFAULT_MANUFACTURING_HOURS;

  if (!countryOfOrigin) {
    return {
      laborCostCents: Math.round(mfgHours * FALLBACK_LABOR_RATE_CENTS),
      usedFallbackLabor: true,
    };
  }

  const laborRate = await prisma.laborRate.findUnique({
    where: { countryCode: countryOfOrigin },
  });

  if (!laborRate) {
    return {
      laborCostCents: Math.round(mfgHours * FALLBACK_LABOR_RATE_CENTS),
      usedFallbackLabor: true,
    };
  }

  return {
    laborCostCents: Math.round(mfgHours * laborRate.hourlyRateCents),
    usedFallbackLabor: false,
  };
}

// ─── Internal: shipping ───────────────────────────────────────────────────────

function computeShippingCents(
  weightGrams: number,
  countryOfOrigin: string | null
): number {
  const tier = SHIPPING_TIERS.find((t) => weightGrams <= t.maxGrams)!;
  const isIntercontinental =
    countryOfOrigin !== null && countryOfOrigin !== "US";
  return isIntercontinental
    ? Math.round(tier.baseCents * INTERCONTINENTAL_MULTIPLIER)
    : tier.baseCents;
}

// ─── Internal: confidence scoring ─────────────────────────────────────────────

interface ConfidenceInput {
  totalCount: number;
  pricedCount: number;
  unpricedNames: string[];
  stalePriceCount: number;
  weightKnown: boolean;
  usedCategoryAvg: boolean;
  usedFallbackLabor: boolean;
}

function computeConfidence(input: ConfidenceInput): {
  score: number;
  reason: string;
} {
  const {
    totalCount,
    pricedCount,
    unpricedNames,
    stalePriceCount,
    weightKnown,
    usedCategoryAvg,
    usedFallbackLabor,
  } = input;

  const reasons: string[] = [];
  let score: number;

  if (usedCategoryAvg) {
    score = 0.2;
    reasons.push("no material data; used category-average material cost");
  } else {
    const coverage = pricedCount / Math.max(totalCount, 1);
    // 0.5 base + up to 0.4 for full coverage = max 0.9 before deductions
    score = 0.5 + coverage * 0.4;

    if (pricedCount === totalCount) {
      reasons.push(
        `all ${totalCount} material${totalCount !== 1 ? "s" : ""} have commodity prices`
      );
    } else {
      reasons.push(
        `${pricedCount} of ${totalCount} material${totalCount !== 1 ? "s" : ""} have commodity prices`
      );
      if (unpricedNames.length > 0) {
        const listed = unpricedNames.slice(0, 3).join(", ");
        reasons.push(
          `unpriced: ${listed}${unpricedNames.length > 3 ? "…" : ""}`
        );
      }
    }
  }

  if (stalePriceCount > 0) {
    score -= 0.1;
    reasons.push(
      `${stalePriceCount} price${stalePriceCount !== 1 ? "s are" : " is"} stale (>48h)`
    );
  }

  if (!weightKnown) {
    score -= 0.05;
    reasons.push("weight estimated from default (250g)");
  }

  if (usedFallbackLabor) {
    score -= 0.05;
    reasons.push("labor rate: global average (country unknown)");
  }

  score = Math.max(0, Math.min(1, score));

  return { score: Math.round(score * 100) / 100, reason: reasons.join("; ") };
}

// ─── Internal: methodology string ─────────────────────────────────────────────

interface MethodologyInput {
  totalCount: number;
  pricedCount: number;
  usedCategoryAvg: boolean;
  categoryName: string;
  countryOfOrigin: string | null;
  usedFallbackLabor: boolean;
  weightGrams: number;
  weightKnown: boolean;
  confidenceTier: ConfidenceTier;
  subcategory: string | null;
}

function buildMethodology(input: MethodologyInput): string {
  const {
    totalCount,
    pricedCount,
    usedCategoryAvg,
    categoryName,
    countryOfOrigin,
    usedFallbackLabor,
    weightGrams,
    weightKnown,
    confidenceTier,
    subcategory,
  } = input;

  const parts: string[] = [];

  if (confidenceTier === "HIGH") {
    parts.push(
      `Material cost: commodity prices × product-specific material weights (${pricedCount}/${totalCount} materials priced). [HIGH confidence]`
    );
  } else if (confidenceTier === "MEDIUM") {
    parts.push(
      `Material cost: commodity prices × subcategory profile defaults (${subcategory ?? "unknown subcategory"}, ${pricedCount}/${totalCount} materials priced). [MEDIUM confidence]`
    );
  } else if (usedCategoryAvg) {
    parts.push(
      `Material cost: category-average for "${categoryName}" (no materials linked). [LOW confidence]`
    );
  } else {
    parts.push(
      `Material cost: commodity prices × material weights (${pricedCount}/${totalCount} materials priced).`
    );
  }

  const laborSrc = usedFallbackLabor
    ? "global-average labor rate ($3.00/hr)"
    : `${countryOfOrigin} manufacturing labor rate`;
  parts.push(`Labor: category manufacturing-hours estimate × ${laborSrc}.`);
  parts.push(`Overhead: material cost × category overhead %.`);

  const weightNote = weightKnown
    ? `${weightGrams}g actual weight`
    : `${weightGrams}g default weight`;
  const intercontinental =
    countryOfOrigin && countryOfOrigin !== "US" ? ", intercontinental ×1.5" : "";
  parts.push(`Shipping: flat-rate tier (${weightNote}${intercontinental}).`);

  return parts.join(" ");
}

// ─── Internal: shape DB record to public result ───────────────────────────────

function toResult(record: {
  id: string;
  productId: string;
  materialCostCents: number;
  laborCostCents: number;
  overheadCostCents: number;
  shippingCostCents: number;
  totalCostCents: number;
  retailPriceCents: number | null;
  markupPercent: number | null;
  confidenceScore: number;
  confidenceReason: string;
  confidence: string;
  methodology: string;
  calculatedAt: Date;
}): CostBreakdownResult {
  return {
    id: record.id,
    productId: record.productId,
    materialCostCents: record.materialCostCents,
    laborCostCents: record.laborCostCents,
    overheadCostCents: record.overheadCostCents,
    shippingCostCents: record.shippingCostCents,
    totalCostCents: record.totalCostCents,
    retailPriceCents: record.retailPriceCents,
    markupPercent: record.markupPercent,
    confidenceScore: record.confidenceScore,
    confidenceReason: record.confidenceReason,
    confidence: (record.confidence as ConfidenceTier) || "LOW",
    methodology: record.methodology,
    calculatedAt: record.calculatedAt,
  };
}
