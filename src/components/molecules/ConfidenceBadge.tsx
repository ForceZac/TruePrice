"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tier helpers ─────────────────────────────────────────────────────────────

type ConfidenceTier = "High" | "Medium" | "Low";

function getTier(score: number): ConfidenceTier {
  if (score >= 0.7) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

const TIER_STYLES: Record<ConfidenceTier, string> = {
  High:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  Low:    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  confidenceScore: number;
  confidenceReason: string;
}

export function ConfidenceBadge({ confidenceScore, confidenceReason }: Props) {
  const [expanded, setExpanded] = useState(false);
  const tier = getTier(confidenceScore);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-fit"
        aria-expanded={expanded}
      >
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
            TIER_STYLES[tier]
          )}
        >
          {tier} confidence
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(confidenceScore * 100)}%
        </span>
        {expanded ? (
          <ChevronUp className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <p className="text-xs text-muted-foreground leading-relaxed pl-1 max-w-prose">
          {confidenceReason}
        </p>
      )}
    </div>
  );
}
