import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { centsToUsd } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const aId = searchParams.get("a");
  const bId = searchParams.get("b");

  if (!aId || !bId) {
    return new Response("Missing product IDs", { status: 400 });
  }

  const [productA, productB] = await Promise.all([
    prisma.product.findUnique({
      where: { id: aId },
      include: {
        costBreakdowns: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
          select: { totalCostCents: true, markupPercent: true },
        },
      },
    }),
    prisma.product.findUnique({
      where: { id: bId },
      include: {
        costBreakdowns: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
          select: { totalCostCents: true, markupPercent: true },
        },
      },
    }),
  ]);

  if (!productA || !productB) {
    return new Response("Product not found", { status: 404 });
  }

  const bkA = productA.costBreakdowns[0] ?? null;
  const bkB = productB.costBreakdowns[0] ?? null;

  function multiplierLabel(markupPercent: number | null | undefined) {
    if (markupPercent == null) return "—";
    return `${(markupPercent / 100 + 1).toFixed(1)}×`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
          padding: "48px 64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <span style={{ color: "#6366f1", fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>
            TRUEPRICE
          </span>
          <span style={{ color: "#334155", fontSize: 18 }}>·</span>
          <span style={{ color: "#94a3b8", fontSize: 18 }}>Compare</span>
        </div>

        {/* Products side by side */}
        <div style={{ display: "flex", gap: 24, flex: 1 }}>
          {[
            { product: productA, breakdown: bkA },
            { product: productB, breakdown: bkB },
          ].map(({ product, breakdown }, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: "28px 32px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  color: "#ffffff",
                  fontSize: 26,
                  fontWeight: 800,
                  lineHeight: 1.2,
                }}
              >
                {product.name}
              </div>

              {breakdown ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div
                    style={{
                      color: "#6366f1",
                      fontSize: 52,
                      fontWeight: 900,
                      lineHeight: 1,
                    }}
                  >
                    {multiplierLabel(breakdown.markupPercent)}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 16 }}>markup</div>
                  <div style={{ color: "#64748b", fontSize: 18, marginTop: 8 }}>
                    Costs {centsToUsd(breakdown.totalCostCents)} to make
                  </div>
                </div>
              ) : (
                <div style={{ color: "#64748b", fontSize: 18 }}>No estimate yet</div>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
