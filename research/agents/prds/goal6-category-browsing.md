# PRD: Goal 6 — Category Browsing & Landing Pages

- **Goal reference:** Goal 6 — Category Browsing & Landing Pages (roadmap: implementation-roadmap-v2.md)
- **Status:** Draft
- **Priority:** P1
- **Depends on:** Goal 5 (Product Page & Cost Breakdown UI)
- **Blocks:** Goal 7 (AdSense Integration)

---

## Problem Statement

After Goal 5, TruePrice can show a compelling cost breakdown for individual products — but users can only reach a product via barcode scan or direct URL. There's no way to browse, discover, or land on TruePrice through organic search. This is a dead end for SEO and for AdSense approval.

Google AdSense requires a site with real, organized content before approving monetization. Category landing pages serve two purposes simultaneously: (1) they give users a way to explore products by type, and (2) they create the indexable, content-rich pages that satisfy AdSense's content requirements.

Without category browsing, growth is word-of-mouth only. With it, every category page is an SEO entry point that can rank for terms like "how much does a Levi's t-shirt cost to make" or "true cost of protein powder."

---

## User Stories

1. **As a new user arriving from a Google search**, I want to land on a category page (e.g., "Clothing & Apparel") that shows me the most interesting products in that category — so I understand what TruePrice does and can find something I care about.

2. **As a returning user who doesn't have a product to scan**, I want to browse by category and see which products have the highest markup so I can be outraged / entertained.

3. **As a user on the home page**, I want to see category tiles so I can pick a starting point without having to scan anything.

4. **As a user on a product page**, I want a breadcrumb and a "More in [Category]" section so I can discover related products without going back to the home page.

5. **As a user on a category page**, I want to see aggregate stats — average markup for this category, most-marked-up product — so the page is informative even before I click into a product.

---

## Requirements

### Must-Have

- **`/categories` page** — grid or list of all ProductCategories with name, icon/emoji, product count, and average markup % (computed from existing CostBreakdowns)
- **`/category/[slug]` page** — SEO landing page for a single category, including:
  - Category name and a brief description (2–3 sentences, hardcoded for v1)
  - Aggregate stats: average markup %, highest markup product, number of products with estimates
  - Product list/grid sorted by markup % descending (most marked-up first) — each card shows name, image, retail price, estimated cost, markup %
  - Pagination or "load more" (≥12 products per page)
- **Category slug generation** — derive URL-safe slug from category name (e.g., "Clothing & Textiles" → `clothing-textiles`) and store on ProductCategory (migration required)
- **Breadcrumbs** on product pages — "Home → [Category] → [Product Name]" using category slug; add `BreadcrumbList` JSON-LD schema markup
- **Home page update** — add category grid/tiles to home page so users can browse without scanning
- **Static metadata per category page** — `generateMetadata` sets og:title, og:description, og:url for each category (e.g., "Clothing & Textiles — True manufacturing cost breakdowns")
- **JSON-LD structured data** on category pages — `ItemList` schema referencing top products; helps Google index the content
- **`sitemap.xml` entry** for every category page — use Next.js `sitemap.ts` to generate dynamically
- **Unit/integration tests** — category slug derivation, aggregate stat computation, sitemap output

### Should-Have

- **Category description copy** — unique 2–3 sentence blurb per category stored in a seed file (not in DB for v1); used on the category landing page for SEO value
- **"Most marked-up" highlight card** — featured product at the top of each category page with a "🔥 Highest markup in this category" badge
- **Sort/filter controls** — allow sorting by: highest markup, lowest markup, most recently added; filter by whether estimate exists
- **Related categories** — at the bottom of each category page, show 2–3 sibling categories

### Won't-Have (v1)

- User-generated category suggestions or corrections
- Subcategory pages (e.g., "Clothing > T-Shirts") — deferred to Goal 8
- Infinite scroll — use pagination or "load more" for simplicity
- Category-level price trend charts — deferred to a later goal
- Search within category — the existing search covers this

---

## Acceptance Criteria

- [ ] `/categories` renders all ProductCategories with product count and average markup
- [ ] `/category/[slug]` renders for every seeded category; 404 for unknown slugs
- [ ] Each category page shows at least: category name, description, avg markup, product list sorted by markup desc
- [ ] Product list shows: product name, image (if available), retail price, estimated cost, markup % — all pulled from existing CostBreakdowns
- [ ] Products without a CostBreakdown are either excluded from the list or shown with an "estimate pending" state (not a broken card)
- [ ] Breadcrumbs appear on `/product/[id]` pages with correct JSON-LD markup
- [ ] Home page has a category grid linking to `/category/[slug]` for each category
- [ ] `sitemap.xml` includes a `<url>` entry for every category page
- [ ] `generateMetadata` returns unique og:title and og:description per category
- [ ] Category slug is derived correctly and stored (migration passes, seed re-runs cleanly)
- [ ] Pages are statically generated (ISR or SSG preferred) — not purely SSR
- [ ] TypeScript compiles clean
- [ ] Lighthouse SEO score ≥ 90 on a category page

---

## Technical Notes

- **Tech stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL
- **Static generation:** Use `generateStaticParams` on `/category/[slug]/page.tsx` to pre-generate all category pages at build time; use ISR (`revalidate = 3600`) so new products appear without full redeploy
- **Aggregate stat query:** `SELECT AVG(markupPercent), MAX(markupPercent) FROM CostBreakdown WHERE product.categoryId = ?` — add to a `CategoryStatsService` or inline in the page server component
- **Slug migration:** Add `slug String @unique` to `ProductCategory` in Prisma schema; generate from name in migration seed (`kebabCase(name)`)
- **Category descriptions (v1):** Store in `src/data/category-descriptions.ts` as a plain object keyed by slug — no DB table needed for v1
- **New pages/components:**
  - `app/categories/page.tsx` — category grid
  - `app/category/[slug]/page.tsx` — category landing page
  - `src/components/molecules/CategoryCard.tsx` — card for category grid
  - `src/components/molecules/ProductCard.tsx` — compact card for product lists (reusable in Goal 7+)
  - `src/components/atoms/Breadcrumb.tsx` — breadcrumb with JSON-LD
- **Sitemap:** `app/sitemap.ts` — fetch all category slugs from DB, return `MetadataRoute.Sitemap`
- **No new API keys or external services needed**

---

## Open Questions

1. **Category descriptions:** Who writes the 2–3 sentence blurb per category for launch? Needs to be unique content for SEO value — can be AI-drafted but should be reviewed. How many categories are seeded?

2. **Pagination vs. load more:** Paginated routes (`/category/[slug]?page=2`) are better for SEO (each page is indexable). "Load more" is better UX. Which matters more here given AdSense approval is the near-term goal?

3. **ISR revalidation window:** 1 hour (`revalidate = 3600`) means new products and updated estimates appear within an hour of cache miss. Is that acceptable, or should it be shorter (e.g., 5 minutes)?

4. **Minimum product count for AdSense:** AdSense reviewers look for "substantial content." How many products does TruePrice have seeded by Goal 6? If fewer than ~20 products with estimates, category pages may be thin — should we seed more dummy products or wait until real data accumulates?
