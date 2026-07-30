import type { NextRequest } from "next/server";
import { searchProducts } from "@/services/ProductService";

/**
 * GET /api/products/search?q=<query>
 *
 * Response:
 * {
 *   query: string
 *   products: ProductResult[]
 *   total: number
 * }
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";

  if (!q.trim()) {
    return Response.json({ query: "", products: [], total: 0 });
  }

  try {
    const products = await searchProducts(q);
    return Response.json({ query: q, products, total: products.length });
  } catch (err) {
    console.error("[GET /api/products/search]", err);
    return Response.json({ error: "Search failed." }, { status: 500 });
  }
}
