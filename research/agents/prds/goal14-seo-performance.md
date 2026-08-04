# PRD — Goal 14: SEO & Core Web Vitals

**Goal reference:** Goal 14 — SEO & Core Web Vitals  
**Depends on:** Goal 5 (Product Page UI), Goal 6 (Category Browsing), Goal 9 (Comparison & Social — JSON-LD foundation)  
**Written:** 2026-08-04 (PM Run #154)

---

## Problem Statement

All 13 v1 goals have shipped. TruePrice has 104 products, category pages, a comparison tool, and AdSense slots — but organic search is not yet a meaningful traffic source. The site is discoverable only by direct link or word of mouth.

The product's core value proposition ("see what this thing actually costs to make") is search-intent-native: users regularly search "[product] markup" or "how much does [product] cost to make." Capturing that intent requires structured data that tells Google what TruePrice is, performant pages that pass Core Web Vitals thresholds, and correct canonical signals to prevent duplicate-content penalties.

Without these, AdSense revenue stays near zero and no organic growth funnel exists to support future goals (user sign-ups, watchlist growth, digest engagement).

---

## User Stories

- **Curious shopper (Google):** "I searched 'iPhone manufacturing cost' and found TruePrice in the top 10 — the rich result showed the markup directly in the SERP snippet."
- **Returning visitor (mobile):** "The page loads in under 2 seconds on my phone even on a slow connection. The cost breakdown chart appears without layout shift."
- **Blogger:** "I'm writing about corporate markup. I found TruePrice via Google, and the structured data made it easy to cite."
- **Site admin (Zach):** "I added TruePrice to Google Search Console and can see which products are getting impressions, clicks, and what queries are driving them."
- **AdSense reviewer:** "The site passes Core Web Vitals in Search Console, which is a positive signal for ad quality score."

---

## Requirements

### Must-Have

- **Product page structured data** — Each `/products/[slug]` page emits a `Product` JSON-LD schema with: `name`, `brand`, `description`, `offers.price` (retail price), and a custom `additionalProperty` block for `manufacturingCost` and `markupMultiplier`. Extend the existing JSON-LD work from Goal 9 rather than replacing it.
- **Category page structured data** — Each `/category/[slug]` page emits a `CollectionPage` JSON-LD schema with `name`, `description`, `url`, and `numberOfItems`.
- **Sitemap** — `GET /sitemap.xml` dynamically lists all product pages (`/products/[slug]`), all category pages (`/category/[slug]`), and static pages (`/`, `/compare`, `/trending`). Regenerate on each deploy (no ISR needed; use `generateSitemaps` in Next.js App Router).
- **Canonical URLs** — Every page renders `<link rel="canonical">` pointing to the canonical URL (prevents penalty from `?page=N` or trailing-slash variants). Use `generateMetadata` in each layout.
- **Open Graph completeness** — Every page has: `og:title`, `og:description`, `og:url`, `og:type`, `og:image`. Product pages use the existing OG image route from Goal 9. Category pages use a generated card with category name + product count.
- **Performance budget enforcement** — Product pages must score ≥85 on Lighthouse Performance (mobile, throttled). Identify and fix the largest LCP and CLS contributors. Typical fixes: image size/format, font loading strategy (`next/font`), lazy-loading below-fold components.
- **`robots.txt`** — Correct robots.txt (already partially in place from Goal 7). Confirm `Sitemap:` directive points to `/sitemap.xml`.

### Should-Have

- **Google Search Console setup guidance** — `GOOGLE_SITE_VERIFICATION` env var and `<meta name="google-site-verification">` tag in root layout. Enables Zach to verify ownership and submit sitemap. Document in README.
- **Breadcrumb structured data** — Category and product pages emit `BreadcrumbList` JSON-LD so Google can render breadcrumbs in SERPs (e.g., "Home > Electronics > iPhone 15").
- **`next/image` audit** — All product images and category thumbnails verified to use `next/image` with explicit `width`/`height` and correct `priority` on above-fold images. No raw `<img>` tags.
- **`Link rel="preconnect"`** — Add preconnect hints for external origins loaded on page load (Google Fonts, AdSense, commodity API CDN). Reduces TTFB on first navigation.

### Won't Have (this goal)

- Paid search / SEM campaigns — not a technical concern
- International SEO / `hreflang` — English-only for v1
- AMP pages — deprecated; not worth the complexity
- Programmatic SEO page generation beyond existing routes (e.g., "best [category] products by markup") — deferred to a future content strategy goal
- A/B testing page titles for CTR — deferred

---

## Acceptance Criteria

1. Every product page (`/products/[slug]`) has valid `Product` JSON-LD verifiable via Google's Rich Results Test with no errors.
2. Every category page (`/category/[slug]`) has valid `CollectionPage` JSON-LD.
3. `GET /sitemap.xml` returns a valid XML sitemap containing at minimum one URL per product and one per category. The sitemap is referenced in `robots.txt` via `Sitemap:` directive.
4. Every page has a `<link rel="canonical">` matching its canonical URL.
5. All product and category pages have complete Open Graph meta tags (`og:title`, `og:description`, `og:url`, `og:image`, `og:type`).
6. Lighthouse Performance score on the product page is ≥85 (mobile, simulated throttling) measured in CI.
7. `tsc --noEmit` passes clean.
8. All existing tests pass. ≥8 new tests covering: sitemap route returns valid XML, JSON-LD shape for product page, JSON-LD shape for category page, canonical URL presence, OG tag presence.

---

## Technical Notes

- **Sitemap route:** `src/app/sitemap.ts` using Next.js `generateSitemaps()`. Calls `CategoryService.getAllSlugs()` and `ProductService.getAllSlugs()` (new method on each service — simple `SELECT slug FROM ...`). Return `MetadataRoute.Sitemap` array.
- **Structured data:** Use a shared `JsonLd` atom component (`src/components/atoms/JsonLd.tsx`) that renders `<script type="application/ld+json">`. Call from server components in each page's layout or page file. Do not inject JSON-LD from client components.
- **`generateMetadata`:** Each page (`src/app/products/[slug]/page.tsx`, `src/app/category/[slug]/page.tsx`) should export `generateMetadata` returning full `Metadata` object. Category pages can use the existing `CategoryService.getBySlug()` to populate title/description.
- **LCP / CLS investigation:** Run `next build && next start` locally with Lighthouse CLI. Common culprits: `CostBreakdownChart` (Recharts) rendering client-side causing CLS; product hero image missing `priority`; Google Fonts not using `next/font/google`. Fix whichever issues are blocking the ≥85 score.
- **New env var:** `GOOGLE_SITE_VERIFICATION` (optional, client-visible) — add to `env.client.ts` if present.
- **SoC:** All new DB calls go through Services. No Prisma calls in sitemap route or page files directly.

---

## Open Questions

**Q14-1: Lighthouse CI integration**  
Should Lighthouse CI run as a GitHub Actions check on every PR, or is a manual audit at the goal boundary sufficient? CI integration is the gold standard but adds ~2 minutes to each CI run.  
- **Owner:** Zach | **Priority:** Low — manual audit is acceptable for this goal; CI can be added later

**Q14-2: Google Search Console verification method**  
Google supports four verification methods: HTML meta tag, HTML file, DNS TXT record, and Google Analytics. The meta tag approach (via `GOOGLE_SITE_VERIFICATION` env var) is simplest to implement without deploy-time file changes. Is that acceptable, or does Zach prefer DNS TXT?  
- **Owner:** Zach | **Priority:** Medium — needed before submitting sitemap

**Q14-3: Sitemap URL format for products**  
Product URLs are currently `/products/[id]` (numeric ID) or `/products/[slug]` (human-readable slug). If product slugs are not yet in the DB schema, the sitemap must use numeric IDs. Should we add a `slug` field to `Product` as part of this goal, or use numeric IDs for now?  
- **Owner:** PM / Dev | **Priority:** High — affects sitemap and canonical URL implementation
