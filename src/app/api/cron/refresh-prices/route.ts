import { type NextRequest } from "next/server";
import { fetchPrices } from "@/services/CommodityService";
import { env } from "@/lib/env";

/**
 * GET /api/cron/refresh-prices
 *
 * Vercel Cron endpoint — refreshes all commodity prices from the external API.
 * Runs daily at 06:00 UTC (configured in vercel.json).
 *
 * Protected by CRON_SECRET header: Vercel sets Authorization: Bearer <secret>
 * when invoking cron routes. We verify this to prevent unauthorized triggers.
 */
export async function GET(request: NextRequest) {
  // Verify Vercel cron authorization
  const authHeader = request.headers.get("authorization");
  const expectedToken = env.CRON_SECRET;

  // Note: if CRON_SECRET is not set, the guard is skipped and the endpoint is open.
  // In production, CRON_SECRET must be set — Vercel sets it automatically for cron routes.
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const startedAt = new Date();
    const count = await fetchPrices();
    const elapsed = Date.now() - startedAt.getTime();

    console.log(`[cron/refresh-prices] Refreshed ${count} prices in ${elapsed}ms`);

    return Response.json({
      ok: true,
      refreshed: count,
      elapsedMs: elapsed,
      timestamp: startedAt.toISOString(),
    });
  } catch (err) {
    console.error("[cron/refresh-prices] Error:", err);
    return Response.json({ error: "Price refresh failed." }, { status: 500 });
  }
}
