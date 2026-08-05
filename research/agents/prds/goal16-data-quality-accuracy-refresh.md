# PRD: Goal 16 — Data Quality & Accuracy Refresh

- **Goal reference:** Goal 16 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL — not yet on approved roadmap
- **Depends on:** Goal 8 (Data Expansion), Goal 15 (User-Submitted Products)
- **Proposed by:** PM Run #172 (2026-08-05), informed by Domain Researcher Run #1 (2026-08-05)

---

## Problem Statement

TruePrice's core value proposition is accuracy. Users trust the numbers. But two foundational inputs are now materially wrong:

1. **Labor rates are stale.** TruePrice defaults to China at $3.50/hr. The actual 2026 fully-loaded rate for coastal manufacturing is ~$6.69/hr — nearly double. This causes TruePrice to understate the labor component of electronics and apparel cost breakdowns by 40–90%. Users are seeing numbers that are confidently wrong.

2. **Commodity coverage has gaps.** Textiles and plastics (polyester, polypropylene, cotton yarn, PVC) don't appear in financial commodity APIs like API Ninjas or typical metals/agriculture feeds. These materials are common in clothing, packaging, and consumer goods. Products in those categories either get NO material cost or silently fall back to a wrong proxy. The Domain Researcher (Run #1) confirmed FRED (St. Louis Fed) publishes free PPI series for exactly these materials.

Both issues compound as the catalog grows: more products → more wrong numbers. Fixing the data layer now, before a public marketing push, ensures users aren't misinformed at scale.

---

## User Stories

**US-1 — Accurate labor costs for real-world electronics and apparel**
As a user looking up a phone or a jacket, I want the labor cost to reflect what workers actually earn in 2026, so I can trust the breakdown and share it with friends without it getting fact-checked and dismissed.

**US-2 — Textile and plastic material costs actually show up**
As a user looking up a polyester jacket or a plastic container, I want to see the material cost component rather than a zero or a question mark, so the cost breakdown is complete.

**US-3 — Data freshness visible in the UI**
As a power user, I want to see when commodity prices were last fetched, so I know how fresh the estimate is and can decide whether to trigger a recalculate.

**US-4 — Country-specific labor rates for more countries**
As a user looking up products made in Vietnam, Bangladesh, or Mexico (common manufacturing origins), I want the labor rate to reflect those countries rather than silently falling back to China, so my estimate is country-appropriate.

---

## Requirements

### Must-Have

- **Labor rate update:** Update `LaborRate` seed data:
  - China: $3.50/hr → $6.50/hr (aligned with domain researcher findings, rounding for seed simplicity)
  - Add Vietnam: $2.50/hr
  - Add Bangladesh: $0.65/hr
  - Add Mexico: $4.00/hr
- **FRED API integration:** Extend `CommodityService` to pull textile/plastic PPI data from FRED (St. Louis Fed):
  - `WPU031502411` — Polyester manufactured fibers (maps to `polyester` material key)
  - `WPU034201` — Cotton broadwoven fabrics (maps to `cotton` material key)
  - `WPU072205011` — Polyethylene film/sheet (maps to `polyethylene` material key)
  - `IR12` — Textile supplies import price index (fallback for uncovered textile materials)
  - FRED data is monthly — cache and treat as valid for 30 days (vs. 1 day for daily commodity feeds)
- **Re-estimation trigger:** After labor rate migration and commodity refresh, invalidate all existing `CostBreakdown` records for affected products so the weekly re-estimate cron picks them up (or trigger an immediate re-estimation job)
- **Confidence score disclosure:** When a breakdown uses FRED monthly data rather than daily commodity data, surface the data age in the confidence label tooltip ("Commodity prices as of [month YYYY]")

### Should-Have

- Detect and log which products fall back to the China labor rate default (for manual review)
- Admin coverage page (`/admin/coverage`) updated to show: "labor rate unknown (uses China default): N products"
- Commodity data source field on `CommodityPrice` records (already in model — populate it for FRED-sourced entries)

### Won't Have (v1)

- Real-time labor rate API (no reliable free source exists; FRED/ILO data is annual/quarterly)
- Automatic labor rate updates via cron (rates change annually at most — manual seed update is sufficient)
- Sub-country labor rate variation (coastal vs. inland China, industrial zone vs. general Bangladesh)
- Currency conversion for non-USD-denominated labor rates (all rates stored in USD cents as of conversion date)

