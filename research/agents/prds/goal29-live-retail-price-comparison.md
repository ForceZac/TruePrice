# PRD: Goal 29 — Live Retail Price Comparison

- **Goal reference:** Goal 29 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 4 (Cost Estimation Engine), Goal 5 (Product Page UI), Goal 8 (Data Expansion)
- **Proposed by:** PM Run #240 (2026-08-12)

---

## Problem Statement

TruePrice's core insight — "this product costs X to make but sells for Y" — is only as powerful as the retail price data behind Y. Right now, retail prices come from UPCitemdb, refreshed weekly by cron (Goal 8). This creates three problems:

1. **Stale retail prices weaken the markup story.** If a phone's retail price was $799 when scraped last Monday but Amazon dropped it to $699 on Tuesday for a sale, TruePrice is showing the wrong markup. The manufacturing cost is correct; the comparison is wrong. Users who check Amazon's current price and see a mismatch lose confidence in TruePrice's numbers.

2. **Single-source retail data misses the markup range.** "Markup" isn't a single number — it varies by retailer. Amazon charges $799 for the same phone that Target sells for $749 and Best Buy sells for $819. Showing only one retail price collapses this range into a false precision. Users want to know: "Who's charging the most over cost?"

3. **No retailer comparison is a missed engagement hook.** The natural follow-up question after "it costs $340 to make" is "so where should I buy it?" A retailer price comparison row turns TruePrice from a transparency tool into a purchase decision tool — higher dwell time, more return visits, and a natural affiliate revenue hook (Goal 21).

---

## User Stories

**US-1 — See current prices from multiple retailers**
As a user on a product page, I want to see the current price from Amazon, Target, and Walmart (where available) alongside the manufacturing cost, so I can immediately compare markup across retailers and decide where to buy.

**US-2 — Understand which retailer has the highest/lowest markup**
As a user, I want to see which retailer charges the highest markup (e.g., "Amazon: 135% markup vs. cost") and which charges the lowest, so I can make an informed purchase decision.

**US-3 — See prices refresh on demand**
As a user who suspects a price has changed since the page last updated, I want to click "Refresh prices" to fetch current retailer prices, so I'm always making decisions on live data rather than cached data.

**US-4 — Out-of-stock indication**
As a user, I want to know if a product is out of stock at a particular retailer rather than seeing a stale price or a missing entry, so I don't waste time clicking through to an unavailable listing.

**US-5 — Affiliate buy links**
As a user ready to purchase, I want the retailer name to link to the product listing (with a TruePrice affiliate tag where applicable), so I can go straight to checkout from the TruePrice page.

---

## Requirements

### Must-Have

- **`RetailPriceService`** (`src/services/RetailPriceService.ts`) — sole owner of all external retailer price fetching and caching. Methods:
  - `getRetailPrices(productId)` — returns an array of `{ retailer, priceCents, inStock, url, fetchedAt }` for a product. Returns from cache if `fetchedAt` is within TTL; otherwise fetches live.
  - `refreshRetailPrices(productId)` — force-fetches all configured retailer sources for the given product, updates the `RetailPrice` table, returns updated results.
  - `getRetailPriceSummary(productId)` — returns `{ lowestPriceCents, highestPriceCents, lowestMarkupPercent, highestMarkupPercent, retailerCount, lastUpdatedAt }` for use in list views and OG metadata.

- **`RetailPrice` Prisma model.** New model:
  - `id` (cuid), `productId` (FK → Product), `retailer` (string — e.g., `"amazon"`, `"target"`, `"walmart"`), `priceCents` (int), `inStock` (boolean), `listingUrl` (string), `fetchedAt` (DateTime), `createdAt`, `updatedAt`.
  - Unique constraint: `(productId, retailer)` — one row per product-retailer pair, upserted on refresh.

- **Retailer price source — UPCitemdb extended + Rainforest API.** UPCitemdb already provides a `lowest_recorded_price` and `highest_recorded_price`. For live Amazon pricing, integrate Rainforest API (`https://api.rainforestapi.com`) — a paid product data API that returns current Amazon prices by ASIN or UPC. Rainforest provides real-time Amazon price + stock status. Gate on `RAINFOREST_API_KEY` presence — if absent, fall back to UPCitemdb extended price fields (better than nothing). Target and Walmart prices: v1 uses UPCitemdb's `offers` array where available; dedicated Target/Walmart API integrations deferred to v2.

