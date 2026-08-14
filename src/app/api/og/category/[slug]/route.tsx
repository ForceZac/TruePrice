import { ImageResponse } from "next/og";
import { getCategoryBySlug } from "@/services/CategoryService";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const category = await getCategoryBySlug(slug);

  if (!category) {
    return new Response("Not Found", { status: 404 });
  }

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

        {/* Category name */}
        <div
          style={{
            color: "#ffffff",
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 32,
            maxWidth: 900,
          }}
        >
          {category.name}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "#6366f1", fontSize: 56, fontWeight: 900 }}>
              {category.productCount}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 18 }}>
              {category.productCount === 1 ? "product" : "products"}
            </span>
          </div>
          {category.avgMarkupPercent != null && (
            <>
              <div
                style={{
                  width: 2,
                  height: 80,
                  background: "#334155",
                  borderRadius: 2,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ color: "#6366f1", fontSize: 56, fontWeight: 900 }}>
                  {Math.round(category.avgMarkupPercent)}%
                </span>
                <span style={{ color: "#94a3b8", fontSize: 18 }}>avg markup</span>
              </div>
            </>
          )}
        </div>

        {/* Tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 80,
            color: "#475569",
            fontSize: 18,
          }}
        >
          trueprice.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
