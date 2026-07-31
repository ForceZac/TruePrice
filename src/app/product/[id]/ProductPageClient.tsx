"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useCostBreakdown, useTriggerEstimate } from "@/hooks/useCostBreakdown";
import { CostBreakdownChart } from "@/components/molecules/CostBreakdownChart";
import { ConfidenceBadge } from "@/components/molecules/ConfidenceBadge";
import { CostBreakdownPanel } from "@/components/molecules/CostBreakdownPanel";
import { EstimateSkeleton } from "@/components/molecules/EstimateSkeleton";
import { ShareButton } from "@/components/atoms/ShareButton";
import { recordRecentView } from "@/lib/api";
import { addLocalRecentView, getLocalRecentIds, clearLocalRecentIds } from "@/lib/recentlyViewedLocal";
import { centsToUsd } from "@/lib/format";
import type { ProductResult } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Product data passed down from the server component. Extends the API shape with retail price. */
type ProductProp = ProductResult & { retailPriceCents?: number | null };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMarkup(percent: number): string {
  return `${Math.round(percent)}% markup`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  product: ProductProp;
  canonicalUrl: string;
  /** Passed from the server — if set, records a recently-viewed entry on mount. */
  userId: string | null;
}

export function ProductPageClient({ product, canonicalUrl, userId }: Props) {
  const { data: breakdown, isLoading, isError, error } = useCostBreakdown(product.id);
  const { mutate: trigger, isPending: isTriggering } = useTriggerEstimate(product.id);

  // Record this product view (one write per product per mount).
  // - Authenticated: write to DB, and merge any pending localStorage IDs on the same request.
  // - Unauthenticated: write to localStorage so the IDs can be merged when the user signs in.
  useEffect(() => {
    if (userId) {
      const localIds = getLocalRecentIds();
      recordRecentView(product.id, localIds.length > 0 ? localIds : undefined)
        .then(() => { if (localIds.length > 0) clearLocalRecentIds(); })
        .catch(() => {});
    } else {
      addLocalRecentView(product.id);
    }
  }, [userId, product.id]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return <EstimateSkeleton />;
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          {error instanceof Error ? error.message : "Failed to load cost estimate."}
        </span>
      </div>
    );
  }

  // ── No estimate yet — show trigger button ──────────────────────────────────
  // Also catches `undefined` (can occur briefly before TanStack Query resolves data)
  if (breakdown == null) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-10 px-6 text-center">
        <p className="text-sm text-muted-foreground max-w-xs">
          We haven&apos;t estimated this product&apos;s true cost yet.
        </p>
        <button
          type="button"
          onClick={() => trigger()}
          disabled={isTriggering}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isTriggering ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" aria-hidden="true" />
              Calculating…
            </>
          ) : (
            "Calculate Cost"
          )}
        </button>
      </div>
    );
  }

  // ── Estimate available ─────────────────────────────────────────────────────
  const isLowConfidence = breakdown.confidenceScore < 0.4;

  return (
    <div className="flex flex-col gap-6">
      {/* Low-confidence warning banner */}
      {isLowConfidence && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Low-confidence estimate — we have limited material data for this product.
            The figures below are rough category-level approximations.
          </span>
        </div>
      )}

      {/* Key stats above the fold */}
      <div className="grid grid-cols-3 gap-3">
        {product.retailPriceCents != null && (
          <StatCard
            label="Retail price"
            value={centsToUsd(product.retailPriceCents)}
          />
        )}
        <StatCard
          label="Estimated cost"
          value={centsToUsd(breakdown.totalCostCents)}
        />
        {breakdown.markupPercent != null && (
          <StatCard
            label="Markup"
            value={formatMarkup(breakdown.markupPercent)}
            highlight
          />
        )}
      </div>

      {/* Donut chart */}
      <section aria-labelledby="chart-heading">
        <h2
          id="chart-heading"
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
        >
          Cost Breakdown
        </h2>
        <CostBreakdownChart breakdown={breakdown} />
      </section>

      {/* Cost detail panel */}
      <CostBreakdownPanel breakdown={breakdown} />

      {/* Confidence + share row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ConfidenceBadge
          confidenceScore={breakdown.confidenceScore}
          confidenceReason={breakdown.confidenceReason}
        />
        <ShareButton url={canonicalUrl} label="Share" />
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border p-3 min-w-0">
      <span className="text-xs text-muted-foreground truncate">{label}</span>
      <span
        className={`text-base font-bold tabular-nums leading-tight break-words ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
