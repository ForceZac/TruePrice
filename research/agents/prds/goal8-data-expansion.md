# PRD: Goal 8 — Data Expansion & Accuracy Improvements

- **Goal reference:** Goal 8 — Data Expansion & Accuracy Improvements (roadmap: implementation-roadmap-v2.md)
- **Status:** Draft
- **Priority:** P1
- **Depends on:** Goal 7 (AdSense Integration & Required Pages)
- **Blocks:** nothing (leaf node in current roadmap; data improvements benefit all prior goals retroactively)

---

## Problem Statement

After Goals 1–7, TruePrice can scan, look up, and estimate manufacturing cost for products — but the accuracy and breadth of those estimates is limited by three gaps:

1. **Coverage:** The initial seed is small (dozens of products). Users who scan or search something we haven't seen before hit a "no estimate" dead end.
2. **Material accuracy:** Category-level defaults (a single overhead %, a single labor rate, generic material weights) work for v1 but produce estimates that feel rough. Users notice when the numbers don't match reality for a specific product.
3. **Freshness:** Commodity prices are cached but the product catalog itself doesn't self-heal — outdated or missing retail prices, stale barcode lookups, and products with no image stay broken indefinitely.

Goal 8 is the accuracy and scale-up goal: more products, more precise material mappings, better fallbacks, and tooling so the catalog keeps growing without manual intervention.

---

## User Stories

1. **As a user who scans a product we haven't seen**, I want TruePrice to attempt a live lookup (barcode API) and return an estimate immediately — not a permanent "not found" — so I don't feel like TruePrice only works for popular products.

2. **As a user looking at a cost breakdown**, I want the material breakdown to reflect the actual product (e.g., cotton % for a 60/40 cotton-poly shirt) rather than a generic "clothing" default — so the estimate feels credible and specific.

3. **As Zach monitoring coverage**, I want a simple admin view or script that shows: how many products have estimates, how many are missing estimates, and which categories have the lowest coverage — so I can prioritize what to seed or fix.

4. **As a user who checks TruePrice weekly**, I want cost breakdowns to reflect current commodity prices (cotton, steel, aluminum, oil) rather than prices from months ago — so the "true price" is actually true today.

5. **As a user who finds an estimate suspiciously wrong**, I want to see a confidence tier ("High / Medium / Low") that tells me whether this estimate uses product-specific data or category-level defaults — so I know how much to trust it.

---

## Requirements

### Must-Have

