# PRD: Goal 28 — Embeddable Cost Card Widget

- **Goal reference:** Goal 28 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 5 (Product Page UI), Goal 4 (Cost Estimation Engine), Goal 26 (Public API)
- **Proposed by:** PM Run #240 (2026-08-12)

---

## Problem Statement

TruePrice's cost breakdowns are uniquely publishable content. Journalists writing about supply chains, consumer advocates blogging about markups, and product review sites all have audiences who would find a live "costs $X to make, sells for $Y" card valuable. Right now, the only sharing mechanisms are:

1. Save as image (Goal 11a) — static screenshot; goes stale when prices change
2. Link to product page — requires the reader to leave the article to see the data

Neither option lets a third-party site embed a live, self-contained TruePrice card that updates as commodity prices change. This limits TruePrice's reach to users who proactively visit the site. An embeddable widget turns every article mentioning a product into a passive TruePrice distribution point.

Three concrete gaps:

1. **Static images rot.** An image saved today shows the correct price breakdown today. Six months later, when commodity prices have shifted, that image is a lie. Embedded widgets pull fresh data on each page load.

2. **Off-site discovery is zero.** A consumer advocate article saying "this $15 t-shirt costs $2.10 to make" is compelling editorial. That same article with a live embedded TruePrice card — showing the exact breakdown, confidence level, and a "See full analysis" link — is both more credible and a passive acquisition channel. Every embed becomes a live backlink.

3. **No B2B distribution path.** Price comparison sites, sustainability scorecards, and shopping extension developers want to surface manufacturing cost data without implementing it themselves. Goal 26 (Public API) gives them raw JSON. This goal gives them a zero-integration visual component for non-developer publishers.

---

## User Stories

**US-1 — Journalist embeds a cost card in an article**
As a journalist writing a piece about electronics markups, I want to paste a single `<script>` tag into my CMS to display a live TruePrice cost breakdown for the iPhone 16 Pro, so my readers see real data without leaving the article.

**US-2 — Blogger customizes widget appearance**
As a blogger, I want to control the widget's width and whether to show the full breakdown chart vs. a compact summary card, so the embed fits my site's layout.

**US-3 — Reader sees a fresh breakdown on embedded card**
As a reader encountering a TruePrice embed on a third-party article, I want the card to show current cost data (not stale) with a "Last updated" timestamp, so I trust what I'm reading.

**US-4 — Publisher sees attribution**
As Zach, I want every embedded widget to display a "Powered by TruePrice" attribution link, so every embed drives brand recognition and referral traffic.

**US-5 — Analytics on embed impressions**
As Zach, I want to see which products are being embedded and how many page views each embed generates, so I can identify which content creators are driving usage and potentially reach out for partnerships.

---

## Requirements

### Must-Have

- **Widget script endpoint:** `GET /api/widget/[productId].js` — returns a small JavaScript snippet (~3 KB gzipped) that renders the cost card into the host page. The script is browser-safe (no Node-only APIs), idempotent (safe to load multiple times on one page), and uses no global variable pollution (IIFE pattern, namespaced under `window.__TruePrice`).

- **Widget render:** The script injects an `<iframe>` (not inline DOM injection) pointing to `GET /api/widget/[productId]/frame`. The iframe isolates TruePrice styles from host-page CSS, prevents XSS surface expansion, and makes CSP straightforward for publishers. The iframe is `scrolling="no"` and auto-resizes via `postMessage` from the inner frame to the outer script.

