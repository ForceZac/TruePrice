import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { centsToUsd } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      costBreakdowns: {
        orderBy: { calculatedAt: "desc" },
        take: 1,
        select: {
          totalCostCents: true,
          retailPriceCents: true,
          markupPercent: true,
        },
      },
    },
  });

  if (!product) {
    return new Response("Not Found", { status: 404 });
  }

  const breakdown = product.costBreakdowns[0] ?? null;
  const markupMultiplier =
    breakdown?.markupPercent != null
      ? (breakdown.markupPercent / 100 + 1).toFixed(1)
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
          padding: "60px 80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Brand */}
        <div
          style={{
            color: "#6366f1",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          TRUEPRICE
        </div>

        {/* Product name */}
        <div
          style={{
            color: "#ffffff",
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 32,
            maxWidth: 900,
          }}
        >
          {product.name}
        </div>

        {/* Stats row */}
        {breakdown ? (
          <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
            {markupMultiplier && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#6366f1", fontSize: 64, fontWeight: 900 }}>
                  {markupMultiplier}×
                </span>
                <span style={{ color: "#94a3b8", fontSize: 18 }}>markup</span>
              </div>
            )}
            <div
              style={{
                width: 2,
                height: 80,
                background: "#334155",
                borderRadius: 2,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <span style={{ color: "#94a3b8", fontSize: 18 }}>Costs to make</span>
                <span style={{ color: "#ffffff", fontSize: 28, fontWeight: 700 }}>
                  {centsToUsd(breakdown.totalCostCents)}
                </span>
              </div>
              {breakdown.retailPriceCents != null && (
                <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                  <span style={{ color: "#94a3b8", fontSize: 18 }}>Sells for</span>
                  <span style={{ color: "#ffffff", fontSize: 28, fontWeight: 700 }}>
                    {centsToUsd(breakdown.retailPriceCents)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ color: "#94a3b8", fontSize: 24 }}>
            See the true cost at TruePrice
          </div>
        )}

        {/* Category badge */}
        <div
          style={{
            marginTop: 40,
            background: "#1e293b",
            color: "#94a3b8",
            padding: "8px 16px",
            borderRadius: 24,
            fontSize: 16,
          }}
        >
          {product.category.name}
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
