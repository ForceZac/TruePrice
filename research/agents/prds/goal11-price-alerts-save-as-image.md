# PRD: Goal 11 — Price Alerts & Save-as-Image

- **Goal reference:** Goal 11 — Price Alerts & Save-as-Image
- **Status:** Draft
- **Priority:** P2
- **Depends on:** Goal 10 (User Accounts, Watchlist & Email Digest)
- **Blocks:** nothing (engagement/growth layer)

---

## Problem Statement

Goal 10 gives users a watchlist and a weekly digest. But "weekly" is a blunt instrument — if cotton prices spike 20% after a supply shock, a user who's watching a $180 t-shirt won't hear about it for up to 7 days. By then, the marketing moment is gone.

Price alerts convert the watchlist from a passive reading list into an active monitoring tool. When the daily commodity price refresh (already running in prod) causes a watched product's estimated cost to move by more than a threshold, users get notified the same day — by email, and optionally by browser push notification.

Separately, users regularly ask how they can share the cost breakdown chart to Instagram Stories or WhatsApp. The current Share button copies a URL, but a URL doesn't display inline in visual platforms. A "Save as Image" button that downloads the cost breakdown chart as a PNG closes this gap without requiring an API call — it's client-side, zero infra.

Together, these two features address the two most common requests from early users: "Tell me when it changes" and "How do I share the chart?"

---

## User Stories

1. **As a watchlist user**, I want to receive an email alert the same day a watched product's estimated manufacturing cost changes by more than 10% — so I can act on the information while it's still current (share it, make a purchase decision, etc.).

2. **As a user who prefers browser notifications**, I want to opt in to web push notifications so I get price change alerts on my phone or desktop without checking email.

3. **As a user with varied risk tolerance**, I want to set my own alert threshold (5%, 10%, 20%, or any change) per product or globally — so I'm not flooded with minor fluctuations or miss major ones.

4. **As a user looking at a product page**, I want to click "Save as Image" and download a PNG of the cost breakdown chart — so I can share it directly to Instagram Stories, WhatsApp, or anywhere that renders images inline.

5. **As a casual user who doesn't want account overhead**, I want to use "Save as Image" without signing in — so I get value from the sharing feature without creating an account.

---

## Requirements

### Must-Have

- **Price alert detection** — after each run of `GET /api/cron/refresh-prices` (daily price refresh), re-run `estimateCost()` for all products in any user's watchlist and compare to `WatchlistEntry.costAtWatchCents`. If the delta exceeds the user's threshold, queue an alert.
- **Alert email** — send via Resend. Content: product name, old cost, new cost, change % and direction (▲/▼), retail price, new markup multiplier. Include "Unsubscribe from price alerts" link (separate from digest unsubscribe). Send immediately (not batched to Monday).
- **Global alert threshold** — users can set a threshold on their account page: Any Change / 5% / 10% (default) / 20%. Stored on `User` model as `alertThresholdPct` (int, nullable = use default 10).
- **"Save as Image" button** — on the product page cost breakdown section. Client-side only: captures the `CostBreakdownChart` component DOM node as a PNG using `dom-to-image-more` and triggers browser download (`<a download>`). No sign-in required. No server involvement.
- **Alert baseline update** — after an alert fires for a product, update `WatchlistEntry.costAtWatchCents` to the new cost so the next alert is relative to the most recent change, not the original watch price.

### Should-Have

- **Web push notifications** — users can opt in to browser push (Web Push API / VAPID). On opt-in, store the push subscription in DB. Alert delivery includes push alongside email. Service worker handles push receipt.
- **Per-product threshold override** — on the watchlist page, each row has a dropdown to override the global threshold for that specific product.
- **Alert history page** — `/account/alerts` shows the last 30 days of price alerts received (product, date, old cost, new cost, delta %). Useful for spotting commodity trends affecting the user's watched categories.
- **Alert quiet hours** — respect user timezone; don't deliver push notifications between 22:00–08:00 local time (buffer to next morning instead).

### Won't-Have (v1)

- SMS or WhatsApp alerts
- Price alert webhooks (API-level integrations for power users) — defer
- "Watch and alert me once then stop" (one-shot mode) — too niche; users can unwatch manually
- Alert aggregation / digest-mode for alerts (one email per day instead of immediate) — potential v2 if alert fatigue becomes an issue
- Selling alert data or aggregated commodity trend reports

---

## Acceptance Criteria

- [ ] After `GET /api/cron/refresh-prices` runs and commodity prices change, `AlertService.checkWatchlistAlerts()` is called and computes cost deltas for all products in any watchlist
- [ ] If a product's cost delta exceeds a user's threshold, an alert email is sent via Resend within 1 minute of the cron completing
- [ ] Alert email renders: product name, old estimated cost, new estimated cost, delta % with direction indicator, retail price, new markup multiplier, unsubscribe link
- [ ] "Unsubscribe from price alerts" unsubscribes from alerts only; weekly digest continues unless separately unsubscribed
- [ ] `User.alertThresholdPct` can be set to null (use 10% default), 0 (any change), 5, 10, or 20 from the account page
- [ ] After an alert fires, `WatchlistEntry.costAtWatchCents` is updated to the post-change value
- [ ] "Save as Image" button appears on the product page cost breakdown section
- [ ] Clicking "Save as Image" downloads a PNG of the cost breakdown (donut chart + labels + cost/retail/markup figures) without a page reload
- [ ] PNG renders correctly on macOS and iOS screenshots (Retina-aware: 2× pixel density)
- [ ] "Save as Image" works for signed-out users (no auth check)
- [ ] Alert detection logic is unit-tested in `AlertService`: threshold logic, delta calculation, baseline update, skip when no change exceeds threshold
- [ ] TypeScript compiles clean

