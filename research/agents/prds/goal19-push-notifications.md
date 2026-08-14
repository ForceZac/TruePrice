# PRD: Goal 19 — Browser Push Notifications

- **Goal reference:** Goal 19 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 11b (Price Alerts), Goal 18 (PWA / Service Worker)
- **Proposed by:** PM Run #214 (2026-08-06)

---

## Problem Statement

TruePrice's price alert system (Goal 11b) already computes when a watched product's cost crosses a user-defined threshold. Today the only delivery channel is email — and emails arrive at best in the next weekly digest cycle, days after the price moved. For a use case driven by timing ("should I buy this now?"), that delay kills the value.

Meanwhile, Goal 18 ships a Service Worker, which is the only prerequisite for browser push delivery. Once the Service Worker is registered, push notifications are a natural completion of the alert loop: compute the delta (AlertService) → send immediately to the user's browser (Web Push API) → user sees it while still thinking about the product.

Three concrete problems motivate this goal:

1. **Alert latency.** Email alerts land days late. The user has either already bought the item or forgotten about it. Push notifications deliver within seconds of `AlertService` detecting a qualifying delta.

2. **Re-engagement without requiring an open tab.** Email re-engagement rates for digest-style emails average 20–30%. Push notifications — when used sparingly and for genuinely relevant signals — see 50–60% click-through on mobile. The average TruePrice user checks a product page once; a timely push is the only mechanism to bring them back.

3. **Goal 18 Service Worker is wasted without push.** The Service Worker scaffolded in Goal 18 registers a `push` event listener that currently does nothing. Leaving that listener empty permanently means the user granted Notification permission (if prompted) for no benefit.

---

## User Stories

**US-1 — Immediate alert when a watched product's cost moves**
As a user who watchlisted an iPhone, I want a push notification within minutes of a commodity or labor cost change that crosses my threshold, so I know to check whether now is a good time to buy.

**US-2 — Opt-in at account settings, not forced on first visit**
As a privacy-conscious user, I want to choose to enable browser notifications from my account settings page — I don't want a surprise permission prompt on my first visit to TruePrice.

**US-3 — Notification opens the right product page**
As a user who receives a push notification, I want tapping it to open the specific product that triggered the alert, not TruePrice's homepage, so I can see the current breakdown without searching.

**US-4 — Opt out per-device without losing alert emails**
As a user who switched from desktop to phone, I want to disable push notifications on my old desktop browser without disabling email alerts entirely, so my delivery preferences are device-specific.

---

## Requirements

### Must-Have

- **VAPID key pair** — generate via `web-push generate-vapid-keys`; store as `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` server env vars; expose `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to client
- **`PushSubscription` Prisma model:**
  ```
  model PushSubscription {
    id        String   @id @default(cuid())
    userId    String
    endpoint  String   @unique
    p256dh    String
    auth      String
    createdAt DateTime @default(now())
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }
  ```
- **Subscription API routes:**
  - `POST /api/push/subscribe` — store a `PushSubscription` for the authenticated user
  - `DELETE /api/push/subscribe` — remove the subscription matching the given endpoint
- **Client subscription flow** — a `usePushSubscription` hook in a client component:
  - Checks `Notification.permission` and `'PushManager' in window` (feature-detect before rendering the toggle)
  - Calls `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
  - Posts the resulting `PushSubscription` object to `POST /api/push/subscribe`
- **Settings UI** — add a "Browser Notifications" row to `/dashboard/settings`:
  - Toggle: off by default; shown only if the browser supports push
  - On enable: triggers the subscription flow above (which prompts for Notification permission if not already granted)
  - On disable: calls `DELETE /api/push/subscribe` and removes the subscription from DB
  - Shows "Not supported in this browser" if push is unavailable (e.g., Firefox in private mode, iOS Safari < 16.4)
- **`NotificationService.sendPushAlert(userId, title, body, url)`** — new method that:
  - Fetches all `PushSubscription` records for the user
  - Calls `webPush.sendNotification()` for each subscription
  - On `410 Gone` or `404` response from the push endpoint, deletes the stale subscription from DB
  - Gated on `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` being set (no-op in local dev without keys)
- **`AlertService` extended** — after dispatching email alert (Goal 11b), call `NotificationService.sendPushAlert()` with:
  - `title`: "TruePrice Alert: [Product Name]"
  - `body`: "Manufacturing cost [rose/fell] by [Δ%] — now $X.XX"
  - `url`: `/product/[slug]` (requires Goal 17; fall back to `/product/[id]` if slug unavailable)
- **Service Worker push handler** (in `public/sw.js` from Goal 18):
  ```js
  self.addEventListener('push', (event) => {
    const data = event.data?.json() ?? {};
    event.waitUntil(
      self.registration.showNotification(data.title ?? 'TruePrice', {
        body: data.body,
        icon: '/icons/icon-192.png',
        data: { url: data.url },
      })
    );
  });
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data?.url ?? '/'));
  });
  ```
- `tsc --noEmit` clean; all existing tests pass

