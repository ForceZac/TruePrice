/**
 * DiscoveryService — trending products and "most shocking" markups.
 *
 * This is the ONLY module that queries for view-count-based trending data
 * and high-markup discovery lists. No routes or components should query
 * these directly.
 */

import { prisma } from "@/lib/db";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TrendingProduct {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  markupPercent: number | null;
  viewCount: number;
  confidence: string | null;
}

export interface ShockingProduct {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  markupPercent: number;
  totalCostCents: number;
  retailPriceCents: number | null;
  confidence: string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return the top `limit` products by viewCount, ordered descending.
 * Products with zero views are excluded.
 */
export async function getTrending(
  limit = 20,
  // windowDays retained for future time-window filtering; currently orders by
  // total viewCount since the DB does not store per-day counts yet.
  _windowDays = 7
): Promise<TrendingProduct[]> {
  const products = await prisma.product.findMany({
    where: { viewCount: { gt: 0 } },
    orderBy: { viewCount: "desc" },
    take: limit,
    include: {
      category: { select: { name: true, slug: true } },
      costBreakdowns: {
        select: { markupPercent: true, confidence: true },
        orderBy: { calculatedAt: "desc" },
        take: 1,
      },
    },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category.name,
    categorySlug: p.category.slug,
    markupPercent: p.costBreakdowns[0]?.markupPercent ?? null,
    viewCount: p.viewCount,
    confidence: p.costBreakdowns[0]?.confidence ?? null,
  }));
}

/**
 * Return the `limit` products with the highest markup multiplier
 * that have HIGH confidence cost breakdowns.
 */
export async function getMostShocking(limit = 3): Promise<ShockingProduct[]> {
  const breakdowns = await prisma.costBreakdown.findMany({
    where: {
      confidence: "HIGH",
      markupPercent: { not: null },
    },
    orderBy: { markupPercent: "desc" },
    distinct: ["productId"],
    take: limit,
    include: {
      product: {
        include: { category: { select: { name: true, slug: true } } },
      },
    },
  });

  return breakdowns.map((b) => ({
    id: b.product.id,
    name: b.product.name,
    category: b.product.category.name,
    categorySlug: b.product.category.slug,
    markupPercent: b.markupPercent as number,
    totalCostCents: b.totalCostCents,
    retailPriceCents: b.retailPriceCents,
    confidence: b.confidence,
  }));
}

/**
 * Return a Set of product IDs that are currently trending (top-N by viewCount).
 * Used to annotate product cards with a "Trending" badge without a per-product
 * lookup.
 */
export async function getTrendingIds(
  limit = 20,
  _windowDays = 7
): Promise<Set<string>> {
  const products = await prisma.product.findMany({
    where: { viewCount: { gt: 0 } },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: { id: true },
  });

  return new Set(products.map((p) => p.id));
}
