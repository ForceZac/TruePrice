import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getWatchlist,
  addToWatchlist,
  WatchlistCapError,
} from "@/services/UserService";

/**
 * GET /api/user/watchlist
 * Returns the authenticated user's saved products.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const watchlist = await getWatchlist(session.user.id);
    return Response.json({ watchlist });
  } catch (err) {
    console.error("[GET /api/user/watchlist]", err);
    return Response.json({ error: "Failed to load watchlist." }, { status: 500 });
  }
}

/**
 * POST /api/user/watchlist
 * Body: { productId: string }
 * Adds a product to the watchlist. Returns 409 if already saved, 507 if full.
 */
export async function POST(request: NextRequest) {
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

  const productId =
    body && typeof body === "object" && "productId" in body
      ? (body as { productId: unknown }).productId
      : undefined;

  if (!productId || typeof productId !== "string") {
    return Response.json({ error: "productId is required." }, { status: 400 });
  }

  try {
    const result = await addToWatchlist(session.user.id, productId);
    if (result.alreadySaved) {
      return Response.json({ error: "Already saved." }, { status: 409 });
    }
    return Response.json({ ok: true, nearCap: result.nearCap }, { status: 201 });
  } catch (err) {
    if (err instanceof WatchlistCapError) {
      return Response.json({ error: err.message }, { status: 507 });
    }
    console.error("[POST /api/user/watchlist]", err);
    return Response.json({ error: "Failed to save product." }, { status: 500 });
  }
}
