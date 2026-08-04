import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, Flame } from "lucide-react";
import { getTrending } from "@/services/DiscoveryService";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Trending Products — TruePrice",
  description:
    "See which products people are looking up the most on TruePrice right now.",
};

function formatMarkup(markupPercent: number | null): string {
  if (markupPercent === null) return "—";
  return `${(markupPercent / 100).toFixed(1)}×`;
}

export default async function TrendingPage() {
  const products = await getTrending(20, 7);

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-3xl mx-auto w-full gap-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">
            /
          </li>
          <li>
            <span className="text-foreground font-medium" aria-current="page">
              Trending
            </span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-orange-500" aria-hidden="true" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Trending Products
          </h1>
        </div>
        <p className="text-muted-foreground">
          Products people are looking up the most right now.
        </p>
      </div>

      {/* Product list */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-muted-foreground">
            No trending data yet — start exploring products to build the list.
          </p>
          <Link
            href="/"
            className="text-sm text-primary hover:underline"
          >
            Browse products →
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Trending products">
          {products.map((product, idx) => (
            <li key={product.id}>
              <Link
                href={`/product/${product.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition"
              >
                {/* Rank */}
                <span
                  className="text-2xl font-bold text-muted-foreground/40 w-8 shrink-0 text-right"
                  aria-hidden="true"
                >
                  {idx + 1}
                </span>

                {/* Info */}
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{product.category}</p>
                </div>

                {/* Stats */}
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  {product.markupPercent !== null && (
                    <span className="text-sm font-semibold text-foreground">
                      {formatMarkup(product.markupPercent)} markup
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {product.viewCount.toLocaleString()}{" "}
                    {product.viewCount === 1 ? "view" : "views"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
