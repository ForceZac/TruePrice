/**
 * UserService — watchlist CRUD, recently-viewed, weekly digest, account deletion.
 *
 * All user-facing data operations live here. Route handlers call into
 * these functions; they never touch Prisma directly.
 */

import { prisma } from "@/lib/db";

// ─── Constants ────────────────────────────────────────────────────────────────

export const WATCHLIST_CAP = 50;
export const WATCHLIST_WARN_AT = 45;
export const RECENTLY_VIEWED_CAP = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchlistEntry {
  productId: string;
  savedAt: Date;
  product: {
    id: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
    retailPriceCents: number | null;
    category: { name: string; slug: string };
    costBreakdowns: Array<{
      markupPercent: number | null;
      confidence: string;
      calculatedAt: Date;
    }>;
  };
}

export interface RecentlyViewedEntry {
  productId: string;
  viewedAt: Date;
  product: {
    id: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
    category: { name: string; slug: string };
    costBreakdowns: Array<{
      markupPercent: number | null;
      confidence: string;
    }>;
  };
}

export interface DigestCandidate {
  userId: string;
  email: string | null;
  name: string | null;
  products: Array<{
    productId: string;
    productName: string;
    oldMarkupPercent: number;
    newMarkupPercent: number;
    changePercent: number;
  }>;
}

// ─── Shared include shape ─────────────────────────────────────────────────────

const productInclude = {
  category: { select: { name: true, slug: true } },
  costBreakdowns: {
    orderBy: { calculatedAt: "desc" as const },
    take: 1,
    select: { markupPercent: true, confidence: true, calculatedAt: true },
  },
} as const;

// ─── Watchlist ────────────────────────────────────────────────────────────────

/** Returns all saved products for a user, most-recently saved first. */
export async function getWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const rows = await prisma.savedProduct.findMany({
    where: { userId },
    orderBy: { savedAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          brand: true,
          imageUrl: true,
          retailPriceCents: true,
          ...productInclude,
        },
      },
    },
  });
  return rows as WatchlistEntry[];
}

/** Returns true if the product is in the user's watchlist. */
export async function isInWatchlist(
  userId: string,
  productId: string
): Promise<boolean> {
  const row = await prisma.savedProduct.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { userId: true },
  });
  return row !== null;
}

/**
 * Adds a product to the user's watchlist.
 * Throws `WatchlistCapError` if at WATCHLIST_CAP.
 * Returns `{ alreadySaved: true }` if already saved.
 */
export async function addToWatchlist(
  userId: string,
  productId: string
): Promise<{ alreadySaved: boolean; nearCap: boolean }> {
  const existing = await prisma.savedProduct.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { userId: true },
  });
  if (existing) return { alreadySaved: true, nearCap: false };

  const count = await prisma.savedProduct.count({ where: { userId } });
  if (count >= WATCHLIST_CAP) {
    throw new WatchlistCapError(
      `Watchlist is full (${WATCHLIST_CAP} products maximum).`
    );
  }

  await prisma.savedProduct.create({ data: { userId, productId } });
  return { alreadySaved: false, nearCap: count + 1 >= WATCHLIST_WARN_AT };
}

/** Removes a product from the user's watchlist. Returns false if not found. */
export async function removeFromWatchlist(
  userId: string,
  productId: string
): Promise<boolean> {
  const existing = await prisma.savedProduct.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { userId: true },
  });
  if (!existing) return false;
  await prisma.savedProduct.delete({
    where: { userId_productId: { userId, productId } },
  });
  return true;
}

export class WatchlistCapError extends Error {
  readonly code = "WATCHLIST_CAP";
  constructor(message: string) {
    super(message);
    this.name = "WatchlistCapError";
  }
}

// ─── Recently Viewed ──────────────────────────────────────────────────────────

