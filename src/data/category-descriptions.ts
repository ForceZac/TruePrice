/**
 * Category descriptions — static SEO copy per category slug.
 *
 * Each blurb is 2–3 sentences used on /category/[slug] pages. Unique content
 * per page improves organic ranking and satisfies AdSense content requirements.
 * Not stored in the DB for v1 — update here and redeploy to change copy.
 */

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "food-beverage":
    "From the grain in your cereal to the syrup in your soda, the raw ingredients in packaged food cost a fraction of what you pay at checkout. TruePrice breaks down every cent — commodities, labor, packaging, and markup — so you can see exactly what your grocery bill is actually paying for.",

  "clothing-textiles":
    "That $60 t-shirt might contain $2 worth of cotton. TruePrice reverse-engineers apparel manufacturing costs using real commodity prices for cotton, polyester, and elastane, plus labor rates by country of origin. See the true cost stitched into every seam.",

  electronics:
    "Consumer electronics carry some of the highest markups of any product category. TruePrice traces the polycarbonate, rare-earth metals, and assembly labor behind your devices so you can make sense of the gap between BOM cost and retail price.",

  "cosmetics-personal-care":
    "Skincare and beauty products are often 90% water and packaging — yet retail prices suggest otherwise. TruePrice demystifies the formulation costs behind lotions, serums, and shampoos so you can judge whether you're paying for ingredients or a brand story.",

  "home-kitchen":
    "The kitchenware and home goods you rely on daily are built from commodity materials at scale. TruePrice estimates the steel, plastic, and labor that go into everyday household items, revealing the markup baked into every product on the shelf.",
};

/** Fallback description for categories without a custom blurb. */
export const DEFAULT_CATEGORY_DESCRIPTION =
  "TruePrice estimates the real manufacturing cost of products in this category — raw materials, labor, overhead, and shipping — so you can see exactly what you're paying above cost.";

/**
 * Returns the SEO description for a category slug, falling back to the default.
 */
export function getCategoryDescription(slug: string): string {
  return CATEGORY_DESCRIPTIONS[slug] ?? DEFAULT_CATEGORY_DESCRIPTION;
}
