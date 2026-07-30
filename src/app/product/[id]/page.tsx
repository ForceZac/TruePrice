import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductById } from "@/services/ProductService";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return { title: "Product Not Found — TruePrice" };
  }

  return {
    title: `${product.name} — TruePrice`,
    description: `See what ${product.name} actually costs to make — raw materials, labor, and overhead.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-2xl mx-auto w-full gap-6">
      <Link
        href="/search"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition w-fit"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to search
      </Link>

      {/* Product header */}
      <div className="flex gap-4 items-start">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-24 w-24 rounded-xl object-contain bg-muted shrink-0"
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

      {/* Cost breakdown placeholder */}
      <section aria-labelledby="cost-heading">
        <h2
          id="cost-heading"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
        >
          Cost Breakdown
        </h2>
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
          <p className="text-sm">Cost breakdown coming in Goal 4.</p>
          <p className="text-xs mt-1">
            We&apos;ll calculate raw material, labor, and overhead costs based on product data.
          </p>
        </div>
      </section>
    </main>
  );
}
