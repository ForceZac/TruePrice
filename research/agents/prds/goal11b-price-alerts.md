# PRD: Goal 11b — Price Alerts

- **Goal reference:** Goal 11b (sub-feature of Goal 11 — Price Alerts & Save-as-Image)
- **Status:** In review (PR #20)
- **Priority:** P2
- **Depends on:** Goal 10 (User Accounts — requires authenticated User, SavedProduct, Resend)
- **Blocks:** nothing

---

## Problem Statement

Users who save products to their watchlist are expressing a specific intent: "I care about this product's real cost." But today, the watchlist is a passive feature — nothing happens after you save a product. If commodity prices shift and a product's real manufacturing cost changes meaningfully, the user has no way to know without manually revisiting.

This breaks the core value loop. TruePrice's edge is live cost data. If users aren't notified when that data changes, the watchlist is just a bookmark folder. Price alerts close the loop: save a product, get an email when the real cost moves, come back to TruePrice to see why.

Automated emails also provide a repeat traffic driver that doesn't depend on users remembering to return — the product comes to them.

---

## User Stories

- **As a watchlist user**, I want to receive an email when the manufacturing cost of a saved product changes significantly so I can decide whether to buy it now or wait.
- **As a user with many saved products**, I don't want to be spammed — I want to set my own threshold for what counts as a "meaningful" change (e.g. only alert me if cost moves more than 10%).
- **As a user who decides alerts aren't useful**, I want to opt out without deleting my account or watchlist.
- **As a user who checks prices daily**, I don't want duplicate alerts for the same product within 24 hours even if prices bounce around.
- **As a developer**, I want price alert logic isolated in its own service so the cron route doesn't grow into a monolith.

---

## Requirements

### Must Have
- Alert email sent via Resend when a watchlisted product's cost changes past the user's threshold
- Alert fires after each daily commodity price refresh (integrated into `GET /api/cron/refresh-prices`)
- Per-user threshold selector: any change / 5% / 10% (default) / 20%
- Per-user opt-out toggle (`alertsEnabled`)
- 24-hour rate limit per (user, product) pair to prevent alert storms
- Alert history stored in `AlertLog` table, accessible via API
- Settings UI on `/dashboard/settings` — threshold selector + opt-out toggle
- Auth-gated settings endpoints (401 for unauthenticated requests)

### Should Have
- Unsubscribe link in alert email (one-click opt-out)
- Email renders old cost, new cost, and delta % with direction (up/down)

### Won't Have (v1)
- Push notifications (email only)
- Per-product threshold overrides (account-level threshold only)
- SMS alerts
- Digest batching (one email per alert event; batching deferred)
- In-app notification bell

---

## Acceptance Criteria

- [ ] `AlertService.checkWatchlistAlerts()` is called after `CommodityService.refreshPrices()` completes in the daily cron
- [ ] Alert fires when `|delta| / baseline >= threshold` (null threshold → 10% default)
- [ ] Alert threshold options: any change (0), 5%, 10%, 20%
- [ ] No alert fires if `SavedProduct.lastAlertedAt` is within the last 24 hours (rate limit)
- [ ] `User.alertsEnabled = false` skips that user entirely
- [ ] Alert email renders: product name, old cost, new cost, delta % with direction
- [ ] `SavedProduct.lastAlertedCostCents` is updated after each alert fires
- [ ] `PATCH /api/account/alert-settings` updates threshold + enabled; returns 401 for unauthenticated
- [ ] `GET /api/account/alerts` returns last 30 days of alert history; returns 401 for unauthenticated
- [ ] `/dashboard/settings` shows threshold selector + opt-out toggle
- [ ] TypeScript compiles clean
- [ ] Unit tests cover: all 5 threshold cases (null/0/5/10/20), delta calculation, rate-limit skip, alertsEnabled skip, baseline update

---

## Technical Notes

### Schema additions

**User model:**
- `alertThresholdPct Int?` — null = 10% default; 0 = any change; 5 | 10 | 20
- `alertsEnabled Boolean @default(true)`

**SavedProduct model:**
- `costAtWatchCents Int?` — cost at time product was saved; baseline if no prior alert
- `lastAlertedCostCents Int?` — cost at last alert fire; primary baseline
- `lastAlertedAt DateTime?` — rate-limit anchor

**New AlertLog model:**
- `id`, `userId`, `productId`, `oldCostCents`, `newCostCents`, `deltaPercent`, `sentAt`
- Cascades on user/product delete
- Indexed on `userId` and `(userId, productId)` for fast history queries

### Service design
- `AlertService` owns all alert logic — delta computation, threshold evaluation, rate-limit check, Resend dispatch, baseline update, history query
- No alert logic leaks into cron routes or `UserService` (SoC compliance)
- `CostEstimationService` is called per product to compute current cost; results are compared to stored baseline

### Baseline comparison
1. If `lastAlertedCostCents` is non-null → use it as baseline
2. Else if `costAtWatchCents` is non-null → use it as baseline
3. Else → skip (no baseline to compare against; will establish baseline on next alert cycle)

### Environment variables
- `ALERT_FROM_EMAIL` — server-only; Resend from-address for price alerts. Defaults to `FROM_EMAIL` if unset.
- `RESEND_API_KEY` — already required for Goal 10 digest emails; alert emails use the same key

### Stack compliance
- All email logic through Resend (Goal 10 dep — already in the stack)
- `AlertService` in `src/services/AlertService.ts`
- No raw DB queries in API routes — all through `AlertService`
- Cron route calls `AlertService.checkWatchlistAlerts()`; does not contain alert logic itself

---

## Open Questions

None — all design decisions resolved before implementation.

**Resolved decisions:**
- **Threshold default:** 10% (null). Balances sensitivity with noise; users who want more/less can adjust.
- **Rate limit window:** 24 hours per (user, product). Prevents storm conditions when commodity prices bounce intraday.
- **Digest vs. per-event emails:** Per-event for v1. Digest batching deferred — adds scheduling complexity with little gain at low user volumes.
- **Baseline when no prior alert:** Fall back to `costAtWatchCents`; skip if both null. Avoids spurious first-alert on products saved before Goal 11b shipped.
