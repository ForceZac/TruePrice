# PRD: Goal 9 — Product Comparison & Social Features

- **Goal reference:** Goal 9 — Product Comparison & Social Features (roadmap: implementation-roadmap-v2.md)
- **Status:** Draft
- **Priority:** P1
- **Depends on:** Goal 5 (Product Page & Cost Breakdown UI)
- **Blocks:** nothing (growth/engagement layer; not a prerequisite for any current goal)

---

## Problem Statement

After Goals 1–7, TruePrice is useful — users can find out what something costs to make. But it's not yet shareable or sticky. The core loop ends at the product page: you see the breakdown, maybe you're surprised, and then you close the tab.

Virality for a tool like TruePrice is driven by moments of outrage and comparison: "This $200 hoodie costs $8 to make. Look how it compares to this $40 one." Without a comparison feature, users can only experience one product's markup at a time — there's no "aha" moment they can show a friend.

Similarly, the product page currently has no shareable asset. A tweet or Instagram story linking to a TruePrice product page shows a bland link preview. A dynamic OG image with the markup visualized ("5× markup — $8 to make, $200 retail") is a visual hook that drives click-through from social posts.

This goal adds the comparison tool, social sharing infrastructure, and a "leaderboard" — the highest-markup products across the site — to drive engagement and organic distribution.

---

## User Stories

1. **As a user looking at a product page**, I want to add a second product to compare side-by-side — so I can see whether the "expensive" version is actually more expensive to make, or just more marked up.

2. **As a user who is outraged by a markup**, I want to share the product page (or comparison) to Twitter/X or Instagram with a pre-built visual that includes the key numbers — so my friends immediately understand why I'm sharing it without clicking through.

3. **As a curious new visitor arriving from social media**, I want to land on a shareable comparison link (`/compare?a=<id>&b=<id>`) that shows both products' breakdowns side-by-side — so I get the full context without needing to navigate.

4. **As a user browsing the home page or category pages**, I want to see a "Hall of Shame" — the 10 most marked-up products across all categories — so I immediately understand what TruePrice is about and which products are worth outrage-clicking.

5. **As a returning user**, I want my recently viewed products to appear on the home page so I can pick up where I left off without re-scanning.

---

## Requirements

### Must-Have

- **Product comparison page** — `/compare?a=<productId>&b=<productId>` renders two products side-by-side with:
  - Cost breakdown for each (same visualization as the product page)
  - Delta highlight: which product has the higher markup %, by how much
  - "Add to compare" button on every product page (stores selection in localStorage or URL param)
  - Share button that copies the `/compare?a=...&b=...` URL to clipboard
- **Dynamic OG image generation** — `/api/og/product/[id]` and `/api/og/compare` endpoints that render a social card image using `@vercel/og` (Edge runtime). Content: product name, estimated cost, retail price, markup multiplier (e.g., "8× markup"). Used in `og:image` meta tag on product and compare pages.
- **"Add to compare" UX** — a persistent comparison tray (bottom-of-screen bar) that shows the 1–2 products currently staged for comparison; clears on navigation away or explicit dismiss. Maximum 2 products at a time.
- **Share button on product page** — native Web Share API on mobile; fallback to copy-link on desktop. Shares the product page URL with OG image populated.
- **"Hall of Shame" / leaderboard** — `/leaderboard` page showing the top 20 most-marked-up products across the site (by `markupPercent` on `CostBreakdown`). Updated via ISR (revalidate every hour). Linked from home page and nav.
- **Structured data on compare page** — `ItemList` JSON-LD referencing both products (helps Google index the comparison)

### Should-Have

- **Category comparison** — on the `/compare` page, add a third "category average" column so users can see how both products compare to what's typical in their category
- **Pre-built share text** — auto-populate the share dialog with pre-written copy: e.g., "This [Product] has an 8× markup — costs $8 to make, sells for $200. See the breakdown:" — editable before sending
- **Recently viewed** — store last 5 visited product IDs in localStorage; display as a "Recently Viewed" row on the home page
- **Social meta tags on category pages** — category pages already have static OG metadata (Goal 6); add dynamic OG image for category pages (`/api/og/category/[slug]`) showing the category name and avg markup stat
- **Copy-to-image button** — on the product page cost breakdown, a "Save as image" button that uses `html2canvas` or `dom-to-image` to capture the chart + numbers as a PNG; downloadable and shareable directly to Instagram Stories

### Won't-Have (v1)

- User accounts, saved comparisons, or history synced across devices
- Comparison of more than 2 products simultaneously
- Comments, ratings, or community content — defer to a later goal
- Email sharing or "send to a friend" features
- Twitter/X card App integration (deep link back to app) — standard og:image is sufficient
- Real-time comparison (live commodity price updates mid-session) — ISR cache is acceptable

---

## Acceptance Criteria

