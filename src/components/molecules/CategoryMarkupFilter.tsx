"use client";

import { useState, Fragment } from "react";
import type { CategoryProductItem } from "@/lib/types";
import { CategoryProductCard } from "@/components/molecules/ProductCard";
import { AdSlot } from "@/components/atoms/AdSlot";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTier = "all" | "under3" | "3to7" | "over7";

interface FilterBadge {
  id: FilterTier;
  label: string;
}

const FILTER_BADGES: FilterBadge[] = [
  { id: "all", label: "All" },
  { id: "under3", label: "Under 3×" },
  { id: "3to7", label: "3–7×" },
  { id: "over7", label: "Over 7×" },
];

function matchesTier(markupPercent: number | null, tier: FilterTier): boolean {
  if (tier === "all") return true;
  if (markupPercent === null) return false;
  if (tier === "under3") return markupPercent < 300;
  if (tier === "3to7") return markupPercent >= 300 && markupPercent < 700;
  return markupPercent >= 700; // "over7"
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CategoryMarkupFilterProps {
  products: CategoryProductItem[];
  topProductId?: string | null;
  adsenseClient?: string;
  adsenseSlot?: string;
}

/**
 * Client component that renders the category product list with markup-range
 * filter badges. Filtering is applied client-side; no extra API calls.
 */
export function CategoryMarkupFilter({
  products,
  topProductId,
  adsenseClient,
  adsenseSlot,
}: CategoryMarkupFilterProps) {
  const [activeTier, setActiveTier] = useState<FilterTier>("all");

  const filtered = products.filter((p) => {
    if (activeTier === "all") return true;
    // Products without markupPercent are always shown under "All" only
    if (p.markupPercent === null) return false;
    return matchesTier(p.markupPercent, activeTier);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filter badges */}
      <div
        role="group"
        aria-label="Filter by markup range"
        className="flex items-center gap-2 flex-wrap"
      >
        {FILTER_BADGES.map((badge) => (
          <button
            key={badge.id}
            type="button"
            onClick={() => setActiveTier(badge.id)}
            aria-pressed={activeTier === badge.id}
            className={`px-3 py-1 text-sm rounded-full border transition ${
              activeTier === badge.id
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
            }`}
          >
            {badge.label}
          </button>
        ))}
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-6 text-center">
          No products match this filter.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((product, index) => (
            <Fragment key={product.id}>
              <CategoryProductCard
                product={product}
                isTop={
                  topProductId === product.id && product.markupPercent !== null
                }
              />
              {index === 5 && adsenseClient && adsenseSlot && (
                <AdSlot
                  publisherId={adsenseClient}
                  slotId={adsenseSlot}
                  format="leaderboard"
                />
              )}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
