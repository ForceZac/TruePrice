# TRD: Goal 12 — Enhanced Search & Discovery

- **status:** `done`
- **goal:** `Goal 12`
- **priority:** `P2`
- **branch:** `task/goal12-enhanced-search-discovery`
- **estimated_effort:** `Large`
- **depends_on:** `Goal 5, Goal 8, Goal 9`

## Description

Improve top-of-funnel discovery with search autocomplete, view-count-based trending, a "Most Shocking Markups" homepage section, markup-range filters on category pages, and recently-searched quick access. Users get faster paths to interesting content; the site gets engagement signal data.

## Acceptance Criteria

- [ ] Typing ≥2 chars in the search bar shows a dropdown within 350ms (debounced 250ms) with up to 6 product suggestions
- [ ] Clicking a suggestion navigates to the correct product page; keyboard arrow keys + Enter also work
- [ ] Each product page visit increments `Product.viewCount` in the DB; a second visit from the same browser within 30 minutes does NOT increment it again (cookie dedup)
- [ ] `/trending` page loads and shows up to 20 products by 7-day view count; uses `export const revalidate = 3600`
- [ ] Products with top-20 view counts in the last 7 days display a "Trending" badge on product cards
- [ ] Homepage has a "Most Shocking Markups" section showing 3 HIGH-confidence products (highest markup multiplier); uses `revalidate = 3600`
- [ ] Category pages have markup-range filter badges ("Under 3×", "3–7×", "Over 7×") that filter the visible product list client-side
- [ ] Up to 5 recent searches are surfaced in the search dropdown when the input is empty (localStorage; authenticated users sync to DB)
- [ ] All new API routes return in <300ms at p95 against the seeded dataset
- [ ] TypeScript compiles clean; all existing tests pass; ≥8 new tests covering autocomplete, view count increment, dedup logic, trending sort, markup filter

## Tasks

### 1. Prisma Schema

- Add `viewCount Int @default(0)` to `Product` model
- Add `recentSearches String[]` to `User` model
- Create migration `20260801000001_goal12_view_count_recent_searches`

### 2. DiscoveryService (`src/services/DiscoveryService.ts`)

- `getTrending(limit: number, windowDays: number): Promise<TrendingProduct[]>` — query products by viewCount desc where updatedAt or viewCount was touched in last N days
- `getMostShocking(limit: number): Promise<ShockingProduct[]>` — query CostBreakdown with HIGH confidence, order by markupPercent desc
- `TrendingProduct`: `{ id, name, category, markupPercent, viewCount, confidence }`
- `ShockingProduct`: `{ id, name, category, markupPercent, totalCostCents, retailPriceCents, confidence }`
- No business logic in routes; all queries go through DiscoveryService

### 3. ProductService — autocomplete + view count

- Update `searchProducts(query, limit, autocomplete)` — when `autocomplete=true`, return slim projection `{ id, name, category }` only, `limit` defaults to 6
- Add `incrementViewCount(productId: string): Promise<void>` — increments `viewCount` by 1; does nothing if product not found

### 4. UserService — recent searches

- Add `saveRecentSearch(userId: string, query: string): Promise<void>` — prepend to `recentSearches`, keep last 10 (server stores 10, client shows 5)
- Add `getRecentSearches(userId: string): Promise<string[]>` — return `recentSearches` array

### 5. API Route Updates

- `GET /api/products/search?q=&autocomplete=true&limit=6` — if `autocomplete=true`, call `searchProducts(q, limit, true)` and return slim projection
- `POST /api/products/[id]/view` — no auth required; reads `viewed_<id>` cookie; if absent, calls `ProductService.incrementViewCount(id)` and sets cookie (`maxAge: 1800`, `httpOnly: true`, `sameSite: lax`)
- `GET /api/account/recent-searches` — auth required; returns `UserService.getRecentSearches(userId)`
- `POST /api/account/recent-searches` — auth required; body `{ query: string }`; calls `UserService.saveRecentSearch(userId, query)`

### 6. SearchInput Rewrite (`src/components/molecules/SearchInput.tsx`)

- Add debounced autocomplete: on keyup, if value ≥2 chars, call `GET /api/products/search?q=&autocomplete=true&limit=6` after 250ms delay; show dropdown
- Dropdown items: product name + category; click → navigate to product page; also call `POST /api/account/recent-searches` for auth users
- When input is empty: show up to 5 recent searches from localStorage (key: `tp-recent-searches`) as quick chips; auth users also fetch from `GET /api/account/recent-searches`
- Keyboard: ArrowDown/ArrowUp to navigate dropdown, Enter to select, Escape to close
- Clicking outside the dropdown closes it
- After submit, save query to localStorage recent searches (always) + DB (if auth)

### 7. `/trending` Page (`src/app/trending/page.tsx`)

- `export const revalidate = 3600`
- Call `DiscoveryService.getTrending(20, 7)`
- Show cards: rank, product name, category, markup multiplier, view count
- Link to product pages
- Breadcrumb: Home → Trending
- Add link from home page footer / Hall of Shame section
- `generateMetadata` with title "Trending Products — TruePrice"

### 8. Homepage "Most Shocking Markups" section

- Add after the search/hero section, before categories
- Call `DiscoveryService.getMostShocking(3)` — server component, respects `revalidate = 3600`
- Show 3 product cards: name, markup multiplier (e.g. "6.2×"), category, link to product page
- Heading: "Most Shocking Markups"
- Only render if `getMostShocking` returns ≥1 product

### 9. Category Page Markup Filter (`src/components/molecules/CategoryMarkupFilter.tsx`)

- Client component wrapping the product list section
- Filter badges: "All", "Under 3×" (markupPercent < 300), "3–7×" (300 ≤ markupPercent < 700), "Over 7×" (markupPercent ≥ 700)
- Applied client-side from the fetched product data (no extra API calls)
- Products without markupPercent are always shown under "All"
- Active filter badge is highlighted

### 10. Trending Badge on Product Cards

- In `CategoryProductCard`, if `product.isTrending` is true, show a small "Trending" badge
- `CategoryProductItem` type: add optional `isTrending?: boolean`
- `DiscoveryService.getTrendingIds(windowDays)` returns a `Set<string>` — used by `getCategoryProducts` to annotate products

## Technical Notes

- `markupPercent` in DB is stored as a float (e.g. 620 = 6.2×). Multiplier = markupPercent / 100.
- Cookie name for view dedup: `vw_<productId>` (short to stay within cookie size limits)
- `recentSearches` on `User` is `String[]` (Postgres text array). `saveRecentSearch` prepends + slices to last 10 server-side.
- No new npm packages required; TanStack Query already installed for client data fetching
- `DiscoveryService.getTrendingIds` is called once per category page render (not per product); returns `Set<string>` so lookup is O(1)

## Resolved Open Questions

- **Q12-1 (session dedup):** Cookie (server-authoritative, works without JS)
- **Q12-2 (trending window):** 7-day rolling window (configurable via function param; default 7)
- **Q12-3 (markup tiers):** Under 3× / 3–7× / Over 7× (stored as markupPercent < 300 / 300–700 / ≥700)
