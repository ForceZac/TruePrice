import type { NextRequest } from "next/server";
import { searchProducts } from "@/services/ProductService";

/**
 * GET /api/products/search?q=<query>[&autocomplete=true&limit=6]
 *
 * When autocomplete=true, returns a slim projection { id, name, category }
 * suitable for search dropdown suggestions (limit defaults to 6).
 *
 * Response:
 * {
 *   query: string
 *   products: ProductResult[]
 *   total: number
 * }
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const autocomplete = params.get("autocomplete") === "true";
  const limitParam = params.get("limit");
  const limit = autocomplete
    ? Math.min(parseInt(limitParam ?? "6", 10) || 6, 10)
    : Math.min(parseInt(limitParam ?? "20", 10) || 20, 50);

  if (!q.trim()) {
    return Response.json({ query: "", products: [], total: 0 });
  }

  try {
    const products = await searchProducts(q, limit, autocomplete);
    return Response.json({ query: q, products, total: products.length });
  } catch (err) {
    console.error("[GET /api/products/search]", err);
    return Response.json({ error: "Search failed." }, { status: 500 });
  }
}