### Should-Have

- Per-subscription `userAgent` field on `PushSubscription` to help users identify which devices are subscribed (display in settings as "Chrome on Mac", "Safari on iPhone")
- Badge count on the app icon when a push fires (via `navigator.setAppBadge(1)` in the push event handler) — clears on `notificationclick`

### Won't Have (v1)

- Marketing / promotional push notifications (only price alert signals — users opted in for alerts, not marketing)
- Category-level push alerts (only per-product watchlist alerts in scope)
- Android native notification channels (web push covers the use case; native app is out of scope)
- iOS Safari push on iOS < 16.4 (Apple only enabled Web Push on iOS 16.4+; show "Not supported" for older versions gracefully)

---

## Acceptance Criteria

- [ ] `PushSubscription` model exists in `prisma/schema.prisma` with the fields above after migration
- [ ] `POST /api/push/subscribe` creates a record for the authenticated user; returns 401 if unauthenticated
- [ ] `DELETE /api/push/subscribe` removes the matching subscription; returns 404 if not found
- [ ] Settings page shows the "Browser Notifications" toggle (or "Not supported" fallback) when user is signed in
- [ ] Enabling the toggle triggers browser Notification permission prompt and stores the subscription in DB
- [ ] Disabling the toggle removes the subscription from DB and revokes the client-side subscription
- [ ] `NotificationService.sendPushAlert()` delivers a push notification to all active subscriptions for a user
- [ ] Stale push endpoints (410/404 from push service) are automatically deleted from DB
- [ ] Tapping/clicking the notification opens `/product/[slug]` (or `/product/[id]` fallback) in the browser
- [ ] No push is attempted when VAPID env vars are absent (local dev no-op)
- [ ] New unit tests cover: subscription creation, stale endpoint cleanup, push payload formatting, AlertService → NotificationService dispatch
- [ ] Playwright e2e covers: settings toggle renders, subscription API calls fire on toggle

---

## Technical Notes

- **`web-push` npm package** — server-side Web Push API. Add to `dependencies` (not devDependencies). Initialize once at module level in `NotificationService`.
- **SoC enforcement:** Push notification sending belongs exclusively in `NotificationService`. Push subscription storage (CRUD) belongs in `UserService`. `AlertService` calls `NotificationService.sendPushAlert()` — it does not call `web-push` directly.
- **Client feature detection order:** (1) Check `'serviceWorker' in navigator` → (2) Check `'PushManager' in window` → (3) Check `Notification.permission !== 'denied'`. Render the toggle only when all three pass.
- **VAPID public key on client:** Must be available at runtime as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (client env var). The client passes it as `applicationServerKey` to `pushManager.subscribe()` after base64url-decoding via `urlBase64ToUint8Array()` (standard helper).
- **Goal 17 dependency:** Notification `url` field should link to `/product/[slug]`. If Goal 17 has not shipped yet when Goal 19 lands, use `/product/[id]` as a fallback — the redirect in Goal 17 will handle it retroactively.
- **iOS note:** Web Push on iOS requires Safari 16.4+ and the site must be installed to the home screen (PWA mode from Goal 18). Users on iOS < 16.4 see the "Not supported" state. Do not attempt `pushManager.subscribe()` on unsupported browsers.
- **Rate limiting:** `AlertService` already enforces alert rate limits (Goal 11b — no repeat alerts within cooldown window). Push notifications inherit those limits automatically since they fire from the same `AlertService.checkAndSendAlerts()` path.

---

## Open Questions

**Q19-1: Permission prompt timing**
The settings toggle approach (manual opt-in) is proposed to avoid aggressive permission prompts. But should TruePrice also prompt when a user first sets up a price alert threshold (Goal 11b UI)? That's the moment of highest relevance — the user just said "alert me." Prompting here feels natural rather than invasive.
- Suggested default: add a secondary prompt in the alert-setup UI: "Want an instant push notification when this price changes? Enable browser notifications." Links to `/dashboard/settings`. Does not auto-prompt Notification permission — just navigates the user there.
- **Owner:** Zach | **Priority:** Low — the settings approach is sufficient for v1; refine UX post-launch

**Q19-2: Multi-device subscription management**
A user subscribed on both their laptop and phone sees two active push subscriptions. If they disable the toggle on one device, it only removes that device's subscription. The settings page currently shows one toggle state but two subscriptions exist. Should we show a "Subscribed on N devices" count?
- Suggested default: show "Browser notifications active on N device(s)" with a "Remove all" option. Keep per-device toggle as primary action. This avoids confusion without adding a full device management UI.
- **Owner:** PM/Dev | **Priority:** Low — not a blocker for v1

**Q19-3: Push payload encryption & size limits**
Web Push messages are limited to ~4KB payload. The current payload (title + body + url) is well under this limit. Future enrichment (e.g., including the product image URL or cost breakdown delta) must stay under 4KB. No action needed for v1.
- **Owner:** Dev | **Priority:** None for v1 — document in TRD
