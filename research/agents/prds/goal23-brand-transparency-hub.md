# PRD: Goal 23 — Brand Transparency Hub

- **Goal reference:** Goal 23 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 5 (Product Page UI), Goal 6 (Category Browsing), Goal 9 (Comparison & Social), Goal 17 (Product Slug URLs)
- **Proposed by:** PM Run #218 (2026-08-06)

---

## Problem Statement

TruePrice surfaces markup data at the *product* level, but users, journalists, and advocates think in terms of *brands*. "Is Apple more transparent than Samsung?" "Which clothing brands have the worst markups?" "Show me every Nike product and what they really cost."

These brand-level stories are what generate press coverage and virality — they make TruePrice a reference destination, not just a lookup tool. Right now, TruePrice has no answer for them.

Three concrete gaps:

1. **No brand landing pages.** `/brand/apple` doesn't exist. Google searches for "Apple manufacturing cost," "Nike markup," or "Adidas vs Nike markup" return no TruePrice results, despite TruePrice having this data across dozens of seeded products. Each brand page would be a high-intent SEO target.

2. **No brand-level aggregation.** Even internally, there's no way to see "all Apple products on TruePrice" with summary stats — average markup, most inflated product, least inflated product, confidence distribution. The data exists in the DB; it's just never surfaced at the brand grain.

3. **No shareable brand story.** The comparison tray (Goal 9) compares individual products. There's no "Brands with the worst markups" leaderboard — the kind of list that gets shared on Twitter, cited in articles, and linked from Reddit. A single "Hall of Shame" and "Hall of Transparency" feature could generate more organic traffic than months of SEO work.

---

## User Stories

**US-1 — Brand page lookup**
As a user, I want to visit `/brand/apple` and see all Apple products on TruePrice with their costs and markup multipliers, so I can understand Apple's pricing behavior as a whole.

**US-2 — Brand Transparency Score**
As a user, I want to see a single "Transparency Score" for a brand (e.g., average markup multiplier across all products), so I can quickly compare whether a brand's pricing is reasonable or extractive.

**US-3 — Top/Bottom brand leaderboard**
As a user, I want to browse a `/brands` leaderboard sorted by average markup (most inflated → most transparent), so I can discover which brands have the worst and best practices — shareable content I can send to friends.

**US-4 — Brand page sharing**
As a user, I want to share a brand's transparency page (OG card: brand name + Transparency Score + product count) on social media, so I can start conversations about specific brands.

**US-5 — In-product cross-linking**
As a user viewing a product page, I want to see a "More from [Brand]" section with links to other TruePrice-analyzed products from the same brand, so I can explore the full picture without searching.

---

## Requirements

### Must-Have

- **`Brand` model** in Prisma: `id`, `name`, `slug`, `logoUrl` (nullable), `description` (nullable), `createdAt`. `Product` gets a `brandId` FK (nullable — not all products have a matched brand). Migration included.
- **`BrandService`** (`src/services/BrandService.ts`): sole owner of brand queries. Methods: `getBrandBySlug(slug)`, `getBrandProducts(brandId)`, `getAllBrands()`, `getBrandStats(brandId)` (average markup, product count, confidence distribution), `getBrandLeaderboard(limit, order)`.
- **`/brand/[slug]` route** — server-rendered page showing:
  - Brand name + Transparency Score (average markup multiplier)
  - Grid of product cards (same card component used on category pages)
  - "Most inflated" and "Least inflated" product callouts (top 1 each)
  - `<title>` and OG tags: `"[Brand] Manufacturing Costs & Markup — TruePrice"`
- **`/brands` route** — leaderboard page:
  - Sorted by average markup, toggleable between ascending (most transparent) and descending (most inflated)
  - Filterable by category (showing only brands with products in that category)
  - Includes "min 3 products" threshold — brands with fewer than 3 analyzed products are excluded from the leaderboard to avoid single-product distortion
- **Sitemap inclusion** — `BrandService.getAllBrandSlugs()` feeds the sitemap generated in Goal 14 (SEO). Brand pages must appear in `sitemap.xml`.
- **"More from [Brand]" widget** on product pages — shows up to 4 other products from the same brand (server component, no new API route needed). Displayed below the cost breakdown chart.
- **Brand backfill** — seed script that extracts unique brand names from the existing `Product.brand` field and creates `Brand` records + sets `Product.brandId`. The current `Product.brand` string field is kept (for products without a matched `Brand` record) but `brandId` takes priority when set.
- `tsc --noEmit` clean; all existing tests pass; new unit tests cover `BrandService` core methods

### Should-Have

