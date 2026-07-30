import { getAllCachedPrices } from "@/services/CommodityService";

/**
 * GET /api/commodities/prices
 *
 * Returns all cached commodity prices (most recent per material).
 *
 * Response:
 * {
 *   prices: Array<{
 *     materialId: string
 *     materialName: string
 *     pricePerKgCents: number
 *     source: string
 *     fetchedAt: string  // ISO 8601
 *     stale: boolean
 *   }>
 * }
 */
export async function GET() {
  try {
    const prices = await getAllCachedPrices();
    return Response.json({ prices });
  } catch (err) {
    console.error("[GET /api/commodities/prices]", err);
    return Response.json({ error: "Failed to retrieve commodity prices." }, { status: 500 });
  }
}
