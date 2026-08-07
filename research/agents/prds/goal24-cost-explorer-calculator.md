# PRD: Goal 24 — Interactive Cost Explorer ("What Would It Cost?")

- **Goal reference:** Goal 24 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 4 (Cost Estimation Engine), Goal 5 (Product Page UI), Goal 16 (Data Quality & Accuracy Refresh)
- **Proposed by:** PM Run #218 (2026-08-06)

---

## Problem Statement

TruePrice tells users what a product costs to make *right now*, under the current assumptions. But the most compelling question isn't "what does it cost?" — it's **"why does it cost that, and what would change the number?"**

Right now, the cost breakdown is a read-only result. Users see "labor: $14.20, materials: $32.80" but have no way to interrogate why, or to explore what-if scenarios. This leaves TruePrice's deepest insights locked up inside opaque estimates.

Three concrete gaps:

1. **Assumptions are invisible.** The cost engine uses a specific country of origin, specific commodity prices, and category-level material estimates. A product page shows the output but never surfaces the inputs. Users have no way to verify or challenge the estimate. This creates a trust gap — skeptics bounce rather than engage.

2. **Journalists and educators can't tell the "what if" story.** The most viral supply chain stories are scenario-based: "What if your iPhone was made in America? It would cost $650 to make, not $180." That story is computable from TruePrice's existing `CostEstimationService` — but there's no UI to trigger it without calling the API directly.

3. **No engagement hook for return visits.** Once a user has seen a product's breakdown, there's nothing new to do on that page (until Goal 20 adds history charts). A "What If" calculator gives users a reason to return when headlines about tariffs, trade wars, or commodity price spikes make the tool newly relevant.

---

## User Stories

**US-1 — Country of origin swap**
As a user on a product page, I want to change the country of manufacture and see the cost recalculate instantly, so I can understand how much of the cost is driven by labor rates (e.g., "What if this was made in the USA instead of China?").

**US-2 — Commodity price override**
As a user, I want to manually adjust a key commodity price (e.g., "what if cotton costs 50% more?") and see how the breakdown changes, so I can understand the supply chain risk for this product.

**US-3 — Explorer permalink**
As a user, I want to share a link to a specific "what if" scenario (e.g., `/product/[id]/explore?country=US&cotton=+50%`) so that a journalist or friend sees the same numbers I do.

**US-4 — "True USA Cost" feature card**
As a user, I want to see a pre-built scenario card on the product page that shows "If made in the USA: $X.XX" right below the main breakdown, so I can immediately grasp the labor arbitrage without having to configure anything.

**US-5 — Scenario sharing**
As a user, I want to share a scenario as an OG card (product name + scenario label + scenario total cost + delta vs actual), so I can make the "what if" story immediately legible on social media.

---

## Requirements

### Must-Have

- **`CostExplorerService`** (`src/services/CostExplorerService.ts`) — sole owner of scenario calculation. Wraps `CostEstimationService` with override parameters; **must not** duplicate cost logic — it passes overrides to `CostEstimationService` and returns the modified breakdown. Methods: `computeScenario(productId, overrides: ScenarioOverrides)`. `ScenarioOverrides` type: `{ countryOfOrigin?: string; commodityOverrides?: Record<string, number> }` (commodity key → adjusted price per kg in cents).
- **`GET /api/products/[id]/explore` API route** — accepts query params: `country` (ISO 3166-1 alpha-2) and `commodity[<key>]` (price multiplier, e.g., `1.5` = 50% higher). Returns a `CostBreakdown`-shaped object with `isScenario: true` and `scenarioLabel: string`. Rate-limited to 60 req/min per IP (reuse existing rate-limit middleware).
- **Cost Explorer panel on the product page** — collapsible "What Would It Cost?" section below the main breakdown chart. Collapsed by default (a link/button opens it). Contains:
  - Country selector (dropdown populated from `LaborRate` table — all supported countries with their hourly rates)
  - Commodity sliders for materials used by this product (±50% range, shown as "+20%" etc.)
  - "Calculate" button — fires `GET /api/products/[id]/explore` via TanStack Query mutation (optimistic UI not needed; wait for response)
  - Result panel: updated cost breakdown pie chart + total cost + delta badge ("↑ $14.20 vs actual" or "↓ $8.40 vs actual")
