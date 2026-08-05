"use client";

import Link from "next/link";
import { ScanLine } from "lucide-react";
import { SearchInput } from "@/components/molecules/SearchInput";
import { ProductCard, ProductCardSkeleton } from "@/components/molecules/ProductCard";
import { useProductSearch } from "@/hooks/useProductLookup";

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

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-lg font-medium text-foreground">
        No products found for &ldquo;{query}&rdquo;
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Try scanning the barcode or searching with different keywords.
      </p>
      <div className="flex flex-col items-center gap-2 mt-4">
        <Link
          href="/scan"
          className="text-sm text-primary underline underline-offset-4"
        >
          Scan barcode instead →
        </Link>
        <Link
          href="/submit-product"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Don&apos;t see it? Submit it →
        </Link>
      </div>
    </div>
  );
}
