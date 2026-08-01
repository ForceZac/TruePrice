# TRD: Goal 8 — Data Expansion & Accuracy Improvements

- **status:** `done`
- **goal:** `Goal 8`
- **priority:** `P1`
- **branch:** `task/goal8-data-expansion`
- **estimated_effort:** `Large`
- **depends_on:** `Goal 7` (soft — no runtime dependency; Goal 7 adds pages, Goal 8 adds data)

## Description

Expand TruePrice's data breadth and estimation accuracy: add ≥100 seed products, introduce a
categorical confidence tier (HIGH/MEDIUM/LOW) on cost breakdowns, add subcategory material
profiles, improve the ingredient-to-material parser, add cron jobs for retail price refresh and
re-estimation, add stale commodity price detection, and an admin coverage dashboard.

## Acceptance Criteria

- [ ] `CostBreakdown.confidence` field exists (`"HIGH" | "MEDIUM" | "LOW"`); existing rows default `"LOW"` via migration
- [ ] `Product.subcategory` optional field exists
- [ ] `CostEstimationService.estimateCost()` populates `confidence` tier: HIGH when product has ProductMaterial rows, MEDIUM when subcategory profile matches, LOW otherwise
- [ ] `src/data/subcategory-profiles.ts` exists; ≥3 subcategory profiles per top-level seeded category
- [ ] `src/data/product-overrides.ts` exists; override values applied before estimation in `CostEstimationService`
- [ ] `material-parser.ts` handles ≥10 new aliases/edge cases (unit conversions, "high-fructose corn syrup" → corn, etc.); test suite documents the table
- [ ] `POST /api/products/lookup` returns `{ found, product, breakdown }` — estimate is included in the same response when product is found
- [ ] Retail price refresh cron at `GET /api/cron/refresh-retail-prices` (weekly); updates `retailPriceCents` for products with null price or `lastLookedUp` > 30 days
- [ ] Stale price detection runs after commodity refresh; posts Discord `#alerts` if any `CommodityPrice.fetchedAt` > 25 hours
- [ ] Re-estimation cron at `GET /api/cron/re-estimate` (weekly); re-runs `estimateCost()` for products with `CostBreakdown.updatedAt` > `RE_ESTIMATION_TTL_DAYS` env var (default 7)
- [ ] Seed script seeds ≥100 products; `npm run db:seed` runs clean; ≥20 products have product-specific material data (HIGH confidence candidate)
- [ ] `/admin/coverage` page (no auth) shows total products, breakdown by confidence tier, breakdown by category
- [ ] TypeScript compiles clean; Prisma migration runs against empty DB
- [ ] All existing tests pass (≥212)

## Technical Notes

### Prisma Schema Additions

```prisma
// Product
subcategory  String?

// CostBreakdown
confidence   String  @default("LOW")
updatedAt    DateTime @updatedAt
```

### Confidence Tier Logic (in CostEstimationService)

- **HIGH**: product has ≥1 ProductMaterial rows linked (actual material data)
- **MEDIUM**: no material rows but subcategory profile exists for `{ category.slug, product.subcategory }`
- **LOW**: no material rows, no subcategory match → category-average fallback

### Subcategory Profiles (`src/data/subcategory-profiles.ts`)

Keyed by `{ categorySlug, subcategory }`. Each profile:
```ts
interface SubcategoryProfile {
  subcategory: string;
  categorySlug: string;
  defaultMaterialMix: Array<{ materialName: string; percentage: number }>;
  defaultWeightGrams: number;
  defaultLaborHours: number;
}
```

Required profiles (≥3 per category):
- `clothing-textiles`: t-shirt, jeans, shoes
- `food-beverage`: beverage, snack, canned-good
- `electronics`: smartphone, laptop, cable
- `cosmetics-personal-care`: moisturizer, shampoo, lipstick
- `home-kitchen`: cookware, cutting-board, knife

### Product Overrides (`src/data/product-overrides.ts`)

Keyed by UPC/EAN. Allows correcting material composition or retail price.
```ts
interface ProductOverride {
  upc?: string;
  ean?: string;
  retailPriceCents?: number;
  materials?: Array<{ materialName: string; percentage: number }>;
}
```

### Lookup Endpoint Change

`POST /api/products/lookup` currently returns `{ found, product }`.
Add cost estimation call inline: return `{ found, product, breakdown }`.
Use `Promise.race` with 4s timeout so slow external APIs don't block.

### New Cron Routes

- `GET /api/cron/refresh-retail-prices` — protected by CRON_SECRET; queries products with `retailPriceCents IS NULL OR lastLookedUp < NOW() - 30d`; calls UPCitemdb for each in batches of 20
- `GET /api/cron/re-estimate` — protected by CRON_SECRET; queries products whose latest CostBreakdown.updatedAt < `RE_ESTIMATION_TTL_DAYS` days ago; re-runs estimateCost() in batches of 50
- Stale price detection: add to `GET /api/cron/refresh-prices` after `fetchPrices()` — call `CommodityService.detectStalePrices(25h)`; if stale materials found, notify via `NotificationService.postDiscordAlert()` to #alerts

### Stale Price Alert

In `GET /api/cron/refresh-prices`, after `fetchPrices()` succeeds:
1. Call `CommodityService.detectStalePrices(25h)` — returns names of materials with `fetchedAt < NOW() - 25h`
2. If any stale materials, call `NotificationService.postDiscordAlert(alertsChannelId, message)` — **do not call the Discord API directly from the cron route**
3. Return stale count in cron response JSON

### NotificationService

`src/services/NotificationService.ts` is the single module responsible for all outbound Discord notifications. Cron routes and other services must use this module — they must not call the Discord API inline.

```ts
/**
 * Posts a message to a Discord channel via the bot token.
 * Fire-and-forget — failures are logged but not re-thrown.
 */
export async function postDiscordAlert(
  channelId: string,
  content: string
): Promise<void>
```

This enforces separation of concerns: the cron route handles business logic (detect stale prices), `NotificationService` handles the transport (Discord API call).

### vercel.json

Add to `crons`:
```json
{ "path": "/api/cron/refresh-retail-prices", "schedule": "0 7 * * 1" },
{ "path": "/api/cron/re-estimate", "schedule": "0 8 * * 1" }
```

### Env Vars

Add to `env.server.ts`:
- `RE_ESTIMATION_TTL_DAYS: z.coerce.number().int().positive().default(7)`

### Admin Coverage Page

Server component at `app/admin/coverage/page.tsx`. Three stat blocks + category table.
Query via direct Prisma calls (server component, no auth for v1).

## Tasks

1. Write TRD (this file) ✓
2. Create branch `task/goal8-data-expansion`
3. Prisma migration: add `Product.subcategory`, `CostBreakdown.confidence`, `CostBreakdown.updatedAt`
4. Add `src/data/subcategory-profiles.ts`
5. Add `src/data/product-overrides.ts`
6. Update `CostEstimationService`: confidence tier, subcategory profile lookup, override support
7. Improve `src/lib/material-parser.ts`: more aliases, unit conversions
8. Update `POST /api/products/lookup`: return `breakdown` in response
9. Add `GET /api/cron/refresh-retail-prices`
10. Add stale price detection to `GET /api/cron/refresh-prices`
11. Add `GET /api/cron/re-estimate`
12. Add `RE_ESTIMATION_TTL_DAYS` to `env.server.ts`
13. Expand `prisma/seed.ts` to ≥100 products
14. Add `app/admin/coverage/page.tsx`
15. Update `vercel.json` with new cron schedules
16. Write Vitest tests
17. Run `tsc --noEmit` and `vitest run`; fix failures
18. Update backlog
