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
  ingredients?: string | null;
  weightGrams?: number | null;
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
  const any = await prisma.productCategory.findFirst();
  if (any) return any.id;

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

  for (const entry of parsed) {
    // Find the matching Material row
    const material = await prisma.material.findFirst({
      where: { name: { equals: entry.name, mode: "insensitive" } },
    });
    if (!material) continue;

    // Upsert (avoid duplicates on re-cache)
    const existing = await prisma.productMaterial.findFirst({
      where: { productId, materialId: material.id },
    });

    if (!existing) {
      await prisma.productMaterial.create({
        data: {
          productId,
          materialId: material.id,
          percentage: entry.percentage ?? null,
          weightGrams:
            entry.percentage && entry.productWeightGrams
              ? entry.percentage * entry.productWeightGrams
              : null,
          source: "label",
        },
      });
    }
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
export async function searchProducts(query: string, limit = 20): Promise<ProductResult[]> {
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

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    description: p.description,
    imageUrl: p.imageUrl,
    category: p.category.name,
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
    ingredients: product.ingredients,
    weightGrams: product.weightGrams,
    countryOfOrigin: product.countryOfOrigin,
    upc: product.upc,
    ean: product.ean,
    source: product.source,
    cachedAt: product.createdAt,
  };
}
