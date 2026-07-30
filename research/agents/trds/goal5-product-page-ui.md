# TRD: Goal 5 — Product Page & Cost Breakdown UI

- **status:** `ready`
- **goal:** `Goal 5`
- **priority:** `P1`
- **branch:** `task/goal5-product-page-ui`
- **estimated_effort:** `Large`
- **depends_on:** `Goal 4`

## Description

Enhance the product detail page (`/product/[id]`) with a full cost breakdown UI. After Goal 4
delivers the estimation engine, this goal turns the raw numbers into an experience: donut chart
of cost segments, material-level cost list, confidence badge, share button, and a "Calculate Cost"
trigger flow for products that haven't been estimated yet.

## Acceptance Criteria

- [ ] `/product/[id]` shows retail price, estimated cost to make, and markup % above the fold on mobile (375px)
- [ ] Donut chart (`CostBreakdownChart`) renders labeled segments: Materials, Labor, Overhead, Shipping
- [ ] `MaterialCostList` shows each material: name, weight/kg, commodity price (¢/kg), and subtotal
- [ ] `ConfidenceBadge` maps `confidenceScore` → High (≥ 0.7) / Medium (≥ 0.4) / Low (< 0.4) with expandable reason
- [ ] If no estimate exists (GET 404), page shows "Calculate Cost" button that POSTs to `/api/products/[id]/estimate` and polls GET until result arrives
- [ ] `EstimateSkeleton` renders during the loading/polling state (no blank page)
- [ ] Share button copies the canonical product URL to clipboard; page has `og:title` and `og:description` meta tags
- [ ] All product images use `next/image`; no raw `<img>` tags
- [ ] `useCostBreakdown(productId)` and `useTriggerEstimate(productId)` hooks wrap all API calls via TanStack Query
- [ ] `getEstimate` / `triggerEstimate` typed functions added to `src/lib/api.ts`
- [ ] TypeScript compiles clean
- [ ] Vitest tests: `CostBreakdownChart` renders correct segment count; `ConfidenceBadge` maps tiers correctly; `EstimateSkeleton` renders without error

## Technical Notes

- Server component `page.tsx` fetches the product server-side; hands product data to `ProductPageClient.tsx` (client component)
- `ProductPageClient` manages the estimate fetch/trigger flow via hooks
- Recharts `PieChart` + `ResponsiveContainer` — use `outerRadius="80%"` for mobile fit
- `"use client"` required on: `ProductPageClient`, `CostBreakdownChart`, `ShareButton`
- All monetary values displayed as dollars (divide cents by 100), formatted with `Intl.NumberFormat`
- Confidence tiers: High ≥ 0.7 (green), Medium ≥ 0.4 (yellow), Low < 0.4 (red)
- Polling strategy: `useTriggerEstimate` uses `useMutation` to POST; on success, `invalidateQueries` on the GET query — no manual interval polling needed since estimation is synchronous on the server
- OG metadata: use Next.js `generateMetadata` (already in place); extend with `openGraph` fields

## Tasks

1. Add `getEstimate` and `triggerEstimate` to `src/lib/api.ts`
2. Create `src/hooks/useCostBreakdown.ts` — `useCostBreakdown(productId)` + `useTriggerEstimate(productId)`
3. Create `src/components/atoms/ShareButton.tsx` — clipboard copy, client component
4. Create `src/components/molecules/CostBreakdownChart.tsx` — Recharts PieChart, `"use client"`
5. Create `src/components/molecules/ConfidenceBadge.tsx` — tier badge + collapsible reason
6. Create `src/components/molecules/MaterialCostList.tsx` — expandable per-material list
7. Create `src/components/molecules/EstimateSkeleton.tsx` — skeleton loading state
8. Create `src/app/product/[id]/ProductPageClient.tsx` — client orchestrator component
9. Update `src/app/product/[id]/page.tsx` — extend `generateMetadata` with OG fields; render `ProductPageClient`
10. Write `src/components/molecules/__tests__/CostBreakdownChart.test.tsx`
11. Write `src/components/molecules/__tests__/ConfidenceBadge.test.tsx`
12. Write `src/components/molecules/__tests__/EstimateSkeleton.test.tsx`
13. Update backlog: move Goal 5 to Active

## Notes

- Do not add `retailPriceCents` to the API response — it's already on `CostBreakdownResult` from Goal 4.
- Markup display: show as percentage ("400% markup") per open question default.
- Low-confidence (<0.4) still shows the estimate with a prominent warning (option a from PRD Q4).
- OG dynamic image (`opengraph-image.tsx`) deferred to a later iteration.
