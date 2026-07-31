import { type NextRequest } from "next/server";
import { serverEnv as env } from "@/lib/env.server";
import { getDigestCandidates, type DigestCandidate } from "@/services/UserService";

/**
 * GET /api/cron/weekly-digest
 *
 * Vercel Cron endpoint — identifies watchlisted products whose markup changed
 * by >5 percentage points in the last 7 days and emails affected users.
 *
 * Scheduled: every Monday at 09:00 UTC (see vercel.json).
 * Protected by CRON_SECRET header.
 * Real email send is gated on RESEND_API_KEY being set.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = env.CRON_SECRET;

  if (!expectedToken) {
    // CRON_SECRET must be set — an open endpoint would allow anyone to trigger
    // bulk emails to all watchlist users.
    console.error(
      "[cron/weekly-digest] CRON_SECRET is not set. Refusing request to prevent unauthorized email sends."
    );
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const candidates = await getDigestCandidates(since, 5);

    console.log(
      `[cron/weekly-digest] ${candidates.length} users with changed watchlist products`
    );

    let usersNotified = 0;
    let usersSkipped = 0;

    if (env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(env.RESEND_API_KEY);

      await Promise.all(
        candidates.map(async (candidate) => {
          if (!candidate.email) {
            usersSkipped++;
            return;
          }
          try {
            await resend.emails.send({
              from: env.FROM_EMAIL,
              to: candidate.email,
              subject: "Your TruePrice watchlist has updates",
              html: buildDigestHtml(candidate),
            });
            usersNotified++;
          } catch (err) {
            console.error(
              `[cron/weekly-digest] Failed to email ${candidate.userId}:`,
              err
            );
            usersSkipped++;
          }
        })
      );
    } else {
      console.log(
        "[cron/weekly-digest] RESEND_API_KEY not set — logging digest, skipping send"
      );
      for (const c of candidates) {
        console.log(
          `  → ${c.email}: ${c.products.length} changed product(s):`,
          c.products.map((p) => `${p.productName} ${p.changePercent > 0 ? "+" : ""}${p.changePercent.toFixed(1)}%`)
        );
      }
      usersSkipped = candidates.length;
    }

    return Response.json({
      ok: true,
      usersNotified,
      usersSkipped,
      productsIncluded: candidates.reduce((n, c) => n + c.products.length, 0),
      since: since.toISOString(),
    });
  } catch (err) {
    console.error("[cron/weekly-digest] Error:", err);
    return Response.json({ error: "Digest failed." }, { status: 500 });
  }
}

function buildDigestHtml(candidate: DigestCandidate): string {
  const rows = candidate.products
    .map((p) => {
      const dir = p.changePercent > 0 ? "▲" : "▼";
      const sign = p.changePercent > 0 ? "+" : "";
      return `
        <tr>
          <td style="padding:8px 12px">${escapeHtml(p.productName)}</td>
          <td style="padding:8px 12px">${p.oldMarkupPercent.toFixed(1)}%</td>
          <td style="padding:8px 12px">${p.newMarkupPercent.toFixed(1)}%</td>
          <td style="padding:8px 12px">${dir} ${sign}${p.changePercent.toFixed(1)}%</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#111;max-width:600px;margin:auto">
  <h2 style="color:#1a1a1a">Your TruePrice watchlist has updates</h2>
  <p>Hi${candidate.name ? ` ${escapeHtml(candidate.name)}` : ""},</p>
  <p>The following products on your watchlist had estimate changes in the past 7 days:</p>
  <table style="width:100%;border-collapse:collapse;border:1px solid #ddd">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:8px 12px;text-align:left">Product</th>
        <th style="padding:8px 12px;text-align:left">Previous markup</th>
        <th style="padding:8px 12px;text-align:left">New markup</th>
        <th style="padding:8px 12px;text-align:left">Change</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top:24px">
    <a href="https://trueprice.app/dashboard">View your dashboard →</a>
  </p>
  <hr style="margin-top:32px;border:none;border-top:1px solid #eee"/>
  <p style="font-size:12px;color:#888">
    You're receiving this because you saved products to your TruePrice watchlist.
  </p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
