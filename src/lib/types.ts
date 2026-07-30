/**
 * Shared domain types used across service and component layers.
 *
 * Components import types from here — never directly from service modules.
 * Services may also import these types and re-export them for backward compat.
 */

// ─── Category types ───────────────────────────────────────────────────────────

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  /** Average markup % across products that have a CostBreakdown. Null if none. */
  avgMarkupPercent: number | null;
}

export interface CategoryProductItem {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  retailPriceCents: number | null;
  /** Most recent CostBreakdown total in cents. Null if no estimate. */
  estimatedCostCents: number | null;
  markupPercent: number | null;
}

export interface CategoryDetail extends CategorySummary {
  /** Top product by markup % — null if no estimates exist. */
  topProduct: CategoryProductItem | null;
}
