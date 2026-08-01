"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchWatchlist,
  saveToWatchlist,
  unsaveFromWatchlist,
} from "@/lib/api";

const WATCHLIST_KEY = ["watchlist"] as const;

/**
 * Returns the full list of saved product IDs for the current user.
 * Returns an empty array when the user is unauthenticated (no throw).
 */
export function useWatchlistIds() {
  return useQuery<string[]>({
    queryKey: WATCHLIST_KEY,
    queryFn: fetchWatchlist,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Convenience hook for a single product — returns whether it's in the watchlist
 * plus save/unsave mutations with optimistic updates.
 */
export function useWatchlist(productId: string) {
  const queryClient = useQueryClient();
  const { data: ids = [], isLoading } = useWatchlistIds();

  const isSaved = ids.includes(productId);

  const save = useMutation({
    mutationFn: () => saveToWatchlist(productId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: WATCHLIST_KEY });
      const prev = queryClient.getQueryData<string[]>(WATCHLIST_KEY) ?? [];
      queryClient.setQueryData<string[]>(WATCHLIST_KEY, (old = []) =>
        old.includes(productId) ? old : [...old, productId]
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData<string[]>(WATCHLIST_KEY, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  const unsave = useMutation({
    mutationFn: () => unsaveFromWatchlist(productId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: WATCHLIST_KEY });
      const prev = queryClient.getQueryData<string[]>(WATCHLIST_KEY) ?? [];
      queryClient.setQueryData<string[]>(WATCHLIST_KEY, (old = []) =>
        old.filter((id) => id !== productId)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData<string[]>(WATCHLIST_KEY, ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WATCHLIST_KEY });
    },
  });

  return { isSaved, isLoading, save, unsave };
}
