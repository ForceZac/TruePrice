import { auth } from "@/lib/auth";
import { getAlertHistory } from "@/services/AlertService";

/**
 * GET /api/user/alerts
 *
 * Returns the last 30 days of price alert history for the authenticated user.
 * Newest first.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const alerts = await getAlertHistory(session.user.id);
    return Response.json({ alerts });
  } catch (err) {
    console.error("[GET /api/user/alerts]", err);
    return Response.json({ error: "Failed to fetch alert history." }, { status: 500 });
  }
}
