# PRD: Goal 14 — SEO & Core Web Vitals

- **Goal reference:** Goal 14 (roadmap: `research/implementation-roadmap-v2.md`)
- **TRD:** `trds/goal14-seo-performance.md`
- **Status:** In Review (PR #25)
- **Priority:** P2
- **Depends on:** Goal 5, Goal 6, Goal 9

---

## Problem Statement

TruePrice product and category pages produce minimal organic search value. The site lacks structured data (JSON-LD), canonical URLs are missing, product pages are absent from the sitemap, and OG tags are incomplete on category pages. Google cannot surface rich results for TruePrice content, and social shares generate weak link previews. This limits top-of-funnel traffic at precisely the point (post-Goal 12 enhanced search + post-Goal 9 social sharing) where organic acquisition should begin compounding.

---

## User Stories

**US-1 — Rich search result**
As a user who Googles "iPhone 15 manufacturing cost," I want to see a rich result card with product name and price so I can immediately recognize TruePrice as the authoritative source.

**US-2 — Category discovery**
As a user searching "most overpriced electronics," I want to find a TruePrice category landing page in the top results so I can browse without already knowing a specific product.

**US-3 — Social share**
As a user who shares a product or category page to Twitter/iMessage, I want a proper OG card image and title to render so the link looks credible and drives clicks.

**US-4 — Google Search Console setup**
As Zach, I want to submit a complete sitemap to Google Search Console so I can track indexing progress and identify crawl errors.

**US-5 — Page speed**
As a user on a mobile data connection, I want the product hero image to load without blocking page interaction so the page feels fast.

---

## Requirements

### Must-Have
- **Product JSON-LD** — Every `/product/[id]` page emits a valid `Product` schema with `name`, `brand`, `description`, `offers.price`, and `additionalProperty` entries for `manufacturingCost` and `markupMultiplier` when a cost breakdown exists.
- **Category JSON-LD** — Every `/category/[slug]` page emits a `CollectionPage` JSON-LD block alongside the existing `ItemList`.
- **Canonical URLs** — All product and category pages set `alternates.canonical` via `generateMetadata` (no trailing slash).
- **Complete OG tags** — All product and category pages include `og:title`, `og:description`, `og:url`, `og:image`, `og:type`.
- **Sitemap coverage** — `GET /sitemap.xml` includes one URL per product (`/product/[id]`) and one per category.
- **LCP fix** — Above-fold product hero image uses the `priority` prop on `next/image`.
- **Site verification** — `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` env var (optional) wires up the Google meta tag in root layout.

### Should-Have
- `robots.txt` includes a `Sitemap:` directive pointing to `/sitemap.xml` (already in place from Goal 6; confirm it persists).

### Won't-Have (this goal)
- Lighthouse CI as a PR gate — manual audit at goal boundary is acceptable; CI integration deferred.
- Product URL slugs — sitemap uses numeric IDs (`/product/[id]`) for now. Slug field on `Product` deferred to a future goal.
- Per-product `lastmod` timestamps in sitemap — static timestamps are fine for v1.

---

## Acceptance Criteria

1. Every `/product/[id]` page contains a `<script type="application/ld+json">` block with valid `Product` JSON-LD including all required fields.
2. Every `/category/[slug]` page contains a `CollectionPage` JSON-LD block.
3. `GET /sitemap.xml` returns XML that includes at least one `/product/[id]` entry and one `/category/[slug]` entry.
4. `<link rel="canonical">` is present on all product and category pages with the correct URL.
5. All product and category pages pass OG completeness check: `og:title`, `og:description`, `og:url`, `og:image`, `og:type` all non-empty.
6. Product hero image includes `priority` prop.
7. When `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is set, the root layout includes `<meta name="google-site-verification">`.
8. `tsc --noEmit` passes clean.
9. ≥8 new tests covering: sitemap XML with product + category entries, `getAllProductIds` return shape, Product JSON-LD shape, CollectionPage JSON-LD shape, canonical URL in metadata, OG tags completeness, `JsonLd` component renders correct script tag.

---

## Technical Notes

- **`JsonLd` atom** — New `src/components/atoms/JsonLd.tsx` server component. Renders `<script type="application/ld+json">` with XSS-safe serialisation (`JSON.stringify` with HTML entity escaping). Reusable for any future structured data.
- **`ProductService.getAllProductIds()`** — Returns `string[]` of all product IDs. Used exclusively by the sitemap route. Simple `SELECT id FROM Product`. No pagination needed; product count is bounded for v1.
- **Sitemap route** — `src/app/sitemap.ts` extended to import `getAllProductIds` and return one `MetadataRoute.Sitemap` entry per product. Category slugs come from `CategoryService.getAllSlugs()`.
- **Env var** — `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` added to `src/lib/env.client.ts` as optional string. Root layout reads it and sets `metadata.verification.google`.
- **OG image for categories** — Use existing OG image route if available; fall back to static placeholder. Do not create a new image generation route in this goal.
- Stack constraints: App Router only, no Pages Router. Follow `node_modules/next/dist/docs/` for `generateMetadata` API in this Next.js version.

---

## Open Questions

**Q14-1: Lighthouse CI integration** *(Low priority — resolved for this goal)*
Manual Lighthouse audit at goal boundary is sufficient. CI integration can be added post-launch if Zach wants automated performance regression detection.

**Q14-2: Google Search Console verification method** *(Medium — needed before sitemap submission)*
HTML meta tag via `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` is the chosen approach (implemented in TRD). DNS TXT record remains an alternative if meta tag approach causes deploy friction.
- **Owner:** Zach

**Q14-3: Sitemap URL format** *(Resolved — numeric IDs)*
Sitemap uses `/product/[id]` (numeric IDs). No `slug` field added to `Product` in this goal. SEO benefit of human-readable slugs deferred to a future goal. `getAllProductIds()` returns numeric ID strings.
