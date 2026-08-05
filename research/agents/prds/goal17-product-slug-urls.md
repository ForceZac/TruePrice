# PRD: Goal 17 — Human-Readable Product Slug URLs

- **Goal reference:** Goal 17 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 14 (SEO & Core Web Vitals), Goal 8 (Data Expansion)
- **Proposed by:** PM Run #173 (2026-08-05)

---

## Problem Statement

Every product page currently lives at `/product/123` — a numeric ID with zero semantic meaning. This hurts TruePrice in three compounding ways:

1. **SEO.** Google uses URL structure as a ranking signal. `/product/apple-airpods-pro-2nd-gen` ranks higher than `/product/1847` for long-tail product queries. Goal 14 (SEO) laid the metadata foundation; human-readable URLs are the next step.

2. **Social sharing.** When a user shares a link, the URL appears in the preview. "trueprice.app/product/47" conveys nothing. "trueprice.app/product/apple-airpods-pro-2nd-gen" is self-describing and more likely to get clicked.

3. **Future-proofing.** The sitemap (Goal 14) currently lists numeric URLs. As TruePrice scales and products get discovered via search, slug URLs make the site more navigable and trustworthy. Q14-3 explicitly deferred slug migration to a future goal — this is it.

This is a high-leverage, low-risk change: the data model is largely in place (products have names and brands), and the migration is straightforward with proper redirect handling.

---

## User Stories

**US-1 — Shareable product links that explain themselves**
As a user who wants to share a cost breakdown on social media, I want the link to include the product name, so my followers know what they're clicking before the page loads.

**US-2 — Better search engine discoverability**
As a new user searching Google for "how much does [product] actually cost to make," I want TruePrice's product page to appear with a descriptive URL in the search result, so I'm more likely to click it over a competitor result.

**US-3 — Backward compatibility for existing shared links**
As a user who shared a numeric URL last month, I want that link to still work, so I don't get a 404 and neither does anyone I shared it with.

**US-4 — Consistent slug display in category pages and comparison**
As a user browsing category pages or the comparison tray, I want all product links to use slug format, so the experience feels consistent and polished.

---

## Requirements

### Must-Have

- Add `slug` field to `Product` model (unique, non-null string, e.g., `apple-airpods-pro-2nd-gen`)
- Generate slugs from `brand + name`: lowercase, whitespace → hyphens, remove special chars, truncate at 80 chars, append `-[id]` suffix if slug already exists in DB (deduplication)
- Prisma migration to populate `slug` for all existing products
- New slug-based route: `/product/[slug]` (replaces `/product/[id]`)
- HTTP 301 redirect: `/product/[id]` → `/product/[slug]` for all numeric IDs
- `ProductService` updated: add `getBySlug(slug)`, update `getAllProductIds()` → `getAllProductSlugs()` for sitemap
- Sitemap (`src/app/sitemap.ts`) updated to emit slug-based URLs
- All internal links (category pages, comparison tray, search results, recently-viewed, watchlist) updated to use slug URLs
- Canonical `<link>` tags already use the slug URL (via metadata in the product page)
- `tsc --noEmit` clean; all existing tests pass; new tests cover slug generation logic and redirect behavior

### Should-Have

- Slug visible in `AdminCoverage` page alongside product ID (for operator use)
- Slug generation utility function extracted to `src/lib/slugify.ts` for reuse

### Won't Have (v1)

- User-editable slugs (editorial control is acceptable for v1; slugs are auto-generated)
- Slug history table (if a product is renamed, the old slug redirects via the numeric fallback)
- Non-ASCII slug support (international product names transliterated to ASCII for URL safety)

---

## Acceptance Criteria

- [ ] `Product` table has `slug` column (unique, non-null) after migration
- [ ] All existing products have auto-generated slugs after migration runs
- [ ] `GET /product/[slug]` returns the product page with status 200
- [ ] `GET /product/[id]` (numeric) returns 301 redirect to `/product/[slug]`
- [ ] Sitemap contains slug-format URLs (not numeric IDs)
- [ ] All internal links across the app use slug format
- [ ] Two products whose `brand + name` would generate the same slug get distinct slugs (e.g., `apple-airpods-pro` and `apple-airpods-pro-2`)
- [ ] `tsc --noEmit` passes clean
- [ ] New unit tests cover: slug generation, deduplication, `getBySlug()`, 301 redirect logic
- [ ] Playwright e2e confirms: navigating to a numeric ID URL redirects to slug URL and product page loads

---

## Technical Notes

- **Slug generation:** `slugify(brand + '-' + name)` → strip non-alphanumeric except hyphens, collapse repeated hyphens, lowercase, truncate at 80 chars. Implement as `src/lib/slugify.ts`. Called in `ProductService` at product creation and in the seed migration.
- **Migration strategy:** Prisma migration adds `slug` column as nullable, then a seed step populates all slugs, then a second migration sets `NOT NULL`. This avoids a blocking constraint on the first migration if the table is large.
- **Redirect implementation:** Next.js App Router supports `redirect()` in server components and `permanentRedirect()` for 308 (preferred) or a `next.config.js` redirect rule for 301. Implement as a server component redirect at `src/app/product/[id]/page.tsx` (numeric pattern) that calls `ProductService.getSlugById(id)` and redirects.
- **Routing coexistence:** Both `/product/[slug]` and `/product/[id]` routes exist temporarily during the migration window. After confirming all links are updated, the numeric route becomes redirect-only.
- **SoC:** Slug generation belongs in `ProductService`. No slug logic in API routes or components.
- **Sitemap:** `getAllProductSlugs()` replaces `getAllProductIds()` in `CategoryService` or `ProductService` (whichever owns the sitemap data). Update `src/app/sitemap.ts` accordingly.

---

## Open Questions

**Q17-1: Slug for user-submitted products**
When a user submits a product (Goal 15), the `SubmissionService` creates the `Product` record on approval. Should `ProductService.create()` auto-generate and attach the slug at creation time, or should `SubmissionService` call `slugify()` explicitly before calling `ProductService`?
- Suggested default: auto-generate in `ProductService.create()` so slug generation is never forgotten, regardless of which code path creates the product.
- **Owner:** Dev | **Priority:** Must decide before implementation

**Q17-2: Slug update on product rename**
If an admin or the seed updates a product's name or brand, should the slug automatically regenerate? If it does, any existing links to the old slug break (no redirect exists for old slugs, only numeric IDs).
- Suggested default: slugs are immutable once set. If a product is significantly renamed, a dev manually updates the slug and adds a redirect in `next.config.js`.
- **Owner:** Dev | **Priority:** Low — edge case for v1
