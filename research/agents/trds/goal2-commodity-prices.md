# TRD: Goal 2 — Commodity Price Integration

- **status:** `ready`
- **goal:** `Goal 2`
- **priority:** `P0`
- **branch:** `task/goal2-commodity-prices`
- **estimated_effort:** `Medium`
- **depends_on:** `Goal 1`

## Description

Integrate a commodity price API to fetch real-time prices for raw materials used in consumer products. Build the CommodityService that fetches, normalizes, and caches prices. Set up a daily cron job to refresh prices.

## Acceptance Criteria

- [ ] CommodityService implemented in `src/services/CommodityService.ts`
- [ ] Fetches prices from a commodity API (Commodities API or Tradefeeds free tier)
- [ ] All prices normalized to USD cents per kg, regardless of source format
- [ ] Prices cached in the `CommodityPrice` table with `fetchedAt` timestamp
- [ ] Material-to-commodity mapping table created in `src/data/commodity-mappings.ts`
- [ ] At least 30 materials mapped to commodity API keys covering:
  - **Textiles:** cotton, polyester, nylon, wool, silk, elastane/spandex, linen
  - **Metals:** steel, aluminum, copper, zinc, tin, nickel
  - **Plastics:** polyethylene (PE), polypropylene (PP), PVC, PET, polycarbonate
  - **Food:** sugar, wheat/flour, cocoa, milk/dairy, corn, soybean oil, palm oil, coffee, rice
  - **Other:** rubber, glass, paper/pulp, leather
- [ ] API route `GET /api/commodities/prices` returns current cached prices
- [ ] API route `GET /api/commodities/prices/:materialId` returns price for a specific material
- [ ] Vercel Cron job configured to refresh prices daily at 06:00 UTC
- [ ] Fallback behavior when API is down: serve last cached price with `stale: true` flag
- [ ] Unit tests for price normalization logic (at least 10 test cases covering different source units)
- [ ] `COMMODITY_API_KEY` used via typed env config, never raw process.env

## Material-to-Commodity Mapping Structure

```typescript
// src/data/commodity-mappings.ts
export interface CommodityMapping {
  materialName: string;       // matches Material.name in DB
  apiKey: string;             // key in the commodity price API
  sourceUnit: string;         // unit the API returns (e.g., "USD/lb", "USD/ton")
  conversionToKg: number;     // multiply API price by this to get USD/kg
  category: string;           // "textile", "metal", "plastic", "food", "other"
}
```

## API Evaluation

Test these free tiers in order of preference:
1. **Commodities API** (commodities-api.com) — 100 req/month free, covers metals + agriculture
2. **Tradefeeds** (tradefeeds.com) — covers industrial + agriculture
3. **API Ninjas Commodity Price** (api-ninjas.com) — 10,000 req/month free, limited coverage

Pick whichever has the best coverage of our 30+ target materials on the free tier. Document the choice and coverage gaps in a comment at the top of CommodityService.

## Unit Conversion Reference

Common conversions needed:
- 1 metric ton = 1,000 kg
- 1 lb = 0.453592 kg
- 1 oz (troy) = 0.0311035 kg
- 1 bushel of wheat ≈ 27.216 kg
- 1 bushel of corn ≈ 25.4 kg
- 1 bushel of soybeans ≈ 27.216 kg
- 1 barrel of oil = 158.987 liters

## Tasks

1. Evaluate commodity price API free tiers — test coverage of target materials
2. Create `src/data/commodity-mappings.ts` with all 30+ material mappings
3. Create `src/lib/unit-conversion.ts` with conversion helpers
4. Implement `src/services/CommodityService.ts`:
   - `fetchPrices()` — bulk fetch from API
   - `fetchPrice(materialName)` — single material lookup
   - `normalizePriceToKgCents(rawPrice, sourceUnit)` — unit conversion
   - `cachePrices(prices)` — write to CommodityPrice table
   - `getCachedPrice(materialId)` — read from DB with staleness check
5. Create API routes:
   - `src/app/api/commodities/prices/route.ts` — GET all current prices
   - `src/app/api/commodities/prices/[materialId]/route.ts` — GET single price
6. Configure Vercel Cron in `vercel.json`: daily price refresh
7. Create `src/app/api/cron/refresh-prices/route.ts` — cron endpoint
8. Write unit tests for:
   - Unit conversion (lb→kg, ton→kg, bushel→kg, etc.)
   - Price normalization (various source formats → USD cents/kg)
   - Staleness detection (price older than 48h = stale)
   - Fallback behavior (API down → serve cached with stale flag)
9. Seed CommodityPrice table with initial prices via the API

## Notes

- Start with the free tier. If coverage is too limited, we'll upgrade or add a second source later.
- The cron endpoint must be protected — verify `CRON_SECRET` header from Vercel.
- Log API errors to Sentry but don't crash — always fall back to cached data.
- Price staleness threshold: 48 hours. After that, still serve but flag `stale: true` in the response.
