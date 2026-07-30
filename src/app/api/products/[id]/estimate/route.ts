import { estimateCost, getCachedBreakdown } from "@/services/CostEstimationService";

/**
 * POST /api/products/[id]/estimate
 *
 * Triggers cost estimation for the given product. Returns the cached breakdown
 * if it's still fresh; otherwise recomputes and returns the new result.
 *
 * Response:
 *   200 { breakdown: CostBreakdownResult }
 *   404 { error: "Product not found." }
 *   500 { error: "..." }
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "Missing product id." }, { status: 400 });
  }

  try {
    const breakdown = await estimateCost(id);

    if (!breakdown) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    return Response.json({ breakdown }, { status: 200 });
  } catch (err) {
    console.error(`[POST /api/products/${id}/estimate]`, err);
    return Response.json(
      { error: "Failed to compute cost estimate." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/[id]/estimate
 *
 * Returns the most recent cached cost breakdown for the product.
 * Does NOT trigger a recompute — call POST to compute first.
 *
 * Response:
 *   200 { breakdown: CostBreakdownResult }
 *   404 { breakdown: null }
 *   500 { error: "..." }
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
    const breakdown = await getCachedBreakdown(id);

    if (!breakdown) {
      return Response.json({ breakdown: null }, { status: 404 });
    }

    return Response.json({ breakdown }, { status: 200 });
  } catch (err) {
    console.error(`[GET /api/products/${id}/estimate]`, err);
    return Response.json(
      { error: "Failed to retrieve cost estimate." },
      { status: 500 }
    );
  }
}
