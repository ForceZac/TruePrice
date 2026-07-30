# PRD: Goal 4 — Cost Estimation Engine

- **Goal reference:** Goal 4 — Cost Estimation Engine (roadmap: implementation-roadmap-v2.md)
- **Status:** Draft
- **Priority:** P0
- **Depends on:** Goal 2 (commodity prices), Goal 3 (product lookup + material extraction)
- **Blocks:** Goal 5 (Product Page UI)

---

## Problem Statement

TruePrice's core value proposition is showing users what a product *actually costs to make*, not just what it retails for. Without the cost estimation engine, the app is just a product lookup tool — no different from a barcode scanner. The engine turns raw material data + live commodity prices into a meaningful cost breakdown (materials, labor, overhead, shipping) and a markup percentage. Without this, there's nothing to show on the product page.

Users scan a product and ask: *"How much does this cost to make?"* — this goal answers that question.

---

## User Stories

1. **As a user who just scanned a barcode**, I want to see a breakdown of the product's estimated manufacturing cost so I can understand what I'm actually paying for.

2. **As a user looking at a t-shirt that retails for $40**, I want to see the material cost (cotton, polyester), labor cost (Vietnam factory rate), overhead, and shipping — and understand that the manufacturer's cost might be $6–8.

3. **As a user whose product has incomplete material data**, I want to still receive an estimate (with a clear "low confidence" warning) rather than an error — partial information is better than nothing.

4. **As a developer building the product page (Goal 5)**, I need an API endpoint that returns a complete, cached cost breakdown for any product ID, so I can display it without re-computing each time.

5. **As a user revisiting a product**, I want the estimate to be cached so it loads instantly — not re-computed on every page load.

---

## Requirements

### Must-Have

- **CostEstimationService** at `src/services/CostEstimationService.ts` that orchestrates the full estimate
- **Material cost calculation:** for each ProductMaterial, multiply (weight or percentage × product weight) × commodity price per kg
- **Labor cost calculation:** (estimated manufacturing hours × hourly labor rate for product's country of origin). Manufacturing hours should be estimated by product category (e.g., apparel: 1.5 hrs, food: 0.1 hrs, electronics: 3 hrs).
- **Overhead calculation:** `materialCost × category.overheadPercent` using ProductCategory.overheadPercent from the data model
- **Shipping cost calculation:** estimated by weight + country of origin (flat rate table is acceptable for v1)
- **Markup calculation:** `(retailPriceCents - totalCostCents) / totalCostCents × 100`, stored on CostBreakdown
- **Confidence score (0.0–1.0)** reflecting data quality:
  - Full material coverage + current prices + known weight = high (0.8–1.0)
  - Missing some materials or stale prices = medium (0.5–0.79)
  - No material data at all = low (0.0–0.49); still produce estimate using category averages
- **Confidence reason string** — human-readable explanation (e.g., "2 of 4 materials have current commodity prices; weight estimated from category average")
- **Methodology string** — human-readable explanation of how the total was derived
- **Cache in CostBreakdown table** — don't re-compute on every request; re-compute when commodity prices refresh or product data changes
- **API endpoint:** `POST /api/products/[id]/estimate` — triggers computation (or returns cached), responds with full CostBreakdown
- **API endpoint:** `GET /api/products/[id]/estimate` — returns cached CostBreakdown or 404 if not yet computed
- **Unit tests** covering: material cost math, labor rate lookup, overhead %, confidence scoring logic, fallback to category averages

### Should-Have

- Invalidate (re-compute) CostBreakdown when a daily cron refreshes commodity prices
- Async estimate: if computation takes >500ms, respond immediately with `{ status: "computing" }` and let client poll
- Logging of cost breakdown inputs (which prices, which weights used) for debuggability

### Won't-Have (v1)

- Real manufacturing time data — use category-level estimates for now
- Multiple estimates (e.g., "best case" vs "worst case") — single estimate per product
- User-provided corrections or community overrides — that's a later goal
- Currency conversion — everything stays in USD cents

---

## Acceptance Criteria

- [ ] `CostEstimationService.estimateCost(productId)` returns a complete CostBreakdown object
- [ ] Material cost = Σ(materialWeightKg × commodityPricePerKgCents) across all ProductMaterial entries; falls back to category average if no materials linked
- [ ] Labor cost = manufacturingHoursEstimate × LaborRate.hourlyRateCents for product's countryOfOrigin; uses US rate if country unknown
- [ ] Overhead = materialCostCents × ProductCategory.overheadPercent
- [ ] Shipping = flat rate by weight tier and origin region (defined in a lookup table in service)
- [ ] Markup = `(retailPriceCents - totalCostCents) / totalCostCents * 100`; null if no retail price
- [ ] Confidence score computed correctly across all three tiers (high/medium/low) with a descriptive reason string
- [ ] Result written to CostBreakdown table; subsequent GET requests return cached result
- [ ] If no commodity price for a material, service uses last cached price or logs material as "unpriced" and reduces confidence score
- [ ] If product has no materials at all, service uses category-average material cost and sets confidence ≤ 0.3
- [ ] `POST /api/products/[id]/estimate` returns 200 with CostBreakdown JSON (or 202 if computing async)
- [ ] `GET /api/products/[id]/estimate` returns 200 with cached breakdown or 404
- [ ] Unit tests pass: ≥15 test cases covering math, fallbacks, confidence scoring
- [ ] TypeScript compiles clean

---

## Technical Notes

- **Data already in place:** CostBreakdown schema, LaborRate table (seeded in Goal 1), ProductCategory.overheadPercent, ProductMaterial join table with percentage/weight, CommodityPrice table with pricePerKgCents
- **Tech stack:** Next.js 15 App Router, TypeScript, Prisma ORM, PostgreSQL — same as Goals 1–3
- **Service location:** `src/services/CostEstimationService.ts`
- **Test location:** `src/services/__tests__/CostEstimationService.test.ts`
- **Manufacturing hour estimates (v1 defaults):**
  - Food & Beverage: 0.05 hrs/unit
  - Clothing & Textiles: 1.5 hrs/unit
  - Electronics: 2.5 hrs/unit
  - Cosmetics & Personal Care: 0.2 hrs/unit
  - Home & Kitchen: 0.5 hrs/unit
- **Shipping flat rate table (v1):** under 100g = $0.50, 100–500g = $1.00, 500g–2kg = $2.50, 2kg+ = $5.00; multiply by 1.5 for intercontinental (non-US origin)
- **CostBreakdown invalidation:** compare CommodityPrice.fetchedAt to CostBreakdown.calculatedAt — if any linked material has a newer price, mark breakdown stale and trigger re-compute on next GET
- **No new API keys needed** — uses existing CommodityService + existing DB

---

## Open Questions

1. **Cron-triggered re-estimation:** Should the daily price cron automatically re-compute CostBreakdowns for all products, or lazily re-compute on next page view? Lazy is simpler for v1 but means first visitor after a price refresh gets a slow page load.

2. **Manufacturing hours:** Category-level defaults are coarse. Should there be a per-subcategory table, or is category-level acceptable for launch?

3. **Labor rate for unknown country of origin:** Default to US rate (highest, so most conservative) or global average? US feels too high for most manufactured goods.

4. **Async vs sync estimation:** If a product has many materials, estimation could take 1–2 seconds due to DB queries. Should the API be async (202 + polling) or should we optimize queries to keep it under 500ms?
