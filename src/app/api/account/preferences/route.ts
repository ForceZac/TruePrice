import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { updateDigestPreferences } from "@/services/UserService";

/**
 * PATCH /api/account/preferences
 * Body: { digestEnabled: boolean }
 *
 * Auth-gated. Updates the authenticated user's email preference(s).
 * Returns: { digestEnabled: boolean }
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("digestEnabled" in body) ||
    typeof (body as { digestEnabled: unknown }).digestEnabled !== "boolean"
  ) {
    return Response.json(
      { error: "Body must be { digestEnabled: boolean }." },
      { status: 422 }
    );
  }

  const { digestEnabled } = body as { digestEnabled: boolean };

  try {
    const updated = await updateDigestPreferences(session.user.id, digestEnabled);
    return Response.json(updated);
  } catch (err) {
    console.error("[PATCH /api/account/preferences]", err);
    return Response.json({ error: "Failed to update preferences." }, { status: 500 });
  }
}
