import { type NextRequest } from "next/server";
import { fetchRetailPriceByUPC } from "@/services/BarcodeService";
import { getStaleRetailProducts, updateRetailPrice } from "@/services/ProductService";
import { serverEnv as env } from "@/lib/env.server";

const BATCH_SIZE = 20;

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

    const products = await getStaleRetailProducts();
    console.log(`[cron/refresh-retail-prices] ${products.length} products to refresh`);

    let refreshed = 0;
    let updated = 0;

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (product) => {
          try {
            const priceCents = await fetchRetailPriceByUPC(product.upc);
            refreshed++;

            if (priceCents !== null) {
              await updateRetailPrice(product.id, priceCents);
              updated++;
            } else {
              // Touch lastLookedUp even if no price found, to avoid re-querying next run
              await updateRetailPrice(product.id, null);
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
