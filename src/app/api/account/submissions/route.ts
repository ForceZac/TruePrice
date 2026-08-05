import { auth } from "@/lib/auth";
import { getUserSubmissions } from "@/services/SubmissionService";

/**
 * GET /api/account/submissions
 *
 * Returns the authenticated user's submission history, newest first.
 *
 * Responses:
 *   200 — { submissions: SubmissionRow[] }
 *   401 — unauthenticated
 *   500 — internal error
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const submissions = await getUserSubmissions(session.user.id);
    return Response.json({ submissions });
  } catch (err) {
    console.error("[GET /api/account/submissions]", err);
    return Response.json({ error: "Failed to fetch submissions." }, { status: 500 });
  }
}
