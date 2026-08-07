# PRD: Goal 21 — Affiliate & "Where to Buy" Links

- **Goal reference:** Goal 21 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 3 (Product Lookup / UPC), Goal 4 (Cost Estimation Engine), Goal 5 (Product Page UI), Goal 17 (Product Slug URLs)
- **Proposed by:** PM Run #216 (2026-08-06)

---

## Problem Statement

TruePrice's core value proposition is revealing the gap between manufacturing cost and retail price. But right now the user journey ends at that revelation — they see "5× markup" and then what? There's no next step.

Three problems compound this gap:

1. **Revenue ceiling on AdSense.** Display ads pay fractions of a cent per impression. A user who just learned that an iPhone costs $180 to make and retails for $1,099 is in peak buying intent. Affiliate revenue on a $1,099 conversion is $5–$20 — 100–400× more than an AdSense impression. TruePrice is sending motivated buyers to Google with no monetization.

2. **Missing context: "what does it actually retail for?"** The cost breakdown is compelling, but users often don't know the current retail price. Showing "true cost: $180 / retail: $1,099 / markup: 6.1×" with a live price lookup makes the markup visceral. Right now, the retail price is static (seeded at ingest time) and frequently stale.

3. **No closed loop after the scan.** The in-store barcode scan use case (Goal 3, Goal 18) has a natural next action: scan product → see markup → decide whether to buy (here or elsewhere) → click buy. Without a buy link, TruePrice drops the user after the insight and captures none of the downstream intent.

The fix is targeted: on each product page, add a "Where to Buy" section showing 1–3 retailer links (Amazon, Walmart, target.com) keyed by UPC, with affiliate tracking. A secondary benefit is that clicking through lets TruePrice pull a live retail price and freshen the product record.

---

## User Stories

**US-1 — Buy with context**
As a user who just saw that a product has a 6× markup, I want a direct link to buy it on Amazon with the current retail price visible, so I can decide whether to buy now or look for a better deal without leaving TruePrice mid-decision.

**US-2 — Price freshness via click-through**
As a user who regularly checks TruePrice for deal timing, I want the retail price on a product page to reflect actual current pricing (not a stale seed), so I can trust the markup ratio I'm seeing.

**US-3 — In-store scan → buy online**
As a user standing in a store who just scanned a product and saw it's priced 4× above true cost, I want to buy it online for a lower price instead, so I can immediately act on the markup insight.

**US-4 — No affiliate links in Low-confidence estimates**
As a user viewing a product with LOW confidence estimate, I don't want to be pushed toward a purchase based on a potentially inaccurate cost breakdown, so I trust TruePrice's recommendations.

---

## Requirements

### Must-Have

- **`AffiliateLink` Prisma model:**
  ```
  model AffiliateLink {
    id          String   @id @default(cuid())
    productId   String
    retailer    String   // "amazon" | "walmart" | "target"
    url         String   // affiliate-tagged URL
    retailPrice Int?     // cents; null if unknown
    lastChecked DateTime?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  }
  ```
