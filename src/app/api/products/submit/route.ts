import { type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { createSubmission } from "@/services/SubmissionService";

/**
 * POST /api/products/submit
 *
 * Body: { name, upc, brand?, categoryId, retailPriceCents?, countryOfOrigin?, materials? }
 *
 * Responses:
 *   201 — submission created
 *   400 — invalid payload
 *   401 — unauthenticated
 *   409 — UPC already exists (includes existing product URL)
 *   429 — rate limit (≥5 PENDING submissions)
 *   500 — internal error
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, upc, brand, categoryId, retailPriceCents, countryOfOrigin, materials } = body;

  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "name is required." }, { status: 400 });
  }
  if (typeof upc !== "string" || !upc.trim()) {
    return Response.json({ error: "upc is required." }, { status: 400 });
  }
  if (typeof categoryId !== "string" || !categoryId.trim()) {
    return Response.json({ error: "categoryId is required." }, { status: 400 });
  }

  try {
    const submission = await createSubmission(session.user.id, {
      name: name.trim(),
      upc: upc.trim(),
      brand: typeof brand === "string" ? brand.trim() || undefined : undefined,
      categoryId: categoryId.trim(),
      retailPriceCents: typeof retailPriceCents === "number" ? retailPriceCents : undefined,
      countryOfOrigin: typeof countryOfOrigin === "string" ? countryOfOrigin.trim() || undefined : undefined,
      materials: Array.isArray(materials) ? materials as Array<{ materialId: string; weightGrams: number }> : undefined,
    });

    return Response.json({ submission }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: string }).code;

    if (code === "INVALID_UPC") {
      return Response.json({ error: (err as Error).message }, { status: 400 });
    }
    if (code === "DUPLICATE_UPC") {
      const productId = (err as { productId?: string }).productId;
      return Response.json(
        { error: (err as Error).message, productUrl: productId ? `/product/${productId}` : null },
        { status: 409 }
      );
    }
    if (code === "RATE_LIMITED") {
      return Response.json({ error: (err as Error).message }, { status: 429 });
    }

    console.error("[POST /api/products/submit]", err);
    return Response.json({ error: "Failed to create submission." }, { status: 500 });
  }
}
