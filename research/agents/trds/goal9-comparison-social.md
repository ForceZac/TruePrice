# TRD: Goal 9 — Product Comparison & Social Features

- **status:** `done`
- **goal:** `Goal 9`
- **priority:** `P2`
- **branch:** `task/goal9-comparison-social`
- **estimated_effort:** `Large`
- **depends_on:** `Goal 5`

## Description

Add a product comparison tool, dynamic OG images for social sharing, a leaderboard of the most marked-up products, and Web Share API integration to drive engagement and organic distribution.

## Acceptance Criteria

- [ ] `/compare?a=<id>&b=<id>` renders for any two valid product IDs with estimates; 400/redirect for missing or invalid IDs; cold state (no params) shows an informational prompt
- [ ] Compare page shows both products' cost breakdowns side-by-side; delta callout highlights which has the higher markup and by how much
- [ ] "Add to compare" button exists on every product page; clicking it stages the product in the CompareStore; a floating CompareTray appears with staged product(s)
- [ ] CompareTray has a "Clear" button and a "Compare" button; max 2 products enforced (third add replaces oldest); "Compare" navigates to `/compare?a=...&b=...`
- [ ] `/api/og/product/[id]` returns a valid 1200×630 PNG with product name, markup multiplier, estimated cost, and retail price
- [ ] `/api/og/compare` returns a valid 1200×630 PNG with both products' key stats
- [ ] Product page `og:image` meta uses `/api/og/product/[id]` endpoint
- [ ] Compare page `og:image` meta uses `/api/og/compare?a=<id>&b=<id>` endpoint
- [ ] Share button on product page triggers native Web Share API on mobile; falls back to clipboard copy on desktop
- [ ] `/leaderboard` renders top 20 products by `markupPercent DESC` from CostBreakdown; cards show product name, category, markup multiplier, estimated cost, retail price, and confidence badge
- [ ] Leaderboard uses `export const revalidate = 3600`; linked from home page and footer
- [ ] Compare page includes `ItemList` JSON-LD structured data
- [ ] DB index on `CostBreakdown.markupPercent DESC` added
- [ ] All existing tests pass; TypeScript compiles clean

## Tasks

### 1. Prisma Schema — Add markupPercent Index
- Add `@@index([markupPercent(sort: Desc)])` to `CostBreakdown` model
- Create migration `20260730000003_goal9_leaderboard_index`

### 2. Compare Store (`src/store/compareStore.ts`)
- Zustand store with `persist` middleware (localStorage key: `trueprice-compare`)
- State: `items: CompareItem[]` (max 2)
- `CompareItem`: `{ id: string; name: string }`
- Actions: `addItem`, `removeItem`, `clearItems`
- `addItem` replaces oldest when at cap of 2

### 3. ShareButton Atom Update (`src/components/atoms/ShareButton.tsx`)
- Try `navigator.share({ title, text, url })` first
- Fall back to `navigator.clipboard.writeText(url)`

### 4. CompareTray Molecule (`src/components/molecules/CompareTray.tsx`)
- Client component; uses `useCompareStore`
- Fixed bottom bar, hidden when `items.length === 0`
- Shows product name chips; individual remove (×) per chip
- "Clear" button clears all
- "Compare" button (disabled until 2 items) navigates to `/compare?a=...&b=...`

### 5. LeaderboardCard Molecule (`src/components/molecules/LeaderboardCard.tsx`)
- Props: rank, id, name, category, markupPercent, totalCostCents, retailPriceCents, confidence
- Link wraps to `/product/[id]`
- Shows rank number, product name, markup multiplier, cost vs retail

### 6. Leaderboard Page (`src/app/leaderboard/page.tsx`)
- Server component; `export const revalidate = 3600`
- Query: top 20 CostBreakdown ordered by `markupPercent DESC` with `product` relation
- Map to LeaderboardCard list

### 7. Compare Page (`src/app/compare/page.tsx`)
- Server component
- Read `a`, `b` from `searchParams`; cold state if missing
- Fetch both products + breakdowns; 404 if either missing
- Side-by-side layout with delta highlight
- `ItemList` JSON-LD; `generateMetadata` with OG image

### 8. OG Image Routes
- `src/app/api/og/product/[id]/route.tsx` — fetch product + estimate; return `ImageResponse`
- `src/app/api/og/compare/route.tsx` — fetch two products; return side-by-side `ImageResponse`
- Both: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`

### 9. Wire Into Product Page
- Update `generateMetadata` in `/product/[id]/page.tsx` to reference `/api/og/product/[id]`
- Add `<AddToCompareButton>` client atom that calls `useCompareStore.addItem`
- Import and render `<CompareTray>` in layout or product page (render globally via layout)

### 10. Home Page & Footer Updates
- Home page: add a "Hall of Shame" link section below categories
- Footer: add Leaderboard link

## Technical Notes

- `ImageResponse` imported from `next/og` (bundled in Next.js 16, no extra install needed)
- No new DB migrations beyond the index
- No new external dependencies needed (Zustand persist middleware is already included)
- Leaderboard query uses Prisma `orderBy: { markupPercent: 'desc' }` with `take: 20`
- CompareTray must be rendered in a Client Component wrapper (not the root layout, which is a Server Component) — add it to `QueryProvider` wrapper or a new `ClientProviders` wrapper

## Resolved Open Questions

- **Q9-1 (OG image design):** Option A — bold text card with product name + markup multiplier in large type
- **Q9-2 (Compare cold state):** Show informational prompt: "Add two products to compare from any product page"
- **Q9-3 (Leaderboard confidence filter):** Show all products with a confidence badge; no filtering
- **Q9-4 (Copy-to-image):** Deferred to Goal 10+
