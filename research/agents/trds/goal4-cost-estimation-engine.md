# TRD: Goal 4 — Cost Estimation Engine

- **status:** `ready`
- **goal:** `Goal 4`
- **priority:** `P0`
- **branch:** `task/goal4-cost-estimation`
- **estimated_effort:** `Large`
- **depends_on:** `Goal 2, Goal 3`

## Description

Build the CostEstimationService — the core engine that calculates a product's true manufacturing cost from its materials, commodity prices, labor rates, and category overhead. Persist results to the `CostBreakdown` table and expose them via an API route. This is the central value proposition of TruePrice.

## Acceptance Criteria

- [ ] `CostEstimationService` implemented in `src/services/CostEstimationService.ts` — the ONLY module that calculates cost breakdowns
- [ ] `estimateCost(productId: string): Promise<CostBreakdown>` — full cost estimation for a product
- [ ] Material cost calculated from `ProductMaterial` weights × current `CommodityPrice` (USD cents/kg)
- [ ] Labor cost calculated from `LaborRate` for product's `countryOfOrigin` × estimated assembly hours
- [ ] Assembly hours estimated from product category (seed values in `src/data/assembly-hours.ts`)
- [ ] Overhead cost calculated as `materialCost × category.overheadPercent`
- [ ] Shipping cost estimated from product weight + country of origin (flat rate lookup table)
- [ ] `totalCostCents = materialCost + laborCost + overheadCost + shippingCost`
- [ ] `markupPercent` calculated when `retailPriceCents` is known: `((retail - total) / total) × 100`
- [ ] `confidenceScore` (0.0–1.0) reflects data completeness:
  - 1.0 = all materials have live commodity prices + known weight + known origin
  - 0.7 = some materials missing prices (uses category average fallback)
  - 0.4 = weight unknown (estimated from category average)
  - 0.2 = multiple data gaps
- [ ] `confidenceReason` is a human-readable string explaining the score
- [ ] `methodology` field documents which data sources and fallbacks were used
- [ ] Results cached in `CostBreakdown` table; recalculated only when inputs change (commodity price refresh or product data update)
- [ ] API route `GET /api/products/[id]/cost` returns current cost breakdown
- [ ] API route `POST /api/products/[id]/cost/recalculate` forces recalculation
- [ ] Fallbacks when data is missing:
  - No commodity price: use category average price with confidence penalty
  - No country of origin: use China as default (largest mfg share) with confidence penalty
  - No weight: use category median weight from seed data
  - No material breakdown: mark confidence 0.2, estimate from category defaults
- [ ] Unit tests: at least 15 test cases covering calculation logic, fallbacks, and confidence scoring
- [ ] All monetary values in cents (integers), never floats

## Cost Calculation Methodology

```
materialCostCents  = Σ (material.weightGrams / 1000) × commodityPrice.pricePerKgCents
laborCostCents     = laborRate.hourlyRateCents × assemblyHours[category]
overheadCostCents  = materialCostCents × category.overheadPercent
shippingCostCents  = shippingRates[countryOfOrigin][weightBucket]
totalCostCents     = materialCostCents + laborCostCents + overheadCostCents + shippingCostCents
markupPercent      = ((retailPriceCents - totalCostCents) / totalCostCents) × 100  // if retail known
```

## Assembly Hours Seed Data

Create `src/data/assembly-hours.ts` with estimated hours by category:

```typescript
export const ASSEMBLY_HOURS: Record<string, number> = {
  'clothing':         0.5,
  'electronics':      2.0,
  'toys':             0.8,
  'footwear':         0.75,
  'kitchen':          1.0,
  'furniture':        3.0,
  'personal-care':    0.3,
  'food-beverage':    0.2,
  'sporting-goods':   1.5,
  'default':          1.0,
};
```

## Shipping Rate Lookup

Create `src/data/shipping-rates.ts` — flat rate estimates (USD cents) by origin region and weight bucket:

| Region | 0–500g | 500g–2kg | 2kg–10kg | 10kg+ |
|--------|--------|----------|----------|-------|
| China/East Asia | 150 | 300 | 800 | 2000 |
| South/Southeast Asia | 200 | 400 | 1000 | 2500 |
| Europe | 300 | 600 | 1500 | 3500 |
| USA/Canada | 500 | 900 | 2000 | 4500 |
| Rest of World | 400 | 700 | 1800 | 4000 |

## Tasks

1. Create `src/data/assembly-hours.ts` with category → hours mapping
2. Create `src/data/shipping-rates.ts` with region × weight-bucket lookup
3. Implement `src/services/CostEstimationService.ts`:
   - `estimateCost(productId)` — main entry point
   - `calcMaterialCost(productId)` — fetch materials + commodity prices, sum
   - `calcLaborCost(countryOfOrigin, categorySlug)` — labor rate × assembly hours
   - `calcOverhead(materialCost, overheadPercent)` — simple multiply
   - `calcShipping(countryOfOrigin, weightGrams)` — lookup from shipping-rates
   - `calcConfidence(inputs)` — score 0.0–1.0 based on data completeness
   - `buildMethodology(inputs)` — human-readable methodology string
   - `getCachedBreakdown(productId)` — check if fresh breakdown exists (< 24h old)
   - `saveCostBreakdown(productId, result)` — persist to DB
4. Create API routes:
   - `src/app/api/products/[id]/cost/route.ts` — GET current breakdown (or calculate if none)
   - `src/app/api/products/[id]/cost/recalculate/route.ts` — POST force recalculation
5. Write unit tests in `src/services/__tests__/CostEstimationService.test.ts`:
   - Full calculation with complete data (confidence 1.0)
   - Missing commodity price → fallback + confidence penalty
   - Missing weight → category median + confidence penalty
   - Missing country → China default + confidence penalty
   - No materials at all → 0.2 confidence
   - Markup calculation when retail price known
   - Markup null when retail price unknown
   - All monetary values are integers (no float leakage)
   - Shipping bucket boundaries (499g vs 500g, 1999g vs 2000g)
   - Assembly hours fallback to 'default' for unknown category
   - Caching: getCachedBreakdown returns null if > 24h old
   - Caching: getCachedBreakdown returns breakdown if < 24h old
   - Methodology string contains data source names
   - confidenceReason is non-empty string
   - totalCostCents equals sum of components
6. Seed: update prisma seed to calculate + store a CostBreakdown for each of the 5 seeded products

## Notes

- Cache invalidation: stale after 24h OR when `CommodityPrice.fetchedAt` changes for any material in the product.
- The API route should trigger calculation on first access if no breakdown exists.
- Do not call CostEstimationService from components or API middleware — API routes only.
- Country-to-region mapping for shipping: maintain a `src/data/country-regions.ts` lookup (ISO 3166-1 alpha-2 → region string).
