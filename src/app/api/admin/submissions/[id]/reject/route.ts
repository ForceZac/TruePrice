import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { rejectSubmission } from "@/services/SubmissionService";

/**
 * POST /api/admin/submissions/[id]/reject
 *
 * Rejects a pending submission. No product row is created. Admin only.
 *
 * Body (optional): { reason?: string }
 *
 * Responses:
 *   204 — rejected
 *   401 — unauthenticated
 *   403 — not an admin
 *   404 — submission not found
 *   409 — submission not in PENDING state
 *   500 — internal error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isAdmin(session.user.email)) {
    return Response.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  let reason: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    reason = typeof body?.reason === "string" ? body.reason.trim() || undefined : undefined;
  } catch {
    reason = undefined;
  }

  try {
    await rejectSubmission(id, reason);
    return new Response(null, { status: 204 });
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "NOT_FOUND") {
      return Response.json({ error: (err as Error).message }, { status: 404 });
    }
    if (code === "INVALID_STATE") {
      return Response.json({ error: (err as Error).message }, { status: 409 });
    }
    console.error(`[POST /api/admin/submissions/${id}/reject]`, err);
    return Response.json({ error: "Failed to reject submission." }, { status: 500 });
  }
}
