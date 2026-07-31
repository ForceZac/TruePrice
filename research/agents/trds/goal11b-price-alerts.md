# TRD: Goal 11b — Price Alerts

- **status:** `ready`
- **goal:** `Goal 11b`
- **priority:** `P2`
- **branch:** `task/goal11b-price-alerts`
- **estimated_effort:** `Medium`
- **depends_on:** `Goal 10 (task/goal10-user-accounts) — requires User, SavedProduct, Resend`

## Description

Add price alert emails: after each daily commodity price refresh, re-estimate costs for all watchlisted products and email users when cost changes exceed their configured threshold. Users can configure their alert threshold (any change / 5% / 10% / 20%) and opt out of alerts from their settings page. Alert history is stored in an `AlertLog` table and exposed via an API route.

## Acceptance Criteria

- [ ] `AlertService.checkWatchlistAlerts()` is called after `CommodityService.refreshPrices()` completes in the daily cron
- [ ] For each user with ≥1 saved product, computes `estimateCost()` result and compares `totalCostCents` to `SavedProduct.lastAlertedCostCents` (falls back to `costAtWatchCents`, then skips if both null)
- [ ] Alert fires when `abs(delta) / baseline >= threshold` (threshold: null → 10%, 0 → any change, else the stored value in pct)
- [ ] Alert email (Resend) renders: product name, old cost, new cost, delta % with direction, unsubscribe link
- [ ] After alert fires, `SavedProduct.lastAlertedCostCents` is updated to the new cost and `SavedProduct.lastAlertedAt` is set to now
- [ ] Rate limit: no alert fires if `SavedProduct.lastAlertedAt` is within the last 24 hours for that (user, product) pair
- [ ] `User.alertsEnabled = false` skips that user entirely
- [ ] `PATCH /api/account/alert-settings` updates `alertThresholdPct` (must be one of `[null, 0, 5, 10, 20]`) and `alertsEnabled`; returns 401 for unauthenticated requests
- [ ] `GET /api/account/alerts` returns the last 30 days of `AlertLog` rows for the current user; returns 401 for unauthenticated requests
- [ ] `/dashboard/settings` includes an Alert Settings section with threshold selector and opt-out toggle
- [ ] TypeScript compiles clean
- [ ] `AlertService` unit tests: threshold logic (all 5 cases), delta calculation, rate-limit skip, alertsEnabled skip, baseline update

## New Dependencies

None — uses existing `resend` (from Goal 10), `CostEstimationService`, and Prisma.

## Schema Changes

```prisma
// User additions
alertThresholdPct   Int?     // null = 10% default; 0 = any change; 5 | 10 | 20
alertsEnabled       Boolean  @default(true)

// SavedProduct additions
costAtWatchCents    Int?     // cost at time product was saved (null if saved before Goal 11b)
lastAlertedCostCents Int?    // cost at last alert fire; baseline for next comparison
lastAlertedAt       DateTime? // rate-limit anchor (no second alert within 24 h)

// New model
model AlertLog {
  id            String   @id @default(cuid())
  userId        String
  productId     String
  oldCostCents  Int
  newCostCents  Int
  deltaPercent  Float
  sentAt        DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, productId])
  @@index([sentAt])
}
```

## New Services

- `src/services/AlertService.ts` — owns all price alert logic (delta computation, threshold evaluation, rate-limit check, email dispatch, baseline update, history query). No alert logic in cron routes or UserService.

## New API Routes

- `PATCH /api/account/alert-settings` — update `alertThresholdPct` + `alertsEnabled`
- `GET /api/account/alerts` — alert history for current user (last 30 days)

## New Components

- `src/components/molecules/AlertSettingsForm.tsx` — threshold selector + opt-out toggle (client component; calls PATCH route via fetch)

## Environment Variables

- `ALERT_FROM_EMAIL` — server-only; Resend from-address for price alerts (e.g. `alerts@trueprice.app`). Defaults to `FROM_EMAIL` if unset.

## Tasks

- [ ] Write TRD
- [ ] Create branch off `task/goal10-user-accounts`
- [ ] Add `alertThresholdPct`, `alertsEnabled` to `User` in schema
- [ ] Add `costAtWatchCents`, `lastAlertedCostCents`, `lastAlertedAt` to `SavedProduct` in schema
- [ ] Add `AlertLog` model to schema
- [ ] Create Prisma migration
- [ ] Add `ALERT_FROM_EMAIL` to `env.server.ts`
- [ ] Implement `AlertService.ts`
- [ ] Hook `AlertService.checkWatchlistAlerts()` into refresh-prices cron
- [ ] Implement `PATCH /api/account/alert-settings`
- [ ] Implement `GET /api/account/alerts`
- [ ] Implement `AlertSettingsForm.tsx`
- [ ] Add alert settings section to `/dashboard/settings`
- [ ] Write `AlertService` unit tests
- [ ] Run full test suite + tsc; fix failures
