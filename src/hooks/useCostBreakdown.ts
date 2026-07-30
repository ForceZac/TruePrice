"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getEstimate, triggerEstimate, ApiError } from "@/lib/api";
import type { CostBreakdownResult } from "@/lib/api";

export type { CostBreakdownResult };

// ─── Query key factory ────────────────────────────────────────────────────────

const estimateKey = (productId: string) => ["cost-estimate", productId] as const;

// ─── Fetch cached breakdown ───────────────────────────────────────────────────

/**
 * Fetches the cached cost breakdown for a product.
 *
 * Returns `null` when no estimate exists yet (404 from the API).
 * The calling component should show the "Calculate Cost" trigger in that case.
 */
export function useCostBreakdown(productId: string) {
  return useQuery<CostBreakdownResult | null>({
    queryKey: estimateKey(productId),
    queryFn: async () => {
      try {
        return await getEstimate(productId);
      } catch (err) {
        // 404 means "not estimated yet" — return null instead of throwing so
        // the component can show the trigger button instead of an error state.
        if (err instanceof ApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // treat fresh for 5 min (commodity prices update daily)
    enabled: Boolean(productId),
  });
}

// ─── Trigger estimation ───────────────────────────────────────────────────────

/**
 * Mutation that POSTs to trigger cost estimation for a product.
 *
 * On success, the returned breakdown is written directly into the query cache
 * so the UI updates immediately without a refetch round-trip.
 */
export function useTriggerEstimate(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerEstimate(productId),
    onSuccess: (breakdown) => {
      queryClient.setQueryData<CostBreakdownResult | null>(
        estimateKey(productId),
        breakdown
      );
    },
  });
}
