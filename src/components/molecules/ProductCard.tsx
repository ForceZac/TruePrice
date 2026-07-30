import Link from "next/link";
import Image from "next/image";
import type { ProductResult } from "@/lib/api";
import type { CategoryProductItem } from "@/services/CategoryService";

// ─── Search result card (existing) ───────────────────────────────────────────

export function ProductCard({ product }: { product: ProductResult }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted transition"
    >
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt=""
          width={64}
          height={64}
          className="rounded-lg object-contain bg-muted shrink-0"
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

export function ProductCardSkeleton() {
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

// ─── Category product card ────────────────────────────────────────────────────

function centsToUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

interface CategoryProductCardProps {
  product: CategoryProductItem;
  /** If true, renders a "🔥 Highest markup" badge */
  isTop?: boolean;
}

export function CategoryProductCard({ product, isTop }: CategoryProductCardProps) {
  const hasEstimate = product.estimatedCostCents !== null;

  return (
    <Link
      href={`/product/${product.id}`}
      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted transition group"
    >
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt=""
          width={64}
          height={64}
          className="rounded-lg object-contain bg-muted shrink-0"
        />
      ) : (
        <div className="h-16 w-16 rounded-lg bg-muted shrink-0 flex items-center justify-center text-2xl">
          📦
        </div>
      )}

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground truncate">{product.name}</p>
          {isTop && (
            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full shrink-0">
              🔥 Highest markup
            </span>
          )}
        </div>

        {product.brand && (
          <p className="text-sm text-muted-foreground truncate">{product.brand}</p>
        )}

        {hasEstimate ? (
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground mt-0.5">
            {product.retailPriceCents !== null && (
              <span>Retail: {centsToUsd(product.retailPriceCents)}</span>
            )}
            {product.estimatedCostCents !== null && (
              <span>Cost: {centsToUsd(product.estimatedCostCents)}</span>
            )}
            {product.markupPercent !== null && (
              <span className="font-semibold text-foreground">
                {Math.round(product.markupPercent)}% markup
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            Estimate pending
          </p>
        )}
      </div>
    </Link>
  );
}
