/**
 * product-overrides — manual corrections for specific products.
 *
 * Allows correcting a product's material composition or retail price without
 * a DB migration. Overrides are keyed by UPC or EAN and applied in
 * CostEstimationService before estimation runs.
 *
 * Usage: add an entry here when you know a product's exact material mix
 * from a spec sheet, teardown report, or label that the automatic parser
 * doesn't capture correctly.
 */

export interface ProductOverride {
  /** UPC-A (12-digit) barcode, if applicable. */
  upc?: string;
  /** EAN-13 barcode, if applicable. */
  ean?: string;
  /** Corrected retail price in cents. */
  retailPriceCents?: number;
  /** Corrected subcategory slug. */
  subcategory?: string;
  /**
   * Corrected material mix. When present, replaces the ProductMaterial rows
   * from the DB for estimation purposes (does not modify the DB).
   * Percentages should sum to ≤1.0.
   */
  materials?: Array<{ materialName: string; percentage: number }>;
}

/**
 * Manual product overrides. Add entries here to correct specific products.
 * Keyed by UPC or EAN — UPC takes precedence when both are present.
 */
const overrides: ProductOverride[] = [
  // Example (uncomment and edit to use):
  // {
  //   upc: "049000006346",  // Coca-Cola 12oz
  //   retailPriceCents: 149,
  //   subcategory: "beverage",
  //   materials: [
  //     { materialName: "water", percentage: 0.89 },
  //     { materialName: "sugar", percentage: 0.11 },
  //   ],
  // },
];

// ── Lookup index ─────────────────────────────────────────────────────────────

const upcIndex = new Map<string, ProductOverride>();
const eanIndex = new Map<string, ProductOverride>();

for (const o of overrides) {
  if (o.upc) upcIndex.set(o.upc, o);
  if (o.ean) eanIndex.set(o.ean, o);
}

/**
 * Look up a product override by UPC or EAN.
 * UPC takes precedence when both are provided.
 * Returns null if no override exists.
 */
export function getProductOverride(
  upc: string | null | undefined,
  ean: string | null | undefined
): ProductOverride | null {
  if (upc) {
    const match = upcIndex.get(upc);
    if (match) return match;
  }
  if (ean) {
    const match = eanIndex.get(ean);
    if (match) return match;
  }
  return null;
}