- **TTL:** Live retailer prices are cached for 4 hours (vs. 7 days for the existing UPCitemdb weekly refresh). After 4 hours, the next page load triggers a background refresh (respond with stale data, update in the background — stale-while-revalidate pattern). Manual "Refresh prices" forces an immediate synchronous refresh, rate-limited to once per product per 5 minutes per user.

- **Retailer price comparison table on product pages.** New section below the cost breakdown chart. Displays:
  - A header: "Where to buy — current retail prices"
  - One row per retailer with: retailer name (logo icon optional), current price (formatted), markup over manufacturing cost (e.g., "+135%"), stock status badge ("In stock" / "Out of stock"), and a "Buy →" link (affiliate-tagged where applicable, per Goal 21 rules)
  - Rows sorted by price ascending (lowest first)
  - A "Last updated: X minutes ago" line with a "Refresh" button
  - Client component (data fetched via TanStack Query hook `useRetailPrices(productId)`); server-render shows skeleton while loading

- **`GET /api/products/[id]/retail-prices`** — returns `RetailPrice[]` for the product. Calls `RetailPriceService.getRetailPrices()`. No auth required.
- **`POST /api/products/[id]/retail-prices/refresh`** — force-refreshes prices. Rate-limited: 1 per product per 5 minutes (tracked via in-memory cache or Redis if available; degrade gracefully if neither). Returns updated `RetailPrice[]`.

- **Weekly cron update.** Extend the existing `GET /api/cron/refresh-retail-prices` (already defined in PROJECT_KEYS.md section 6) to also call `RetailPriceService.refreshRetailPrices()` for all products in the catalog (in batches of 50, with 200 ms delay between batches to stay within Rainforest API rate limits). The existing cron currently refreshes UPCitemdb data; this extends it to include the new `RetailPrice` table.

- **`tsc --noEmit` clean; unit tests for `RetailPriceService`:** `getRetailPrices` (cache hit, cache miss triggers fetch), `refreshRetailPrices` (returns updated records), markup percent calculation, TTL logic, rate-limit enforcement.

### Should-Have