- **Affiliate URL construction from UPC** — for Amazon: `https://www.amazon.com/s?k={UPC}&tag={AMAZON_AFFILIATE_TAG}`. No Product Advertising API required for v1 — search URLs are publicly constructable and affiliate tags work on search result clicks. Walmart: `https://www.walmart.com/search?q={UPC}&affiliates_id={WALMART_AFFILIATE_ID}`.
- **`AffiliateService`** (`src/services/AffiliateService.ts`) — sole owner of affiliate link logic:
  - `getLinksForProduct(productId)` — fetches `AffiliateLink` records for a product; creates them if none exist (lazy init using the product's UPC)
  - `buildAffiliateUrl(retailer, upc)` — constructs tagged URLs for each retailer from env vars
  - No price refresh in v1 (deferred to Q21-3)
- **New API route:** `GET /api/products/[id]/buy-links` — calls `AffiliateService.getLinksForProduct()`; returns `[{ retailer, url, retailPrice }]`
- **`BuyLinksPanel` molecule component** (`src/components/molecules/BuyLinksPanel.tsx`):
  - Displays below the cost breakdown section on the product page
  - Shows 1–3 retailer buttons: "Buy on Amazon", "Buy on Walmart", "Buy on Target"
  - Each button links to the affiliate URL, opens in a new tab (`rel="noopener noreferrer"`)
  - Shows the retailer's current price (if available in DB): "Amazon — $49.99"
  - Hidden when: (a) product has no UPC, (b) estimate confidence is LOW, (c) no affiliate env vars are configured
  - Client-side via `useBuyLinks(productId)` TanStack Query hook
- **New env vars:**
  - `AMAZON_AFFILIATE_TAG` (server) — Amazon Associates tracking tag
  - `WALMART_AFFILIATE_ID` (server) — Walmart affiliate ID
  - `TARGET_AFFILIATE_ID` (server) — Target affiliate ID (optional; omit to suppress Target button)
- **`AffiliateLink` lazy creation** — on first call to `getLinksForProduct()`, if no links exist for the product and the product has a UPC, create stub `AffiliateLink` records for each configured retailer using `buildAffiliateUrl()`. No external API call required.
- **Confidence gate** — `BuyLinksPanel` is suppressed when `breakdown.confidence === 'LOW'`. The panel should only appear alongside HIGH or MEDIUM confidence estimates. Display note: "Find TruePrice products with a lower markup first" links to `/trending`.
- `tsc --noEmit` clean; all existing tests pass; new tests cover affiliate URL construction and lazy link creation

### Should-Have

- **"Compare prices" UX** — if all three retailers are configured, add a short header: "Where to buy" + 3 buttons in a row. If only one retailer is configured, show a simpler "Buy on [Retailer]" link (no "where to buy" framing needed for a single option).
- **Click-through tracking** — log affiliate link clicks to a lightweight `AffiliateLinkClick` model (productId, retailer, userId?, timestamp) via `POST /api/products/[id]/buy-links/click`. Gives Zach data on which retailers drive the most revenue.
- **Retail price auto-update on first load** — if `AffiliateLink.retailPrice` is null or stale (> 7 days old), queue a background job via a `/api/cron/refresh-retail-prices` call (already exists from Goal 8). Re-use the existing UPCitemdb retail price lookup rather than a third-party price scraper.

### Won't Have (v1)

- Amazon Product Advertising API (PAAPI) — requires product approval; search-URL affiliate links are sufficient for v1 and don't require an application
- Price comparison aggregator (showing 5+ retailers) — 3 major retailers is sufficient for v1
- In-app price history for retail prices (separate from manufacturing cost history in Goal 20) — deferred
- Commission tracking dashboard — Zach uses Amazon/Walmart affiliate dashboards directly for v1

---

## Acceptance Criteria

- [ ] `AffiliateLink` model exists in `prisma/schema.prisma` after migration
- [ ] `GET /api/products/[id]/buy-links` returns links for a product with a UPC, and creates them lazily on first call
- [ ] `GET /api/products/[id]/buy-links` returns an empty array for a product with no UPC (no 500 error)
- [ ] `BuyLinksPanel` renders on the product page when at least one retailer env var is set and the estimate confidence is HIGH or MEDIUM
- [ ] `BuyLinksPanel` is hidden when estimate confidence is LOW
- [ ] `BuyLinksPanel` is hidden when no affiliate env vars are configured (graceful no-op in local dev)
- [ ] Affiliate URLs include the correct tracking tag/ID from env vars
- [ ] Links open in a new tab with `rel="noopener noreferrer"`
- [ ] `tsc --noEmit` passes clean
- [ ] New unit tests cover: `buildAffiliateUrl()` for each retailer, lazy link creation, LOW confidence suppression
- [ ] Playwright e2e: product page with HIGH confidence shows `BuyLinksPanel`; product page with LOW confidence does not

---

## Technical Notes

- **SoC:** All affiliate link logic in `AffiliateService`. No affiliate URL construction in API routes or components. `BuyLinksPanel` only reads the data returned by the hook.
- **Amazon search URL affiliate tracking:** Amazon Associates pays commissions on purchases made within 24 hours of a user clicking an affiliate search result, regardless of which product they ultimately buy. The tag must be an approved Associates tag (Zach registers at `associates.amazon.com`).
- **UPC requirement:** If a product was added via user submission (Goal 15) without a UPC, the affiliate links panel cannot generate meaningful search URLs. The panel is suppressed via a `product.upc == null` check in `AffiliateService`.
- **No scraping:** The v1 implementation does not scrape retailer sites for prices. Retail prices come from UPCitemdb (already used in Goals 3 and 8) on the existing retail price refresh cron. The `BuyLinksPanel` shows a price if `AffiliateLink.retailPrice` is populated; otherwise the button shows no price (just the retailer name).
- **Env var gating:** `AffiliateService.getLinksForProduct()` reads env vars at runtime. If `AMAZON_AFFILIATE_TAG` is unset, the Amazon link is not created/returned. This makes local dev trivially safe (no garbage affiliate URLs in the DB from dev runs).

---

## Open Questions

**Q21-1: Amazon Associates account status**
Has Zach created an Amazon Associates account and received an approved affiliate tag? Associates applications are typically approved within 1–3 days but require making 3 qualifying sales within 180 days or the account closes. If TruePrice doesn't have enough traffic to convert 3 sales in that window, the account will be terminated.
- Suggested default: Apply as soon as Goal 21 ships. The affiliate links work immediately (URLs are constructable before account approval) but commissions don't pay out until approved.
- **Owner:** Zach | **Priority:** Required before launch

**Q21-2: Walmart affiliate program**
Walmart runs its affiliate program through Impact Radius. The signup process is manual and approval can take 1–5 business days. Is Zach already enrolled? If not, launch with Amazon only and add Walmart after approval.
- Suggested default: Launch with Amazon only. Add Walmart and Target as secondary retailers once enrolled.
- **Owner:** Zach | **Priority:** Low — Amazon is the primary revenue channel

**Q21-3: Retail price refresh frequency for AffiliateLink records**
Should `AffiliateLink.retailPrice` refresh automatically? The existing `GET /api/cron/refresh-retail-prices` cron already hits UPCitemdb weekly (Goal 8). We could extend it to also update `AffiliateLink.retailPrice`. But UPCitemdb returns a single retail price, not per-retailer prices. Is a single "retail price" accurate enough to show next to a specific retailer link?
- Suggested default: Show the UPCitemdb retail price as "~$X" (with a tilde to signal approximation) next to each retailer button, rather than claiming it's the exact Amazon price. This is honest and requires no additional API calls.
- **Owner:** PM/Dev | **Priority:** Must decide before implementation

**Q21-4: Disclosure / FTC compliance**
US FTC guidelines require disclosure of affiliate relationships when recommending products. The "Where to Buy" section needs a one-line disclosure: "Links may earn us a commission." Should this appear inline in the `BuyLinksPanel` or only on a static `/affiliate-disclosure` page linked from the footer?
- Suggested default: Both — a one-line note in `BuyLinksPanel` ("Links may earn a small commission — learn more") linking to `/affiliate-disclosure`, plus the `/affiliate-disclosure` static page itself. FTC guidance is clear that the disclosure must be proximate to the recommendation.
- **Owner:** Zach | **Priority:** Required before launch (legal compliance)
