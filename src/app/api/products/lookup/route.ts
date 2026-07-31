import { z } from "zod";
import { lookupProduct } from "@/services/ProductService";
import { isValidBarcode } from "@/services/BarcodeService";
import { estimateCost } from "@/services/CostEstimationService";

const bodySchema = z.object({
  barcode: z.string().min(1, "barcode is required"),
});

/** Timeout for inline cost estimation during a barcode lookup (ms). */
const ESTIMATE_TIMEOUT_MS = 4000;

/**
 * POST /api/products/lookup
 *
 * Body: { barcode: string }
 *
 * Response:
 * {
 *   found: boolean
 *   product: ProductResult | null
 *   breakdown: CostBreakdownResult | null  — included when product is found
 * }
 *
 * The cost estimate is computed inline with a 4s timeout. If estimation
 * times out or fails, `breakdown` is null and the client should poll
 * POST /api/products/[id]/estimate separately.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { barcode } = parsed.data;

  if (!isValidBarcode(barcode)) {
    return Response.json(
      { error: "Invalid barcode format. Expected UPC-A (12 digits), EAN-13 (13 digits), EAN-8 (8 digits), or UPC-E (6 digits)." },
      { status: 422 }
    );
  }

  try {
    const product = await lookupProduct(barcode);

    if (!product) {
      return Response.json({ found: false, product: null, breakdown: null });
    }

    // Attempt inline estimation with timeout
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), ESTIMATE_TIMEOUT_MS)
    );
    const breakdown = await Promise.race([
      estimateCost(product.id).catch(() => null),
      timeout,
    ]);

    return Response.json({ found: true, product, breakdown });
  } catch (err) {
    console.error("[POST /api/products/lookup]", err);
    return Response.json({ error: "Product lookup failed." }, { status: 500 });
  }
}
