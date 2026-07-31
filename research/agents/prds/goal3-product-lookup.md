# PRD: Goal 3 — Product Lookup (Search + Barcode)

- **Goal reference:** Goal 3 — Product Lookup (Search + Barcode) (roadmap: implementation-roadmap-v2.md)
- **Status:** Shipped (PR #3, 500c75d — 2026-07-30)
- **Priority:** P0
- **Depends on:** Goal 1 (Project Scaffold & Data Model)
- **Blocks:** Goal 4 (Cost Estimation Engine)

---

## Problem Statement

TruePrice's core promise — "see the true cost to make any product" — requires users to first find the product they care about. Without a reliable product lookup layer, the app is unapproachable: users don't know product IDs, they have products in their hands (with barcodes), or they know a product name but not a UPC.

There are two distinct lookup contexts:
1. **In-store/in-hand:** user is holding a product and wants the breakdown immediately — barcode scan is the highest-value action.
2. **Browsing/research:** user heard about a product or category and wants to explore — text search is how they get there.

Both paths need to terminate at the same place: a cached product record in the TruePrice database, with enough material and metadata to feed the cost estimation engine in Goal 4.

The external world's product databases (Open Food Facts, UPCitemdb) are the source of truth for what products exist and what they're made of. This goal makes TruePrice a consumer of those databases and a caching layer on top of them, so every lookup result is instantly available for all future users.

---

## User Stories

1. **As a shopper standing in a grocery aisle**, I want to scan the barcode on a product with my phone camera so I can immediately see whether TruePrice knows what it costs to make — without typing anything.

2. **As a user who can't get camera access** (browser permission denied, or on desktop), I want to type a UPC/EAN number directly into a field so I can still look up a product by barcode.

3. **As a user who doesn't have the product in hand**, I want to search by product name or brand so I can find and compare products while browsing from my couch.

4. **As a user whose product isn't in any database**, I want to see a clear "product not found" message with an option to submit it, rather than a confusing error screen.

5. **As a user on a product I've already visited**, I want the page to load from cached data instantly — not re-hit the external API every time.

6. **As the cost estimation engine (Goal 4)**, I need every Product record to include `category`, `weight`, `countryOfOrigin`, and linked `ProductMaterial` rows so I have enough data to compute a breakdown without calling external APIs again.

---

## Requirements

### Must-Have

- **BarcodeService** at `src/services/BarcodeService.ts` — sole integration point for Open Food Facts and UPCitemdb. Handles API calls, response parsing, and returning a normalized product shape.
- **ProductService** at `src/services/ProductService.ts` — orchestrates lookup flow: check local cache first, delegate to BarcodeService on miss, persist result to DB.
- **Camera barcode scanner** — `BarcodeScanner` client component using `html5-qrcode`. Opens rear camera on mobile, scans UPC-A, UPC-E, EAN-8, EAN-13. On decode, routes to product lookup.
- **Manual UPC entry** — a text field for direct barcode entry with format validation. "Type it instead" is the fallback link from the camera UI.
- **Text search** — search by product name returning a results grid; no minimum character count required, but results truncated to 20.
- **External API integration:**
  - Open Food Facts (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`) — food/beverage, no API key, unlimited
  - UPCitemdb (`https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}`) — general products, 100 req/day free tier
- **Lookup strategy:** local DB cache → Open Food Facts (food prefix heuristic) → UPCitemdb → not-found state
- **Product caching:** every external lookup result is persisted to the `Product` table after first fetch. Subsequent lookups are served from DB.
- **Material extraction:** `src/lib/material-parser.ts` parses ingredient/composition text into `ProductMaterial` rows per category:
  - Food: ingredient list → individual ingredients → match against `Material` table
  - Clothing: material composition ("60% cotton, 40% polyester") → materials + percentages
  - Cosmetics: INCI ingredient list parsing
  - Electronics: no auto-extraction (manual teardown data only)
- **API routes:**
  - `POST /api/products/lookup` — barcode/UPC lookup; returns `{ found, product, breakdown }`
  - `GET /api/products/search?q=<query>` — full-text search
  - `GET /api/products/[id]` — get cached product by ID
- **Pages:**
  - `/scan` — camera scanner UI
  - `/search?q=<query>` — search results grid
  - `/product/[id]` — basic product info (name, brand, category, weight, origin) as a placeholder until Goal 5 adds the full breakdown UI
- **Loading and error states** on all async operations. Camera permission denial shows a clear message, not a crash.
- **Not-found handling** — graceful "product not found" state with a prompt to submit manually (no form needed in v1 — just the messaging).

### Should-Have

- Camera opens quickly (<2s from tap to live viewfinder) on modern Android/iOS browsers
- UPC entry field validates format before submitting (length 8/12/13 digits) to avoid unnecessary API calls
- Search results show product name, brand, category, and a "get breakdown" CTA
- Aggressive caching of Open Food Facts responses to stay within the spirit of their "be polite" rate limit guidelines

### Won't-Have (v1)

- User-submitted product corrections or manual product creation form
- Nutrition facts display (captured by Open Food Facts but not used in cost estimation)
- Multi-barcode scanning (scan multiple items in sequence)
- Product images displayed on the basic product page (deferred to Goal 5 polish)
- UPCitemdb paid tier integration (100 req/day is sufficient for launch volume)

---

## Acceptance Criteria

- [ ] `BarcodeService` implemented; calls Open Food Facts and UPCitemdb; returns normalized product shape or null
- [ ] `ProductService` implemented; checks DB cache before calling `BarcodeService`; persists result after external lookup
- [ ] `POST /api/products/lookup` returns `{ found: true, product: {...}, breakdown: null }` on cache hit or successful external lookup; `{ found: false }` when not in any database
- [ ] `GET /api/products/search?q=<query>` returns up to 20 matching products from local DB by name/brand
- [ ] `GET /api/products/[id]` returns the product or 404
- [ ] Camera scanning works on current Chrome/Safari on Android and iOS (rear camera, UPC/EAN formats)
- [ ] Manual UPC entry field accepts 8, 12, 13-digit codes; rejects shorter/longer strings before submitting
- [ ] `/scan` page shows clear instructions, a camera permission request UI, and a "type it instead" text link
- [ ] `/search` page renders a results grid; handles empty query, no results, and loading states
- [ ] `/product/[id]` page renders product name, brand, category, weight, country of origin
- [ ] Material parser extracts at least one material for ≥70% of food products in the test corpus
- [ ] Material parser correctly parses textile compositions ("60% cotton, 40% polyester") into two `ProductMaterial` rows
- [ ] Second lookup of the same barcode is served from DB with no external API call
- [ ] All new API routes return appropriate HTTP status codes (200, 404, 400, 500)
- [ ] Unit tests pass: material parser, lookup orchestration (external APIs mocked), search functionality
- [ ] TypeScript compiles clean

---

## Technical Notes

- **Tech stack:** Next.js (App Router), TypeScript, Prisma ORM, PostgreSQL, html5-qrcode, TanStack Query — same as Goal 1
- **No new API keys for MVP** — Open Food Facts requires none; UPCitemdb free tier uses no key. `UPCITEMDB_API_KEY` env var is available for future paid upgrade.
- **html5-qrcode quirk:** must be loaded as a dynamic import in a client component with `ssr: false` to avoid SSR window errors.
- **UPCitemdb rate limit:** 100 req/day on free trial endpoint. Cache every successful lookup immediately. If the daily quota is hit, degrade gracefully to "could not verify this product — try again later."
- **Open Food Facts food heuristic:** barcodes beginning with 0–7 are likely North American (food); begin with 2 = variable weight; 9 = GS1 restricted. Heuristic is best-effort — fall through to UPCitemdb if OFF returns no result.
- **Material parser confidence:** failed parses (unknown ingredient tokens) reduce the downstream CostEstimation confidence score. No parser is expected to be 100% — partial coverage is acceptable and disclosed to users.
- **Product schema fields populated from external APIs:**
  - `Product.name`, `brand`, `category`, `weight`, `countryOfOrigin`, `retailPriceCents` (from UPCitemdb `price` field if available)
  - `Product.upc` / `ean` from the barcode
- **BarcodeScanner component:** wrap in `React.lazy` + `Suspense` at the `/scan` page level. `html5-qrcode` is ~300KB; lazy loading prevents it from blocking the initial route bundle.

---

## Open Questions

*(All resolved — feature is shipped)*

1. **Food vs. general product routing:** Open Food Facts first for food, UPCitemdb as fallback/complement. Implemented as the lookup strategy in `BarcodeService`.

2. **Material extraction quality gate:** No minimum quality threshold enforced at lookup time — all parses are stored; confidence scoring handles quality at estimation time (Goal 4).

3. **Product not found UX:** Show a clear "not in our database yet" message. No submission form in v1. Resolved as acceptable for launch.
