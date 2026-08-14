# PRD: Goal 20 — Cost History & Trend Visualization

- **Goal reference:** Goal 20 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 4 (Cost Estimation Engine), Goal 5 (Product Page UI), Goal 16 (Data Quality & Accuracy Refresh)
- **Proposed by:** PM Run #214 (2026-08-06)

---

## Problem Statement

TruePrice tells users what a product costs to make *today*. But the most compelling question isn't "what does it cost now?" — it's **"has this gotten cheaper or more expensive to make over time, and why?"**

Right now, every weekly re-estimation (cron from Goal 8) overwrites the existing `CostBreakdown` record in place. Historical data is permanently discarded. Three problems follow directly:

1. **No trend visibility.** Users who return to a product page they've seen before have no way to know whether the breakdown changed. A product that went from a 4× markup to a 7× markup in six months is a compelling story — TruePrice has no way to tell it.

2. **Price alerts with no context.** When `AlertService` (Goal 11b) fires an alert saying "cost rose 12%," users don't know if that's a one-time spike or part of a sustained upward trend. A 6-month chart next to the alert would answer that immediately.

3. **Missed SEO content.** Each product page currently shows a single static breakdown. A trend chart makes the page more authoritative and more likely to attract backlinks ("TruePrice shows how iPhone manufacturing costs changed during the tariff wave"). This compounds the Goal 14 SEO work.

The fix is surgical: instead of overwriting `CostBreakdown` records, archive the old one and insert a new one. Display the last 12 months of snapshots as a line chart on the product page.

---

## User Stories

**US-1 — Trend chart on product page**
As a user viewing a product's cost breakdown, I want to see a chart of how the total manufacturing cost has changed over the past year, so I can tell whether the markup is growing or shrinking and make a better purchase decision.

**US-2 — "Changed since last visit" indicator**
As a returning user who watchlisted a product 2 months ago, I want a badge or callout showing that the cost breakdown changed since I last viewed it, so I notice the update without having to compare numbers manually.

**US-3 — Historical breakdown drilldown**
As a curious user, I want to tap a point on the trend chart and see the full breakdown (material / labor / overhead / shipping) for that historical snapshot, so I understand which component changed and why (e.g., "labor rose when Vietnam rates updated").

**US-4 — Volatile products surfaced in discovery**
As a user browsing the most-volatile products, I want to find products whose manufacturing cost has changed the most in the past 90 days, so I can discover stories that are currently in the news (tariffs, commodity spikes, supply chain events).

---

## Requirements

### Must-Have

- **`CostBreakdown` retention policy change:** Stop overwriting `CostBreakdown` records. On each re-estimation, insert a *new* `CostBreakdown` row (with `createdAt` = now). The product's "current" breakdown is the most-recent record by `createdAt`.
  - `ProductService` and `CostEstimationService` updated: queries that fetch "the breakdown" use `ORDER BY createdAt DESC LIMIT 1`.
  - No migration needed to backfill history — history begins accumulating from Goal 20 merge date.
  - Add a `CostBreakdown` index on `(productId, createdAt DESC)` for query efficiency.
- **`DiscoveryService.getMostVolatile(n, windowDays)`** — returns the N products with the largest absolute change in `totalCostCents` between their oldest and newest `CostBreakdown` within `windowDays`. Used by the new trending variant and future features.
- **Cost trend API route:** `GET /api/products/[id]/cost/history?months=12` — returns an array of `{ date: ISO string, totalCostCents, materialCostCents, laborCostCents, overheadCostCents, shippingCostCents, markupPercent, confidence }` sorted oldest-first; capped at one snapshot per calendar week (dedup by `DATE_TRUNC('week', createdAt)`) to avoid chart noise from daily re-runs.
- **`CostTrendChart` molecule component** (`src/components/molecules/CostTrendChart.tsx`):
  - Recharts `LineChart` + `ResponsiveContainer` (consistent with existing chart choices)
  - X-axis: month labels; Y-axis: total manufacturing cost in USD (display layer divides cents by 100)
  - Single line: total cost; tooltip shows full breakdown on hover
  - If fewer than 2 data points exist (not enough history), renders a "Check back in a few weeks — we're building your history" empty state
  - Loaded client-side via `useCostHistory(productId)` TanStack Query hook
- **Product page integration** — add `CostTrendChart` below the existing `CostBreakdownChart` (donut); visible only when ≥ 2 historical snapshots exist for the product
- **"Changed since last visit" badge** — on the product page, if the breakdown changed (cost delta > 0%) since the user's last `viewedAt` timestamp (available from `UserService.getRecentlyViewed()`), show a small badge: "Updated — cost [rose/fell] X% since your last visit." Signed-in users only; guests see nothing.

### Should-Have

- **`/trending/volatile`** route — a new tab or sub-page under `/trending` that lists the most-volatile products (biggest cost swings in 90 days), linking to each product's page. Powered by `DiscoveryService.getMostVolatile()`.
- **Breakdown drilldown on chart click** — tapping a data point on the trend chart expands a detail panel showing the full cost breakdown for that snapshot date (material, labor, overhead, shipping). Implemented as a controlled state in `CostTrendChart` — no new API route needed, all data already returned by the history endpoint.
- **Sitemap freshness signal** — update `sitemap.ts` to include `lastmod` on product URLs based on the most recent `CostBreakdown.createdAt`. Currently, `lastmod` is static or absent; dynamic values help Search Console prioritize recrawl frequency.

