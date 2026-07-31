"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";

interface Props {
  productId: string;
  productName: string;
  /** Passed from the server component — avoids a client-side auth round-trip. */
  isAuthenticated: boolean;
}

/**
 * Saves/unsaves a product from the user's watchlist.
 *
 * - Authenticated: toggles saved state with an optimistic update.
 * - Unauthenticated: shows a soft "Sign in to save" nudge linking to /login.
 */
export function SaveButton({ productId, productName, isAuthenticated }: Props) {
  const pathname = usePathname();
  const { isSaved, isLoading, save, unsave } = useWatchlist(productId);

  // ── Unauthenticated nudge ──────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition"
        aria-label={`Sign in to save ${productName}`}
      >
        <Bookmark className="h-4 w-4" aria-hidden="true" />
        Sign in to save
      </Link>
    );
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium opacity-50"
        aria-label="Loading watchlist"
      >
        <Bookmark className="h-4 w-4" aria-hidden="true" />
        Save
      </button>
    );
  }

  const isPending = save.isPending || unsave.isPending;

  function handleClick() {
    if (isSaved) {
      unsave.mutate();
    } else {
      save.mutate();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
        isSaved
          ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
          : "border-border bg-background text-foreground shadow-sm hover:bg-muted"
      }`}
      aria-label={
        isSaved
          ? `Remove ${productName} from watchlist`
          : `Save ${productName} to watchlist`
      }
      aria-pressed={isSaved}
    >
      {isSaved ? (
        <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden="true" />
      )}
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}