---

## Acceptance Criteria

- [ ] `LaborRate` seed for China reflects $6.50/hr (650 cents stored)
- [ ] Vietnam, Bangladesh, Mexico entries exist in `LaborRate` table after migration
- [ ] `CostEstimationService` correctly uses the new country rates for products with those country-of-origin values
- [ ] `CommodityService` can fetch at least one FRED series (e.g., WPU031502411) and store the normalized price in `CommodityPrice`
- [ ] FRED prices are not re-fetched within 30 days of the last fetch (TTL enforced in `CommodityService`)
- [ ] A product with `polyester` as a material shows a non-zero material cost after the FRED feed runs
- [ ] After migration, existing `CostBreakdown` records for affected products are invalidated (staleness flag set or `updatedAt` reset to trigger re-estimation)
- [ ] UI shows commodity price date on the product page cost breakdown (at minimum in tooltip or footer note)
- [ ] `tsc --noEmit` passes clean; all existing tests still pass
- [ ] New unit tests cover: FRED price normalization, FRED TTL enforcement, labor rate fallback logic

---

## Technical Notes

- **FRED API:** `https://api.stlouisfed.org/fred/series/observations?series_id=WPU031502411&api_key=<key>&file_type=json` — free API key, unlimited requests, no billing required. Add `FRED_API_KEY` to `env.server.ts`.
- **FRED price normalization:** FRED PPI series report a price index (base year = 100), not USD/kg directly. Strategy: use the most recent observation value as a relative index and maintain a manually-set base-year reference price per material key (e.g., polyester base = 1.20 USD/kg at index 100). Store the computed price in `CommodityPrice` as normal; document the base reference in a data file.
- **Labor rate migration:** A Prisma migration is needed to update the seed. Use `prisma migrate dev` — do NOT modify existing `LaborRate` rows directly; use an `upsert` in the seed so it's idempotent.
- **Re-estimation invalidation:** The cleanest approach is to set `CostBreakdown.updatedAt` back by `RE_ESTIMATION_TTL_DAYS + 1` days for affected products, which makes them eligible for the next weekly cron without requiring a new API route.
- **SoC:** All FRED fetching belongs in `CommodityService`. `CostEstimationService` reads from `CommodityPrice` only — it never calls FRED directly.
- **Confidence disclosure:** The `CostBreakdown.confidence` field is already exposed on the product page. Extend the confidence tooltip text to include data source and date when the FRED path is taken.

---

## Open Questions

**Q16-1: FRED API key ownership**
Who registers the FRED API key? It's free and takes <2 minutes at `fred.stlouisfed.org/docs/api/api_key.html`. Should be Zach's Google account so it's under the project owner's control.
- **Owner:** Zach | **Priority:** Required before Goal 16 TRD implementation

**Q16-2: FRED base-year reference prices**
FRED PPI is an index, not a USD/kg price. We need manually-set base reference prices per material (e.g., polyester at 1.20 USD/kg when index = 100). Where do these live — a static data file, an env var, or an admin UI?
- Suggested default: static data file at `src/data/fred-base-prices.ts`, editable by the developer. No UI needed for v1.
- **Owner:** PM/Dev | **Priority:** Must decide before implementation

**Q16-3: Re-estimation scope**
After labor rate update, how many products will be re-estimated? If the catalog has 100+ products all needing re-estimation at once, the weekly cron may take longer than expected. Should we add a rate limit or batch the re-estimation?
- Suggested default: let the cron handle it naturally (100 products × ~200ms each = ~20s, well within Vercel function limits).
- **Owner:** Dev | **Priority:** Low — only matters if catalog is >1,000 products at launch

**Q16-4: API Ninjas replacement decision**
Domain Researcher Run #1 flagged that API Ninjas may now serve only 7 rotating commodities/week rather than the 10,000 req/month documented in Goal 2 TRD. Before Goal 16 is written, confirm which commodity API is actually in production and whether it covers TruePrice's full material list.
- **Owner:** Dev | **Priority:** High — if API Ninjas coverage has degraded, Goal 16 TRD should include a migration to commodities-api.com or Twelve Data for metals/agriculture
