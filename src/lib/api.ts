/**
 * Centralized API client — typed request/response for all TruePrice endpoints.
 *
 * Never use raw fetch in components. Use TanStack Query hooks that call these helpers.
 */

import { env } from "@/lib/env";

const BASE_URL = env.NEXT_PUBLIC_APP_URL;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductResult {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  category: string;
  ingredients?: string | null;
  weightGrams?: number | null;
  countryOfOrigin?: string | null;
  upc?: string | null;
  ean?: string | null;
  source: string;
  cachedAt?: string; // ISO 8601
}

export interface LookupResponse {
  product: ProductResult | null;
  found: boolean;
}

export interface SearchResponse {
  products: ProductResult[];
  query: string;
  total: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

/** Look up a product by UPC/EAN barcode. */
export async function lookupByBarcode(barcode: string): Promise<LookupResponse> {
  return apiFetch<LookupResponse>("/api/products/lookup", {
    method: "POST",
    body: JSON.stringify({ barcode }),
  });
}

/** Text search over cached products. */
export async function searchProducts(query: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query });
  return apiFetch<SearchResponse>(`/api/products/search?${params.toString()}`);
}

/** Get a single product by internal ID. */
export async function getProduct(id: string): Promise<ProductResult | null> {
  const data = await apiFetch<{ product: ProductResult | null }>(
    `/api/products/${encodeURIComponent(id)}`
  );
  return data.product;
}
