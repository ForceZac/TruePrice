import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VALID_THRESHOLDS, type AlertThreshold } from "@/lib/alert-constants";

/**
 * PATCH /api/user/alert-settings
 *
 * Updates the authenticated user's price alert preferences.
 * Body: { alertThresholdPct?: number | null, alertsEnabled?: boolean }
 *
 * alertThresholdPct must be one of: null, 0, 5, 10, 20
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { alertThresholdPct, alertsEnabled } = body as Record<string, unknown>;

  const updates: { alertThresholdPct?: number | null; alertsEnabled?: boolean } = {};

  if ("alertThresholdPct" in (body as object)) {
    if (alertThresholdPct !== null && !VALID_THRESHOLDS.includes(alertThresholdPct as AlertThreshold)) {
      return Response.json(
        { error: `alertThresholdPct must be one of: null, ${VALID_THRESHOLDS.join(", ")}` },
        { status: 422 }
      );
    }
    updates.alertThresholdPct = alertThresholdPct as number | null;
  }

  if ("alertsEnabled" in (body as object)) {
    if (typeof alertsEnabled !== "boolean") {
      return Response.json({ error: "alertsEnabled must be a boolean." }, { status: 422 });
    }
    updates.alertsEnabled = alertsEnabled;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields provided." }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      select: { alertThresholdPct: true, alertsEnabled: true },
    });
    return Response.json({ ok: true, ...user });
  } catch (err) {
    console.error("[PATCH /api/user/alert-settings]", err);
    return Response.json({ error: "Failed to update alert settings." }, { status: 500 });
  }
}