/** Returns recently viewed products for a user, most-recent first. */
export async function getRecentlyViewed(
  userId: string,
  limit = RECENTLY_VIEWED_CAP
): Promise<RecentlyViewedEntry[]> {
  const rows = await prisma.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: limit,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          brand: true,
          imageUrl: true,
          ...productInclude,
        },
      },
    },
  });
  return rows as RecentlyViewedEntry[];
}

/**
 * Records a product view for an authenticated user (upsert — one row per product).
 * Updates viewedAt on subsequent views.
 */
export async function recordProductView(
  userId: string,
  productId: string
): Promise<void> {
  await prisma.recentlyViewed.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: { viewedAt: new Date() },
  });
}

/**
 * Merges localStorage product IDs into the user's recently-viewed DB rows.
 * Deduplicates by productId (DB viewedAt wins if already present),
 * then caps the total at RECENTLY_VIEWED_CAP by deleting the oldest.
 */
export async function mergeLocalRecentlyViewed(
  userId: string,
  localProductIds: string[]
): Promise<void> {
  if (localProductIds.length === 0) return;

  // Validate that productIds exist before upserting
  const validProducts = await prisma.product.findMany({
    where: { id: { in: localProductIds } },
    select: { id: true },
  });
  const validIds = new Set(validProducts.map((p) => p.id));

  // Upsert only valid IDs — skip if already in DB (keep existing viewedAt)
  for (const productId of localProductIds) {
    if (!validIds.has(productId)) continue;
    await prisma.recentlyViewed.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {}, // don't overwrite existing viewedAt — DB record is more recent
    });
  }

  // Enforce cap: delete oldest beyond RECENTLY_VIEWED_CAP
  const all = await prisma.recentlyViewed.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    select: { productId: true },
  });

  if (all.length > RECENTLY_VIEWED_CAP) {
    const toDelete = all.slice(RECENTLY_VIEWED_CAP).map((r) => r.productId);
    await prisma.recentlyViewed.deleteMany({
      where: { userId, productId: { in: toDelete } },
    });
  }
}

// ─── Weekly Digest ────────────────────────────────────────────────────────────

/**
 * Returns users whose watchlisted products had a markup change of at least
 * `minChangePercent` percentage points within the last `since` date.
 *
 * A "change" is detected by comparing the most-recent CostBreakdown's
 * markupPercent against the oldest breakdown calculated after `since`.
 * Only products with two or more breakdowns in the window qualify.
 */
export async function getDigestCandidates(
  since: Date,
  minChangePercent = 5
): Promise<DigestCandidate[]> {
  // Load users with their saved products and recent breakdowns
  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      savedProducts: { some: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      savedProducts: {
        select: {
          productId: true,
          product: {
            select: {
              id: true,
              name: true,
              costBreakdowns: {
                where: { calculatedAt: { gte: since } },
                orderBy: { calculatedAt: "asc" },
                select: { markupPercent: true, calculatedAt: true },
              },
            },
          },
        },
      },
    },
  });

  const candidates: DigestCandidate[] = [];

  for (const user of users) {
    const changedProducts: DigestCandidate["products"] = [];

    for (const { product } of user.savedProducts) {
      const breakdowns = product.costBreakdowns;
      if (breakdowns.length < 2) continue;

      const oldest = breakdowns[0].markupPercent;
      const newest = breakdowns[breakdowns.length - 1].markupPercent;
      if (oldest === null || newest === null) continue;

      const change = Math.abs(newest - oldest);
      if (change >= minChangePercent) {
        changedProducts.push({
          productId: product.id,
          productName: product.name,
          oldMarkupPercent: oldest,
          newMarkupPercent: newest,
          changePercent: newest - oldest,
        });
      }
    }

    if (changedProducts.length > 0) {
      candidates.push({
        userId: user.id,
        email: user.email,
        name: user.name,
        products: changedProducts,
      });
    }
  }

  return candidates;
}

// ─── Account Deletion ─────────────────────────────────────────────────────────

/**
 * Permanently deletes a user and all their associated data.
 * Uses a transaction for atomicity.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.recentlyViewed.deleteMany({ where: { userId } }),
    prisma.savedProduct.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}
