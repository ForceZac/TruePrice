"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lookupByBarcode, searchProducts, getProduct } from "@/lib/api";
import type { ProductResult } from "@/lib/api";

// ─── Barcode lookup ───────────────────────────────────────────────────────────

export function useBarcodeLookup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (barcode: string) => lookupByBarcode(barcode),
    onSuccess: (data) => {
      if (data.product) {
        // Pre-populate the product cache so the product page loads instantly
        queryClient.setQueryData(["product", data.product.id], data.product);
      }
    },
  });
}

// ─── Text search ──────────────────────────────────────────────────────────────

export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ["product-search", query],
    queryFn: () => searchProducts(query),
    enabled: query.trim().length > 0,
    staleTime: 60_000, // 1 minute
  });
}

// ─── Single product ───────────────────────────────────────────────────────────

export function useProduct(id: string) {
  return useQuery<ProductResult | null>({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
    staleTime: 5 * 60_000, // 5 minutes
  });
}
