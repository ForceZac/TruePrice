import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductById } from "@/services/ProductService";
import { env } from "@/lib/env";
import { ProductPageClient } from "./ProductPageClient";
import { Breadcrumb } from "@/components/atoms/Breadcrumb";
import { AdSlot } from "@/components/atoms/AdSlot";
import type { ProductResult } from "@/lib/api";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return { title: "Product Not Found — TruePrice" };
  }

  const title = `${product.name} — TruePrice`;
  const description = `See what ${product.name} actually costs to make — raw materials, labor, and overhead. True cost revealed by TruePrice.`;
  const url = `${env.NEXT_PUBLIC_APP_URL}/product/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "TruePrice",
      type: "website",
      ...(product.imageUrl
        ? { images: [{ url: product.imageUrl, alt: product.name }] }
        : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const canonicalUrl = `${env.NEXT_PUBLIC_APP_URL}/product/${id}`;

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...(product.categorySlug
      ? [
          { label: "Categories", href: "/categories" },
          {
            label: product.category,
            href: `/category/${product.categorySlug}`,
          },
        ]
      : []),
    { label: product.name, href: `/product/${id}` },
  ];

  // Map ServiceResult → API-level ProductResult shape expected by the client component.
  // retailPriceCents is passed through so the stats row can show the retail price.
  const productForClient: ProductResult & { retailPriceCents?: number | null } = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    imageUrl: product.imageUrl,
    category: product.category,
    ingredients: product.ingredients,
    weightGrams: product.weightGrams,
    countryOfOrigin: product.countryOfOrigin,
    upc: product.upc,
    ean: product.ean,
    source: product.source,
    retailPriceCents: product.retailPriceCents,
  };

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-2xl mx-auto w-full gap-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Product header */}
      <div className="flex gap-4 items-start">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={96}
            height={96}
            className="rounded-xl object-contain bg-muted shrink-0"
          />
        ) : (
          <div className="h-24 w-24 rounded-xl bg-muted shrink-0 flex items-center justify-center text-4xl">
            📦
          </div>
        )}

        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
            {product.name}
          </h1>
          {product.brand && (
            <p className="text-base text-muted-foreground">{product.brand}</p>
          )}
          <span className="inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full w-fit mt-1">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product details */}
      <section aria-labelledby="details-heading">
        <h2
          id="details-heading"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
        >
          Product Details
        </h2>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {product.description && (
            <>
              <dt className="text-muted-foreground">Description</dt>
              <dd className="text-foreground col-span-1">{product.description}</dd>
            </>
          )}
          {product.weightGrams && (
            <>
              <dt className="text-muted-foreground">Weight</dt>
              <dd className="text-foreground">
                {product.weightGrams >= 1000
                  ? `${(product.weightGrams / 1000).toFixed(2)} kg`
                  : `${product.weightGrams} g`}
              </dd>
            </>
          )}
          {product.countryOfOrigin && (
            <>
              <dt className="text-muted-foreground">Made in</dt>
              <dd className="text-foreground">{product.countryOfOrigin}</dd>
            </>
          )}
          {product.upc && (
            <>
              <dt className="text-muted-foreground">UPC</dt>
              <dd className="font-mono text-foreground">{product.upc}</dd>
            </>
          )}
          {product.ean && (
            <>
              <dt className="text-muted-foreground">EAN</dt>
              <dd className="font-mono text-foreground">{product.ean}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Source</dt>
          <dd className="text-foreground capitalize">{product.source.replace(/-/g, " ")}</dd>
        </dl>
      </section>

      {/* Ingredients / Composition */}
      {product.ingredients && (
        <section aria-labelledby="ingredients-heading">
          <h2
            id="ingredients-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
          >
            Ingredients / Composition
          </h2>
          <p className="text-sm text-foreground leading-relaxed bg-muted rounded-lg px-4 py-3">
            {product.ingredients}
          </p>
        </section>
      )}

      {/* Cost breakdown — client component handles fetch / trigger / display */}
      <section aria-labelledby="cost-heading">
        <h2
          id="cost-heading"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
        >
          True Cost
        </h2>
        <ProductPageClient product={productForClient} canonicalUrl={canonicalUrl} />
      </section>

      {/* Ad unit — below cost breakdown */}
      {env.NEXT_PUBLIC_ADSENSE_CLIENT && (
        <AdSlot
          publisherId={env.NEXT_PUBLIC_ADSENSE_CLIENT}
          slotId="product-page-rectangle"
          format="rectangle"
        />
      )}
    </main>
  );
}