- [ ] `/compare?a=<id>&b=<id>` renders for any two valid product IDs with estimates; 400/redirect for missing or invalid IDs
- [ ] Compare page shows both products' cost breakdowns; delta bar or callout highlights which has the higher markup and by what %
- [ ] "Add to compare" button exists on every product page; clicking it stages the product; a comparison tray appears showing staged product(s); navigating to a second product and clicking "Compare" navigates to `/compare`
- [ ] Comparison tray has a "Clear" button and a "Compare" button; max 2 products at a time enforced
- [ ] `/api/og/product/[id]` returns a valid image (1200×630) with product name, markup multiplier, estimated cost, and retail price; used in `og:image` on the product page
- [ ] `/api/og/compare` returns a valid image (1200×630) with both products' key stats
- [ ] OG image appears correctly when product page URL is pasted into Twitter/X card validator and Slack
- [ ] Share button on product page triggers native Web Share API on mobile; copies URL to clipboard on desktop; copies without error
- [ ] `/leaderboard` renders top 20 products by markup %; cards show product name, category, markup % and multiplier, estimated cost, retail price
- [ ] `/leaderboard` is linked from the home page and the main nav
- [ ] Leaderboard uses ISR with `revalidate = 3600`; new products with estimates appear within 1 hour
- [ ] TypeScript compiles clean
- [ ] Existing product page Lighthouse performance score does not drop more than 5 points after OG image endpoint is added (endpoint is not loaded on page; only meta tag reference)

---

## Technical Notes

- **Tech stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL — same as prior goals
- **OG image generation:** Use `@vercel/og` (built on Satori). Runs at Edge runtime. Route: `app/api/og/product/[id]/route.tsx` and `app/api/og/compare/route.tsx`. Accept product IDs as path/query params, fetch from DB, render `ImageResponse`. Cache with `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.
- **Comparison tray state:** Use Zustand store (`compareStore`) — same pattern as existing stores. Persist to `localStorage` so the tray survives a page refresh within the session. Max 2 items; adding a third replaces the oldest.
- **Compare page URL:** `/compare?a=<productId>&b=<productId>` — server component that fetches both products + estimates from DB. Generate metadata with `generateMetadata` using both product names. OG image URL: `/api/og/compare?a=<id>&b=<id>`.
- **Leaderboard query:** `SELECT p.*, cb.markupPercent, cb.estimatedCostCents FROM CostBreakdown cb JOIN Product p ON cb.productId = p.id ORDER BY cb.markupPercent DESC LIMIT 20`. Run at build time + ISR. Add DB index on `CostBreakdown.markupPercent DESC` if not already present.
- **Web Share API fallback:** `if (navigator.share)` → use native; else → `navigator.clipboard.writeText(url)` with a "Copied!" toast. Wrap in a Client Component `<ShareButton>`.
- **No new DB migrations needed** — this goal is purely a UI/API layer on top of existing `Product` and `CostBreakdown` data.
- **New routes/components:**
  - `app/compare/page.tsx` — comparison page (server component)
  - `app/leaderboard/page.tsx` — leaderboard (server component, ISR)
  - `app/api/og/product/[id]/route.tsx` — OG image for product
  - `app/api/og/compare/route.tsx` — OG image for compare
  - `src/components/molecules/CompareTray.tsx` — floating tray (client component)
  - `src/components/atoms/ShareButton.tsx` — share/copy button (client component)
  - `src/components/molecules/LeaderboardCard.tsx` — card for leaderboard page
  - `src/store/compareStore.ts` — Zustand store for comparison state

---

## Open Questions

1. **OG image design:** What should the dynamic OG image look like? Options: (a) bold text card with product name + "8× markup" in large type, (b) mini version of the cost breakdown chart rendered in Satori, (c) stylized gradient with key stats. Option (a) is simplest and most readable at thumbnail size in social feeds. Confirm before building.

2. **Compare page cold state:** What should `/compare` show with no query params? Options: (a) redirect to home, (b) show a prompt to "Add two products to compare from any product page," (c) show a "popular comparisons" set of pre-built pairs. Option (b) is simplest; (c) is better for SEO/discovery.

3. **Leaderboard minimum estimate count:** The leaderboard is only interesting if the data is good. If most products have LOW-confidence estimates, the leaderboard rankings may be misleading. Should the leaderboard filter to `confidence = "HIGH"` or `"MEDIUM"` only, or show all products with a confidence badge? Recommend showing all with a badge, letting users decide.

4. **Recently viewed storage scope:** `localStorage` means recently-viewed products are device-specific and lost if the user clears storage. Is that acceptable for v1, or should we use a session cookie? localStorage is simpler and no server state needed; recommend accepting the limitation.

5. **`html2canvas` vs `dom-to-image` for "Save as image":** Both have known issues with cross-origin images and some CSS properties. Given TruePrice uses Tailwind (computed styles), `dom-to-image-more` (active fork) tends to work better. Should we include this at all in v1, or defer the copy-to-image feature until Goal 10+? It adds a non-trivial JS bundle and is a "should-have" — safe to cut if scope is tight.