- **Live barcode fallback lookup** — when a product is scanned and not in the DB, attempt a live UPCitemdb + Open Food Facts lookup on-demand (not just at seed time); cache the result; return an estimate in the same request cycle. Current behavior is a dead-end 404.
- **Confidence tier enum** — add `confidence: "HIGH" | "MEDIUM" | "LOW"` to `CostBreakdown`. HIGH = product-specific material data; MEDIUM = subcategory defaults; LOW = category defaults. Displayed on the product page (already specified in Goal 5's PRD).
- **Subcategory material profiles** — expand the material mapping layer below category level. e.g., within "Clothing": T-shirts, jeans, shoes each get distinct default material mixes (cotton%, polyester%, leather%, etc.) instead of one "Clothing" default. Minimum: 3 subcategory profiles per top-level category seeded at launch.
- **Ingredient-to-material parser improvement** — the current parser reads the raw `ingredients` field (from Open Food Facts) and maps text to commodity materials. Improve coverage: handle unit conversions, common aliases (e.g., "high-fructose corn syrup" → corn), and additives that map to petrochemical commodities.
- **Retail price refresh cron** — weekly cron job that re-fetches retail prices (via UPCitemdb or manual overrides) for products where `retailPriceCents` is null or `lastLookedUp` is older than 30 days.
- **Commodity price stale-detection** — alert (log + Discord `#alerts` post) if any commodity price is older than 25 hours (current cron is daily; 25h catches drift). Don't silently serve stale prices.
- **Re-estimation cron** — weekly cron that re-runs `estimateCost()` for any product whose `CostBreakdown.updatedAt` is older than 7 days, using the freshest commodity prices. Answers Q4-1 from the open questions parking lot (lazy re-estimation was v1; this makes it reliable at scale).
- **Expanded seed data** — seed script grows to ≥100 products across all seeded categories, with at least 20 products having HIGH-confidence estimates (real material data from label or spec sheet). Existing seed must still run cleanly.

### Should-Have

- **Admin coverage dashboard** — simple internal page (`/admin/coverage`, no auth for v1) showing: total products, % with estimates, % with HIGH/MEDIUM/LOW confidence, breakdown by category. Useful for Zach to know what to prioritize seeding.
- **Manual product override file** — `src/data/product-overrides.ts` — allows Zach to correct a specific product's material composition or retail price without a DB migration. Overrides take precedence over API data at estimation time.
- **Subcategory field on Product** — add optional `subcategory String?` to `Product` model; used by the material profile lookup to select the right defaults. Nullable; falls back to category-level if absent.
- **Duplicate product deduplication** — products can enter via barcode lookup multiple times with slightly different names (e.g., "Coca-Cola 12oz" vs "Coca-Cola 12 oz Can"). Add a deduplication check on UPC/EAN at insert time; merge duplicates in the seed.

### Won't-Have (v1)

- Machine-learning-based material inference from product images — defer to a future goal
- User-submitted corrections or crowdsourced material data
- Real-time commodity price updates (sub-daily) — daily cron is sufficient for manufacturing cost estimates
- Subcategory landing pages (SEO) — that's a Goal 6/8.5 concern, not this goal
- Ingredient sourcing from third-party nutritional DBs beyond Open Food Facts — scope creep
- Full audit log of estimate changes over time — deferred; too much DB churn for v1

---

## Acceptance Criteria

- [ ] Scanning a UPC not in the DB triggers a live lookup; if the API finds it, an estimate is returned in the response (or a "calculating…" state with a follow-up polling endpoint); no permanent 404 for recognizable barcodes
- [ ] `CostBreakdown` model has `confidence: "HIGH" | "MEDIUM" | "LOW"` field; existing breakdowns default to `"LOW"` in the migration
- [ ] At least 3 subcategory material profiles exist per top-level seeded category (e.g., Clothing: t-shirt, jeans, shoes; Food: beverage, snack, canned good)
- [ ] Ingredient-to-material parser correctly maps at least 10 additional aliases/edge cases (test suite documents the mapping table)
- [ ] Retail price refresh cron runs on a weekly schedule; products with stale/missing prices are re-fetched and updated
- [ ] Commodity price stale-detection fires a Discord `#alerts` post if any price row is older than 25 hours
- [ ] Re-estimation cron runs weekly; all products older than 7 days get a fresh `CostBreakdown`
- [ ] Seed script seeds ≥100 products; `npm run db:seed` completes without errors; 20+ products have `confidence: "HIGH"`
- [ ] `/admin/coverage` page (no auth) shows total products, estimates by confidence tier, per-category breakdown
- [ ] TypeScript compiles clean; Prisma migration runs cleanly against an empty DB
- [ ] Existing tests for Goals 1–7 continue to pass (no regressions)

---

## Technical Notes

- **Tech stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL — same as prior goals
- **Live lookup flow:** `GET /api/product/[upc]` — check DB first; if miss, call UPCitemdb then Open Food Facts; if found, insert Product + trigger async estimation (or do it synchronously if under 500ms budget per Q4-4 resolution); return result. Use `Promise.race` with a 4s timeout to avoid hanging the user request.
- **Subcategory profiles:** `src/data/subcategory-profiles.ts` — keyed by `{ category: string, subcategory: string }` — stores material mix percentages, default labor hours, confidence tier. Keep as static data for v1; move to DB in a future goal if profiles grow large.
- **Confidence assignment logic:**
  - HIGH: product has parsed material data (weight + ingredients mapped to specific commodities)
  - MEDIUM: product has subcategory match (uses subcategory profile)
  - LOW: only category-level defaults available
- **Re-estimation cron:** Add to the existing cron setup (likely `vercel.json` scheduled functions or a standalone script). Query `CostBreakdown WHERE updatedAt < NOW() - INTERVAL '7 days'`; batch in chunks of 50 to avoid DB pressure.
- **Stale price check:** Run after the commodity price cron completes. `SELECT * FROM CommodityPrice WHERE fetchedAt < NOW() - INTERVAL '25 hours'`. Post to Discord `#alerts` if any rows found.
- **Admin coverage page:** Server component only; no auth for v1 (internal use). Simple stat query + Tailwind table. Route: `app/admin/coverage/page.tsx`.
- **New Prisma fields:**
  - `Product.subcategory String?`
  - `CostBreakdown.confidence String @default("LOW")` (typed as enum in app layer)
- **Migration:** Add fields with defaults; no data loss. Backfill `confidence = "LOW"` for all existing rows.

---

## Open Questions

1. **Live lookup latency budget:** UPCitemdb API can be slow (1–3s). If the live lookup exceeds 500ms, should the product page return a "loading estimate" state and poll, or should we return the product data immediately and trigger estimation as a background job? The Q4-4 resolution says go sync first — but live lookups add new latency on top of estimation. Needs a call.

2. **100-product seed sourcing:** Where does the seed data for ≥100 products come from? Options: (a) a bulk export from Open Food Facts filtered to common US products, (b) Zach manually curating a list, (c) automated bulk lookup against a pre-defined UPC list. Option (a) is most scalable but requires a one-time import script.

3. **Subcategory field population:** For existing products in the DB, `subcategory` will be null after the migration. Should we attempt to infer subcategory from product name/ingredients at migration time, or leave it null and fill it lazily (next estimation run picks the best subcategory profile based on ingredients)?

4. **Admin page security:** `/admin/coverage` is internal-only but unauthenticated for v1. Is that acceptable given the site is public? Worst case: someone finds the URL and sees aggregate stats. Low risk, but worth confirming.

5. **Re-estimation cost at scale:** At 100 products, weekly re-estimation is trivial. At 10,000 products, it's a meaningful DB load. Should the 7-day TTL be configurable via env var so it can be tuned later without a deploy?
