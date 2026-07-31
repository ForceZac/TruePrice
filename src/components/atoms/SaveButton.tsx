"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";

interface Props {
  productId: string;
  productName: string;
}

/**
 * Saves/unsaves a product from the user's watchlist.
 *
 * - Authenticated: toggles saved state with an optimistic update.
 * - Unauthenticated: shows a soft sign-in nudge instead of toggling.
 */
export function SaveButton({ productId, productName }: Props) {
  const { isSaved, isLoading, save, unsave } = useWatchlist(productId);

  const isPending = save.isPending || unsave.isPending;

  function handleClick() {
    if (isSaved) {
      unsave.mutate();
    } else {
      save.mutate(undefined, {
        onError: (err) => {
          // 401 = not signed in — redirect to login
          if (err instanceof Error && err.message.includes("401")) {
            window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
          }
        },
      });
    }
  }

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
