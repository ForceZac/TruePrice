import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { serverEnv as env } from "@/lib/env.server";

const BATCH_SIZE = 20;
const STALE_DAYS = 30;

/**
 * GET /api/cron/refresh-retail-prices
 *
 * Vercel Cron endpoint — refreshes retail prices for products with no price
 * or a lastLookedUp timestamp older than 30 days.
 *
 * Calls UPCitemdb for each product's UPC in batches of 20 and updates
 * retailPriceCents + lastLookedUp where price data is returned.
 *
 * Scheduled: every Monday at 07:00 UTC (see vercel.json).
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = env.CRON_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const startedAt = new Date();
    const staleDate = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

    // Products with no retail price or not looked up in 30+ days, with a UPC
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

    console.log(`[cron/refresh-retail-prices] ${products.length} products to refresh`);

    let refreshed = 0;
    let updated = 0;

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (product) => {
          if (!product.upc) return;
          try {
            const priceCents = await fetchRetailPriceFromUPCItemDb(product.upc);
            refreshed++;

            if (priceCents !== null) {
              await prisma.product.update({
                where: { id: product.id },
                data: { retailPriceCents: priceCents, lastLookedUp: new Date() },
              });
              updated++;
            } else {
              // Touch lastLookedUp even if no price found, to avoid re-querying next run
              await prisma.product.update({
                where: { id: product.id },
                data: { lastLookedUp: new Date() },
              });
            }
          } catch (err) {
            console.error(`[cron/refresh-retail-prices] Error for UPC ${product.upc}:`, err);
          }
        })
      );
    }

    const elapsed = Date.now() - startedAt.getTime();
    console.log(
      `[cron/refresh-retail-prices] Done — ${refreshed} queried, ${updated} prices updated in ${elapsed}ms`
    );

    return Response.json({
      ok: true,
      queried: refreshed,
      updated,
      elapsedMs: elapsed,
      timestamp: startedAt.toISOString(),
    });
  } catch (err) {
    console.error("[cron/refresh-retail-prices] Error:", err);
    return Response.json({ error: "Retail price refresh failed." }, { status: 500 });
  }
}

// ─── UPCitemdb fetch ──────────────────────────────────────────────────────────

interface UPCItemDbOffer {
  merchant?: string;
  price?: string;
  updated_t?: number;
}

interface UPCItemDbItem {
  title?: string;
  offers?: UPCItemDbOffer[];
}

interface UPCItemDbResponse {
  code: string;
  items?: UPCItemDbItem[];
}

/**
 * Fetch the lowest retail price for a UPC from UPCitemdb.
 * Returns cents (integer) or null if no price data is available.
 * Trial API keys don't return offers — only paid plans do.
 */
async function fetchRetailPriceFromUPCItemDb(upc: string): Promise<number | null> {
  const apiKey = env.UPCITEMDB_API_KEY;
  const baseUrl = apiKey
    ? "https://api.upcitemdb.com/prod/v1/lookup"
    : "https://api.upcitemdb.com/prod/trial/lookup";

  const url = `${baseUrl}?upc=${encodeURIComponent(upc)}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (apiKey) headers["user_key"] = apiKey;

  const res = await fetch(url, { headers, next: { revalidate: 0 } });
  if (!res.ok) return null;

  const data = (await res.json()) as UPCItemDbResponse;
  if (data.code !== "OK" || !data.items?.length) return null;

  const item = data.items[0];
  if (!item.offers?.length) return null;

  // Take the lowest price from offers
  const prices = item.offers
    .map((o) => parseFloat(o.price ?? ""))
    .filter((p) => !isNaN(p) && p > 0);

  if (prices.length === 0) return null;

  const lowestDollars = Math.min(...prices);
  return Math.round(lowestDollars * 100);
}