### Won't Have (v1)

- Automated "why did this change?" explanations (attributing the delta to a specific commodity API feed or labor rate update — requires audit trail beyond scope)
- User-configurable history window (12 months is the fixed display window; longer history is stored but not surfaced in v1)
- CSV export of historical cost data
- Per-material commodity price history (only total cost and top-level component breakdown are charted; per-material series are too granular for v1)

---

## Acceptance Criteria

- [ ] Re-estimation cron inserts a new `CostBreakdown` row instead of overwriting the existing one
- [ ] `GET /api/products/[id]/cost` returns the most-recent breakdown (`ORDER BY createdAt DESC LIMIT 1`)
- [ ] `GET /api/products/[id]/cost/history?months=12` returns ≥ 1 record for any product that has been estimated at least once, and returns records deduped to one per calendar week
- [ ] `CostTrendChart` renders on the product page when ≥ 2 historical snapshots exist
- [ ] `CostTrendChart` renders the "building your history" empty state when < 2 snapshots exist
- [ ] Hovering/tapping a data point shows the full cost breakdown for that date in a tooltip or panel
- [ ] "Changed since last visit" badge appears on the product page for signed-in users whose last view predates the most recent breakdown update, and the delta direction/percent is correct
- [ ] `DiscoveryService.getMostVolatile(10, 90)` returns the correct products ordered by absolute cost delta descending
- [ ] No existing tests broken (all passing test suite count maintained)
- [ ] New unit tests cover: history endpoint dedup logic, `getMostVolatile()` ordering, "changed since last visit" delta calculation, `CostTrendChart` empty state
- [ ] `tsc --noEmit` passes clean

---

## Technical Notes

- **Schema impact:** `CostBreakdown` already has `createdAt` and `updatedAt`. The only change is behavioral: instead of `upsert` in `CostEstimationService`, use `create`. Add an index: `@@index([productId, createdAt(sort: Desc)])` in `schema.prisma` to support efficient "latest breakdown" queries.
- **Data volume concern:** With 100 products re-estimated weekly, this generates ~100 rows/week = 5,200 rows/year. At full scale (10,000 products), ~520,000 rows/year. Postgres handles this easily; no partitioning needed for v1. If the catalog grows past 100,000 products, add a TTL cleanup job.
- **History dedup strategy for chart:** SQL: `SELECT DISTINCT ON (DATE_TRUNC('week', created_at)) * FROM cost_breakdowns WHERE product_id = $1 ORDER BY DATE_TRUNC('week', created_at), created_at DESC`. Prisma doesn't support `DISTINCT ON`; implement via `groupBy` + `_max` or a raw query using `prisma.$queryRaw`. Raw query is acceptable here since it's isolated to `CostEstimationService` or a dedicated read method.
- **SoC:** History querying belongs in `CostEstimationService` (cost data is its domain). `DiscoveryService.getMostVolatile()` reads `CostBreakdown` aggregates — acceptable because Discovery is the read-only analytics layer. No direct Prisma calls from API routes or components.
- **"Changed since last visit" timing:** `UserService.getRecentlyViewed()` returns `viewedAt` per product. Compare `viewedAt` to the most recent `CostBreakdown.createdAt`. If `createdAt > viewedAt`, the breakdown changed since the user's last visit. Compute delta as `(newTotal - oldTotal) / oldTotal * 100`.
- **Recharts choice:** `LineChart` with `<Line type="monotone">` is consistent with Recharts already in the approved stack. `CostTrendChart` follows the same `ResponsiveContainer` wrapper pattern as `CostBreakdownChart`.
- **Empty state trigger:** < 2 data points means the chart is meaningless (you can't draw a line through one point). The empty state is purely client-side — the hook returns data, the component checks `data.length < 2`.

---

## Open Questions

**Q20-1: Retention limit for historical CostBreakdown rows**
If history is kept indefinitely, a catalog of 10,000 products × 5 years × 52 weeks/year = 2.6M rows. This is manageable but worth planning. Should we add a TTL cleanup cron at launch (e.g., keep at most 2 years of history per product), or defer until there's evidence of table bloat?
- Suggested default: defer TTL cron. At current catalog scale (100 products), this is a non-issue for at least 3 years. Add a note in the TRD to revisit when the product catalog exceeds 1,000.
- **Owner:** Dev | **Priority:** Low — defer

**Q20-2: Chart visibility gating**
Should the trend chart be visible to all users (including guests), or signed-in users only? Guests have no "changed since last visit" indicator but could still see the trend chart.
- Suggested default: trend chart visible to all users (it's public product data — no auth required). "Changed since last visit" badge is signed-in only (requires `viewedAt` from `UserService`). Keeps the chart as a general SEO-value feature while the personalized badge is a retention hook.
- **Owner:** PM | **Priority:** Decide before TRD

**Q20-3: Volatile products page placement**
`/trending/volatile` is proposed as a sub-tab under `/trending`. But `/trending` is a Discovery feature. Should volatile products live under `/trending` or get its own route like `/volatile` or appear as a section on the home page?
- Suggested default: sub-tab on `/trending` (reuses the existing trending page shell). Avoids a new top-level route for a feature that may have low traffic until the catalog has more history. Promote to a top-level route if analytics show demand.
- **Owner:** Zach | **Priority:** Low — doesn't affect core implementation
