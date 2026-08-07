/**
 * ProductService — product lookup orchestration and PostgreSQL caching.
 *
 * Lookup flow:
 *   1. Check local cache (Product table) by UPC/EAN.
 *   2. If not cached, call BarcodeService to query external APIs.
 *   3. Parse extracted materials with material-parser.
 *   4. Cache the result and return.
 *
 * Text search queries the local Product table (full-text on name/brand).
 */

import { prisma } from "@/lib/db";
import { lookupByBarcode, type ExternalProductData } from "@/services/BarcodeService";
import { parseMaterials } from "@/lib/material-parser";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductResult {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  category: string;
  /** URL-safe slug of the product's category — used for breadcrumbs and links. */
  categorySlug?: string | null;
  ingredients?: string | null;
  weightGrams?: number | null;
  retailPriceCents?: number | null;
  countryOfOrigin?: string | null;
  upc?: string | null;
  ean?: string | null;
  source: string;
  cachedAt?: Date;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Fetch (or create) a ProductCategory by slug, falling back to "Other". */
async function resolveCategory(rawCategory?: string): Promise<string> {
  if (rawCategory) {
    // Normalize: take the first comma-separated category word, lowercase, slugify
    const slug = rawCategory
      .toLowerCase()
      .split(",")[0]
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const existing = await prisma.productCategory.findFirst({
      where: { slug: { contains: slug } },
    });
    if (existing) return existing.id;
  }

  // Default category
  const fallback = await prisma.productCategory.findFirst({
    where: { slug: "food-beverage" },
  });
  if (fallback) return fallback.id;

  // Last resort: any category
  const firstCategory = await prisma.productCategory.findFirst();
  if (firstCategory) return firstCategory.id;

  // Create a minimal default if none exist
  const created = await prisma.productCategory.create({
    data: {
      name: "Other",
      slug: "other",
      overheadPercent: 0.3,
    },
  });
  return created.id;
}

/** Persist an external product to the Product table and extract materials. */
async function cacheProduct(
  data: ExternalProductData,
  upc?: string,
  ean?: string
): Promise<ProductResult> {
  const categoryId = await resolveCategory(data.category);

  // Upsert by upc or ean if available, otherwise create fresh
  const upsertWhere = upc
    ? { upc }
    : ean
      ? { ean }
      : null;

  let product;

  if (upsertWhere) {
    product = await prisma.product.upsert({
      where: upsertWhere,
      create: {
        name: data.name,
        brand: data.brand,
        upc,
        ean,
        categoryId,
        description: data.description,
        imageUrl: data.imageUrl,
        weightGrams: data.weightGrams,
        countryOfOrigin: data.countryOfOrigin,
        ingredients: data.ingredients,
        source: data.source,
        sourceId: data.sourceId,
        lastLookedUp: new Date(),
      },
      update: {
        name: data.name,
        brand: data.brand,
        description: data.description,
        imageUrl: data.imageUrl,
        weightGrams: data.weightGrams,
        countryOfOrigin: data.countryOfOrigin,
        ingredients: data.ingredients,
        lastLookedUp: new Date(),
      },
    });
  } else {
    product = await prisma.product.create({
      data: {
        name: data.name,
        brand: data.brand,
        categoryId,
        description: data.description,
        imageUrl: data.imageUrl,
        weightGrams: data.weightGrams,
        countryOfOrigin: data.countryOfOrigin,
        ingredients: data.ingredients,
        source: data.source,
        sourceId: data.sourceId,
        lastLookedUp: new Date(),
      },
    });
  }

  // Extract and link materials if ingredient text is present
  if (data.ingredients) {
    await linkMaterials(product.id, data.ingredients, data.category);
  }

  const category = await prisma.productCategory.findUnique({
    where: { id: categoryId },
  });

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    imageUrl: product.imageUrl,
    category: category?.name ?? "Other",
    ingredients: product.ingredients,
    weightGrams: product.weightGrams,
    countryOfOrigin: product.countryOfOrigin,
    upc: product.upc,
    ean: product.ean,
    source: product.source,
    cachedAt: product.createdAt,
  };
}

