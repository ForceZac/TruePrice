# PRD: Goal 18 — Progressive Web App & Mobile Experience

- **Goal reference:** Goal 18 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 3 (Product Lookup / Barcode), Goal 5 (Product Page UI), Goal 11b (Price Alerts), Goal 12 (Enhanced Search)
- **Proposed by:** PM Run #173 (2026-08-05)

---

## Problem Statement

TruePrice's core acquisition loop is: **scan barcode → see shocking markup → share with friends**. That loop is 100% mobile — users are standing in a store aisle with their phone. Yet TruePrice ships as a standard web app with no home-screen presence, no offline cache, and a barcode scanner UX that requires the user to navigate to `/scan`, wait for the camera to initialize, and hope the scan succeeds on a small viewport.

Three concrete problems compound this:

1. **No home-screen install.** Users who discover TruePrice can't "add to home screen" with a branded icon and splash screen. They have to re-navigate via browser every time. This kills repeat usage — the app feels disposable.

2. **No offline access.** If a user is in a store with spotty signal, previously-viewed product breakdowns are unavailable. The empty-state experience breaks the in-store use case exactly when it matters most.

3. **Barcode scanner UX is friction-heavy.** The current implementation (Goal 3) uses `html5-qrcode` with a raw viewfinder and no guidance UI. First-time users don't know how to position the barcode, and failed scans produce a generic error. On iOS Safari in particular, camera permission prompts can feel alarming without clear context.

All three can be addressed without a native app by making TruePrice a full PWA — adding a Web App Manifest, a Service Worker, and polishing the scanner UX into something users want to return to.

---

## User Stories

**US-1 — Add to Home Screen**
As a user who discovered TruePrice in a store, I want to install it to my home screen with a proper icon and name, so I can reopen it quickly next time I'm shopping without searching through browser tabs.

**US-2 — Offline product cache**
As a user with poor in-store WiFi, I want to see the cost breakdown for products I've already looked up, so I can still make an informed purchase decision even when I can't load new data.

**US-3 — Scanner with guidance UI**
As a first-time user trying to scan a barcode, I want clear visual guidance (a targeting overlay, positioning hints, and feedback when a barcode is detected), so I succeed on the first try and don't abandon the flow.

**US-4 — Faster scan → result flow**
As a returning user, I want the barcode scan result to appear as fast as possible (ideally with a loading skeleton while the API call completes), so the experience feels native-app-fast rather than website-slow.

**US-5 — Price alert push notifications (optional, user-gated)**
As a watchlist user, I want to receive a browser push notification when a watched product's cost changes significantly, so I don't have to wait for the weekly digest email to notice a price move.

---

## Requirements

### Must-Have

- **Web App Manifest** (`/public/manifest.json`): `name`, `short_name`, `start_url` ("/"), `display: "standalone"`, `theme_color`, `background_color`, `icons` (192×192 and 512×512 PNG in `/public/icons/`)
- **`<link rel="manifest">` in root layout** (already supported by Next.js App Router via `metadata.manifest`)
- **Service Worker** registered via Next.js `next-pwa` or manual registration in root layout:
  - Cache strategy: Network-first for API routes; Cache-first for static assets; Stale-while-revalidate for product pages
  - Offline fallback page: `/offline` — shows "You're offline. Previously viewed products are cached below." with a list of cached product slugs
  - Cache product pages on first visit (cache key: `/product/[slug]`)
- **Barcode scanner UX overhaul:**
  - Visual targeting overlay (SVG bracket corners) centered on the camera feed
  - "Position barcode inside the frame" instructional text below the viewfinder
  - Pulsing green flash + haptic feedback (`navigator.vibrate(100)`) on successful scan
  - Skeleton loader shown immediately after scan, before API response returns
  - Camera permission request preceded by an explanatory modal: "TruePrice needs camera access to scan barcodes. We never store your camera feed."
  - Error state with retry button (not just console error) when camera is unavailable or barcode not recognized after 10 seconds

### Should-Have

