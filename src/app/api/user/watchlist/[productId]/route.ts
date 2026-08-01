import { auth } from "@/lib/auth";
import { removeFromWatchlist } from "@/services/UserService";

/**
 * DELETE /api/user/watchlist/[productId]
 * Removes a product from the watchlist. Returns 404 if not found.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { productId } = await params;

  try {
    const removed = await removeFromWatchlist(session.user.id, productId);
    if (!removed) {
      return Response.json({ error: "Product not in watchlist." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error(`[DELETE /api/user/watchlist/${productId}]`, err);
    return Response.json({ error: "Failed to remove product." }, { status: 500 });
  }
}