- **Price history sparkline in the retailer comparison table.** A small 7-day sparkline of price changes per retailer (using data in the `RetailPrice` table's `updatedAt` history). Shows whether the current price is above or below the recent average. Requires that `RetailPrice` keep historical rows (not just upsert) — store daily snapshots, prune to 30 days.
- **Lowest price badge on product cards in list views.** When `RetailPriceSummary.lowestPriceCents` is available, show a "From $X.XX" chip on product cards in search results and category pages. Requires `RetailPriceService.getRetailPriceSummary()` to be called at list-render time (cached, not live).
- **OG metadata update.** Update the product page OG title/description to include the lowest retail price: "iPhone 15 Pro: costs $340 to make — from $699 at Amazon." Makes social shares more clickable.

### Won't Have (v1)

- Price alerts for retailer price drops (deferred — Goal 11b handles cost-based alerts; retailer price alerts are a separate scope)
- Walmart or Target live API integration (UPCitemdb offers array covers these sufficiently for v1; dedicated integrations deferred to v2)
- Price comparison across used/refurbished marketplaces (eBay, Back Market) — different value proposition; deferred
- Currency conversion for non-USD retail prices — all retail prices stored in USD cents; international prices deferred to Goal 25 (Internationalization)
- Machine-learning price prediction ("likely to drop next week") — out of scope

---

## Acceptance Criteria

- [ ] Product pages show a retailer comparison section with at least one retailer's current price and stock status
- [ ] When `RAINFOREST_API_KEY` is present, Amazon's live price is fetched and displayed; when absent, UPCitemdb extended price fields are used as fallback
- [ ] Retailer rows are sorted by price ascending; markup percent is shown per retailer
- [ ] "Refresh prices" button triggers `POST /api/products/[id]/retail-prices/refresh` and updates the table; button is disabled for 5 minutes after use
- [ ] "Last updated: X minutes ago" timestamp reflects `RetailPrice.fetchedAt`
- [ ] Out-of-stock retailers show an "Out of stock" badge instead of a price
- [ ] `RetailPrice` records are upserted (not duplicated) on each refresh
- [ ] Weekly cron (`refresh-retail-prices`) updates `RetailPrice` records for all products in batches
- [ ] `RetailPriceService` unit tests pass: cache hit, cache miss, markup calculation, TTL, rate-limit
- [ ] `tsc --noEmit` passes clean; all existing tests continue to pass

---

## Technical Notes

- **SoC:** `RetailPriceService` owns all retailer price fetching, caching, and TTL logic. API routes delegate to it. Components fetch via TanStack Query (`useRetailPrices` hook) — no direct service imports in client components.
- **Rainforest API:** `GET https://api.rainforestapi.com/request?api_key=<key>&type=product&asin=<ASIN>` returns `{ product: { buybox_winner: { price: { value, currency }, availability: { raw } } } }`. To look up by UPC (not ASIN): `type=search&amazon_domain=amazon.com&search_term=<UPC>` — gets the ASIN from search results, then fetches the product. Add `RAINFOREST_API_KEY` to `env.server.ts`.
- **UPCitemdb fallback:** UPCitemdb's `/trial/lookup` response includes `lowest_recorded_price` and `highest_recorded_price`. These are not "current" prices but are better than nothing when Rainforest is unavailable. Store them as `retailer: "upcitemdb_range_low"` and `"upcitemdb_range_high"` in the `RetailPrice` table to distinguish from live Rainforest prices.
- **Stale-while-revalidate:** On `getRetailPrices()`: if data is within TTL, return it synchronously. If stale, return stale data and trigger an async background refresh (`void refreshRetailPrices(productId)`) — do not await. This avoids blocking the product page render on a slow Rainforest call.
- **Rate limiting the refresh button:** Use an in-memory `Map<productId, lastRefreshAt>` on the server (sufficient for single-instance Vercel functions since each invocation is stateless; use `lru-cache` package, already a transitive dep). A Redis layer can be added in Goal 30+ if needed. The rate-limit check in the API route returns a `429` with `Retry-After: <seconds>` header.
- **Markup calculation:** `((retailPriceCents - totalCostCents) / totalCostCents) * 100` — same formula as the existing `CostBreakdown.markupPercent`. Use integer arithmetic until the final display division.
- **New env vars:** `RAINFOREST_API_KEY` (server-side only). Add to `env.server.ts` as optional (`z.string().optional()`); gate Rainforest calls on its presence.

---

## Open Questions

**Q29-1: Rainforest API pricing — is the cost justified?**
Rainforest API charges per request. At ~$0.01 per request for the Product type, refreshing 1,000 products weekly = ~$10/week = ~$40/month. This is low at current scale but grows linearly with catalog size. Is Zach comfortable with this as an ongoing infra cost, or should v1 use only UPCitemdb (free) until scale justifies Rainforest?
- Suggested default: Start with UPCitemdb only (free); add Rainforest as an opt-in upgrade once the feature proves its value. The code should be written to support both — just don't provision the key until ready.
- **Owner:** Zach | **Priority:** High — must decide before TRD so the developer doesn't over-engineer the Rainforest integration

**Q29-2: How many retailers to show in v1?**
Showing 1 retailer (Amazon only via Rainforest) is simplest. Showing 3 (Amazon + UPCitemdb's extended offer data for Target/Walmart) is richer but requires parsing UPCitemdb's `offers` array, which is inconsistently structured. A single clean Amazon price row is better UX than 3 rows where 2 are often empty.
- Suggested default: 1 retailer (Amazon via Rainforest, or UPCitemdb fallback) for v1. Table structure supports multiple rows; add retailers in follow-on runs.
- **Owner:** Zach | **Priority:** Medium — scope decision; affects how much DB schema pre-work to do

**Q29-3: Where does Goal 21 (Affiliate Buy Links) affiliate tagging happen?**
Goal 21 (Affiliate Buy Links) hasn't been implemented yet. Should this goal pre-wire the `listingUrl` field for affiliate parameters (e.g., `?tag=trueprice-20` for Amazon Associates), or leave it as a clean URL and let Goal 21 handle the tagging?
- Suggested default: Store the clean canonical URL in `RetailPrice.listingUrl`. When rendering the "Buy →" link, `RetailPriceService` (or a thin util) appends the affiliate tag from an env var (`AMAZON_AFFILIATE_TAG`) if present. This gates the affiliate revenue on having a tag configured, but pre-wires the hook so Goal 21 is just adding the env var + disclosure copy.
- **Owner:** PM/Dev | **Priority:** Low — can be decided during TRD
