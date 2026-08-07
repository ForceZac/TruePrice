/**
 * UserService — watchlist CRUD, recently-viewed, weekly digest, account deletion.
 *
 * All user-facing data operations live here. Route handlers call into
 * these functions; they never touch Prisma directly.
 */

import { SignJWT, jwtVerify } from "jose";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serverEnv } from "@/lib/env.server";
import { sendDigestEmail } from "@/services/NotificationService";

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

  try {
    await prisma.savedProduct.create({ data: { userId, productId } });
  } catch (e) {
    // P2002 = unique constraint violation — two concurrent requests raced; treat as already saved
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { alreadySaved: true, nearCap: false };
    }
    throw e;
  }
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

// ─── Digest Preferences ───────────────────────────────────────────────────────

/** Returns the user's digest preference. */
export async function getDigestPreferences(
  userId: string
): Promise<{ digestEnabled: boolean } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { digestEnabled: true },
  });
  return user ? { digestEnabled: user.digestEnabled } : null;
}

/** Updates the user's digestEnabled preference. */
export async function updateDigestPreferences(
  userId: string,
  digestEnabled: boolean
): Promise<{ digestEnabled: boolean }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { digestEnabled },
    select: { digestEnabled: true },
  });
  return { digestEnabled: user.digestEnabled };
}

// ─── Unsubscribe Tokens ────────────────────────────────────────────────────────

function getUnsubscribeSecret(): Uint8Array {
  const secret = serverEnv.DIGEST_UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("DIGEST_UNSUBSCRIBE_SECRET is not configured");
  return Buffer.from(secret, "utf8");
}

/** Signs a 30-day JWT for one-click digest unsubscribe. */
export async function signUnsubscribeToken(userId: string): Promise<string> {
  return new SignJWT({ userId, action: "unsubscribe-digest" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getUnsubscribeSecret());
}

/**
 * Verifies a digest unsubscribe token.
 * Returns `{ userId }` on success, `null` if invalid or expired.
 */
export async function verifyUnsubscribeToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getUnsubscribeSecret());
    if (
      payload.action !== "unsubscribe-digest" ||
      typeof payload.userId !== "string"
    ) {
      return null;
    }
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

// ─── Full Digest Candidates ───────────────────────────────────────────────────

export interface FullDigestProduct {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  retailPriceCents: number | null;
  markupPercent: number | null;
  confidence: string;
}

export interface FullDigestCandidate {
  userId: string;
  email: string;
  name: string | null;
  products: FullDigestProduct[];
}

export interface DigestHighlight {
  id: string;
  name: string;
  brand: string | null;
  markupPercent: number;
}

export interface DigestSendResult {
  sent: number;
  skipped: number;
  errors: number;
}

/**
 * Returns opted-in users (digestEnabled=true) with ≥1 saved product,
 * including up to 5 watchlisted products per user.
 * Cursor-paginated; pageSize=500 by default.
 */
export async function getFullDigestCandidates(
  pageSize = 500,
  cursor?: string
): Promise<FullDigestCandidate[]> {
  const users = await prisma.user.findMany({
    where: {
      digestEnabled: true,
      email: { not: null },
      savedProducts: { some: {} },
    },
    take: pageSize,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { id: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      savedProducts: {
        take: 5,
        orderBy: { savedAt: "desc" },
        select: {
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              imageUrl: true,
              retailPriceCents: true,
              costBreakdowns: {
                orderBy: { calculatedAt: "desc" },
                take: 1,
                select: { markupPercent: true, confidence: true },
              },
            },
          },
        },
      },
    },
  });

  return users
    .filter((u): u is typeof u & { email: string } => u.email !== null)
    .map((u) => ({
      userId: u.id,
      email: u.email,
      name: u.name,
      products: u.savedProducts.map((sp) => ({
        id: sp.product.id,
        name: sp.product.name,
        brand: sp.product.brand,
        imageUrl: sp.product.imageUrl,
        retailPriceCents: sp.product.retailPriceCents,
        markupPercent: sp.product.costBreakdowns[0]?.markupPercent ?? null,
        confidence: sp.product.costBreakdowns[0]?.confidence ?? "LOW",
      })),
    }));
}

