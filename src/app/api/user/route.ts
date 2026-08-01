import { auth, signOut } from "@/lib/auth";
import { deleteAccount } from "@/services/UserService";

/**
 * DELETE /api/user
 * Permanently deletes the authenticated user's account and all associated data.
 * Invalidates the current session after deletion.
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await deleteAccount(session.user.id);
    // Sign out after deletion to clear the JWT cookie
    await signOut({ redirect: false });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/user]", err);
    return Response.json({ error: "Failed to delete account." }, { status: 500 });
  }
}
