# TRD: Goal 6 — Category Browsing & Landing Pages

- **status:** `done`
- **goal:** `Goal 6`
- **priority:** `P1`
- **branch:** `task/goal6-category-browsing`
- **estimated_effort:** `Large`
- **depends_on:** `Goal 5`

## Description

Add category browsing to TruePrice so users can discover products by type without scanning. This
goal creates `/categories` (grid of all categories), `/category/[slug]` (SEO landing pages with
product lists sorted by markup), breadcrumbs on product pages, a category tile section on the home
page, and a sitemap that includes all category URLs. Pages use ISR (revalidate every hour) for
performance and SEO. This satisfies Google AdSense's content-richness requirement and creates
organic SEO entry points.

## Acceptance Criteria

- [ ] `/categories` renders all ProductCategories with product count and average markup
- [ ] `/category/[slug]` renders for every seeded category; 404 for unknown slugs
- [ ] Each category page shows: category name, description, avg markup, product list sorted by markup % desc
- [ ] Product list cards show: name, image (if available), retail price, estimated cost, markup %
- [ ] Products without a CostBreakdown are excluded or shown with "estimate pending" state
- [ ] Breadcrumbs appear on `/product/[id]` pages with correct JSON-LD BreadcrumbList markup
- [ ] Home page has a category grid linking to `/category/[slug]` for each category
- [ ] `sitemap.xml` includes a `<url>` entry for every category page
- [ ] `generateMetadata` returns unique og:title and og:description per category page
- [ ] Category slug already exists on ProductCategory schema (no new migration needed)
- [ ] Pages are statically generated with ISR (`revalidate = 3600`)
- [ ] TypeScript compiles clean
- [ ] Vitest tests: slug derivation utility, category stats, Breadcrumb renders correct JSON-LD

## Technical Notes

- `ProductCategory.slug` already exists in Prisma schema (added in Goal 1) — no migration needed
- Add `CategoryService` in `src/services/CategoryService.ts` for all category stats queries
- Category descriptions: `src/data/category-descriptions.ts` — keyed by slug
- New pages: `app/categories/page.tsx`, `app/category/[slug]/page.tsx`
- New components: `src/components/molecules/CategoryCard.tsx`, `src/components/atoms/Breadcrumb.tsx`
- Update `src/components/molecules/ProductCard.tsx` to accept optional markup/price info for category pages
- ISR: `export const revalidate = 3600` on both category pages
- JSON-LD: inline `<script type="application/ld+json">` in page components (per Next.js 16 guide)
- Sitemap: `app/sitemap.ts` — async, fetches all category slugs from DB

## Tasks

1. Create `src/data/category-descriptions.ts` — static descriptions keyed by slug
2. Create `src/services/CategoryService.ts` — `getAllCategories()`, `getCategoryBySlug()`, `getCategoryProducts(slug)`
3. Create `src/components/atoms/Breadcrumb.tsx` — breadcrumb nav with JSON-LD BreadcrumbList
4. Create `src/components/molecules/CategoryCard.tsx` — card for category grid
5. Update `src/components/molecules/ProductCard.tsx` — add optional `markupPercent` and `costCents` props
6. Create `app/categories/page.tsx` — static category grid (ISR)
7. Create `app/category/[slug]/page.tsx` — ISR category landing page with generateStaticParams
8. Update `app/product/[id]/page.tsx` — add breadcrumb using product's categoryId/slug
9. Update `app/page.tsx` — add category tiles section
10. Create `app/sitemap.ts` — include home, categories, and per-category URLs
11. Write Vitest tests for Breadcrumb, CategoryService slug logic, and category stats
