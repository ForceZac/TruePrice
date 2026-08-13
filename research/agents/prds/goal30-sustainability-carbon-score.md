# PRD: Goal 30 — Sustainability & Environmental Impact Score

- **Goal reference:** Goal 30 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 4 (Cost Estimation Engine), Goal 5 (Product Page UI), Goal 8 (Data Expansion), Goal 11a (Save as Image)
- **Proposed by:** PM Run #242 (2026-08-12)

---

## Problem Statement

TruePrice reveals the financial markup hidden in consumer goods. But the full cost of a product — what it truly costs the world — includes its environmental footprint. Eco-conscious consumers increasingly want to know not just "how much profit is the company making?" but also "how much CO₂e did making this emit?" These two questions are deeply related: cheap manufacturing often means high-emission manufacturing (coal-heavy energy grids, long shipping routes, material-intensive processes), and TruePrice already has all the data needed to estimate it.

Three concrete gaps:

1. **The "true cost" framing is incomplete without environmental cost.** A product that costs $3.40 to make and retails for $45 has a 13× markup. But if manufacturing it emits 8 kg CO₂e, that environmental cost is invisible to the buyer. Surfacing carbon footprint alongside the dollar breakdown makes TruePrice's "true cost" framing more complete — and more defensible as a journalistic and advocacy tool.

2. **Differentiation from pure price tools.** Competitors (PriceGrabber, Google Shopping) show retail price comparisons. TruePrice's edge is manufacturing cost transparency. Adding carbon footprint is a second layer of differentiation that no retail price tool offers — it turns TruePrice from a frugality tool into a sustainability tool as well, broadening the audience.

3. **Highly shareable content unit.** "This $80 sneaker emits 22 kg CO₂e to make — that's the same as driving 55 miles" is a more viral stat than a dollar figure alone. The save-as-image feature (Goal 11a) can include the CO₂e badge; OG images can feature it. Carbon footprint adds a second sharing angle that resonates with a different (and growing) audience segment.

---

## User Stories

**US-1 — See carbon footprint on product pages**
As an eco-conscious user viewing a product page, I want to see an estimated CO₂e footprint displayed alongside the manufacturing cost breakdown, so I can understand the environmental impact of the product's production.

**US-2 — Understand what the number means**
As a user who sees "12 kg CO₂e," I want a plain-language comparison ("equivalent to driving 30 miles in a typical car") so I can intuitively grasp what that number means without needing a background in environmental science.

**US-3 — Include carbon in shareable exports**
As a user saving the cost breakdown as an image (Goal 11a), I want the CO₂e score included in the saved image, so the full picture — dollar cost + carbon cost — is part of what I share.

**US-4 — Browse highest-impact products by category**
As a user interested in sustainable purchasing, I want to see the highest-carbon products in a category (e.g., "Most carbon-intensive electronics"), so I can make informed comparisons when choosing between alternatives.

