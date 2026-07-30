import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCategoryBySlug,
  getCategoryProducts,
  getAllCategorySlugs,
} from "@/services/CategoryService";
import { getCategoryDescription } from "@/data/category-descriptions";
import { CategoryProductCard } from "@/components/molecules/ProductCard";
import { env } from "@/lib/env";

export const revalidate = 3600;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "TruePrice",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [category, { products, total }] = await Promise.all([
    getCategoryBySlug(slug),
    getCategoryProducts(slug),
  ]);

  if (!category) {
    notFound();
  }

  const description = getCategoryDescription(slug);
  const appUrl = env.NEXT_PUBLIC_APP_URL;

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} — TruePrice`,
    description,
    numberOfItems: itemListElements.length,
    itemListElement: itemListElements,
  };

  const hasEstimates = products.some((p) => p.markupPercent !== null);

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-4xl mx-auto w-full gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

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

      {/* Product list */}
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
          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <CategoryProductCard
                key={product.id}
                product={product}
                isTop={
                  category.topProduct?.id === product.id &&
                  product.markupPercent !== null
                }
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
