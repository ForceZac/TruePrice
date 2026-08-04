import type { NextRequest } from "next/server";
import { incrementViewCount } from "@/services/ProductService";

/**
 * POST /api/products/[id]/view
 *
 * Increments the viewCount on a product, with 30-minute session dedup
 * via a cookie (`vw_<id>`). No auth required.
 *
 * Response: 204 No Content
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieName = `vw_${id}`;

  if (request.cookies.has(cookieName)) {
    return new Response(null, { status: 204 });
  }

  try {
    await incrementViewCount(id);
  } catch (err) {
    console.error("[POST /api/products/[id]/view]", err);
    return new Response(null, { status: 500 });
  }

  const response = new Response(null, { status: 204 });
  response.headers.set(
    "Set-Cookie",
    `${cookieName}=1; Max-Age=1800; Path=/; HttpOnly; SameSite=Lax`
  );
  return response;
}