**US-5 — Understand confidence level for carbon estimates**
As a user, I want to know how confident TruePrice is in the carbon estimate (e.g., HIGH when product composition is well-known, LOW when it's a category average), so I don't over-rely on uncertain figures.

---

## Requirements

### Must-Have

- **`CarbonService`** (`src/services/CarbonService.ts`) — sole owner of all CO₂e estimation logic. No other module may compute carbon footprints. Methods:
  - `estimateFootprint(productId)` — computes CO₂e for a product from its material composition, manufacturing country, and estimated shipping distance. Returns `{ totalGrams: number, breakdown: { materials, manufacturing, shipping }, confidence: 'HIGH' | 'MEDIUM' | 'LOW' }`.
  - `getFootprint(productId)` — returns the cached `CarbonFootprint` record if present and not stale (TTL: same as `RE_ESTIMATION_TTL_DAYS`); otherwise calls `estimateFootprint()` and persists it.
  - `getFootprintSummary(productId)` — returns `{ totalGrams, equivalentMilesDriven, confidence }` for use in list views and OG metadata.

- **`CarbonFootprint` Prisma model.** New model:
  - `id` (cuid), `productId` (FK → Product, unique), `totalGrams` (int — CO₂e in grams), `materialGrams` (int), `manufacturingGrams` (int), `shippingGrams` (int), `confidence` (enum: HIGH/MEDIUM/LOW), `computedAt` (DateTime), `createdAt`, `updatedAt`.

- **Static CO₂e lookup tables** in `src/data/`:
  - `carbon-material-factors.ts` — CO₂e per kg per material type (e.g., cotton: 5,500 g/kg, polyester: 5,900 g/kg, aluminum: 8,200 g/kg, steel: 1,800 g/kg, lithium: 15,000 g/kg). Initial data sourced from publicly available LCA databases (ecoinvent summary figures, EPA materials data).
  - `carbon-grid-factors.ts` — CO₂e per kWh by country of origin (e.g., China: 555 g/kWh, Germany: 364 g/kWh, USA: 386 g/kWh). Used to weight manufacturing energy cost.
  - `carbon-shipping-rates.ts` — CO₂e per kg·km by shipping mode (sea: 0.01 g, air: 0.5 g, truck: 0.1 g). Combined with estimated origin→USA shipping distance using existing `src/data/shipping-rates.ts` country data.

- **CO₂e estimation formula:**
  1. **Material footprint:** `Σ (materialWeightKg × CO₂ePerKg)` for each material in `ProductMaterial`. Falls back to category-average weight × category-average material factor if composition is unknown.
  2. **Manufacturing energy footprint:** `assemblyHours × energyPerHour × gridFactor[countryOfOrigin]`. `energyPerHour` defaults to 2.0 kWh (category-level calibration; data from `src/data/assembly-hours.ts`). Falls back to `countryOfOrigin: 'CN'` if unknown.
  3. **Shipping footprint:** `productWeightKg × shippingDistance[countryOfOrigin] × CO₂ePerKgKm[mode]`. Default mode: sea for Asia/Europe, truck for North America.
  4. **Confidence:** HIGH if product has full material composition + known country of origin. MEDIUM if partial composition OR unknown country. LOW if both unknown (category averages used throughout).

- **CO₂e display on product pages.** New section in the product page (`src/app/product/[id]/page.tsx`) below the cost breakdown, labeled "Environmental Impact Estimate." Displays:
  - Total CO₂e in kg (e.g., "12.4 kg CO₂e")
  - A plain-language equivalent (driving miles: `totalGrams / 404` — EPA avg passenger car g CO₂e/mile)
  - A breakdown bar (materials / manufacturing / shipping proportions — reuse Recharts)
  - A confidence badge (HIGH / MEDIUM / LOW) with a tooltip explaining what it means
  - A disclosure footnote: "Estimate based on typical material composition and manufacturing data. Actual emissions vary by factory and logistics route."

- **CO₂e in save-as-image export.** The `CostBreakdownImage` server component (Goal 11a) gains a `carbonGrams?: number` prop. When present, a small CO₂e line renders below the cost breakdown: "~12.4 kg CO₂e to produce." Client component passes the value from `useCostBreakdown` hook (extend the hook to include carbon summary).

- **`GET /api/products/[id]/carbon`** — returns `CarbonFootprint` for the product. Calls `CarbonService.getFootprint()`. No auth required.

- **Weekly cron integration.** Extend `GET /api/cron/re-estimate` to also call `CarbonService.estimateFootprint()` for products missing a `CarbonFootprint` record or with `computedAt` older than `RE_ESTIMATION_TTL_DAYS`. Batched alongside the existing cost re-estimation pass.

- **`tsc --noEmit` clean; unit tests for `CarbonService`:** `estimateFootprint` (full data → HIGH confidence, partial data → MEDIUM, no data → LOW), `getFootprint` (cache hit, cache miss), driving-miles equivalent calculation, TTL logic.

### Should-Have

- **OG metadata update.** Product page OG description includes the CO₂e score: "iPhone 15 Pro: costs $340 to make, emits ~28 kg CO₂e — retail price: $999." Adds shareable environmental context to social previews.
- **Carbon leaderboard.** A `/sustainability` page listing products with the highest and lowest CO₂e scores within each category. Reuses `DiscoveryService` pattern — `CarbonService.getHighImpactProducts(categorySlug, limit)` and `CarbonService.getLowImpactProducts(categorySlug, limit)`.
- **Watchlist carbon summary.** User's watchlist page (`/watchlist`) shows total estimated CO₂e for all watched products. A fun vanity stat ("Your watched products have a combined footprint of 340 kg CO₂e — equivalent to driving 840 miles").

### Won't Have (v1)

- Scope 3 emissions (retail distribution, consumer use phase, end-of-life disposal) — manufacturing and shipping only for v1
- Per-factory emissions data (would require supply chain disclosure from brands) — category/country-level granularity only
- Carbon offset integration or "offset this product" flow — separate product decision, deferred
- Lifecycle assessment (LCA) PDFs or detailed methodology reports — disclosure footnote is sufficient for v1
- Real-time grid intensity via electricity APIs (e.g., Electricity Maps) — static country averages are sufficient for v1 accuracy level

---

## Acceptance Criteria

- [ ] Product pages show a CO₂e estimate section with total grams, driving-miles equivalent, and a breakdown bar
- [ ] Confidence badge (HIGH/MEDIUM/LOW) is displayed with a tooltip explaining the basis for the estimate
- [ ] A disclosure footnote is present on every carbon estimate
- [ ] `CarbonService.estimateFootprint()` returns HIGH confidence when product has full material composition + known country of origin; MEDIUM for partial; LOW for unknown
- [ ] `GET /api/products/[id]/carbon` returns the `CarbonFootprint` record (or triggers estimation if none exists)
- [ ] Save-as-image output includes CO₂e when `carbonGrams` is available
- [ ] Weekly re-estimate cron populates `CarbonFootprint` for products missing records
- [ ] `CarbonService` unit tests pass: estimation at all three confidence levels, cache hit/miss, driving-miles calculation
- [ ] `tsc --noEmit` passes clean; all existing tests continue to pass

---

## Technical Notes

- **SoC:** `CarbonService` is the sole owner of CO₂e estimation. API routes delegate to it. Components fetch via TanStack Query (`useCarbonFootprint(productId)` hook) — no direct service imports in client components. `CostEstimationService` does not call `CarbonService`; they run independently (carbon is displayed alongside but not as part of the cost breakdown).
- **Integer storage:** `totalGrams`, `materialGrams`, `manufacturingGrams`, `shippingGrams` stored as integers (grams). Display layer divides by 1,000 to show kg. Same pattern as cent-based monetary storage.
- **No new env vars required for v1.** Static data tables avoid external API dependencies. If Zach later wants to integrate a real-time LCA API (e.g., Climatiq), add `CLIMATIQ_API_KEY` to `env.server.ts` gated on presence.
- **Driving-miles equivalent formula:** `Math.round(totalGrams / 404)` — EPA average US passenger vehicle emits 404 g CO₂e/mile (2023 EPA figure). This is a client-friendly constant; store in `src/data/carbon-equivalents.ts`.
- **Assembly hours data:** `src/data/assembly-hours.ts` already exists (from Goal 4/8). Add an `energyKwhPerHour` field per category. Default: 2.0 kWh/hr (light manufacturing). Electronics: 3.5 kWh/hr. Textiles: 1.2 kWh/hr. Calibrate from publicly available figures.
- **Shipping distance:** `src/data/shipping-rates.ts` already has country → base shipping rate. Derive approximate km from existing rate data (or add a `distanceKm` field per country region). Alternatively, use a static `countryShippingDistance` table (China: 12,000 km sea, Vietnam: 13,500 km sea, Mexico: 2,000 km truck, Germany: 8,000 km sea).

---

## Open Questions

**Q30-1: Should carbon data be user-visible confidence ratings affect product trust signals?**
Currently `CostBreakdown.confidence` (HIGH/MEDIUM/LOW) is based on cost data completeness. Should a LOW carbon confidence score affect the product's overall trust signal or be kept entirely separate?
- Suggested default: Keep them separate. Users understand that "this product's cost is well-known" and "this product's carbon is estimated from averages" are different claims. Separate badges avoid conflating the two.
- **Owner:** Zach | **Priority:** Low — UI decision; can be resolved during TRD

**Q30-2: Which LCA data source should anchor the material CO₂e factors?**
Options: (a) ecoinvent summary figures (industry standard, freely available in summary form), (b) EPA's Waste Reduction Model (WARM) — US-centric, free, public, covers common materials, (c) commercially licensed GHG Protocol data. For v1 accuracy level, EPA WARM is sufficient and avoids licensing concerns.
- Suggested default: EPA WARM + public ecoinvent summaries. Document the source in `carbon-material-factors.ts` comments for auditability.
- **Owner:** PM/Dev | **Priority:** Medium — must be decided before TRD so the developer uses the right reference

**Q30-3: Should the `/sustainability` leaderboard be gated behind user auth?**
The leaderboard is public content (similar to the markup leaderboard). No auth required for v1.
- Suggested default: Public, no auth. Consistent with the rest of the site.
- **Owner:** PM | **Priority:** Low — resolved here as working default
