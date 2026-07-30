"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CostBreakdownResult } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function centsToUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Per-material cost entry returned by the estimate API.
 * The Cost Estimation Service doesn't expose line items in v1 — we show the
 * rolled-up material total and note how it was calculated from the methodology.
 */
interface Props {
  breakdown: CostBreakdownResult;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MaterialCostList({ breakdown }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-left hover:bg-muted/50 transition"
        aria-expanded={expanded}
      >
        <span>Material costs</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-normal tabular-nums">
            {centsToUsd(breakdown.materialCostCents)}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {/* Cost breakdown rows */}
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Materials</dt>
              <dd className="tabular-nums">{centsToUsd(breakdown.materialCostCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Labor</dt>
              <dd className="tabular-nums">{centsToUsd(breakdown.laborCostCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Overhead</dt>
              <dd className="tabular-nums">{centsToUsd(breakdown.overheadCostCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">{centsToUsd(breakdown.shippingCostCents)}</dd>
            </div>
          </dl>

          {/* Methodology disclosure */}
          <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">How this was calculated</p>
            <p>{breakdown.methodology}</p>
          </div>

          <p className="text-xs text-muted-foreground">
            Calculated{" "}
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(breakdown.calculatedAt))}
          </p>
        </div>
      )}
    </div>
  );
}