- **Brand OG image** — `GET /api/og/brand/[slug]` generating a Satori card with brand name + Transparency Score. Uses the same OG infrastructure added in Goal 9.
- **Brand search autocomplete** — extend `DiscoveryService` (or `SearchService` if extracted in Goal 12) to include brand name matches in the search autocomplete dropdown. Brand results appear under a "Brands" section header in the dropdown.
- **`logoUrl` seeding** — where logos are available via Clearbit Logo API (free, no key required, `https://logo.clearbit.com/<domain>`), set `Brand.logoUrl`. Gate behind a one-time script; don't add external Clearbit calls to the hot path.

### Won't Have (v1)

- User-submitted brand pages — brands are created by the admin seed/backfill only in v1
- Brand "claim" or "official response" features — not a priority until press coverage brings brands to TruePrice
- Brand-level cost trend charts — depends on Goal 20 (Cost History); defer to a follow-up
- Sponsored or paid brand placements — monetization of brand pages deferred to post-launch

---

## Acceptance Criteria

- [ ] `GET /brand/apple` (or any seeded brand slug) returns 200 with brand name, Transparency Score, and product list
- [ ] `GET /brand/nonexistent` returns 404
- [ ] `GET /brands` returns a leaderboard of brands with ≥3 analyzed products, sortable by avg markup asc/desc
- [ ] Product pages for products with a matched brand show a "More from [Brand]" widget with ≥1 other product (or hide the widget if no other products exist)
- [ ] Brand pages appear in `sitemap.xml` output from `GET /sitemap.xml`
- [ ] Brand pages have correct `<title>` and `og:title` / `og:description` meta tags
- [ ] `BrandService` unit tests cover: `getBrandBySlug` (found/not found), `getBrandStats` (markup average, confidence distribution), `getBrandLeaderboard` (sort order, min-product threshold)
- [ ] Backfill script creates `Brand` records from existing `Product.brand` strings and sets `Product.brandId` correctly
- [ ] `tsc --noEmit` passes clean
- [ ] All existing tests (467+) continue to pass

---

## Technical Notes

- **`Brand` slug generation:** `brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')`. Store in `Brand.slug` — unique index. Collisions (two brands whose names normalize to the same slug) should append a numeric suffix (`-2`, `-3`).
- **`BrandService` SoC:** `BrandService` reads from `Brand`, `Product`, and `CostBreakdown` tables but **must not** call `CostEstimationService` or `ProductService`. All data is read-only DB queries. Conforms to Section 10 service rules.
- **"More from [Brand]" widget:** Server component that calls `BrandService.getBrandProducts(brandId, { exclude: currentProductId, limit: 4 })` directly. No API route needed — this is server-side data.
- **Leaderboard query performance:** `BrandService.getBrandLeaderboard()` joins `Brand → Product → CostBreakdown` to compute average `markupPercent`. Add `@@index([brandId])` on `Product` and `@@index([productId])` on `CostBreakdown` if not already present. Verify with `EXPLAIN ANALYZE` before shipping.
- **Product.brand field handling:** Keep `Product.brand` (string) as a display fallback. When `Product.brandId` is set, prefer `Brand.name` for display. When `brandId` is null (unmatched products), `Product.brand` is still shown on the product card.
- **Category filter on `/brands`:** Pass `?category=electronics` query param; `BrandService.getBrandLeaderboard({ category })` filters via `Product.category` join.

---

## Open Questions

**Q23-1: Minimum product threshold for leaderboard**
The PRD proposes ≥3 products for leaderboard inclusion. Is this the right cutoff? Too low and single-product outlier brands distort rankings; too high and the leaderboard is sparse early on.
- Suggested default: 3. Configurable via query param for admin previews (`?minProducts=1`). Revisit after 6 months of data.
- **Owner:** Zach | **Priority:** Low — doesn't block implementation

**Q23-2: Logo sourcing and licensing**
Clearbit Logo API is free but terms of service require that logos not be displayed in a way that implies endorsement. Does showing a brand's logo on a "worst markup" leaderboard create legal risk?
- Suggested default: Launch without logos (`logoUrl` null). Add logos after legal review. The text-based brand page is fully functional without them.
- **Owner:** Zach | **Priority:** Medium — block logo feature until clarified; doesn't block brand pages

**Q23-3: Brand name deduplication**
The existing `Product.brand` field is free text entered at seed time (e.g., "Apple", "Apple Inc.", "APPLE"). The backfill script needs a deduplication pass. Should it be case-insensitive match only, or also apply fuzzy matching?
- Suggested default: Case-insensitive exact match only for v1. Flag ambiguous cases to a CSV for manual Zach review before the migration runs. Fuzzy matching adds complexity with unclear benefit at current catalog size.
- **Owner:** Dev | **Priority:** Must clarify before running backfill migration
