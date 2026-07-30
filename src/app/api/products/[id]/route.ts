import { getProductById } from "@/services/ProductService";

/**
 * GET /api/products/[id]
 *
 * Response:
 * {
 *   product: ProductResult | null
 * }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "Missing product id." }, { status: 400 });
  }

  try {
    const product = await getProductById(id);
    if (!product) {
      return Response.json({ product: null }, { status: 404 });
    }
    return Response.json({ product });
  } catch (err) {
    console.error(`[GET /api/products/${id}]`, err);
    return Response.json({ error: "Failed to retrieve product." }, { status: 500 });
  }
}
