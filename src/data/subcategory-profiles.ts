/**
 * subcategory-profiles — default material mixes for product subcategories.
 *
 * Used by CostEstimationService when a product has no linked ProductMaterial rows
 * but has a subcategory field set. Provides MEDIUM-confidence estimates that are
 * more accurate than raw category-level averages.
 *
 * Key format: `${categorySlug}:${subcategory}`
 */

export interface SubcategoryProfile {
  subcategory: string;
  categorySlug: string;
  /** Materials and their proportion of total product weight (0.0–1.0, should sum ≤1.0). */
  defaultMaterialMix: Array<{ materialName: string; percentage: number }>;
  /** Default product weight in grams when product.weightGrams is null. */
  defaultWeightGrams: number;
  /** Estimated manufacturing hours per unit. */
  defaultLaborHours: number;
}

const profiles: SubcategoryProfile[] = [
  // ── Clothing & Textiles ──────────────────────────────────────────────────────
  {
    subcategory: "t-shirt",
    categorySlug: "clothing-textiles",
    defaultMaterialMix: [
      { materialName: "cotton", percentage: 0.6 },
      { materialName: "polyester", percentage: 0.4 },
    ],
    defaultWeightGrams: 200,
    defaultLaborHours: 1.2,
  },
  {
    subcategory: "jeans",
    categorySlug: "clothing-textiles",
    defaultMaterialMix: [
      { materialName: "cotton", percentage: 0.98 },
      { materialName: "elastane", percentage: 0.02 },
    ],
    defaultWeightGrams: 800,
    defaultLaborHours: 2.0,
  },
  {
    subcategory: "shoes",
    categorySlug: "clothing-textiles",
    defaultMaterialMix: [
      { materialName: "leather", percentage: 0.55 },
      { materialName: "rubber", percentage: 0.25 },
      { materialName: "polyester", percentage: 0.20 },
    ],
    defaultWeightGrams: 700,
    defaultLaborHours: 2.5,
  },
  {
    subcategory: "hoodie",
    categorySlug: "clothing-textiles",
    defaultMaterialMix: [
      { materialName: "cotton", percentage: 0.8 },
      { materialName: "polyester", percentage: 0.2 },
    ],
    defaultWeightGrams: 500,
    defaultLaborHours: 1.5,
  },
  {
    subcategory: "jacket",
    categorySlug: "clothing-textiles",
    defaultMaterialMix: [
      { materialName: "polyester", percentage: 0.6 },
      { materialName: "nylon", percentage: 0.3 },
      { materialName: "elastane", percentage: 0.1 },
    ],
    defaultWeightGrams: 600,
    defaultLaborHours: 2.0,
  },

  // ── Food & Beverage ──────────────────────────────────────────────────────────
  {
    subcategory: "beverage",
    categorySlug: "food-beverage",
    defaultMaterialMix: [
      { materialName: "water", percentage: 0.9 },
      { materialName: "sugar", percentage: 0.1 },
    ],
    defaultWeightGrams: 355,
    defaultLaborHours: 0.02,
  },
  {
    subcategory: "snack",
    categorySlug: "food-beverage",
    defaultMaterialMix: [
      { materialName: "wheat", percentage: 0.5 },
      { materialName: "corn", percentage: 0.2 },
      { materialName: "sugar", percentage: 0.15 },
      { materialName: "soybean oil", percentage: 0.15 },
    ],
    defaultWeightGrams: 200,
    defaultLaborHours: 0.05,
  },
  {
    subcategory: "canned-good",
    categorySlug: "food-beverage",
    defaultMaterialMix: [
      { materialName: "water", percentage: 0.5 },
      { materialName: "corn", percentage: 0.35 },
      { materialName: "sugar", percentage: 0.05 },
    ],
    defaultWeightGrams: 400,
    defaultLaborHours: 0.03,
  },
  {
    subcategory: "dairy",
    categorySlug: "food-beverage",
    defaultMaterialMix: [
      { materialName: "milk", percentage: 0.9 },
      { materialName: "sugar", percentage: 0.05 },
    ],
    defaultWeightGrams: 500,
    defaultLaborHours: 0.02,
  },
  {
    subcategory: "condiment",
    categorySlug: "food-beverage",
    defaultMaterialMix: [
      { materialName: "water", percentage: 0.5 },
      { materialName: "sugar", percentage: 0.25 },
      { materialName: "soybeans", percentage: 0.1 },
    ],
    defaultWeightGrams: 350,
    defaultLaborHours: 0.04,
  },

  // ── Electronics ──────────────────────────────────────────────────────────────
  {
    subcategory: "smartphone",
    categorySlug: "electronics",
    defaultMaterialMix: [
      { materialName: "aluminum", percentage: 0.3 },
      { materialName: "glass", percentage: 0.15 },
      { materialName: "copper", percentage: 0.1 },
      { materialName: "steel", percentage: 0.1 },
    ],
    defaultWeightGrams: 180,
    defaultLaborHours: 3.0,
  },
  {
    subcategory: "laptop",
    categorySlug: "electronics",
    defaultMaterialMix: [
      { materialName: "aluminum", percentage: 0.35 },
      { materialName: "copper", percentage: 0.12 },
      { materialName: "steel", percentage: 0.1 },
      { materialName: "glass", percentage: 0.08 },
    ],
    defaultWeightGrams: 1500,
    defaultLaborHours: 5.0,
  },
  {
    subcategory: "cable",
    categorySlug: "electronics",
    defaultMaterialMix: [
      { materialName: "copper", percentage: 0.6 },
      { materialName: "pvc", percentage: 0.3 },
      { materialName: "polyethylene", percentage: 0.1 },
    ],
    defaultWeightGrams: 80,
    defaultLaborHours: 0.3,
  },
  {
    subcategory: "earbuds",
    categorySlug: "electronics",
    defaultMaterialMix: [
      { materialName: "abs plastic", percentage: 0.5 },
      { materialName: "copper", percentage: 0.2 },
      { materialName: "steel", percentage: 0.1 },
    ],
    defaultWeightGrams: 50,
    defaultLaborHours: 1.5,
  },
  {
    subcategory: "charger",
    categorySlug: "electronics",
    defaultMaterialMix: [
      { materialName: "abs plastic", percentage: 0.5 },
      { materialName: "copper", percentage: 0.25 },
      { materialName: "steel", percentage: 0.1 },
    ],
    defaultWeightGrams: 100,
    defaultLaborHours: 0.5,
  },

  // ── Cosmetics & Personal Care ─────────────────────────────────────────────────
  {
    subcategory: "moisturizer",
    categorySlug: "cosmetics-personal-care",
    defaultMaterialMix: [
      { materialName: "water", percentage: 0.7 },
      { materialName: "soybean oil", percentage: 0.1 },
      { materialName: "glycerin", percentage: 0.05 },
    ],
    defaultWeightGrams: 200,
    defaultLaborHours: 0.15,
  },
  {
    subcategory: "shampoo",
    categorySlug: "cosmetics-personal-care",
    defaultMaterialMix: [
      { materialName: "water", percentage: 0.75 },
      { materialName: "glycerin", percentage: 0.05 },
    ],
    defaultWeightGrams: 250,
    defaultLaborHours: 0.1,
  },
  {
    subcategory: "lipstick",
    categorySlug: "cosmetics-personal-care",
    defaultMaterialMix: [
      { materialName: "palm oil", percentage: 0.25 },
      { materialName: "cocoa butter", percentage: 0.15 },
      { materialName: "canola oil", percentage: 0.1 },
    ],
    defaultWeightGrams: 10,
    defaultLaborHours: 0.25,
  },
  {
    subcategory: "sunscreen",
    categorySlug: "cosmetics-personal-care",
    defaultMaterialMix: [
      { materialName: "water", percentage: 0.65 },
      { materialName: "soybean oil", percentage: 0.1 },
    ],
    defaultWeightGrams: 150,
    defaultLaborHours: 0.15,
  },
  {
    subcategory: "deodorant",
    categorySlug: "cosmetics-personal-care",
    defaultMaterialMix: [
      { materialName: "water", percentage: 0.6 },
      { materialName: "glycerin", percentage: 0.08 },
    ],
    defaultWeightGrams: 80,
    defaultLaborHours: 0.1,
  },

  // ── Home & Kitchen ────────────────────────────────────────────────────────────
  {
    subcategory: "cookware",
    categorySlug: "home-kitchen",
    defaultMaterialMix: [
      { materialName: "aluminum", percentage: 0.7 },
      { materialName: "steel", percentage: 0.2 },
    ],
    defaultWeightGrams: 1200,
    defaultLaborHours: 0.8,
  },
  {
    subcategory: "cutting-board",
    categorySlug: "home-kitchen",
    defaultMaterialMix: [
      { materialName: "wood", percentage: 0.95 },
    ],
    defaultWeightGrams: 800,
    defaultLaborHours: 0.4,
  },
  {
    subcategory: "knife",
    categorySlug: "home-kitchen",
    defaultMaterialMix: [
      { materialName: "steel", percentage: 0.7 },
      { materialName: "wood", percentage: 0.2 },
    ],
    defaultWeightGrams: 300,
    defaultLaborHours: 0.6,
  },
  {
    subcategory: "storage-container",
    categorySlug: "home-kitchen",
    defaultMaterialMix: [
      { materialName: "polyethylene", percentage: 0.8 },
      { materialName: "polypropylene", percentage: 0.15 },
    ],
    defaultWeightGrams: 300,
    defaultLaborHours: 0.2,
  },
  {
    subcategory: "towel",
    categorySlug: "home-kitchen",
    defaultMaterialMix: [
      { materialName: "cotton", percentage: 0.85 },
      { materialName: "polyester", percentage: 0.15 },
    ],
    defaultWeightGrams: 400,
    defaultLaborHours: 0.5,
  },
];

// ── Lookup index ─────────────────────────────────────────────────────────────

const profileIndex = new Map<string, SubcategoryProfile>(
  profiles.map((p) => [`${p.categorySlug}:${p.subcategory}`, p])
);

/**
 * Look up a subcategory profile by category slug and subcategory name.
 * Returns null if no profile exists for the combination.
 */
export function getSubcategoryProfile(
  categorySlug: string,
  subcategory: string | null | undefined
): SubcategoryProfile | null {
  if (!subcategory) return null;
  return profileIndex.get(`${categorySlug}:${subcategory}`) ?? null;
}

export { profiles as subcategoryProfiles };