/** Parse ingredient/composition text and create ProductMaterial links. */
async function linkMaterials(
  productId: string,
  ingredientText: string,
  category?: string
): Promise<void> {
  const parsed = parseMaterials(ingredientText, category);
  if (parsed.length === 0) return;

  // Batch lookup: one query instead of one per ingredient
  const names = parsed.map((e) => e.name.toLowerCase());
  const dbMaterials = await prisma.material.findMany({
    where: { name: { in: names, mode: "insensitive" } },
  });
  const materialByName = new Map(dbMaterials.map((m) => [m.name.toLowerCase(), m]));

  const toCreate = parsed
    .map((entry) => {
      const material = materialByName.get(entry.name.toLowerCase());
      if (!material) return null;
      return {
        productId,
        materialId: material.id,
        percentage: entry.percentage ?? null,
        weightGrams:
          entry.percentage && entry.productWeightGrams
            ? entry.percentage * entry.productWeightGrams
            : null,
        source: "label",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (toCreate.length > 0) {
    // skipDuplicates relies on @@unique([productId, materialId]) in schema
    await prisma.productMaterial.createMany({ data: toCreate, skipDuplicates: true });
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Look up a product by UPC/EAN barcode.
 * Returns cached result or fetches from external APIs and caches.
 */
export async function lookupProduct(barcode: string): Promise<ProductResult | null> {
  const clean = barcode.replace(/\s/g, "");

  // 1. Check cache
  const cached = await prisma.product.findFirst({
    where: {
      OR: [{ upc: clean }, { ean: clean }],
    },
    include: { category: true },
  });

  if (cached) {
    // Touch lastLookedUp
    await prisma.product.update({
      where: { id: cached.id },
      data: { lastLookedUp: new Date() },
    });

    return {
      id: cached.id,
      name: cached.name,
      brand: cached.brand,
      description: cached.description,
      imageUrl: cached.imageUrl,
      category: cached.category.name,
      ingredients: cached.ingredients,
      weightGrams: cached.weightGrams,
      countryOfOrigin: cached.countryOfOrigin,
      upc: cached.upc,
      ean: cached.ean,
      source: cached.source,
      cachedAt: cached.createdAt,
    };
  }

  // 2. External lookup
  const external = await lookupByBarcode(clean);
  if (!external) return null;

  // Classify barcode as UPC-A (12 digits) or EAN-13 (13 digits)
  const upc = clean.length === 12 ? clean : undefined;
  const ean = clean.length === 13 || clean.length === 8 ? clean : undefined;

  return cacheProduct(external, upc, ean);
}

/**
 * Text search over cached products (name + brand).
 */
export async function searchProducts(
  query: string,
  limit = 20,
  autocomplete = false
): Promise<ProductResult[]> {
  const q = query.trim();
  if (!q) return [];

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { category: true },
    take: limit,
    orderBy: { lastLookedUp: "desc" },
  });

  if (autocomplete) {
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      description: null,
      imageUrl: null,
      category: p.category.name,
      categorySlug: p.category.slug,
      ingredients: null,
      weightGrams: null,
      countryOfOrigin: null,
      upc: null,
      ean: null,
      source: p.source,
      cachedAt: p.createdAt,
    }));
  }

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    description: p.description,
    imageUrl: p.imageUrl,
    category: p.category.name,
    categorySlug: p.category.slug,
    ingredients: p.ingredients,
    weightGrams: p.weightGrams,
    countryOfOrigin: p.countryOfOrigin,
    upc: p.upc,
    ean: p.ean,
    source: p.source,
    cachedAt: p.createdAt,
  }));
}

/**
 * Increment the viewCount of a product by 1.
 * Silently no-ops if the product does not exist.
 */
export async function incrementViewCount(productId: string): Promise<void> {
  await prisma.product.updateMany({
    where: { id: productId },
    data: { viewCount: { increment: 1 } },
  });
}

// ─── Retail price refresh helpers ────────────────────────────────────────────

const RETAIL_STALE_DAYS = 30;

/**
 * Returns products that have a UPC but no retail price, or whose retail price
 * hasn't been refreshed in more than 30 days.
 *
 * Used by the cron/refresh-retail-prices route to build its refresh queue.
 */
export async function getStaleRetailProducts(): Promise<Array<{ id: string; upc: string }>> {
  const staleDate = new Date(Date.now() - RETAIL_STALE_DAYS * 24 * 60 * 60 * 1000);
  const products = await prisma.product.findMany({
    where: {
      upc: { not: null },
      OR: [
        { retailPriceCents: null },
        { lastLookedUp: { lt: staleDate } },
        { lastLookedUp: null },
      ],
    },
    select: { id: true, upc: true },
  });
  return products.filter((p): p is { id: string; upc: string } => p.upc !== null);
}

