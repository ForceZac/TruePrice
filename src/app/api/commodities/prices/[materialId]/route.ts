import { type NextRequest } from "next/server";
import { getCachedPrice } from "@/services/CommodityService";

/**
 * GET /api/commodities/prices/:materialId
 *
 * Returns the most recent cached price for a specific material.
 *
 * Response (200):
 * {
 *   materialId: string
 *   materialName: string
 *   pricePerKgCents: number
 *   source: string
 *   fetchedAt: string  // ISO 8601
 *   stale: boolean
 * }
 *
 * Response (404): { error: "Price not found for this material." }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const { materialId } = await params;

  if (!materialId || typeof materialId !== "string") {
    return Response.json({ error: "Invalid materialId." }, { status: 400 });
  }

  try {
    const price = await getCachedPrice(materialId);
    if (!price) {
      return Response.json(
        { error: "Price not found for this material." },
        { status: 404 }
      );
    }
    return Response.json(price);
  } catch (err) {
    console.error(`[GET /api/commodities/prices/${materialId}]`, err);
    return Response.json({ error: "Failed to retrieve commodity price." }, { status: 500 });
  }
}
