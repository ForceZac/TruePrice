import { type NextRequest } from "next/server";
import { serverEnv as env } from "@/lib/env.server";
import { getStaleBreakdownProductIds, forceReEstimate } from "@/services/CostEstimationService";

const BATCH_SIZE = 50;

/**
 * GET /api/cron/re-estimate
 *
 * Vercel Cron endpoint — re-runs cost estimation for products whose latest
 * CostBreakdown.updatedAt is older than RE_ESTIMATION_TTL_DAYS (default 7).
 *
 * Runs in batches of 50 to avoid overwhelming the DB under cold starts.
 *
 * Scheduled: every Monday at 08:00 UTC (see vercel.json).
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
    const ttlDays = env.RE_ESTIMATION_TTL_DAYS;

    const productIds = await getStaleBreakdownProductIds(ttlDays);

    console.log(
      `[cron/re-estimate] ${productIds.length} products with stale breakdowns (TTL=${ttlDays}d)`
    );

    let reEstimated = 0;
    let errors = 0;

    // Process in batches of BATCH_SIZE (sequential to avoid DB contention)
    for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
      const batch = productIds.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (productId) => {
          try {
            await forceReEstimate(productId);
            reEstimated++;
          } catch (err) {
            console.error(`[cron/re-estimate] Error for productId=${productId}:`, err);
            errors++;
          }
        })
      );
    }

    const elapsed = Date.now() - startedAt.getTime();
    console.log(
      `[cron/re-estimate] Done — ${reEstimated} re-estimated, ${errors} errors in ${elapsed}ms`
    );

    return Response.json({
      ok: true,
      reEstimated,
      errors,
      ttlDays,
      elapsedMs: elapsed,
      timestamp: startedAt.toISOString(),
    });
  } catch (err) {
    console.error("[cron/re-estimate] Error:", err);
    return Response.json({ error: "Re-estimation failed." }, { status: 500 });
  }
}
