"use client";

import Link from "next/link";
import { ScanLine } from "lucide-react";
import { SearchInput } from "@/components/molecules/SearchInput";
import { useProductSearch } from "@/hooks/useProductLookup";
import type { ProductResult } from "@/lib/api";

interface SearchPageClientProps {
  initialQuery: string;
}

export function SearchPageClient({ initialQuery }: SearchPageClientProps) {
  const { data, isLoading, isError } = useProductSearch(initialQuery);

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-3xl mx-auto w-full gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Search products
      </h1>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchInput defaultValue={initialQuery} autoFocus={!initialQuery} />
        </div>
        <Link
          href="/scan"
          aria-label="Scan barcode"
          className="flex items-center justify-center h-14 w-14 rounded-full border border-input bg-background text-foreground shadow-sm hover:bg-muted transition"
        >
          <ScanLine className="h-6 w-6" aria-hidden="true" />
        </Link>
      </div>

      {initialQuery && (
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Searching…"
            : isError
              ? "Search failed — please try again."
              : `${data?.total ?? 0} result${data?.total === 1 ? "" : "s"} for "${initialQuery}"`}
        </p>
      )}

      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && data?.products && data.products.length > 0 && (
        <ul className="grid gap-3" role="list">
          {data.products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}

      {!isLoading && !isError && initialQuery && data?.products.length === 0 && (
        <EmptyState query={initialQuery} />
      )}

      {!initialQuery && (
        <div className="text-center text-muted-foreground py-12">
          <p className="text-base">Type a product name above to search.</p>
          <p className="text-sm mt-1">
            Or{" "}
            <Link href="/scan" className="underline underline-offset-4">
              scan a barcode
            </Link>
            .
          </p>
        </div>
      )}
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductCard({ product }: { product: ProductResult }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted transition"
    >
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt=""
          className="h-16 w-16 rounded-lg object-contain bg-muted shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="h-16 w-16 rounded-lg bg-muted shrink-0 flex items-center justify-center text-2xl">
          📦
        </div>
      )}

      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="font-medium text-foreground truncate">{product.name}</p>
        {product.brand && (
          <p className="text-sm text-muted-foreground truncate">{product.brand}</p>
        )}
        <p className="text-xs text-muted-foreground">{product.category}</p>
      </div>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card animate-pulse">
      <div className="h-16 w-16 rounded-lg bg-muted shrink-0" />
      <div className="flex flex-col gap-2 flex-1">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/4" />
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-lg font-medium text-foreground">
        No products found for &ldquo;{query}&rdquo;
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Try scanning the barcode or searching with different keywords.
      </p>
      <Link
        href="/scan"
        className="inline-block mt-4 text-sm text-primary underline underline-offset-4"
      >
        Scan barcode instead →
      </Link>
    </div>
  );
}