/** Returns the top N most-shocking products (HIGH confidence, highest markupPercent). */
async function getMostShockingHighlights(limit = 3): Promise<DigestHighlight[]> {
  const breakdowns = await prisma.costBreakdown.findMany({
    where: { confidence: "HIGH", markupPercent: { not: null } },
    orderBy: { markupPercent: "desc" },
    take: limit * 3, // fetch extra to deduplicate by product
    distinct: ["productId"],
    select: {
      markupPercent: true,
      product: { select: { id: true, name: true, brand: true } },
    },
  });

  return breakdowns
    .filter((b): b is typeof b & { markupPercent: number } => b.markupPercent !== null)
    .slice(0, limit)
    .map((b) => ({
      id: b.product.id,
      name: b.product.name,
      brand: b.product.brand,
      markupPercent: b.markupPercent,
    }));
}

/**
 * Orchestrates the weekly digest send.
 * Skips users with digestEnabled=false or empty watchlist.
 * Resend failure for one user does not stop others.
 * Returns `{ sent, skipped, errors }`.
 */
export async function sendWeeklyDigests(): Promise<DigestSendResult> {
  const result: DigestSendResult = { sent: 0, skipped: 0, errors: 0 };

  if (!serverEnv.RESEND_API_KEY) {
    console.warn(
      "[sendWeeklyDigests] RESEND_API_KEY not set — skipping email send"
    );
    return result;
  }

  if (!serverEnv.DIGEST_UNSUBSCRIBE_SECRET) {
    console.warn(
      "[sendWeeklyDigests] DIGEST_UNSUBSCRIBE_SECRET not set — skipping email send"
    );
    return result;
  }

  const highlights = await getMostShockingHighlights(3);

  // Cursor-paginated to handle large user counts
  let cursor: string | undefined;
  do {
    const page = await getFullDigestCandidates(500, cursor);
    if (page.length === 0) break;

    await Promise.all(
      page.map(async (candidate) => {
        try {
          const unsubscribeToken = await signUnsubscribeToken(candidate.userId);
          const html = buildDigestHtml(candidate, highlights, unsubscribeToken);
          const text = buildDigestText(candidate, highlights);

          await sendDigestEmail({
            from: serverEnv.FROM_EMAIL,
            to: candidate.email,
            subject: "Your TruePrice weekly digest",
            html,
            text,
          });
          result.sent++;
        } catch (err) {
          console.error(
            `[sendWeeklyDigests] Failed for user ${candidate.userId}:`,
            err
          );
          result.errors++;
        }
      })
    );

    cursor = page[page.length - 1]?.userId;
    // If page is smaller than pageSize, we've hit the last page
    if (page.length < 500) break;
  } while (cursor);

  return result;
}

