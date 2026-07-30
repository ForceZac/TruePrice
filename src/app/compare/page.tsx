import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftRight, ArrowLeft } from "lucide-react";
import { getProductById } from "@/services/ProductService";
import { getCachedBreakdown } from "@/services/CostEstimationService";
import { clientEnv } from "@/lib/env.client";
import { centsToUsd } from "@/lib/format";
import { ConfidenceBadge } from "@/components/molecules/ConfidenceBadge";

interface Props {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { a, b } = await searchParams;

  if (!a || !b) {
    return { title: "Compare Products — TruePrice" };
  }

  const [productA, productB] = await Promise.all([
    getProductById(a),
    getProductById(b),
  ]);

  if (!productA || !productB) {
    return { title: "Compare Products — TruePrice" };
  }

  const title = `${productA.name} vs ${productB.name} — TruePrice`;
  const description = `Compare the true manufacturing cost of ${productA.name} and ${productB.name} — see which has the bigger markup.`;
  const ogImageUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/api/og/compare?a=${a}&b=${b}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${clientEnv.NEXT_PUBLIC_APP_URL}/compare?a=${a}&b=${b}`,
      siteName: "TruePrice",
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ComparePage({ searchParams }: Props) {
  const { a, b } = await searchParams;

  // ── Cold state ───────────────────────────────────────────────────────────────
  if (!a || !b) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-16 text-center gap-4">
        <ArrowLeftRight className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-foreground">Compare Products</h1>
        <p className="text-muted-foreground max-w-sm">
          Add two products to compare from any product page. Use the{" "}
          <span className="font-medium text-foreground">Add to Compare</span> button to stage them,
          then tap <span className="font-medium text-foreground">Compare</span>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Browse Products
        </Link>
      </main>
    );
  }

  // ── Fetch both products + breakdowns ─────────────────────────────────────────
  const [productA, productB] = await Promise.all([
    getProductById(a),
    getProductById(b),
  ]);

  if (!productA || !productB) {
    notFound();
  }

  const [breakdownA, breakdownB] = await Promise.all([
    getCachedBreakdown(a),
    getCachedBreakdown(b),
  ]);

  // ── Delta calculation ────────────────────────────────────────────────────────
  const markupA = breakdownA?.markupPercent ?? null;
  const markupB = breakdownB?.markupPercent ?? null;
  const higherMarkupSide =
    markupA != null && markupB != null
      ? markupA > markupB
        ? "a"
        : markupB > markupA
          ? "b"
          : null
      : null;
  const markupDelta =
    markupA != null && markupB != null ? Math.abs(markupA - markupB) : null;

  // ── JSON-LD structured data ───────────────────────────────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Compare: ${productA.name} vs ${productB.name}`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        url: `${clientEnv.NEXT_PUBLIC_APP_URL}/product/${a}`,
        name: productA.name,
      },
      {
        "@type": "ListItem",
        position: 2,
        url: `${clientEnv.NEXT_PUBLIC_APP_URL}/product/${b}`,
        name: productB.name,
      },
    ],
  };

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-4xl mx-auto w-full gap-8">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">
            Home
          </Link>
          <span>/</span>
          <span>Compare</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Product Comparison</h1>
        {higherMarkupSide && markupDelta != null && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {higherMarkupSide === "a" ? productA.name : productB.name}
            </span>{" "}
            has a{" "}
            <span className="font-semibold text-primary">{Math.round(markupDelta)}% higher markup</span>
          </p>
        )}
      </div>

      {/* Comparison grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[
          {
            key: "a",
            product: productA,
            breakdown: breakdownA,
            isHigher: higherMarkupSide === "a",
          },
          {
            key: "b",
            product: productB,
            breakdown: breakdownB,
            isHigher: higherMarkupSide === "b",
          },
        ].map(({ key, product, breakdown, isHigher }) => (
          <div
            key={key}
            className={`rounded-xl border p-5 flex flex-col gap-4 ${
              isHigher ? "border-primary/60 bg-primary/5" : "border-border bg-card"
            }`}
          >
            {/* Product header */}
            <div>
              <Link
                href={`/product/${product.id}`}
                className="font-semibold text-lg text-foreground hover:text-primary transition leading-tight"
              >
                {product.name}
              </Link>
              {product.brand && (
                <p className="text-sm text-muted-foreground mt-0.5">{product.brand}</p>
              )}
              <span className="inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full mt-1">
                {product.category}
              </span>
              {isHigher && (
                <span className="inline-block ml-2 text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                  Higher markup
                </span>
              )}
            </div>

            {/* Stats */}
            {breakdown ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatCell label="Est. cost" value={centsToUsd(breakdown.totalCostCents)} />
                  {breakdown.retailPriceCents != null && (
                    <StatCell label="Retail" value={centsToUsd(breakdown.retailPriceCents)} />
                  )}
                  {breakdown.markupPercent != null && (
                    <StatCell
                      label="Markup"
                      value={`${Math.round(breakdown.markupPercent)}%`}
                      highlight
                    />
                  )}
                  {breakdown.markupPercent != null && (
                    <StatCell
                      label="Multiplier"
                      value={`${(breakdown.markupPercent / 100 + 1).toFixed(1)}×`}
                      highlight
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground border-t border-border pt-3">
                  <span>Materials</span>
                  <span className="text-right font-medium text-foreground">
                    {centsToUsd(breakdown.materialCostCents)}
                  </span>
                  <span>Labor</span>
                  <span className="text-right font-medium text-foreground">
                    {centsToUsd(breakdown.laborCostCents)}
                  </span>
                  <span>Overhead</span>
                  <span className="text-right font-medium text-foreground">
                    {centsToUsd(breakdown.overheadCostCents)}
                  </span>
                  <span>Shipping</span>
                  <span className="text-right font-medium text-foreground">
                    {centsToUsd(breakdown.shippingCostCents)}
                  </span>
                </div>

                <ConfidenceBadge
                  confidenceScore={breakdown.confidenceScore}
                  confidenceReason={breakdown.confidenceReason}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No estimate yet.{" "}
                <Link href={`/product/${product.id}`} className="underline hover:text-foreground">
                  Calculate cost
                </Link>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Back link */}
      <div className="flex justify-center">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Browse more products
        </Link>
      </div>
    </main>
  );
}

function StatCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-base font-bold tabular-nums leading-tight ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
