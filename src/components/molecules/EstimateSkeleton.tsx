import { cn } from "@/lib/utils";

// ─── Shimmer atom ─────────────────────────────────────────────────────────────

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted animate-pulse",
        className
      )}
      aria-hidden="true"
    />
  );
}

// ─── EstimateSkeleton ─────────────────────────────────────────────────────────

/**
 * Loading skeleton displayed while a cost estimate is being computed or
 * while the initial GET is in-flight.
 */
export function EstimateSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-label="Loading cost estimate…"
    >
      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-6 w-20" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <Shimmer className="h-60 w-full rounded-xl" />

      {/* Material list placeholder */}
      <Shimmer className="h-12 w-full rounded-xl" />

      {/* Confidence badge placeholder */}
      <Shimmer className="h-6 w-40 rounded-full" />

      <span className="sr-only">Loading cost estimate…</span>
    </div>
  );
}
