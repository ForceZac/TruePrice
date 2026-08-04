# PRD — Goal 12: Enhanced Search & Discovery

**Goal reference:** Goal 12 — Enhanced Search & Discovery
**Depends on:** Goal 5 (Product Page UI), Goal 8 (Data Expansion), Goal 9 (Comparison & Social)
**Written:** 2026-08-01 (PM Run #141)

---

## Problem Statement

The current search bar does a straight text match — no autocomplete, no suggestions, no ranking by relevance. Users who arrive without a specific product in mind have no way to browse by "biggest markups" or "most popular" outside of the leaderboard (which is comparison-focused). The homepage is static: new visitors land and see nothing engaging unless they already know what to search for.

This limits top-of-funnel discovery. Users who should be drawn in by "shock factor" content — products with 10× markup — never see them unless they already know to look.

---

## User Stories

- **Visitor browsing:** "I heard TruePrice shows crazy markups — I want to see the most shocking ones right now without typing anything."
- **Searcher:** "I start typing 'nik' and want to see Nike-related products immediately without hitting Enter."
- **Category browser:** "I'm on the Electronics page and want to filter to only products with over 5× markup."
- **Return user:** "I want to quickly re-open a product I searched for last week."
- **Mobile sharer:** "I want to share 'this week's top 5 shocking markups' with my group chat."

---

## Requirements

### Must-Have

- **Search autocomplete** — As the user types in the search bar (≥2 chars), show a dropdown of up to 6 matching product names. Debounced 250ms. Keyboard-navigable. Click navigates to product page.
- **View count tracking** — Increment a `viewCount` field on `Product` each time `GET /api/products/[id]` is called. Session-dedup: count at most once per session per product (use a cookie or localStorage key with 30-min TTL).
- **Trending Products page** (`/trending`) — Shows the 20 products with highest view count over the last 7 days. Cards show product name, markup multiplier, category. Refreshed hourly via ISR.
- **Homepage "Most Shocking Markups" section** — A new section below the search bar on the homepage featuring the top 3 products by markup multiplier (minimum HIGH confidence). Static props, refreshed every hour via `revalidate`.

### Should-Have

- **Markup range filter on category pages** — A filter strip at the top of `/category/[slug]` pages: "Under 3×", "3–7×", "Over 7×" quick-filter badges. Applied client-side from already-fetched data (no extra API calls).
- **Recently searched** — Up to 5 recent search queries stored in `localStorage`. Shown as quick chips in the autocomplete dropdown when the input is empty. Authenticated users: sync to DB via `UserService.saveRecentSearch()`.
- **"Trending this week" badge** — Products with top-20 view counts in the last 7 days display a "Trending" badge on product cards and product page header.

### Won't Have (this goal)

- Full-text product description search (search on name only for v1)
- External search engine integration (Algolia, Meilisearch, Typesense)
- Trending notifications / alerts for trending products
- Multi-keyword / boolean search operators

---

## Acceptance Criteria

1. Typing ≥2 chars in the search bar shows a dropdown within 350ms (debounced) with up to 6 product suggestions.
2. Clicking a suggestion navigates to the correct product page.
3. The `/trending` page loads and shows at least 5 products (provided the DB has products with view counts).
4. Each product page visit increments `Product.viewCount` in the DB. A second visit from the same browser within 30 minutes does NOT increment it again.
5. Homepage has a "Most Shocking Markups" section showing 3 HIGH-confidence products.
6. Category pages have markup-range filter badges that correctly filter the visible product list.
7. Up to 5 recent searches are surfaced in the search dropdown when the input is empty.
8. All new API routes return in <300ms at p95 against the seeded dataset.
9. TypeScript compiles clean. All existing tests pass. ≥8 new tests covering: autocomplete debounce, view count increment, dedup logic, trending sort, markup filter.

---

## Technical Notes

- **Autocomplete:** Extend `GET /api/products/search` to accept `?limit=6&autocomplete=true`. Returns `{ id, name, category }` only (no full breakdown). `ProductService.search()` already exists — just add a slim projection.
- **View count:** Add `viewCount Int @default(0)` to `Product` in `prisma/schema.prisma`. Migration required. Increment via `prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } })` inside `ProductService.getById()`. Session dedup: check `req.cookies['viewed_${id}']`; if absent, increment and set cookie with 30-min `maxAge`.
- **DiscoveryService** (new): `src/services/DiscoveryService.ts` — owns `getTrending(limit, windowDays)` and `getMostShocking(limit)`. No business logic in routes.
- **Recently searched (authenticated):** Add `recentSearches String[]` to `User` model (or a separate `RecentSearch` table if search frequency warrants it). `UserService.saveRecentSearch(userId, query)` keeps last 10 server-side; client shows top 5.
- **ISR revalidation:** `/trending` and homepage section use `export const revalidate = 3600` (1 hour).
- **All client data fetching via TanStack Query** — no raw fetch in components.
- **Env vars:** No new env vars required.

---

## Open Questions

**Q12-1: View count session dedup strategy** — Cookie (works for non-JS) vs. `localStorage` (easier to check before API call). Cookie approach is server-authoritative; localStorage is faster but doesn't dedup across tabs. Recommendation: cookie.
- **Owner:** Zach | **Priority:** Decide before TRD is written

**Q12-2: Trending time window** — 7-day rolling window recommended. All-time favors old products; 7 days reflects current interest. Is 7 days right or should it be 30?
- **Owner:** Zach | **Priority:** Low (7-day default in TRD, can be configured via env var)

**Q12-3: Markup tier thresholds** — Proposed: Under 3× = "Standard Markup", 3–7× = "High Markup", Over 7× = "Shocking". Do these ranges match Zach's intuition about what shocks users?
- **Owner:** Zach | **Priority:** Design decision — affects homepage copy