---

## Technical Notes

- **New service:** `AlertService` (`src/services/AlertService.ts`) owns all price alert logic: computing deltas, deciding who to notify, and dispatching alert emails. Keeps alert concerns out of `CronService` and `UserService`.
- **Trigger point:** After `CommodityService.refreshPrices()` completes in the cron route, call `AlertService.checkWatchlistAlerts()`. This re-estimates costs for any product in a watchlist and fires alerts. Estimated cost is fetched fresh from `CostEstimationService` — no separate DB query for "old cost" needed beyond `WatchlistEntry.costAtWatchCents`.
- **New DB fields:**
  - `User.alertThresholdPct` — `Int?` (null = 10% default). Validate in API route: must be one of `[0, 5, 10, 20]`.
  - `User.alertsEnabled` — `Boolean` (default true). Set to false on alert unsubscribe.
  - `WatchlistEntry.lastAlertedCostCents` — `Int?` (null until first alert). Post-alert baseline; separate from `costAtWatchCents` so the "since you started watching" delta on the digest page remains unchanged.
- **Save as Image — implementation:** Use `dom-to-image-more` (active fork of `dom-to-image`; better Tailwind/computed-style compatibility than `html2canvas`). Import dynamically (`next/dynamic` with `ssr: false`) to keep it out of the server bundle. Target node: the `CostBreakdownChart` wrapper `div` (pass a `ref`). Call `domtoimage.toPng(node, { scale: 2 })` for retina. Then `URL.createObjectURL(blob)` → trigger `<a download="trueprice-{productName}.png">`.
  - **Bundle impact:** `dom-to-image-more` is ~45 kB gzipped. Load only when the button is clicked (lazy import inside the click handler) to avoid impacting initial page load.
  - **Known limitation:** Any external image in the chart (unlikely in the donut chart; applies if product images are ever added to the breakdown) must be same-origin or have CORS headers. Document this constraint.
- **Web push (should-have):**
  - VAPID keys: generate at setup, store `VAPID_PUBLIC_KEY` (client) and `VAPID_PRIVATE_KEY` (server) in env vars.
  - DB model: `PushSubscription` — `id`, `userId`, `endpoint`, `p256dh`, `auth`, `createdAt`. Unique on `endpoint`.
  - Service worker: `public/sw.js`. Handles `push` event → shows notification. Must be at the root scope.
  - Opt-in flow: "Enable push notifications" toggle on `/account`. Calls `Notification.requestPermission()`, then `navigator.serviceWorker.ready.pushManager.subscribe(...)`, then `POST /api/account/push-subscription` to store.
- **Alert rate limiting:** Cap at 1 alert email per user per product per 24-hour window to prevent alert spam if the cron runs more than once in a day. Track `WatchlistEntry.lastAlertedAt` (`DateTime?`).
- **New env vars:**
  - `VAPID_PUBLIC_KEY` — client-safe, needed for push subscription (add to `env.client.ts`)
  - `VAPID_PRIVATE_KEY` — server-only (add to `env.server.ts`)
  - `ALERT_FROM_EMAIL` — server-only (Resend from address for alerts, e.g. `alerts@trueprice.app`)
- **New API routes:**
  - `PATCH /api/account/alert-settings` — update `alertThresholdPct`, `alertsEnabled`
  - `POST /api/account/push-subscription` — store push subscription
  - `DELETE /api/account/push-subscription` — remove push subscription (opt-out)
  - `GET /api/account/alerts` — alert history for current user (last 30 days)
- **New components:**
  - `src/components/atoms/SaveAsImageButton.tsx` — client component; lazy-loads `dom-to-image-more` on click
  - `src/components/molecules/AlertSettingsForm.tsx` — threshold selector + alerts toggle on account page
  - `src/components/molecules/AlertHistoryTable.tsx` — list of past alerts

---

## Open Questions

1. **Alert threshold configurability:** The proposed values are Any Change / 5% / 10% / 20%. Should threshold be a free-input number (1–100%) instead? Free input is more powerful but adds validation complexity. Recommend discrete options for v1; add free input in v2 if users request it.
   - **Suggested answer:** Discrete options (0/5/10/20) for v1.

2. **Same-day vs. batched alerts:** Proposed: alerts fire as soon as the daily price cron completes (typically 02:00 UTC). That means alerts may arrive at night in some time zones. Should alerts batch to a morning-appropriate time per user timezone?
   - **Suggested answer:** For v1, fire immediately after cron — no timezone buffering. Add quiet hours in v2 if users report night-time alerts as annoying.

3. **`dom-to-image-more` license:** Verify the license is compatible with commercial use before merging. (Expected: MIT — confirm before PR opens.)
   - **Owner:** Developer | **Blocking:** Save-as-image implementation

4. **Alert storage:** Should fired alerts be stored in a DB table (`AlertLog`) for the alert history page, or just the `lastAlertedAt` timestamp on `WatchlistEntry`? Storing an `AlertLog` table enables the history page (should-have) but requires an extra migration. Recommend: include `AlertLog` table in the migration to enable the history page.
   - **Suggested answer:** Add `AlertLog` table (`id`, `userId`, `productId`, `oldCostCents`, `newCostCents`, `deltaPercent`, `sentAt`). 30-day retention; prune via cron.