- **"If made in the USA" feature card** — pre-computed server-side for all products with `countryOfOrigin !== 'US'`. Shown as a static card below the product breakdown (not in the explorer panel). Calls `CostExplorerService.computeScenario(id, { countryOfOrigin: 'US' })` in the server component. Hidden if the product is already made in the USA or if the breakdown confidence is LOW.
- **Scenario permalink support** — the Country selector and commodity slider values are reflected in the URL as query params (push to history without reload; use `useSearchParams` + `router.push`). Sharing the URL restores the same explorer state. No server-side pre-rendering of scenario results from URL params (just restore UI state client-side).
- `tsc --noEmit` clean; all existing tests pass; new unit tests cover `CostExplorerService` (country override, commodity override, combined override, invalid country fallback)

### Should-Have

- **Scenario OG card** — `GET /api/og/explore/[id]` with query params for the scenario. Card displays: product name, "If made in [Country]", scenario total cost, delta vs actual. Reuses Satori infrastructure from Goal 9.
- **"Top scenarios" presets** — offer 3–4 one-click scenario presets on the product page:
  - "If made in USA" (pre-filled country = US)
  - "If made in Vietnam" (a common alternative to China)
  - "25% tariff impact" (all commodity prices × 1.25)
  - "Cotton spike +50%" (for clothing products only)
  These presets are hard-coded in the frontend; they're just shortcuts that pre-fill the explorer panel and fire the API.
- **Explorer results in recently-viewed context** — when a user views a scenario, add a note in their recently-viewed list: "You explored: [Product] — if made in USA" (localStorage only; no DB write for scenario views).

### Won't Have (v1)

- Saved/named scenarios — users can't bookmark a scenario to their profile (use the permalink instead)
- Side-by-side scenario comparison (two scenarios at once) — defer until there's demand
- Custom material composition input (changing the % of cotton vs polyester in a product) — requires UI complexity beyond v1; deferred to a future materials editor
- Scenario sharing metrics in the analytics dashboard (Goal 22) — add in a follow-up once the explorer is live and there's signal

---

## Acceptance Criteria

- [ ] `GET /api/products/[id]/explore?country=US` returns a valid cost breakdown with `isScenario: true` and a different `totalCostCents` than the base estimate (for a product not already made in the USA)
- [ ] `GET /api/products/[id]/explore?country=XX` (invalid country code) returns a 400 with a descriptive error
- [ ] The Cost Explorer panel renders on product pages and is hidden by default (collapsed)
- [ ] Selecting a country and clicking "Calculate" shows an updated breakdown chart and total with a delta badge
- [ ] Selecting a country updates the URL query params (back/forward navigation restores the selection)
- [ ] "If made in the USA" feature card is visible on product pages for non-US-origin products with non-LOW confidence
- [ ] "If made in the USA" card is hidden for US-origin products and LOW-confidence products
- [ ] Sharing a `/product/[id]?country=US` URL restores the explorer panel with the USA country pre-selected (client-side only; the static HTML shows the base breakdown, not the scenario)
- [ ] `CostExplorerService` unit tests pass for: country override, commodity override, combined override, invalid country code fallback to base estimate
- [ ] `tsc --noEmit` passes clean
- [ ] All existing tests continue to pass

---

## Technical Notes

