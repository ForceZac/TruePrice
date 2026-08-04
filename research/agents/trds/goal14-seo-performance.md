# TRD: Goal 14 — SEO & Core Web Vitals

- **status:** `done`
- **goal:** `Goal 14`
- **priority:** `P2`
- **branch:** `task/goal14-seo-performance`
- **estimated_effort:** `Medium`
- **depends_on:** `Goal 5, Goal 6, Goal 9`

## Description

Add structured data (JSON-LD), canonical URLs, expanded sitemap coverage, Open
Graph completeness, and performance improvements to drive organic search traffic.
Extends the JSON-LD foundation from Goal 9 rather than replacing it.

## Acceptance Criteria

- [x] Every product page (`/product/[id]`) has valid `Product` JSON-LD with `name`, `brand`, `description`, `offers.price` (retail price in USD), and `additionalProperty` entries for `manufacturingCost` and `markupMultiplier` (when a cost breakdown exists)
- [x] Every category page (`/category/[slug]`) emits a `CollectionPage` JSON-LD block alongside the existing `ItemList`
- [x] `GET /sitemap.xml` includes at least one URL per product (via `/product/[id]`) and one per category; referenced in `robots.txt` via `Sitemap:` directive (already in place)
- [x] Every product and category page sets `alternates.canonical` in `generateMetadata`, pointing to the page's canonical URL (no trailing slash)
- [x] All product and category pages have complete Open Graph tags: `og:title`, `og:description`, `og:url`, `og:image`, `og:type`
- [x] Above-fold product hero image uses `priority` prop on `next/image` to eliminate LCP delay
- [x] `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` env var (optional) wires up `<meta name="google-site-verification">` in root layout
- [x] `tsc --noEmit` passes clean
- [x] All existing tests pass; ≥8 new tests covering: sitemap returns XML with product + category entries, `getAllProductIds` returns IDs, Product JSON-LD shape, CollectionPage JSON-LD shape, canonical URL in metadata, OG tags complete, `JsonLd` component renders correct script tag (23 new tests added)

## Tasks

### 1. JsonLd Atom Component

Create `src/components/atoms/JsonLd.tsx` — a minimal server component that
renders `<script type="application/ld+json">` with XSS-safe serialisation.
Used by product page and any future page needing structured data.

### 2. ProductService — getAllProductIds()

Add `getAllProductIds(): Promise<string[]>` to `src/services/ProductService.ts`.
Simple `SELECT id FROM Product`. Used only by the sitemap route.

### 3. Sitemap — add product pages

Update `src/app/sitemap.ts` to also include `/product/[id]` entries for every
product in the DB. Import `getAllProductIds` from ProductService.

### 4. Product page — canonical + JSON-LD + image priority

Update `src/app/product/[id]/page.tsx`:
- Add `alternates: { canonical: url }` to `generateMetadata` return
- Add `Product` JSON-LD via `<JsonLd>` component in the server render. Fetch
  the latest breakdown in parallel (`getProductWithBreakdown`) and include
  `additionalProperty` when available
- Add `priority` prop to the `<Image>` for the product hero (above fold)

### 5. Category page — canonical + CollectionPage JSON-LD + og:image

Update `src/app/category/[slug]/page.tsx`:
- Add `alternates: { canonical: url }` to `generateMetadata` return
- Add `og:image` using the existing OG image route
  (`/api/og/category/[slug]` if it exists, otherwise a static fallback)
- Emit a `CollectionPage` JSON-LD block alongside the existing `ItemList`

### 6. Root layout — google-site-verification

Update `src/app/layout.tsx` and `src/lib/env.client.ts`:
- Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (optional) to the client env schema
- If set, include `<meta name="google-site-verification" content="...">` via
  `metadata.verification.google` in the root layout export

### 7. Tests

Create `src/services/__tests__/ProductService.goal14.test.ts` and
`src/components/atoms/__tests__/JsonLd.test.tsx` covering all AC test items.
