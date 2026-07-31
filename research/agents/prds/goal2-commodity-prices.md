# PRD: Goal 2 — Commodity Price Integration

**Goal reference:** Goal 2 — Commodity Price Integration
**Status:** Implemented (PR #2, merged)
**Roadmap position:** Depends on Goal 1; unblocks Goal 4 (Cost Engine)

---

## Problem Statement

TruePrice's core value proposition is showing users what a product *actually costs to make* — not a guess, not a fixed markup table, but a live calculation rooted in real commodity market prices. Without real commodity prices, every cost breakdown is fabricated.

The problem has two parts:

1. **Data availability:** Raw material prices (cotton, aluminum, cocoa, PET plastic, etc.) change daily based on commodity markets. TruePrice needs to pull these prices from an external source and keep them fresh.

2. **Data normalization:** Commodity APIs report prices in inconsistent units — USD per pound, per metric ton, per bushel, per troy ounce. Every price must be normalized to a single unit (USD cents per kg) before it can be used in cost calculations. Getting this wrong silently produces estimates that are off by orders of magnitude.

A daily cron refresh ensures that users always see estimates based on this week's commodity prices, not prices from six months ago.

---

## User Stories

**As a user looking at a cotton t-shirt's cost breakdown,** I want the material cost to reflect current cotton commodity prices — not a hardcoded number from when the app launched — so the breakdown stays accurate as markets move.

**As a user checking a product's cost in a week when aluminum prices spike,** I want to see that spike reflected in the breakdown of any aluminum-containing product, so I understand why manufacturing costs changed.

**As a developer building the Cost Estimation Engine (Goal 4),** I want a `getCachedPrice(materialId)` method that returns a normalized USD-cents-per-kg value, so I don't have to think about unit conversion inside estimation logic.

**As Zach running TruePrice in production,** I want commodity prices to refresh daily without manual intervention, and I want the site to keep working (serving stale cached prices) if the API is down, so uptime doesn't depend on a third-party commodity API's availability.

---

## Requirements

### Must-Have
- `CommodityService` at `src/services/CommodityService.ts` with:
  - `fetchPrices()` — bulk fetch from commodity API
  - `getCachedPrice(materialId)` — read from DB, includes staleness flag
  - `normalizePriceToKgCents(rawPrice, sourceUnit)` — canonical unit conversion
  - `cachePrices(prices)` — write to `CommodityPrice` table
- At least 30 materials mapped to commodity API keys, covering: textiles (cotton, polyester, nylon, wool, silk, linen, elastane), metals (steel, aluminum, copper, zinc, tin, nickel), plastics (PE, PP, PVC, PET, polycarbonate), food (sugar, wheat, cocoa, milk, corn, soybean oil, palm oil, coffee, rice), and other (rubber, glass, paper/pulp, leather)
- All prices normalized to **USD cents per kg** regardless of source unit
- Vercel Cron refreshing prices daily at 06:00 UTC (`GET /api/cron/refresh-prices`)
- Cron endpoint protected by `CRON_SECRET` header check
- Fallback behavior: if API is down, serve last cached price with `stale: true` in the response
- `GET /api/commodities/prices` — returns all current cached prices
- `GET /api/commodities/prices/[materialId]` — returns price for one material
- Unit tests for normalization logic (≥10 test cases: lb→kg, ton→kg, oz troy→kg, bushel→kg for wheat/corn/soy)
- `COMMODITY_API_KEY` consumed via typed env config, never raw `process.env`

### Should-Have
- Stale detection: flag prices older than 48 hours as `stale: true` even when served
- Sentry error logging on API failures (don't crash; always fall back)
- Comment at top of `CommodityService.ts` documenting which API was chosen and what coverage gaps exist
- `src/lib/unit-conversion.ts` with named conversion constants (not magic numbers inline)

### Won't-Have (this goal)
- Cost calculation — that's Goal 4
- Admin UI for commodity prices
- Multi-source price aggregation or averaging — pick one API for v1
- Price history charts — just latest price per material for now

---

## Acceptance Criteria

- [ ] `CommodityService.fetchPrices()` successfully fetches and stores prices for ≥30 materials
- [ ] `CommodityService.getCachedPrice(materialId)` returns a price within 48 hours or flags `stale: true`
- [ ] `GET /api/commodities/prices` returns JSON with all cached prices; each entry has `materialId`, `pricePerKgCents`, `fetchedAt`, `stale`
- [ ] `GET /api/commodities/prices/[materialId]` returns a single material's price or 404
- [ ] `GET /api/cron/refresh-prices` refreshes all prices; requires valid `x-vercel-cron-secret` header (returns 401 otherwise)
- [ ] Vercel Cron configured in `vercel.json` to hit `/api/cron/refresh-prices` daily at 06:00 UTC
- [ ] If commodity API returns an error, service logs to Sentry and returns last cached price with `stale: true`
- [ ] `npx vitest run` passes ≥10 unit conversion tests
- [ ] No raw `process.env` in any service or route file
- [ ] `tsc --noEmit` passes clean

---

## Technical Notes

- **API selection:** Evaluate free tiers in this order: Commodities API (commodities-api.com, 100 req/month), Tradefeeds (tradefeeds.com), API Ninjas Commodity Price (10,000 req/month, limited coverage). Choose based on coverage of the 30+ target materials. Document the choice.
- **Unit conversions needed:**
  - 1 metric ton = 1,000 kg
  - 1 lb = 0.453592 kg
  - 1 troy oz = 0.0311035 kg
  - 1 bushel of wheat ≈ 27.216 kg
  - 1 bushel of corn ≈ 25.4 kg
  - 1 bushel of soybeans ≈ 27.216 kg
- **Staleness threshold:** 48 hours. After that, continue serving but flag `stale: true`. Don't hard-fail — stale data is better than no data.
- **Cron protection:** Vercel passes `x-vercel-cron-secret` on cron calls. Validate this in the cron route. Return 401 for any other caller.
- **Data model:** Prices write to `CommodityPrice` table (from Goal 1 schema). One row per material per fetch — don't upsert in place; keep history for future price trend work.
- **Mapping file:** `src/data/commodity-mappings.ts` defines `materialName → apiKey + sourceUnit + conversionToKg`. This is the single source of truth for what we track and how to convert it.
- **Separation of concerns:** `CommodityService` is the *only* module that calls the commodity API or writes to `CommodityPrice`. API routes and estimation logic call `CommodityService` — they never hit the external API directly.

---

## Open Questions

**Q2-1: API coverage gaps**
Some materials (elastane/spandex, polycarbonate, specialty plastics) may not have direct commodity API equivalents on the free tier. What's the fallback?
- Suggested: Use a proxy material with a known price (e.g., map spandex to polyester price as a rough proxy). Document each proxy in the mapping file. Flag LOW confidence in any estimate that relies on a proxied price.
- **Owner:** Developer implementing Goal 2 — make a call and document it; revisit in Goal 8 if accuracy matters.