/**
 * Update the retail price for a product and touch lastLookedUp.
 * Pass null for priceCents to record that the lookup ran but returned no price,
 * which prevents the product from being re-queried on the next cron cycle.
 */
export async function updateRetailPrice(
  productId: string,
  priceCents: number | null
): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: {
      ...(priceCents !== null ? { retailPriceCents: priceCents } : {}),
      lastLookedUp: new Date(),
    },
  });
}

// ─── Coverage dashboard helpers ───────────────────────────────────────────────

export interface CoverageTierCounts {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  none: number;
}

export interface CoverageCategoryRow {
  name: string;
  slug: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  noEstimate: number;
}

export interface CoverageData {
  total: number;
  tiers: CoverageTierCounts;
  categories: CoverageCategoryRow[];
}

/**
 * Aggregate product coverage statistics for the admin dashboard.
 * Returns total product count, tier counts, and a per-category breakdown.
 */
export async function getCoverageData(): Promise<CoverageData> {
  const [products, breakdowns, categories] = await Promise.all([
    prisma.product.findMany({ select: { id: true, categoryId: true } }),
    prisma.costBreakdown.findMany({
      distinct: ["productId"],
      orderBy: { calculatedAt: "desc" },
      select: { productId: true, confidence: true },
    }),
    prisma.productCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const confidenceByProduct = new Map<string, string>(
    breakdowns.map((b) => [b.productId, b.confidence])
  );

  const tiers: CoverageTierCounts = { HIGH: 0, MEDIUM: 0, LOW: 0, none: 0 };
  for (const p of products) {
    const tier = confidenceByProduct.get(p.id);
    if (tier === "HIGH") tiers.HIGH++;
    else if (tier === "MEDIUM") tiers.MEDIUM++;
    else if (tier === "LOW") tiers.LOW++;
    else tiers.none++;
  }

  const productsByCategory = new Map<string, string[]>();
  for (const p of products) {
    const arr = productsByCategory.get(p.categoryId) ?? [];
    arr.push(p.id);
    productsByCategory.set(p.categoryId, arr);
  }

  const categoryRows: CoverageCategoryRow[] = categories.map((cat) => {
    const ids = productsByCategory.get(cat.id) ?? [];
    const row: CoverageCategoryRow = {
      name: cat.name,
      slug: cat.slug,
      total: ids.length,
      high: 0,
      medium: 0,
      low: 0,
      noEstimate: 0,
    };
    for (const id of ids) {
      const tier = confidenceByProduct.get(id);
      if (tier === "HIGH") row.high++;
      else if (tier === "MEDIUM") row.medium++;
      else if (tier === "LOW") row.low++;
      else row.noEstimate++;
    }
    return row;
  });

  return { total: products.length, tiers, categories: categoryRows };
}

// ─── OG image helpers ─────────────────────────────────────────────────────────

export interface ProductWithBreakdown {
  id: string;
  name: string;
  category: { name: string };
  costBreakdowns: Array<{
    totalCostCents: number;
    retailPriceCents: number | null;
    markupPercent: number | null;
  }>;
}

/**
 * Fetch a product with its latest cost breakdown — used by OG image routes.
 * Returns null if the product does not exist.
 */
export async function getProductWithBreakdown(id: string): Promise<ProductWithBreakdown | null> {
  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
      costBreakdowns: {
        orderBy: { calculatedAt: "desc" },
        take: 1,
        select: { totalCostCents: true, retailPriceCents: true, markupPercent: true },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return all product IDs — used by the sitemap route to enumerate product pages.
 * Lightweight: SELECT id only, no joins.
 */
export async function getAllProductIds(): Promise<string[]> {
  const rows = await prisma.product.findMany({ select: { id: true } });
  return rows.map((r) => r.id);
}

/**
 * Get a single cached product by internal ID.
 */
export async function getProductById(id: string): Promise<ProductResult | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    imageUrl: product.imageUrl,
    category: product.category.name,
    categorySlug: product.category.slug,
    ingredients: product.ingredients,
    weightGrams: product.weightGrams,
    retailPriceCents: product.retailPriceCents,
    countryOfOrigin: product.countryOfOrigin,
    upc: product.upc,
    ean: product.ean,
    source: product.source,
    cachedAt: product.createdAt,
  };
}
