import Link from "next/link";
import { ConfidenceBadge } from "@/components/molecules/ConfidenceBadge";
import { centsToUsd } from "@/lib/format";

interface Props {
  rank: number;
  id: string;
  name: string;
  category: string;
  markupPercent: number;
  markupMultiplier: number;
  totalCostCents: number;
  retailPriceCents: number | null;
  confidence: string;
  confidenceScore: number;
}

/**
 * Card for a single entry on the /leaderboard page.
 * Links to the product page. Shows rank, markup, cost vs retail.
 */
export function LeaderboardCard({
  rank,
  id,
  name,
  category,
  markupPercent,
  markupMultiplier,
  totalCostCents,
  retailPriceCents,
  confidence,
  confidenceScore,
}: Props) {
  return (
    <Link
      href={`/product/${id}`}
      className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition group"
    >
      {/* Rank */}
      <span className="shrink-0 w-8 text-2xl font-bold tabular-nums text-muted-foreground/60 text-center">
        {rank}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-foreground leading-tight group-hover:text-primary transition truncate">
              {name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{category}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-primary tabular-nums">
              {markupMultiplier.toFixed(1)}×
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {Math.round(markupPercent)}% markup
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
          <span>
            Cost: <span className="font-medium text-foreground">{centsToUsd(totalCostCents)}</span>
          </span>
          {retailPriceCents != null && (
            <span>
              Retail:{" "}
              <span className="font-medium text-foreground">{centsToUsd(retailPriceCents)}</span>
            </span>
          )}
          <ConfidenceBadge
            confidenceScore={confidenceScore}
            confidenceReason={`${confidence} confidence estimate`}
          />
        </div>
      </div>
    </Link>
  );
}
