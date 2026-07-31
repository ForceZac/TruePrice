/**
 * AlertService — price alert detection, dispatch, and history.
 *
 * Called after each daily commodity price refresh. Re-estimates costs for
 * every product in any user's watchlist and sends an email when the change
 * exceeds the user's configured threshold.
 *
 * Ownership rules:
 * - This service is the ONLY module that writes to AlertLog.
 * - This service is the ONLY module that reads/updates SavedProduct alert fields.
 * - CostEstimationService.getCachedBreakdown() is used for current cost; no
 *   direct Prisma queries against CostBreakdown here.
 */

import { prisma } from "@/lib/db";
import { serverEnv as env } from "@/lib/env.server";
import { getCachedBreakdown } from "@/services/CostEstimationService";
import { VALID_THRESHOLDS, type AlertThreshold } from "@/lib/alert-constants";

export { VALID_THRESHOLDS, type AlertThreshold };

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default threshold when User.alertThresholdPct is null (10%). */
export const DEFAULT_ALERT_THRESHOLD_PCT = 10;

/** Minimum hours between alerts for the same (user, product) pair. */
const RATE_LIMIT_HOURS = 24;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlertLogEntry {
  id: string;
  productId: string;
  productName: string;
  oldCostCents: number;
  newCostCents: number;
  deltaPercent: number;
  sentAt: Date;
}

export interface AlertCheckResult {
  usersChecked: number;
  alertsFired: number;
  alertsSkipped: number;
}

// ─── Threshold helpers ────────────────────────────────────────────────────────

/**
 * Resolves a user's configured threshold to a decimal fraction.
 * null → 10% default → 0.10
 * 0   → any change  → 0    (alert on any non-zero delta)
 * N   → N%          → N/100
 */
export function resolveThreshold(thresholdPct: number | null): number {
  if (thresholdPct === null) return DEFAULT_ALERT_THRESHOLD_PCT / 100;
  return thresholdPct / 100;
}

/**
 * Returns true if the absolute cost change exceeds the user's threshold.
 * When threshold is 0 (any change), any non-zero delta qualifies.
 */
export function exceedsThreshold(
  oldCostCents: number,
  newCostCents: number,
  thresholdFraction: number
): boolean {
  if (oldCostCents === 0) return false; // avoid divide-by-zero
  const delta = Math.abs(newCostCents - oldCostCents) / oldCostCents;
  if (thresholdFraction === 0) return newCostCents !== oldCostCents;
  return delta >= thresholdFraction;
}

/**
 * Returns true if the rate-limit window has not yet elapsed.
 */
export function isRateLimited(lastAlertedAt: Date | null, nowMs: number): boolean {
  if (!lastAlertedAt) return false;
  const elapsed = nowMs - lastAlertedAt.getTime();
  return elapsed < RATE_LIMIT_HOURS * 60 * 60 * 1000;
}

// ─── Main check ───────────────────────────────────────────────────────────────

/**
 * Iterates all active watchlists and fires alert emails where the current
 * estimated cost has moved beyond the user's threshold since the last alert.
 *
 * Call this immediately after CommodityService.refreshPrices() completes.
 */
export async function checkWatchlistAlerts(): Promise<AlertCheckResult> {
  const now = new Date();
  const nowMs = now.getTime();

  // Load all users with alerts enabled who have ≥1 saved product
  const users = await prisma.user.findMany({
    where: {
      alertsEnabled: true,
      email: { not: null },
      savedProducts: { some: {} },
    },
    select: {
      id: true,
      email: true,
      name: true,
      alertThresholdPct: true,
      savedProducts: {
        select: {
          productId: true,
          costAtWatchCents: true,
          lastAlertedCostCents: true,
          lastAlertedAt: true,
          product: { select: { name: true, retailPriceCents: true } },
        },
      },
    },
  });

  let alertsFired = 0;
  let alertsSkipped = 0;
  const usersChecked = users.length;

  // Lazily initialise Resend only if key is present
  let resend: import("resend").Resend | null = null;
  if (env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    resend = new Resend(env.RESEND_API_KEY);
  }

  const fromEmail = env.ALERT_FROM_EMAIL ?? env.FROM_EMAIL;

  for (const user of users) {
    const threshold = resolveThreshold(user.alertThresholdPct);

    for (const sp of user.savedProducts) {
      // Determine baseline cost for comparison
      const baseline = sp.lastAlertedCostCents ?? sp.costAtWatchCents;
      if (baseline === null) {
        // No baseline yet — this is the first refresh since the product was saved.
        // Set costAtWatchCents to the current estimate and move on.
        const current = await getCachedBreakdown(sp.productId);
        if (current) {
          await prisma.savedProduct.update({
            where: { userId_productId: { userId: user.id, productId: sp.productId } },
            data: { costAtWatchCents: current.totalCostCents },
          });
        }
        alertsSkipped++;
        continue;
      }

      // Rate-limit check
      if (isRateLimited(sp.lastAlertedAt, nowMs)) {
        alertsSkipped++;
        continue;
      }

      // Get current estimate from cache
      const current = await getCachedBreakdown(sp.productId);
      if (!current) {
        alertsSkipped++;
        continue;
      }

      const newCost = current.totalCostCents;

      if (!exceedsThreshold(baseline, newCost, threshold)) {
        alertsSkipped++;
        continue;
      }

      // Compute signed delta
      const deltaPercent = ((newCost - baseline) / baseline) * 100;

      // Persist AlertLog row
      await prisma.alertLog.create({
        data: {
          userId: user.id,
          productId: sp.productId,
          oldCostCents: baseline,
          newCostCents: newCost,
          deltaPercent,
        },
      });

      // Update SavedProduct baseline
      await prisma.savedProduct.update({
        where: { userId_productId: { userId: user.id, productId: sp.productId } },
        data: {
          lastAlertedCostCents: newCost,
          lastAlertedAt: now,
        },
      });

      // Send email
      if (resend && user.email) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: user.email,
            subject: `Price alert: ${sp.product.name} cost changed`,
            html: buildAlertHtml({
              userName: user.name,
              productName: sp.product.name,
              oldCostCents: baseline,
              newCostCents: newCost,
              deltaPercent,
              retailPriceCents: sp.product.retailPriceCents,
            }),
          });
        } catch (err) {
          console.error(
            `[AlertService] Failed to email userId=${user.id} productId=${sp.productId}:`,
            err
          );
        }
      } else if (!resend) {
        console.log(
          `[AlertService] RESEND_API_KEY not set — would alert userId=${user.id} product="${sp.product.name}" delta=${deltaPercent.toFixed(1)}%`
        );
      }

      alertsFired++;
    }
  }

  console.log(
    `[AlertService] checkWatchlistAlerts done — checked=${usersChecked} fired=${alertsFired} skipped=${alertsSkipped}`
  );

  return { usersChecked, alertsFired, alertsSkipped };
}

