# PRD: Goal 3 — Product Lookup (Search + Barcode)

- **Goal reference:** Goal 3 — Product Lookup (Search + Barcode) (roadmap: implementation-roadmap-v2.md)
- **Status:** Implemented (PR #3, commit 500c75d, merged 2026-07-30)
- **Priority:** P0
- **Depends on:** Goal 1 (Project Scaffold & Data Model)
- **Blocks:** Goal 4 (Cost Estimation Engine)

---

## Problem Statement

TruePrice reveals the manufacturing cost of consumer products — but before any cost can be shown, the user has to find the product. In v1, there's no way in. You can't land on the homepage and do anything useful if there's no way to look up a product.

Users reach TruePrice in two modes:

1. **Physical product in hand** — they want to scan the barcode on a cereal box or pair of sneakers and immediately see what it costs to make. This is the core "aha moment" use case. If scanning doesn't work on mobile, the app fails at its primary entry point.

2. **Searching by name** — a user sees a product mentioned online (e.g., "this $200 hoodie costs $8 to make") and searches TruePrice to verify or find similar products. Text search is the fallback for everything not in front of the user physically.

Without this goal, the product has a cost estimation engine and a data model but no front door. Goal 3 builds the front door.

---

## User Stories

1. **As a user in a store holding a product**, I want to open TruePrice on my phone, tap "Scan," and point my camera at the barcode — so I can see within seconds what the product costs to make without typing anything.

2. **As a user on a desktop**, I want to type a product name into a search bar and see matching results — so I can find products I've heard about without needing the physical item.

3. **As a user who can't find a product via barcode**, I want to manually type in the UPC/EAN number — so a failed scan doesn't leave me stuck.

4. **As a user scanning a product I've never heard of**, I want TruePrice to look it up from external databases (Open Food Facts, UPCitemdb) and cache the result — so future users of the same product get instant results.

5. **As a user whose scan finds nothing**, I want a clear "not found" state with an explanation and a fallback path (manual entry) — not a broken page or a spinner that never resolves.

---

## Requirements

### Must-Have

- **Camera-based barcode scanning** — `/scan` page using `html5-qrcode`. Supports UPC-A, UPC-E, EAN-8, EAN-13. Requests camera permission; shows clear error if denied with a manual entry fallback. Opens rear camera by default on mobile.
- **Manual UPC/EAN entry** — field with validation (numeric, 8–14 digits). Shares the same lookup path as camera scanning.
- **Text search** — `/search?q=<query>` page. Matches against product name and brand in the DB. Shows product cards with name, brand, category, and (if available) image.
- **External product lookup** — on a barcode miss, hit Open Food Facts (food/beverage) then UPCitemdb (general products). Cache result in the `Product` table on first hit. Never re-fetch a cached product from the external API.
- **`BarcodeService`** — handles all external API integration (Open Food Facts, UPCitemdb). No external API calls outside this service.
- **`ProductService`** — handles lookup orchestration and caching. No business logic in API routes.
- **`material-parser.ts`** — best-effort extraction of materials from ingredient/composition text. Parses food ingredients, textile compositions ("60% cotton, 40% polyester"), and cosmetics INCI lists. Maps to `Material` table entries.
- **API routes:**
  - `POST /api/products/lookup` — barcode/UPC lookup; returns `{ found, product, breakdown }`
  - `GET /api/products/search?q=<query>` — text search; returns array of product cards
  - `GET /api/products/[id]` — get cached product by ID
- **"Not found" handling** — when a product is not in any external database, return a clear not-found state (not a 500). Show the user what was searched and invite manual entry.
- **Loading and error states** — all async operations have loading indicators and error messages. No silent failures.

### Should-Have

- **Search result quality** — rank results by relevance (exact name match > brand match > partial). Filter out products with no estimate if a filter option is surfaced.
- **Barcode format validation** — client-side validation before sending to the API (reject obviously wrong lengths/formats to save API calls).
- **Scan history in session** — recently scanned barcodes remembered during the session (localStorage) so the user can go back without re-scanning.
- **"Type it instead" affordance** — visible link on the scan page to switch to manual entry; reduces friction for users in low-light conditions where the scanner struggles.

### Won't-Have (v1)

- User-submitted product corrections or community data
- Ingredient sourcing beyond Open Food Facts and UPCitemdb
- Fuzzy/typo-tolerant text search (full-text search is sufficient for v1)
- Product image upload or verification
- Real-time inventory or pricing from retailers

---

## Acceptance Criteria

- [ ] `/scan` page loads on mobile; camera permission requested; barcode scanning works for UPC-A and EAN-13 formats
- [ ] Camera permission denied → clear error message + link to manual entry displayed (no crash)
- [ ] Manual UPC entry field validates length and digit-only constraint client-side before submission
- [ ] Scanning a barcode for a cached product returns the product instantly (DB hit)
- [ ] Scanning a barcode for an uncached product triggers external API lookup; Open Food Facts tried first for food items; UPCitemdb tried second; result cached in DB
- [ ] Scanning an unknown barcode (not in any API) returns a not-found state with message and fallback link
- [ ] `/search?q=<query>` returns matching product cards for products in the DB
- [ ] `POST /api/products/lookup` returns `{ found: true, product, breakdown }` for a known UPC; `{ found: false }` for unknown
- [ ] `GET /api/products/search?q=<query>` returns an array (empty array for no results, not 404)
- [ ] `BarcodeService` is the only place external product API calls are made
- [ ] `ProductService` is the only place DB product lookups/inserts are made
- [ ] `material-parser.ts` correctly parses at minimum: food ingredient lists (English), textile compositions ("X% material" format), and INCI cosmetics lists
- [ ] All loading states visible to the user during async operations
- [ ] TypeScript compiles clean; no raw `process.env` in any app code

---

## Technical Notes

- **Tech stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL — same as Goal 1
- **Barcode library:** `html5-qrcode`. Client component only (`"use client"`). Must not be imported in Server Components.
- **External API lookup order:**
  1. Check local DB by UPC/EAN (Prisma `Product.findUnique` on `upcEan` field)
  2. If miss + looks like food (Open Food Facts-compatible barcode prefix): hit Open Food Facts at `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
  3. If still miss: hit UPCitemdb at `https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}` (free tier: 100 req/day — cache aggressively)
  4. If found: insert `Product` row, parse materials, return
  5. If not found: return `{ found: false }`
- **Rate limiting:** UPCitemdb free tier is 100 req/day. The DB cache means each unique product is only fetched once from the external API.
- **Material parser:** best-effort; some products will have unparseable ingredients. That's OK — the `confidence` score (Goal 4/8) reflects the quality of parsed material data. Don't throw on parse failure.
- **Camera permission:** `html5-qrcode` handles permission request. Catch `NotAllowedError` and render the manual entry fallback UI.
- **New pages:**
  - `app/scan/page.tsx` — barcode scanning page (client component)
  - `app/search/page.tsx` — search results page (server component with URL params)
  - `app/product/[id]/page.tsx` — product detail stub (populated in Goal 5)
- **New services:**
  - `src/services/BarcodeService.ts`
  - `src/services/ProductService.ts`
- **New utilities:**
  - `src/lib/material-parser.ts`
- **UPCitemdb API key:** Optional `UPCITEMDB_API_KEY` env var for paid tier. Falls back to trial endpoint if not set.

---

## Open Questions

None — this goal is now implemented and merged. The following decisions were made during implementation:

- Open Food Facts was prioritized for food products (free, no rate limit) over UPCitemdb.
- Material parser is best-effort and does not throw on unrecognized ingredients; the confidence tier in Goal 8 surfaces the quality of the result.
- Camera permission denial degrades gracefully to manual entry with a visible affordance.
- UPCitemdb trial endpoint is used; upgrade to paid tier if barcode miss rate is unacceptable at scale.
