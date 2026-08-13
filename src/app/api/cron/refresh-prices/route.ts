import { type NextRequest } from "next/server";
import { fetchPrices, detectStalePrices } from "@/services/CommodityService";
import { postDiscordAlert } from "@/services/NotificationService";
import { checkWatchlistAlerts } from "@/services/AlertService";
import { serverEnv as env } from "@/lib/env.server";

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

    // ── Stale price detection ─────────────────────────────────────────────
    // 25h window: any row not refreshed in this cron cycle is flagged.
    const CRON_STALE_THRESHOLD_MS = 25 * 60 * 60 * 1000;
    const staleNames = await detectStalePrices(CRON_STALE_THRESHOLD_MS);
    const staleCount = staleNames.length;

    if (staleCount > 0) {
      const alertMsg = `⚠️ Stale commodity prices detected: ${staleCount} material(s) older than 25h — ${staleNames.join(", ")}`;
      console.warn(`[cron/refresh-prices] ${alertMsg}`);

      // Post to Discord #alerts via NotificationService.
      const alertsChannelId = "1494231981800820836";
      void postDiscordAlert(alertsChannelId, alertMsg);
    }

    // ── Price alert check ─────────────────────────────────────────────────
    // Re-estimate costs for all watchlisted products and fire alerts where
    // the change exceeds each user's configured threshold.
    let alertResult = { usersChecked: 0, alertsFired: 0, alertsSkipped: 0 };
    try {
      alertResult = await checkWatchlistAlerts();
    } catch (alertErr) {
      console.error("[cron/refresh-prices] Alert check failed:", alertErr);
    }

    return Response.json({
      ok: true,
      refreshed: count,
      staleCount,
      elapsedMs: elapsed,
      timestamp: startedAt.toISOString(),
      alerts: alertResult,
    });
  } catch (err) {
    console.error("[cron/refresh-prices] Error:", err);
    return Response.json({ error: "Price refresh failed." }, { status: 500 });
  }
}