// ─── User alert settings ──────────────────────────────────────────────────────

export interface AlertSettingsUpdate {
  alertThresholdPct?: number | null;
  alertsEnabled?: boolean;
}

export interface AlertSettingsResult {
  alertThresholdPct: number | null;
  alertsEnabled: boolean;
}

/**
 * Updates the authenticated user's price alert preferences.
 * Called from PATCH /api/user/alert-settings.
 */
export async function updateAlertSettings(
  userId: string,
  updates: AlertSettingsUpdate
): Promise<AlertSettingsResult> {
  return prisma.user.update({
    where: { id: userId },
    data: updates,
    select: { alertThresholdPct: true, alertsEnabled: true },
  });
}

// ─── Alert history ────────────────────────────────────────────────────────────

/**
 * Returns the most recent alert log entries for a user (newest first).
 * Default window: 30 days.
 */
export async function getAlertHistory(
  userId: string,
  days = 30
): Promise<AlertLogEntry[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.alertLog.findMany({
    where: { userId, sentAt: { gte: since } },
    orderBy: { sentAt: "desc" },
    include: { product: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    productName: r.product.name,
    oldCostCents: r.oldCostCents,
    newCostCents: r.newCostCents,
    deltaPercent: r.deltaPercent,
    sentAt: r.sentAt,
  }));
}

// ─── Email template ───────────────────────────────────────────────────────────

interface AlertEmailData {
  userName: string | null;
  productName: string;
  oldCostCents: number;
  newCostCents: number;
  deltaPercent: number;
  retailPriceCents: number | null;
}

function buildAlertHtml(data: AlertEmailData): string {
  const { userName, productName, oldCostCents, newCostCents, deltaPercent, retailPriceCents } =
    data;
  const dir = deltaPercent > 0 ? "▲" : "▼";
  const sign = deltaPercent > 0 ? "+" : "";
  const oldUsd = (oldCostCents / 100).toFixed(2);
  const newUsd = (newCostCents / 100).toFixed(2);
  const deltaPctStr = `${sign}${deltaPercent.toFixed(1)}%`;

  const retailRow = retailPriceCents
    ? `<tr><td style="padding:8px 12px;color:#666">Retail price</td><td style="padding:8px 12px">$${(retailPriceCents / 100).toFixed(2)}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#111;max-width:600px;margin:auto">
  <h2 style="color:#1a1a1a">Price alert: ${escapeHtml(productName)}</h2>
  <p>Hi${userName ? ` ${escapeHtml(userName)}` : ""},</p>
  <p>The estimated manufacturing cost for a product on your TruePrice watchlist has changed:</p>
  <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;margin-top:16px">
    <tbody>
      <tr style="background:#f5f5f5">
        <td style="padding:8px 12px;font-weight:600">${escapeHtml(productName)}</td>
        <td style="padding:8px 12px"></td>
      </tr>
      <tr><td style="padding:8px 12px;color:#666">Previous estimate</td><td style="padding:8px 12px">$${oldUsd}</td></tr>
      <tr><td style="padding:8px 12px;color:#666">New estimate</td><td style="padding:8px 12px">$${newUsd}</td></tr>
      <tr><td style="padding:8px 12px;color:#666">Change</td><td style="padding:8px 12px;font-weight:600">${dir} ${deltaPctStr}</td></tr>
      ${retailRow}
    </tbody>
  </table>
  <p style="margin-top:24px">
    <a href="https://trueprice.app/dashboard">View your watchlist →</a>
  </p>
  <hr style="margin-top:32px;border:none;border-top:1px solid #eee"/>
  <p style="font-size:12px;color:#888">
    You're receiving this because this product is on your TruePrice watchlist and its
    estimated cost changed by more than your configured threshold.
    <a href="https://trueprice.app/dashboard/settings">Manage alert settings</a> ·
    <a href="https://trueprice.app/dashboard/settings">Unsubscribe from price alerts</a>
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
