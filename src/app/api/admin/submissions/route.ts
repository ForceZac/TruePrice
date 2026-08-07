import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getPendingSubmissions } from "@/services/SubmissionService";

/**
 * GET /api/admin/submissions
 *
 * Returns all PENDING submissions. Admin only.
 *
 * Responses:
 *   200 — { submissions: SubmissionRow[] }
 *   401 — unauthenticated
 *   403 — not an admin
 *   500 — internal error
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const submissions = await getPendingSubmissions();
    return Response.json({ submissions });
  } catch (err) {
    console.error("[GET /api/admin/submissions]", err);
    return Response.json({ error: "Failed to fetch submissions." }, { status: 500 });
  }
}
