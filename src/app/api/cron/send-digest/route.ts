import { type NextRequest } from "next/server";
import { serverEnv as env } from "@/lib/env.server";
import { sendWeeklyDigests } from "@/services/UserService";

/**
 * GET /api/cron/send-digest
 *
 * Vercel Cron endpoint — sends weekly digest emails to all opted-in users.
 * Each digest includes up to 5 watchlist products + 3 platform highlights +
 * a one-click JWT-signed unsubscribe link.
 *
 * Scheduled: every Saturday at 08:00 UTC (see vercel.json).
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = env.CRON_SECRET;

  if (!expectedToken) {
    console.error(
      "[cron/send-digest] CRON_SECRET is not set — refusing to prevent unauthorized sends"
    );
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await sendWeeklyDigests();
    console.log(
      `[cron/send-digest] Done — sent=${result.sent} skipped=${result.skipped} errors=${result.errors}`
    );
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/send-digest] Unexpected error:", err);
    return Response.json({ error: "Digest send failed." }, { status: 500 });
  }
}
