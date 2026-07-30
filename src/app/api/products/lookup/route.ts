import { z } from "zod";
import { lookupProduct } from "@/services/ProductService";
import { isValidBarcode } from "@/services/BarcodeService";

const bodySchema = z.object({
  barcode: z.string().min(1, "barcode is required"),
});

/**
 * POST /api/products/lookup
 *
 * Body: { barcode: string }
 *
 * Response:
 * {
 *   found: boolean
 *   product: ProductResult | null
 * }
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
    return Response.json({ found: product !== null, product });
  } catch (err) {
    console.error("[POST /api/products/lookup]", err);
    return Response.json({ error: "Product lookup failed." }, { status: 500 });
  }
}
