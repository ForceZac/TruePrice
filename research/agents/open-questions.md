# Open Questions Parking Lot

Last updated: 2026-07-31 (PM Run #79)

This file replaces the missing PROJECT_KEYS.md section 13. All unresolved product decisions go here. Answered questions are moved to the **Resolved** section below.

---

## Open

### Goal 4 — Cost Estimation Engine

**Q4-1: Cron-triggered re-estimation** — *moved to Resolved (PM Run #78)*

**Q4-2: Labor rate default for unknown country of origin** — *moved to Resolved (PM Run #78)*

### Goal 5 — Product Page & Cost Breakdown UI

**Q5-1: Chart type — stacked bar vs. donut** — *moved to Resolved (PM Run #78)*

### Goal 6 — Category Browsing & Landing Pages

**Q6-1: Category descriptions** — *moved to Resolved (PM Run #78)*

**Q6-2: Pagination vs. load more** — *moved to Resolved (PM Run #4)*

**Q6-3: Minimum product count for AdSense** — *moved to Resolved (PM Run #78)*

### Goal 7 — AdSense Integration

**Q7-1: AdSense account & publisher ID**
Has Zach created a Google AdSense account? Publisher ID (`ca-pub-XXXXXXXX`) needed before ads can serve. Review lag is typically 1–4 weeks after site submission.
- **Owner:** Zach | **Blocking:** Goal 7 launch

**Q7-2: Manual ad unit IDs** — *moved to Resolved (PM Run #4)*

**Q7-3: Privacy Policy data scope**
Does TruePrice store any user data beyond standard server logs? This determines what the Privacy Policy must disclose. For v1 with no user accounts, the answer is likely "server logs only + AdSense cookies."
- **Owner:** Zach | **Blocking:** Privacy Policy content

### Infrastructure / Cross-cutting

**Q-INFRA-1: PROJECT_KEYS.md missing** — *moved to Resolved (PM Run #78)*

**Q-INFRA-2: Discord channels not allowlisted**
All agent runs have failed to post to Discord (#main, #standup, #prs, #alerts, #research).
- Requires user to run `/discord:access` in terminal
- All Discord posts since 2026-07-30 project init have silently failed
- **Action needed:** Zach runs `/discord:access` to configure allowlist
- **Owner:** Zach | **Priority:** High (agents can't close the loop)

### Goal 8 — Data Expansion & Accuracy Improvements

**Q8-1: Live lookup latency budget** — *moved to Resolved (PM Run #78)*

**Q8-2: 100-product seed sourcing** — *moved to Resolved (PM Run #78)*

**Q8-3: Subcategory field backfill** — *moved to Resolved (PM Run #4)*

**Q8-4: Admin page access** — *moved to Resolved (PM Run #78)*

**Q8-5: Re-estimation TTL configurability** — *moved to Resolved (PM Run #4)*

### Goal 10 — User Accounts & Personalization (Proposed)

**Q10-1: NextAuth version** — v5 (App Router native) vs v4 (stable). See PRD Goal 10.
- **Owner:** PM/Dev | **Blocking:** TRD writing

**Q10-2: Auth providers** — Google + magic-link email sufficient, or add GitHub OAuth?
- **Owner:** Zach | **Blocking:** TRD writing

**Q10-3: Watchlist cap** — 50 products (proposed). Too low? Unlimited?
- **Owner:** Zach | **Blocking:** TRD writing

**Q10-4: Digest opt-in vs. opt-out** — opt-in safer; opt-out maximizes engagement.
- **Owner:** Zach | **Blocking:** TRD writing

**Q10-5: Recently viewed merge strategy on sign-in** — merge + deduplicate + cap at 10 (proposed).
- **Owner:** PM | **Blocking:** TRD writing

### Goal 9 — Product Comparison & Social Features

**Q9-1: OG image design** — *moved to Resolved (PM Run #78)*

**Q9-2: Compare page cold state** — *moved to Resolved (PM Run #4)*

**Q9-3: Leaderboard confidence filter** — *moved to Resolved (PM Run #4)*

**Q9-4: Copy-to-image scope** — *moved to Resolved (PM Run #78)*

---

## Resolved

### Goal 4

**Q4-3: Manufacturing hour estimates** — Category-level defaults are acceptable for v1 launch. Subcategory granularity deferred to Goal 8 (Data Expansion). A confidence hit at category level is acceptable and disclosed to users.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q4-4: Async vs sync estimation** — Go sync first; optimize queries to stay under 500ms (batch fetches, indexed joins). Only introduce async (202 + polling) if profiling shows >500ms at p95. Don't add async complexity prematurely.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

### Goal 5

**Q5-2: "Calculate Cost" trigger** — Auto-trigger on page load for real users. Add `?bot=1` bypass or check user-agent to skip auto-trigger for known bot patterns. Avoids unnecessary compute from crawlers while keeping UX smooth.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q5-3: Markup framing** — Show both: primary display as multiplier ("5× markup"), secondary as "retail price is 400% above manufacturing cost." Multiplier is more visceral for sharing; percentage is technically precise.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q5-4: Low-confidence display** — Show category averages with disclaimer ("estimated for [category] products"). Never show empty state when we can give something useful. Prominent warning badge accompanies category-average estimates.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q5-5: OG image generation** — Plain meta tags for launch (Goal 5). Add dynamic OG image (`opengraph-image.tsx`) in Goal 9 (Social) when sharing becomes a focus. Reduces Goal 5 complexity.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

### Goal 6

**Q6-2: Pagination vs. load more** — Use URL-based pagination (`/category/[slug]?page=2`). Prioritize indexability over UX convenience at this stage; each page is independently crawlable, which is what AdSense approval requires.
- **Resolved:** PM Run #4 (2026-07-30) — working default set; Zach can override before TRD is written

### Goal 7

**Q7-2: Manual ad unit IDs** — Launch with auto-ads only (`strategy="afterInteractive"` script in layout). Add manual ad units after AdSense approves and issues unit IDs. Reduces pre-launch dependencies and avoids hardcoding placeholder IDs.
- **Resolved:** PM Run #4 (2026-07-30) — working default set; Zach can override before TRD is written

### Goal 8

**Q8-3: Subcategory field backfill** — Lazy fill. After the migration, `Product.subcategory` is null for existing products. The next re-estimation run selects the best subcategory profile based on ingredients/name. No migration-time inference needed; avoids complexity in the migration script.
- **Resolved:** PM Run #4 (2026-07-30) — working default set

**Q8-5: Re-estimation TTL configurability** — Use `REESTIMATION_TTL_DAYS` env var with default of 7. Cheap to add now; avoids a deploy to tune the window as catalog scales.
- **Resolved:** PM Run #4 (2026-07-30) — working default set

### Goal 9

**Q9-2: Compare page cold state** — Show an informational prompt: "Add two products to compare from any product page." No redirect, no pre-built pairs for v1. Simple and honest.
- **Resolved:** PM Run #4 (2026-07-30) — working default set

**Q9-3: Leaderboard confidence filter** — Show all products with estimates on the leaderboard; display a confidence badge on each card (HIGH/MEDIUM/LOW). Don't filter by confidence — it would hide too many products early on and punish the product for having young data.
- **Resolved:** PM Run #4 (2026-07-30) — working default set

### Added PM Run #78 (2026-07-31)

**Q4-1: Cron-triggered re-estimation** — Go with scheduled auto-compute (weekly, not daily). Goal 8 implements a `GET /api/cron/re-estimate` Vercel Cron (weekly Mon 08:00) that re-runs `estimateCost()` for products with stale breakdowns, ordered by most-recently-estimated descending (so the freshest rotate through). This avoids cold-page hits while keeping compute bounded.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 8 (PR #13)

**Q4-2: Labor rate default for unknown country of origin** — Use China rate ($3.50/hr). Implemented in `CostEstimationService` as the fallback for null `countryOfOrigin`. China accounts for the largest share of manufactured goods globally, making it the least-biased default.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 4 (PR #4)

**Q5-1: Chart type — stacked bar vs. donut** — Donut (Recharts `PieChart` + `ResponsiveContainer`). More visually striking on mobile; better for the "wow" sharing moment. Implemented in the `CostBreakdownChart` molecule component.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 5 (PR #5)

**Q6-1: Category descriptions** — AI-drafted 2–3 sentence blurbs seeded per category, written at Goal 6 time. 5 categories seeded (Food & Beverage, Clothing & Textiles, Electronics, Cosmetics & Personal Care, Home & Kitchen). No separate Zach review needed for launch — thin categories are acceptable for AdSense v1.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 6 (PR #10)

**Q6-3: Minimum product count for AdSense** — Resolved by Goal 8: 104 products seeded with estimates (26 HIGH confidence, mix of food, clothing, electronics). AdSense content threshold met.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 8 (PR #13)

**Q-INFRA-1: PROJECT_KEYS.md missing** — `PROJECT_KEYS.md` now exists at `/workspace/TruePrice/PROJECT_KEYS.md`, committed to task/goal8-data-expansion in commit c20f3d7. All agent prompts that reference it now have a valid file to read. TRD Watcher now validates against it successfully.
- **Resolved:** PM Run #78 (2026-07-31) — created during Dev Run #25 (2026-07-30)

**Q8-1: Live lookup latency** — Sync approach used in Goal 9. Product data returns immediately from DB; estimation is triggered by `GET /api/products/[id]/cost` (calculate if none cached). No polling pattern needed for v1 — re-estimate cron handles freshness. Revisit if p95 latency exceeds 500ms after launch.
- **Resolved:** PM Run #78 (2026-07-31) — confirmed working in Goal 9 implementation

**Q8-2: 100-product seed sourcing** — Used Option C (pre-defined popular UPC list) for electronics and clothing; Open Food Facts data for food products. Goal 8 seeded 104 products across all categories manually curated. Import script approach (Option A) deferred to future growth needs.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 8 (PR #13)

**Q8-4: Admin page access** — `/admin/coverage` is unauthenticated for v1. Aggregate stats (product counts, confidence distribution) are not sensitive. Add basic auth (env-var password) before any public marketing push if coverage data becomes a competitive concern.
- **Resolved:** PM Run #78 (2026-07-31) — accepted as working default for v1

**Q9-1: OG image design** — Option A (bold text card): product name + markup multiplier in large type. Text-forward cards perform best in social feeds and are simplest to build with Satori. Implemented in `src/app/api/og/product/[id]/route.ts` and `src/app/api/og/compare/route.ts`.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 9 (PR #14)

**Q9-4: Copy-to-image scope** — Deferred. Not included in Goal 9 v1. Goal 9 focuses on comparison tray, leaderboard, and OG images. "Save as image" (html2canvas/dom-to-image) deferred to Goal 10+ due to bundle weight and Tailwind CSS edge cases.
- **Resolved:** PM Run #78 (2026-07-31) — confirmed cut from Goal 9 scope
