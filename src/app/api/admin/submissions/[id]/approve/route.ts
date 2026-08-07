import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { approveSubmission } from "@/services/SubmissionService";

/**
 * POST /api/admin/submissions/[id]/approve
 *
 * Approves a pending submission: creates a Product row, triggers cost
 * estimation, and sends an approval email. Admin only.
 *
 * Responses:
 *   200 — { productId: string }
 *   401 — unauthenticated
 *   403 — not an admin
 *   404 — submission not found
 *   409 — submission not in PENDING state
 *   500 — internal error
 */
export async function POST(
  _request: Request,
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

  try {
    const result = await approveSubmission(id);
    return Response.json(result);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "NOT_FOUND") {
      return Response.json({ error: (err as Error).message }, { status: 404 });
    }
    if (code === "INVALID_STATE") {
      return Response.json({ error: (err as Error).message }, { status: 409 });
    }
    console.error(`[POST /api/admin/submissions/${id}/approve]`, err);
    return Response.json({ error: "Failed to approve submission." }, { status: 500 });
  }
}