- **Widget frame (`/api/widget/[productId]/frame`):** Server-rendered HTML page (no React overhead) containing:
  - Product name + brand
  - Material / Labor / Overhead / Shipping cost bars (simplified horizontal bar chart, CSS-only, no Recharts dependency in the embed frame)
  - Total cost vs. retail price comparison line: "Costs $X.XX to make — sells for $Y.YY (Z% markup)"
  - Confidence badge: HIGH / MEDIUM / LOW
  - "Last updated" timestamp (cost breakdown's `updatedAt`)
  - "Powered by TruePrice — See full analysis →" attribution link pointing to `/products/[slug]`
  - No auth dependency — widget is publicly accessible without login

- **Widget code snippet generator on product pages.** On each product page, below the "Save as Image" button, add a "Embed this card" button. Clicking opens a modal with:
  - The embed snippet: `<script src="https://trueprice.app/api/widget/[id].js"></script>`
  - Copy-to-clipboard button
  - A live preview of the card

- **`WidgetService`** (`src/services/WidgetService.ts`) — sole owner of widget rendering and impression tracking. Methods: `getWidgetData(productId)` (returns cost breakdown + product fields needed for the frame), `recordImpression(productId, referrerUrl)` (async, non-blocking).

- **`WidgetImpression` Prisma model:**
  - `id` (cuid), `productId` (FK → Product), `referrerUrl` (string, nullable — `window.location.href` of the host page), `createdAt`.
  - Lightweight — just a timestamp + referrer per embed page load.
  - Retention: keep 90 days; prune older rows via cron.

- **Widget impression ping:** When the widget iframe loads, the frame makes a `POST /api/widget/[productId]/impression` call (fire-and-forget) with `{ referrer: document.referrer }`. This is gated on `NODE_ENV === 'production'` to avoid polluting local dev analytics.

- **`tsc --noEmit` clean; unit tests for `WidgetService`: getWidgetData (product exists, product not found), recordImpression, frame renders correct markup structure.**

### Should-Have

- **Compact vs. full widget size.** Accept a `?size=compact` query param on the widget script URL. Compact mode: shows only product name, total cost, retail price, and markup percent in a 2-line card. Full mode: shows the full bar chart breakdown. Default: full.
- **Dark mode support.** Widget frame detects `prefers-color-scheme: dark` (via CSS media query) and renders a dark card. No JS needed — pure CSS.
- **Widget impression count on admin dashboard (Goal 22).** `WidgetService` exposes a `getTopEmbeddedProducts(limit)` method returning products ranked by impression count in the last 30 days.

### Won't Have (v1)

- React component embed (iframes are sufficient; React embeds add CSP + hydration complexity for publishers)
- Widget customization via URL params beyond `?size=` (color themes, logo swap, language — all deferred)
- Authenticated embed variants (widgets are public-only; personalized breakdowns require the product page)
- Widget A/B testing (impression volume first; experiments when we have enough data)
- Click-through tracking beyond referrer URL (no UTM injection on the attribution link — too invasive for third-party embeds)

---

## Acceptance Criteria

- [ ] Pasting `<script src="/api/widget/[productId].js"></script>` into a plain HTML page renders a TruePrice cost card in an iframe without errors
- [ ] The cost card shows product name, cost bars, total cost vs. retail price, confidence badge, last-updated timestamp, and "Powered by TruePrice" attribution link
- [ ] The "Powered by TruePrice" link points to the product's canonical slug URL (not `/products/[id]`) and opens in a new tab
- [ ] Compact mode (`?size=compact`) shows only name, total cost, retail price, and markup percent; full mode shows the bar chart
- [ ] Clicking "Embed this card" on a product page opens a modal with the snippet and a live preview
- [ ] Each iframe page load fires a `POST /api/widget/[productId]/impression` (production only)
- [ ] `WidgetImpression` records are created in DB; `WidgetService.getWidgetData()` returns correct data for a known product and 404 for an unknown product
- [ ] Widget frame renders without any JavaScript errors in Chrome, Firefox, and Safari
- [ ] `tsc --noEmit` passes clean; `WidgetService` unit tests pass
- [ ] All existing tests continue to pass

---

## Technical Notes

- **iframe over inline inject.** Inline DOM injection would expose TruePrice to XSS via the host page's DOM and would conflict with host-page styles. An iframe with `sandbox="allow-scripts allow-same-origin"` isolates the widget. The `allow-same-origin` flag is required for the impression ping (`fetch` from within the frame) — the domain is same-origin since the frame src is `trueprice.app`.
- **Auto-resize via postMessage.** The inner frame document sends `parent.postMessage({ type: 'tp-resize', height: document.documentElement.scrollHeight }, '*')` on load and on resize. The outer script handles this message and sets the iframe's `height` style. This is the standard iframe auto-resize pattern; no library needed.
- **No Recharts in widget frame.** The widget frame is a static server-rendered page with CSS-only bar charts (percentage-width `div` bars). Recharts is a React component — pulling it into a non-React frame would add ~80 KB. A simple `<div style="width: X%">` bar is sufficient for the embed context.
- **SoC.** `WidgetService` owns all widget data and impression logic. The API routes delegate to `WidgetService` — no business logic in route handlers. `WidgetService` calls `CostEstimationService` (via `getWidgetData`) only if no fresh breakdown exists — same pattern as `/api/products/[id]/cost`.
- **Rate limiting.** The widget script and frame endpoints are public and potentially high-traffic if an article goes viral. Add `Cache-Control: public, max-age=300` on the frame (5-minute CDN cache) so a viral embed doesn't spike the DB. The impression ping is async and non-blocking — not rate-limited (the DB insert is cheap; deduplicate at analytics query time, not write time).
- **New env var:** None required for v1. Widget attribution URL constructed from `NEXT_PUBLIC_APP_URL`.

---

## Open Questions

**Q28-1: Widget domain — same domain or separate subdomain?**
Serving the widget from `trueprice.app/api/widget/...` keeps it simple (same TLS cert, same deploy). A separate `embed.trueprice.app` subdomain allows stricter CSP isolation for the publisher. Complexity tradeoff: subdomain requires additional Vercel configuration and a separate `cors` policy.
- Suggested default: same domain for v1. Revisit if publishers report CSP issues.
- **Owner:** Zach | **Priority:** Low — doesn't block v1 implementation

**Q28-2: Widget analytics retention — 90 days enough?**
`WidgetImpression` records are suggested to be pruned at 90 days. If TruePrice wants to track seasonal embed trends (e.g., Black Friday coverage spikes), 12 months of data is better. More data = larger table, but impressions are lightweight rows.
- Suggested default: 90 days for v1; extend to 12 months once volume is understood.
- **Owner:** Zach | **Priority:** Low

**Q28-3: Attribution text — "Powered by TruePrice" or "Data by TruePrice"?**
"Powered by" implies infrastructure; "Data by" implies the content. For a cost breakdown, "Data by TruePrice" is more accurate. Could also be "Cost estimate by TruePrice."
- Suggested default: "Cost estimate by TruePrice →" — accurate and descriptive.
- **Owner:** Zach | **Priority:** Low — editorial; decide at design review