- **SoC:** `CostExplorerService` **delegates** to `CostEstimationService` with override params — it does not re-implement cost math. The implementation approach: `CostEstimationService.estimateCostWithOverrides(product, overrides)` — add an optional second parameter to the existing method. All existing callers pass no second arg (no behavior change). This is the minimal change to enable the explorer without a SoC violation.
- **No new DB writes:** Scenario results are ephemeral — computed on demand, returned in the API response, never persisted. The existing `CostBreakdown` table is not touched by scenarios. Scenarios are marked `isScenario: true` in the response shape to prevent accidental persistence.
- **LaborRate table:** The country dropdown is populated from `prisma.laborRate.findMany()` (all countries + rates) — no new data needed. Display as "[Country name] — $X.XX/hr". The `data/country-regions.ts` static lookup (Goal 1) provides display names.
- **Commodity sliders scope:** Only materials that appear in `Product.materials` for this product are shown as sliders. A product with no textile materials should not show a "cotton" slider. Fetch the product's `ProductMaterial` join in `GET /api/products/[id]/explore` to determine which commodity keys to expose.
- **Rate limiting:** The `/explore` route is compute-intensive (re-runs `estimateCost` on every call). Reuse existing rate-limit middleware from the cron routes (or add a new per-IP limiter at 60 req/min). Do not cache scenario results — the inputs are user-controlled and the combination space is too large.
- **"If made in USA" server computation:** Computed in the product page server component (alongside the base breakdown). Add as a second `CostExplorerService` call: `const usaScenario = countryOfOrigin !== 'US' && confidence !== 'LOW' ? await costExplorerService.computeScenario(id, { countryOfOrigin: 'US' }) : null`. Pass as a prop to the `UsaScenarioCard` client component.
- **Client component boundary:** The Cost Explorer panel (country selector, sliders, Calculate button, result chart) is a client component. The "If made in USA" feature card is a server component (static computation). They are independent components — the server card does not depend on the client panel's state.

---

## Open Questions

**Q24-1: CostEstimationService override API — extend existing method or add new method?**
Adding `estimateCostWithOverrides(product, overrides?)` to `CostEstimationService` keeps the override logic co-located with the cost math. Alternatively, `CostExplorerService` could replicate the setup (material weights, labor lookup) and pass modified inputs to the existing `estimateCost`. The first approach is cleaner but requires touching `CostEstimationService`.
- Suggested default: Add `overrides?` optional second param to `estimateCost`. Callers without overrides see identical behavior. Minimal surface area change, no logic duplication.
- **Owner:** Dev | **Priority:** Must decide before TRD is written

**Q24-2: Slider precision for commodity overrides**
Sliders could express overrides as multipliers (0.5× to 2×), additive deltas (+$0.10/kg), or percentage adjustments (−50% to +100%). Which is most intuitive for non-technical users?
- Suggested default: Percentage adjustment (−50% to +100%) shown as "−50%" / "+100%". Clearest for "cotton prices doubled" mental model. Internally converted to a multiplier before calling `CostExplorerService`.
- **Owner:** Zach | **Priority:** Low — default is fine for launch; can change after user testing

**Q24-3: Feature card copy — "If made in the USA" framing**
The card needs copy that's compelling without being politically charged. Options: (a) "Made in America — what it would cost"; (b) "US manufacturing cost estimate"; (c) "What if this was made locally?" (avoids USA-centric framing for international users).
- Suggested default: "If manufactured in the USA" as the card heading, with a subline "Estimated at US labor rates ($XX/hr)". Factual framing, not political. Adjust to "If manufactured locally" for non-US locales when/if internationalization is added.
- **Owner:** Zach | **Priority:** Low — editorial decision; doesn't affect implementation

**Q24-4: Should LOW-confidence products have the explorer at all?**
LOW-confidence estimates use category averages for materials — adjusting commodity prices on top of already-noisy material weights compounds the uncertainty. Should the explorer be hidden or shown with a warning for LOW-confidence products?
- Suggested default: Show with a stronger confidence warning ("These estimates use category averages — scenario results are illustrative only"). Hiding the explorer entirely loses engagement potential; the warning maintains honesty. The "If made in USA" card is already specified to be hidden for LOW-confidence products.
- **Owner:** PM | **Priority:** Low — doesn't block implementation
