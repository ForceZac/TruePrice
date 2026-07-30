import Link from "next/link";
import Image from "next/image";
import type { ProductResult } from "@/lib/api";

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
