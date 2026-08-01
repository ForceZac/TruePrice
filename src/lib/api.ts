/**
 * Centralized API client — typed request/response for all TruePrice endpoints.
 *
 * Never use raw fetch in components. Use TanStack Query hooks that call these helpers.
 */

import { clientEnv } from "@/lib/env.client";

const BASE_URL = clientEnv.NEXT_PUBLIC_APP_URL;

// ─── Typed API error ──────────────────────────────────────────────────────────

/** Thrown by apiFetch when the server returns a non-2xx status. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
    throw new ApiError(res.status, `API ${path} failed (${res.status}): ${body}`);
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

// ─── Cost estimate types ──────────────────────────────────────────────────────

export interface CostBreakdownResult {
  id: string;
  productId: string;
  materialCostCents: number;
  laborCostCents: number;
  overheadCostCents: number;
  shippingCostCents: number;
  totalCostCents: number;
  retailPriceCents: number | null;
  markupPercent: number | null;
  confidenceScore: number;
  confidenceReason: string;
  methodology: string;
  calculatedAt: string; // ISO 8601
}

// ─── Cost estimate endpoints ──────────────────────────────────────────────────

/**
 * GET /api/products/[id]/estimate
 *
 * Returns the most recent cached cost breakdown. Throws if none exists yet
 * (the caller should treat a 404-shaped error as "not estimated yet").
 */
export async function getEstimate(
  productId: string
): Promise<CostBreakdownResult> {
  const data = await apiFetch<{ breakdown: CostBreakdownResult }>(
    `/api/products/${encodeURIComponent(productId)}/estimate`
  );
  return data.breakdown;
}

/**
 * POST /api/products/[id]/estimate
 *
 * Triggers (or returns cached) cost estimation. Returns the breakdown.
 */
export async function triggerEstimate(
  productId: string
): Promise<CostBreakdownResult> {
  const data = await apiFetch<{ breakdown: CostBreakdownResult }>(
    `/api/products/${encodeURIComponent(productId)}/estimate`,
    { method: "POST" }
  );
  return data.breakdown;
}

// ─── Watchlist endpoints ──────────────────────────────────────────────────────

/** GET /api/user/watchlist — returns the current user's saved product IDs. */
export async function fetchWatchlist(): Promise<string[]> {
  try {
    const data = await apiFetch<{ watchlist: Array<{ productId: string }> }>(
      "/api/user/watchlist"
    );
    return data.watchlist.map((w) => w.productId);
  } catch (err) {
    // 401 = not signed in — return empty rather than throwing
    if (err instanceof ApiError && err.status === 401) return [];
    throw err;
  }
}

/** POST /api/user/watchlist — saves a product. Returns true if newly saved; false if already saved. */
export async function saveToWatchlist(productId: string): Promise<boolean> {
  try {
    await apiFetch("/api/user/watchlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) return false;
    throw err;
  }
}

/** DELETE /api/user/watchlist/[productId] — removes a product from the watchlist. */
export async function unsaveFromWatchlist(productId: string): Promise<void> {
  await apiFetch(`/api/user/watchlist/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

/** POST /api/user/recent — records a product view (and optionally merges localStorage IDs). */
export async function recordRecentView(
  productId: string,
  localIds?: string[]
): Promise<void> {
  await apiFetch("/api/user/recent", {
    method: "POST",
    body: JSON.stringify({ productId, ...(localIds ? { localIds } : {}) }),
  });
}

/** POST /api/user/recent — merges localStorage recently-viewed IDs on sign-in (no productId). */
export async function mergeLocalRecent(localIds: string[]): Promise<void> {
  await apiFetch("/api/user/recent", {
    method: "POST",
    body: JSON.stringify({ localIds }),
  });
}
