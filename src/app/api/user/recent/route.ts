import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  getRecentlyViewed,
  recordProductView,
  mergeLocalRecentlyViewed,
} from "@/services/UserService";

/**
 * GET /api/user/recent
 * Returns the authenticated user's recently viewed products (up to 10).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const recent = await getRecentlyViewed(session.user.id);
    return Response.json({ recent });
  } catch (err) {
    console.error("[GET /api/user/recent]", err);
    return Response.json({ error: "Failed to load recently viewed." }, { status: 500 });
  }
}

/**
 * POST /api/user/recent
 * Body: { productId: string; localIds?: string[] }
 * Records a product view. If `localIds` is present, also merges localStorage IDs.
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

  const localIds =
    body && typeof body === "object" && "localIds" in body
      ? (body as { localIds: unknown }).localIds
      : undefined;

  try {
    await recordProductView(session.user.id, productId);

    if (Array.isArray(localIds) && localIds.length > 0) {
      const validIds = localIds.filter((id): id is string => typeof id === "string");
      await mergeLocalRecentlyViewed(session.user.id, validIds);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/user/recent]", err);
    return Response.json({ error: "Failed to record view." }, { status: 500 });
  }
}