- **Apple-specific meta tags** for iOS home-screen install: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`
- **Install prompt UI**: on mobile browsers that support `beforeinstallprompt`, show a subtle "Add to Home Screen" banner after the user's second product scan (not on first visit — avoid being annoying)
- **Scan history** persisted to localStorage (product name + scan timestamp, max 10 entries): shown on the scan page as "Recently Scanned" below the viewfinder when no active scan is in progress

### Should-Have (Push Notifications — conditional)

- **Push notification opt-in**: on the `/dashboard/settings` page, a "Browser Notifications" toggle (separate from email alerts). Requires user to grant `Notification` permission in browser.
- **Web Push API**: `AlertService` extended with `sendPushAlert(userId, message)` — uses `web-push` npm package, stores `PushSubscription` objects in a new `PushSubscription` model in Prisma.
- **Trigger:** same delta thresholds as email alerts (Goal 11b). Push fires first (immediate), email sends on next digest cycle (weekly).
- Gate push entirely on `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` env vars being set — no-op in local dev.

### Won't Have (v1)

- Native iOS or Android app (PWA covers the use case at a fraction of the complexity)
- Background sync (requires Background Sync API — too limited on iOS Safari)
- Barcode scanning without camera (QR code image upload deferred — edge case)
- Full offline mode (only cached-product offline is in scope; search + trending require network)

---

## Acceptance Criteria

- [ ] `public/manifest.json` exists and is valid (passes `https://web.dev/measure/` PWA checks or Chrome DevTools Application > Manifest)
- [ ] `<link rel="manifest">` is present in page HTML
- [ ] On Chrome Android, "Add to Home Screen" prompt is available after two product interactions
- [ ] Home-screen icon displays TruePrice logo (not a browser default globe)
- [ ] Service Worker is registered and visible in Chrome DevTools > Application > Service Workers
- [ ] Navigating to a previously-viewed product page while offline shows the cached breakdown (not a browser error page)
- [ ] `/offline` page renders when user is offline and no cached page matches
- [ ] Scan page shows targeting overlay and instruction text
- [ ] Successful scan triggers green flash animation and haptic vibrate
- [ ] Camera permission modal appears before browser permission prompt
- [ ] Failed scan after 10 seconds shows error UI with a retry button (not a blank screen)
- [ ] Skeleton loader appears immediately after scan, before the product API response
- [ ] Apple-specific meta tags are present in root layout
- [ ] `tsc --noEmit` passes clean; all existing tests pass
- [ ] New unit tests cover: Service Worker cache strategy logic, offline fallback routing, scanner error states

---

## Technical Notes

- **Next.js PWA:** Use `@ducanh2912/next-pwa` (the maintained fork of `next-pwa`) or implement a custom Service Worker via `next.config.js` `headers()`. Do NOT use the deprecated `next-pwa` package. Verify compatibility with current Next.js version in `node_modules/next/dist/docs/` before writing any config.
- **Service Worker scope:** Next.js App Router doesn't support `next-pwa` the same way Pages Router does. Manual Service Worker (`public/sw.js`) registered in root layout via `useEffect` in a client component may be cleaner. Confirm approach by reading the Next.js docs for the installed version.
- **Cache storage:** Product pages cached under `trueprice-products-v1` cache key. Static assets under `trueprice-static-v1`. Version keys allow cache invalidation on deploy.
- **Manifest icons:** Create `/public/icons/icon-192.png` and `/public/icons/icon-512.png` — can be derived from existing logo/favicon assets. Square format required.
- **Push notifications:** Web Push requires VAPID keys (generated via `web-push generate-vapid-keys`). Store subscription object in new `PushSubscription` Prisma model: `{ id, userId, endpoint, p256dh, auth, createdAt }`. `AlertService` reads subscriptions by `userId` when firing price alerts.
- **html5-qrcode scanner overlay:** `html5-qrcode` renders its own video element. The overlay (SVG brackets) is an absolute-positioned div over the top. Controlling the camera stop/start lifecycle requires calling `html5QrcodeScanner.clear()` on component unmount — ensure this is handled to avoid React strict-mode double-invocation issues.
- **SoC:** Push notification sending belongs in `NotificationService`. Push subscription storage belongs in `UserService`. `AlertService` orchestrates the call: read subscriptions → call `NotificationService.sendPushAlert()`.

---

## Open Questions

**Q18-1: next-pwa compatibility with current Next.js version**
`next-pwa` and its forks have a history of version mismatches with Next.js App Router. Before writing any PWA config, the dev agent must check `node_modules/next/package.json` for the exact version and verify the chosen PWA library supports it. If no library works cleanly, a hand-rolled Service Worker in `public/sw.js` with manual registration is the fallback.
- **Owner:** Dev | **Priority:** Must resolve before writing a line of PWA config

**Q18-2: Push notifications — include in Goal 18 or separate goal?**
Push notifications introduce a new Prisma model, two new env vars, and meaningful test surface. If Goal 16 (data quality) and Goal 17 (slugs) are already in flight, adding push to Goal 18 may stretch the scope too far for one PR.
- Suggested split: Goal 18 = Manifest + Service Worker + Scanner UX (no push). Goal 19 = Push Notifications.
- **Owner:** Zach | **Priority:** Decide before TRD is written (scope determines PR complexity)

**Q18-3: Offline cache invalidation**
When a product's cost breakdown is recalculated (via cron or user trigger), the cached page in the Service Worker won't update until the user revisits online. Should the cache be invalidated via a Cache-busting API response header, or is stale cached content acceptable given the weekly re-estimation cadence?
- Suggested default: stale cached content is acceptable. Show a "Last updated [date]" note on cached pages. Actively invalidating Service Worker caches requires a background sync API that iOS Safari doesn't support.
- **Owner:** Dev | **Priority:** Low — affects data freshness UX, not correctness
