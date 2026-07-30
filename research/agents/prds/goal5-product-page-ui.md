# PRD: Goal 5 — Product Page & Cost Breakdown UI

- **Goal reference:** Goal 5 — Product Page & Cost Breakdown UI (roadmap: implementation-roadmap-v2.md)
- **Status:** Draft
- **Priority:** P1
- **Depends on:** Goal 4 (Cost Estimation Engine)
- **Blocks:** Goal 6 (Category Browsing), Goal 9 (Comparison & Social)

---

## Problem Statement

After Goals 1–4, TruePrice can scan a barcode, look up a product, and compute a cost breakdown — but the user sees a bare product detail page with just name, brand, and ingredients. There's no visual representation of the cost breakdown, no markup visualization, and nothing shareable. 

The product page is the primary destination in the app and the thing users will share, screenshot, and return to. If it doesn't look compelling, none of the underlying data matters. Goal 5 turns the engine (Goal 4) into an experience.

---

## User Stories

1. **As a user who just scanned a product**, I want to land on a page that immediately tells me what I care about: retail price, estimated true cost, and markup percentage — so I understand the core insight without reading a wall of text.

2. **As a curious user**, I want to drill into the cost breakdown — see the material costs (cotton: $1.20, polyester: $0.40), labor ($0.90), overhead ($0.50), shipping ($1.00) — broken down visually so I understand where each dollar comes from.

3. **As a user who wants to share this with a friend**, I want a "share" button that copies a link or generates a share card (OG image) so they can see the breakdown without installing anything.

4. **As a user on a mobile phone**, I want the page to be fast, scrollable, and readable on a small screen — the chart should be touch-friendly, not a desktop-only data grid.

5. **As a skeptical user**, I want to see the confidence score and an explanation of how the estimate was derived — so I trust the number rather than dismiss it as made up.

6. **As a user whose product has a low-confidence estimate**, I want to see a clear "low confidence" badge and a short explanation (e.g., "we couldn't find material composition data for this product") rather than a misleading precise number.

---

## Requirements

### Must-Have

- **Cost breakdown visualization** — stacked bar chart or donut chart showing: Materials / Labor / Overhead / Shipping / Markup. Use Recharts (already installed).
- **Key stats above the fold** on mobile: retail price, estimated cost to make, markup %. These three numbers are the hook.
- **Material cost list** — expandable section showing each material with its weight, commodity price, and contribution to total cost
- **Confidence indicator** — badge (High / Medium / Low) with expandable explanation of why
- **Methodology disclosure** — collapsible section showing how the estimate was computed (the `methodology` string from CostBreakdown)
- **Share button** — at minimum, copy link to clipboard. OG meta tags for rich link previews.
- **"Trigger estimate" button** — if no CostBreakdown exists yet (404 from Goal 4 endpoint), show a button that POSTs to trigger estimation and polls for the result
- **TanStack Query integration** — use `useQuery` to fetch estimate, `useMutation` to trigger estimation; skeleton loading states while computing
- **Responsive design** — mobile-first; chart must be readable at 375px width
- **Error states** — graceful handling of: product not found, estimate failed, estimate still computing

### Should-Have

- **"How is this calculated?" modal** — educational overlay explaining the methodology in plain English (not just the raw methodology string)
- **Retail price comparison line** on the chart — visual line or marker showing where retail sits relative to estimated cost
- **Price freshness indicator** — "commodity prices as of [date]" with staleness warning if prices are older than 48 hours
- **Product image** — display product image if available from Open Food Facts/UPCitemdb (using next/image with existing remotePatterns)

### Won't-Have (v1)

- Social features (comments, likes, user-submitted corrections) — Goal 9
- Side-by-side product comparison — Goal 9
- Historical price trend chart — later goal
- Custom markup calculation (user changes retail price) — later goal
- Printed / PDF export — later goal

---

## Acceptance Criteria

- [ ] `/product/[id]` page shows: product name, brand, image (if available), retail price, and estimated cost to make
- [ ] Markup percentage is displayed prominently above the fold on mobile (375px)
- [ ] Cost breakdown chart renders correctly (stacked or donut) with labeled segments: Materials, Labor, Overhead, Shipping
- [ ] Material cost detail list shows each material: name, estimated weight/kg, commodity price (cents/kg), and subtotal
- [ ] Confidence badge (High / Medium / Low) is visible with an expandable explanation
- [ ] If no estimate exists, page shows "Calculate Cost" button that triggers `POST /api/products/[id]/estimate` and polls until done
- [ ] Loading skeleton is shown while estimate is computing (not a blank page or spinner-only)
- [ ] Share button copies the canonical product URL to clipboard; page has correct OG title/description/image meta tags
- [ ] All product images use `next/image`; no raw `<img>` tags
- [ ] Page passes Lighthouse mobile performance score ≥ 70 on a throttled connection
- [ ] TypeScript compiles clean
- [ ] Vitest component tests: CostBreakdownChart renders correct segments; ConfidenceBadge shows correct tier; skeleton renders during loading

---

## Technical Notes

- **Existing foundation:** `/product/[id]` page already exists from Goal 3 with basic product info. This goal enhances it.
- **Tech stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Query — all already installed
- **Chart library:** Recharts (already in package.json). Use `<ResponsiveContainer>` to handle mobile width.
- **New components to create** (in `src/components/`):
  - `molecules/CostBreakdownChart.tsx` — Recharts stacked bar or pie
  - `molecules/MaterialCostList.tsx` — expandable list of per-material costs
  - `molecules/ConfidenceBadge.tsx` — High/Medium/Low badge + expandable reason
  - `molecules/EstimateSkeleton.tsx` — loading state while computing
  - `atoms/ShareButton.tsx` — clipboard copy + OG link generation
- **TanStack Query hooks** (in `src/hooks/`):
  - `useCostBreakdown(productId)` — GET /api/products/[id]/estimate
  - `useTriggerEstimate(productId)` — mutation for POST /api/products/[id]/estimate
- **OG image:** Use Next.js Metadata API (`generateMetadata`) to set og:title, og:description. Defer dynamic OG image generation (opengraph-image.tsx) to a later iteration.
- **No new API keys or services needed** — all data comes from Goal 4's endpoint

---

## Open Questions

1. **Chart type — stacked bar vs. donut:** Stacked bar is easier to read with 4–5 segments and shows absolute values clearly. Donut is more visually striking on mobile. Which does Zach prefer?

2. **"Calculate Cost" flow:** When no estimate exists, should the page auto-trigger estimation on load, or wait for a user button press? Auto-trigger is smoother UX but could cause unnecessary compute on bot/crawler visits.

3. **Markup framing:** Should we show markup as a percentage ("marked up 400%") or as a multiplier ("retail is 5× the cost to make")? Multiplier is more visceral for high-markup products.

4. **What to show when confidence is "low" (< 0.3)?** Options: (a) show the estimate with a prominent warning, (b) hide the chart and only show "insufficient data", (c) show category averages with a disclaimer. Option (a) seems most useful but could mislead.

5. **Share card format:** Plain link with OG tags is sufficient for v1. Does Zach want a custom OG image generation route (Next.js `opengraph-image.tsx`) or just text meta tags for launch?
