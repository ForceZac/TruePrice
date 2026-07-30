import Link from "next/link";
import type { CategorySummary } from "@/services/CategoryService";

/** Emoji icons keyed by category slug. */
const CATEGORY_ICONS: Record<string, string> = {
  "food-beverage": "🥤",
  "clothing-textiles": "👕",
  electronics: "📱",
  "cosmetics-personal-care": "💄",
  "home-kitchen": "🏠",
};

function formatMarkup(pct: number | null): string {
  if (pct === null) return "No estimates yet";
  return `${Math.round(pct)}% avg markup`;
}

interface CategoryCardProps {
  category: CategorySummary;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const icon = CATEGORY_ICONS[category.slug] ?? "📦";

  return (
    <Link
      href={`/category/${category.slug}`}
      className="flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card hover:bg-muted transition group"
    >
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>

      <div className="flex flex-col gap-1">
        <p className="font-semibold text-foreground group-hover:text-primary transition">
          {category.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {category.productCount === 1
            ? "1 product"
            : `${category.productCount} products`}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatMarkup(category.avgMarkupPercent)}
        </p>
      </div>
    </Link>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card animate-pulse">
      <div className="h-10 w-10 rounded-lg bg-muted" />
      <div className="flex flex-col gap-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}
