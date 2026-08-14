import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategoryBySlug as _getCategoryBySlug,
  getCategoryProducts,
  getAllCategorySlugs,
} from "@/services/CategoryService";

// Deduplicate the two getCategoryBySlug calls (generateMetadata + page) per
// request so only one DB round-trip is made.
const getCategoryBySlug = cache(_getCategoryBySlug);
import { getCategoryDescription } from "@/data/category-descriptions";
import { CategoryProductCard } from "@/components/molecules/ProductCard";
import { CategoryMarkupFilter } from "@/components/molecules/CategoryMarkupFilter";
import { getTrendingIds } from "@/services/DiscoveryService";
import { JsonLd } from "@/components/atoms/JsonLd";
import { env } from "@/lib/env";

export const revalidate = 3600;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category Not Found — TruePrice" };
  }

  const title = `${category.name} — True Manufacturing Costs | TruePrice`;
  const description = getCategoryDescription(slug);
  const url = `${env.NEXT_PUBLIC_APP_URL}/category/${slug}`;
  const ogImageUrl = `${env.NEXT_PUBLIC_APP_URL}/api/og/category/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
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

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  // v1: pagination via ?page=N. Categories with >12 products require explicit
  // page navigation. Full pagination UI (prev/next) is a v2 enhancement.
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const perPage = 12;

  const [category, { products: rawProducts, total }, trendingIds] = await Promise.all([
    getCategoryBySlug(slug),
    getCategoryProducts(slug, page, perPage),
    getTrendingIds(20, 7),
  ]);

  const products = rawProducts.map((p) => ({
    ...p,
    isTrending: trendingIds.has(p.id),
  }));

  if (!category) {
    notFound();
  }

  const description = getCategoryDescription(slug);
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const canonicalUrl = `${appUrl}/category/${slug}`;

  // JSON-LD: ItemList of top products
  const itemListElements = products
    .filter((p) => p.markupPercent !== null)
    .slice(0, 10)
    .map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${appUrl}/product/${p.id}`,
      name: p.name,
    }));

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} — TruePrice`,
    description,
    numberOfItems: itemListElements.length,
    itemListElement: itemListElements,
  };

  // JSON-LD: CollectionPage
  const collectionPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} — True Manufacturing Costs | TruePrice`,
    description,
    url: canonicalUrl,
    numberOfItems: category.productCount,
  };

  const hasEstimates = products.some((p) => p.markupPercent !== null);
  const totalPages = Math.ceil(total / perPage);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-4xl mx-auto w-full gap-8">
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={collectionPageJsonLd} />

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
            <Link href="/categories" className="hover:text-foreground transition">
              Categories
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted-foreground/50">
            /
          </li>
          <li>
            <span className="text-foreground font-medium" aria-current="page">
              {category.name}
            </span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {category.name}
        </h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1 p-4 rounded-xl border border-border bg-card">
          <p className="text-2xl font-bold text-foreground">{category.productCount}</p>
          <p className="text-sm text-muted-foreground">
            {category.productCount === 1 ? "Product" : "Products"}
          </p>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-xl border border-border bg-card">
          <p className="text-2xl font-bold text-foreground">
            {category.avgMarkupPercent !== null
              ? `${Math.round(category.avgMarkupPercent)}%`
              : "—"}
          </p>
          <p className="text-sm text-muted-foreground">Avg markup</p>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-xl border border-border bg-card col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-foreground truncate">
            {category.topProduct ? category.topProduct.name : "—"}
          </p>
          <p className="text-sm text-muted-foreground">Highest markup product</p>
        </div>
      </div>

      {/* Featured top product */}
      {category.topProduct && (
        <section aria-labelledby="top-product-heading">
          <h2
            id="top-product-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
          >
            Highest Markup
          </h2>
          <CategoryProductCard product={category.topProduct} isTop />
        </section>
      )}

      {/* Product list with markup filter */}
      <section aria-labelledby="products-heading">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="products-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider"
          >
            All Products
            {total > 0 && (
              <span className="ml-2 font-normal normal-case text-muted-foreground/70">
                ({total})
              </span>
            )}
          </h2>
          {!hasEstimates && (
            <p className="text-xs text-muted-foreground italic">
              No cost estimates yet
            </p>
          )}
        </div>

        {products.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No products in this category yet.
          </p>
        ) : (
          <CategoryMarkupFilter
            products={products}
            topProductId={category.topProduct?.id}
            adsenseClient={env.NEXT_PUBLIC_ADSENSE_CLIENT}
            adsenseSlot={env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between pt-4">
            {hasPrev ? (
              <Link
                href={`/category/${slug}?page=${page - 1}`}
                className="text-sm text-primary hover:underline"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            {hasNext ? (
              <Link
                href={`/category/${slug}?page=${page + 1}`}
                className="text-sm text-primary hover:underline"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
