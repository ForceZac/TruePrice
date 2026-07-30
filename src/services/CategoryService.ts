/**
 * CategoryService — category browsing queries.
 *
 * All category reads go through this service. No other module should query
 * ProductCategory directly for category-browsing purposes.
 */

import { prisma } from "@/lib/db";
import type { CategorySummary, CategoryDetail, CategoryProductItem } from "@/lib/types";

// Re-export so existing code that imports from this module continues to work.
export type { CategorySummary, CategoryDetail, CategoryProductItem };

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns all categories with product count and average markup %.
 */
export async function getAllCategories(): Promise<CategorySummary[]> {
  const categories = await prisma.productCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      products: {
        select: {
          id: true,
          costBreakdowns: {
            select: { markupPercent: true },
            orderBy: { calculatedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  return categories.map((cat) => {
    const productsWithEstimates = cat.products.filter(
      (p) => p.costBreakdowns.length > 0 && p.costBreakdowns[0].markupPercent !== null
    );
    const markups = productsWithEstimates.map(
      (p) => p.costBreakdowns[0].markupPercent as number
    );
    const avgMarkupPercent =
      markups.length > 0
        ? markups.reduce((sum, m) => sum + m, 0) / markups.length
        : null;

    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      productCount: cat.products.length,
      avgMarkupPercent,
    };
  });
}

/**
 * Returns category detail (includes top product) for a given slug.
 * Returns null if no category matches.
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryDetail | null> {
  const cat = await prisma.productCategory.findUnique({
    where: { slug },
    include: {
      products: {
        select: {
          id: true,
          costBreakdowns: {
            select: { markupPercent: true },
            orderBy: { calculatedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!cat) return null;

  const productsWithEstimates = cat.products.filter(
    (p) => p.costBreakdowns.length > 0 && p.costBreakdowns[0].markupPercent !== null
  );
  const markups = productsWithEstimates.map(
    (p) => p.costBreakdowns[0].markupPercent as number
  );
  const avgMarkupPercent =
    markups.length > 0
      ? markups.reduce((sum, m) => sum + m, 0) / markups.length
      : null;

  // Fetch top product by markup %
  const topByMarkup = await prisma.costBreakdown.findFirst({
    where: {
      product: { categoryId: cat.id },
      markupPercent: { not: null },
    },
    orderBy: { markupPercent: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          brand: true,
          imageUrl: true,
          retailPriceCents: true,
        },
      },
    },
  });

  const topProduct: CategoryProductItem | null = topByMarkup
    ? {
        id: topByMarkup.product.id,
        name: topByMarkup.product.name,
        brand: topByMarkup.product.brand,
        imageUrl: topByMarkup.product.imageUrl,
        retailPriceCents: topByMarkup.product.retailPriceCents,
        estimatedCostCents: topByMarkup.totalCostCents,
        markupPercent: topByMarkup.markupPercent,
      }
    : null;

  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    productCount: cat.products.length,
    avgMarkupPercent,
    topProduct,
  };
}

/**
 * Returns products in a category, sorted by markup % descending.
 * Products without a CostBreakdown are listed last (markupPercent: null).
 *
 * Fetches all products first, sorts in memory, then paginates — ensures
 * the sort is global across the full category, not within a single page.
 */
export async function getCategoryProducts(
  categorySlug: string,
  page = 1,
  perPage = 12
): Promise<{ products: CategoryProductItem[]; total: number }> {
  const cat = await prisma.productCategory.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  });

  if (!cat) return { products: [], total: 0 };

  // Fetch all products with their latest cost breakdown (no skip/take here —
  // must sort globally before paginating)
  const allProducts = await prisma.product.findMany({
    where: { categoryId: cat.id },
    select: {
      id: true,
      name: true,
      brand: true,
      imageUrl: true,
      retailPriceCents: true,
      costBreakdowns: {
        select: {
          totalCostCents: true,
          markupPercent: true,
        },
        orderBy: { calculatedAt: "desc" },
        take: 1,
      },
    },
  });

  // Sort: estimated products by markup desc, unestimated last
  const allItems: CategoryProductItem[] = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    imageUrl: p.imageUrl,
    retailPriceCents: p.retailPriceCents,
    estimatedCostCents:
      p.costBreakdowns.length > 0 ? p.costBreakdowns[0].totalCostCents : null,
    markupPercent:
      p.costBreakdowns.length > 0 ? p.costBreakdowns[0].markupPercent : null,
  }));

  allItems.sort((a, b) => {
    if (a.markupPercent === null && b.markupPercent === null) return 0;
    if (a.markupPercent === null) return 1;
    if (b.markupPercent === null) return -1;
    return b.markupPercent - a.markupPercent;
  });

  const total = allItems.length;
  const products = allItems.slice((page - 1) * perPage, page * perPage);

  return { products, total };
}

/**
 * Returns all category slugs — used by generateStaticParams and sitemap.
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  const categories = await prisma.productCategory.findMany({
    select: { slug: true },
    orderBy: { name: "asc" },
  });
  return categories.map((c) => c.slug);
}