// ─── Email Templates ───────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDigestHtml(
  candidate: FullDigestCandidate,
  highlights: DigestHighlight[],
  unsubscribeToken: string
): string {
  const productRows = candidate.products
    .map(
      (p) => `
      <tr>
        <td style="padding:8px 12px">${escapeHtml(p.name)}</td>
        <td style="padding:8px 12px">${p.brand ? escapeHtml(p.brand) : "—"}</td>
        <td style="padding:8px 12px">${p.markupPercent !== null ? `${p.markupPercent.toFixed(1)}%` : "—"}</td>
        <td style="padding:8px 12px">${escapeHtml(p.confidence)}</td>
      </tr>`
    )
    .join("");

  const highlightRows = highlights
    .map(
      (h) => `
      <tr>
        <td style="padding:8px 12px">${escapeHtml(h.name)}</td>
        <td style="padding:8px 12px">${h.brand ? escapeHtml(h.brand) : "—"}</td>
        <td style="padding:8px 12px">${h.markupPercent.toFixed(1)}%</td>
      </tr>`
    )
    .join("");

  const unsubscribeUrl = `https://trueprice.app/api/account/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

  return `<!DOCTYPE html>
<html lang="en">
<body style="font-family:sans-serif;color:#111;max-width:600px;margin:auto;padding:20px">
  <h2 style="color:#1a1a1a">Your TruePrice Weekly Digest</h2>
  <p>Hi${candidate.name ? ` ${escapeHtml(candidate.name)}` : ""},</p>
  <p>Here's a look at your watchlist and this week's most surprising markups.</p>

  <h3 style="margin-top:24px">Your Watchlist</h3>
  <table style="width:100%;border-collapse:collapse;border:1px solid #ddd">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px 12px;text-align:left">Product</th>
        <th style="padding:8px 12px;text-align:left">Brand</th>
        <th style="padding:8px 12px;text-align:left">Markup</th>
        <th style="padding:8px 12px;text-align:left">Confidence</th>
      </tr>
    </thead>
    <tbody>${productRows}</tbody>
  </table>

  ${
    highlights.length > 0
      ? `<h3 style="margin-top:24px">This Week's Most Shocking Markups</h3>
  <table style="width:100%;border-collapse:collapse;border:1px solid #ddd">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px 12px;text-align:left">Product</th>
        <th style="padding:8px 12px;text-align:left">Brand</th>
        <th style="padding:8px 12px;text-align:left">Markup</th>
      </tr>
    </thead>
    <tbody>${highlightRows}</tbody>
  </table>`
      : ""
  }

  <p style="margin-top:24px">
    <a href="https://trueprice.app/dashboard" style="color:#2563eb">View your dashboard →</a>
  </p>

  <hr style="margin-top:32px;border:none;border-top:1px solid #eee"/>
  <p style="font-size:12px;color:#888">
    You're receiving this because you opted in to weekly digests on TruePrice.
    <a href="${escapeHtml(unsubscribeUrl)}" style="color:#888">Unsubscribe</a>
  </p>
</body>
</html>`;
}

function buildDigestText(
  candidate: FullDigestCandidate,
  highlights: DigestHighlight[]
): string {
  const productLines = candidate.products
    .map(
      (p) =>
        `- ${p.name}${p.brand ? ` (${p.brand})` : ""}: ${p.markupPercent !== null ? `${p.markupPercent.toFixed(1)}% markup` : "no estimate"}`
    )
    .join("\n");

  const highlightLines = highlights
    .map((h) => `- ${h.name}${h.brand ? ` (${h.brand})` : ""}: ${h.markupPercent.toFixed(1)}% markup`)
    .join("\n");

  return [
    `Your TruePrice Weekly Digest`,
    ``,
    `Hi${candidate.name ? ` ${candidate.name}` : ""},`,
    ``,
    `Your Watchlist:`,
    productLines,
    ``,
    highlights.length > 0 ? `This Week's Most Shocking Markups:\n${highlightLines}` : "",
    ``,
    `View your dashboard: https://trueprice.app/dashboard`,
    ``,
    `To unsubscribe, visit your account settings: https://trueprice.app/dashboard/settings`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

// ─── Account Deletion ─────────────────────────────────────────────────────────

/**
 * Permanently deletes a user and all their associated data.
 * Uses a transaction for atomicity.
 *
 * VerificationToken uses `identifier` (email), not userId, so we fetch the
 * email first and clean up orphaned magic-link tokens explicitly.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  await prisma.$transaction([
    prisma.recentlyViewed.deleteMany({ where: { userId } }),
    prisma.savedProduct.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    // Clean up magic-link tokens — identifier is the email, not userId
    ...(user?.email
      ? [prisma.verificationToken.deleteMany({ where: { identifier: user.email } })]
      : []),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}

// ─── Recent Searches ─────────────────────────────────────────────────────────

/** Maximum number of recent searches stored server-side per user. */
const MAX_RECENT_SEARCHES = 10;

/**
 * Prepend `query` to the user's recent searches list.
 * Deduplicates (removes prior occurrence of the same query) and trims to
 * MAX_RECENT_SEARCHES entries.
 */
export async function saveRecentSearch(userId: string, query: string): Promise<void> {
  const q = query.trim();
  if (!q) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { recentSearches: true },
  });
  if (!user) return;

  const updated = [q, ...user.recentSearches.filter((s) => s !== q)].slice(
    0,
    MAX_RECENT_SEARCHES
  );

  await prisma.user.update({
    where: { id: userId },
    data: { recentSearches: updated },
  });
}

/**
 * Return the user's recent searches, most recent first.
 */
export async function getRecentSearches(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { recentSearches: true },
  });
  return user?.recentSearches ?? [];
}
