import { type NextRequest } from "next/server";
import { lookupByBarcode } from "@/services/BarcodeService";

/**
 * GET /api/products/upc-prefill?upc=<upc>
 *
 * Calls BarcodeService.lookupByBarcode() and returns pre-fill data for the
 * submission form. Used to auto-populate name/brand/category when submitting
 * via a scanned barcode.
 *
 * Responses:
 *   200 — { found: true, data: ExternalProductData } | { found: false }
 *   400 — missing upc param
 *   500 — lookup error
 */
export async function GET(request: NextRequest) {
  const upc = request.nextUrl.searchParams.get("upc");

  if (!upc) {
    return Response.json({ error: "upc query parameter is required." }, { status: 400 });
  }

  try {
    const data = await lookupByBarcode(upc);
    if (!data) {
      return Response.json({ found: false });
    }
    return Response.json({ found: true, data });
  } catch (err) {
    console.error("[GET /api/products/upc-prefill]", err);
    return Response.json({ error: "Failed to look up barcode." }, { status: 500 });
  }
}
