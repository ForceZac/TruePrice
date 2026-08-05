# PRD: Goal 3 — Product Lookup (Search + Barcode)

- **Goal reference:** Goal 3 — roadmap `research/implementation-roadmap-v2.md`
- **TRD:** `research/agents/trds/goal3-product-lookup.md`
- **Status:** ✅ Merged (PR #3, 500c75d)
- **Depends on:** Goal 1

---

## Problem Statement

TruePrice's core promise is showing users what a product actually costs to make. But that promise is useless if users can't find the product they're holding. A person stands in a store, scans a barcode, and either learns the truth — or bounces. The lookup layer is the front door: it has to work on mobile, handle the full diversity of barcodes in the wild, and fall back gracefully when a product isn't in the database.

Without a reliable lookup system, every downstream goal (cost estimation, product pages, social sharing, watchlists) has no data to operate on.

---

## User Stories

**US-1 — Camera barcode scan (primary flow)**
As a user in a store, I want to point my phone camera at a barcode and immediately see product info and cost breakdown, so I don't have to type anything.

**US-2 — Manual UPC entry**
As a user whose camera permission is denied or whose barcode is damaged, I want to type a UPC/EAN number and get the same result, so I'm not blocked.

**US-3 — Text search**
As a user browsing at home, I want to type a product name and see a list of matches, so I can explore without a physical product in hand.

**US-4 — Product not found**
As a user who scans an obscure or regional product, I want a clear message when the product isn't in any database, with an invitation to submit it, so I'm not left with a blank screen.

**US-5 — Fast repeat lookups**
As a frequent user who scans the same products repeatedly, I want lookups to be near-instant on repeat visits because the product is already cached, so the app feels snappy.

---

## Requirements

### Must-Have

- Camera barcode scanning via `html5-qrcode` on `/scan` page (rear camera default, supports UPC-A, UPC-E, EAN-8, EAN-13)
- Camera permission denial shows fallback link to manual UPC entry
- Manual UPC/EAN entry field with format validation
- Text search at `/search?q=<query>` returning product cards
- Barcode → product resolution order:
  1. PostgreSQL cache (instant)
  2. Open Food Facts (food/beverage, free + unlimited)
  3. UPCitemdb (general products, 100 req/day free tier)
- Products cached in PostgreSQL on first lookup (no re-fetch on revisit)
- Product detail page at `/product/[id]` showing: name, brand, category, weight, country of origin, ingredients/materials
- `BarcodeService` owns all external API calls
- `ProductService` owns lookup orchestration + caching
- Material parser (`src/lib/material-parser.ts`) extracts ingredients from food labels and material compositions from clothing labels (best-effort)
- API routes: `POST /api/products/lookup`, `GET /api/products/search`, `GET /api/products/[id]`
- All async operations have loading and error states

### Should-Have

- Search results ranked by relevance (name match weight > brand match)
- Ingredient list displayed on product page when available
- "Type it instead" fallback link visible on scan page before camera loads

### Won't Have (v1)

- Optical character recognition (OCR) for product names from camera
- Product image display (deferred — images from external APIs are unreliable)
- QR code scanning (UPC/EAN only)
- Paid UPCitemdb tier (free tier sufficient for pre-launch volumes)

---

## Acceptance Criteria

- [ ] `/scan` page opens rear camera on mobile; scans a real barcode within 3 seconds in normal lighting
- [ ] Camera permission denial shows a graceful message + link to `/scan?manual=1`
- [ ] Manual UPC entry rejects non-numeric inputs and barcodes that aren't 8, 12, or 13 digits
- [ ] `POST /api/products/lookup` returns `{ found: true, product, breakdown }` for a known UPC and `{ found: false }` for an unknown one
- [ ] `GET /api/products/search?q=<query>` returns an array of matching products from the local DB
- [ ] A product scanned a second time resolves from PostgreSQL cache (no external API call on repeat lookup — verified by log/trace)
- [ ] Material parser correctly extracts ingredients from a food label test fixture (>80% ingredient match rate)
- [ ] Material parser correctly extracts composition from a clothing label (e.g., "60% cotton, 40% polyester")
- [ ] `tsc --noEmit` passes clean
- [ ] All unit tests pass (material parser, service mocks)

---

## Technical Notes

- `html5-qrcode` must be loaded as a dynamic import (`next/dynamic` with `ssr: false`) — it accesses `navigator.mediaDevices`, which is browser-only
- Open Food Facts returns `product.ingredients_text` for food parsing
- UPCitemdb free tier uses the trial endpoint (`/prod/trial/lookup`) — no API key required; paid key via `UPCITEMDB_API_KEY` env var when volume demands it
- Material parser is best-effort: products with unparseable ingredients get no `ProductMaterial` rows and will receive LOW confidence scores in Goal 4
- External API calls belong exclusively in `BarcodeService` — `ProductService` never calls external APIs directly (SoC rule from PROJECT_KEYS.md §10)
- No raw `process.env` — use `src/lib/env.server.ts` for `UPCITEMDB_API_KEY`

---

## Open Questions

None unresolved — this goal is shipped. See `research/agents/open-questions.md` Resolved section for historical decisions.
