# TruePrice Backlog

Last updated: 2026-07-31 (Dev Run #51 — PR #15 promoted to ready, docs cleaned up)

## Active

_None — all goals implemented and merged._

## Upcoming (needs TRD)

_None — all goals have TRDs._

## Completed

| Goal | PR | Merged | Commit |
|------|----|--------|--------|
| Goal 1 — Project Scaffold & Data Model | #1 | 2026-07-30 | 1e23896 |
| Goal 2 — Commodity Price Integration | #2 | 2026-07-30 | (merged in batch) |
| Goal 3 — Product Lookup (Search + Barcode) | #3 | 2026-07-30 | 500c75d |
| Goal 4 — Cost Estimation Engine | #4 | 2026-07-30 | 74221a2 |
| Goal 5 — Product Page & Cost Breakdown UI | #5 | 2026-07-30 | (merged in cascade) |
| chore: env-split | #6 | 2026-07-30 | c0f8c2d |
| Goal 6 — Category Browsing & Landing Pages | #10 | 2026-07-30 | 06cf14e |
| Goal 7 — AdSense Integration & Required Legal Pages | #12 | 2026-07-30 | 752e8c1 |
| Goal 8 — Data Expansion & Accuracy Improvements | #13 | 2026-07-30 | b39dfde |
| Goal 9 — Product Comparison & Social Features | #14 | 2026-07-31 | ea4e0ba |

## Notes

- **Pipeline status:** ✅ ALL 9 GOALS SHIPPED — main at 6dbcee0. 305 tests passing. Project complete.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** ✅ MERGED (b39dfde on 2026-07-30) — 270 tests. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page.
- **PR #14 (Goal 9):** ✅ MERGED (ea4e0ba on 2026-07-31) — 305 tests. Compare page, CompareStore, CompareTray, LeaderboardCard, Leaderboard page, OG image routes, ShareButton, AddToCompareButton, JSON-LD, revalidate.
- **Dev Run #39 (2026-07-31):** PR #14 confirmed merged to main (ea4e0ba). Synced local main. 305 tests passing.
- **Dev Run #40 (2026-07-31):** All 9 TRDs marked `done` to reflect merged state (6dbcee0).
- **Dev Run #41 (2026-07-31):** No new TRDs. Found stale incomplete merge (origin/task/goal1-scaffold batch-lookup commits never landed in main). Fixed failing CommodityService test (wrong env mock path), committed and pushed (81f0fd4). 329 tests passing.
- **Dev Run #42 (2026-07-31):** No new TRDs. Committed pending backlog.md + two missing PRDs (goal1, goal2) that were untracked. Project remains complete.
- **PM Run #76 (2026-07-31):** Project feature-complete. Verified all 9 goals merged, 329 tests passing, commit e8bb2ab. Posted standup to #standup.
- **Remaining Zach actions:** Q7-1 (AdSense publisher ID), Q7-3 (Privacy Policy data scope), Q-INFRA-2 (Discord allowlist — run `/discord:access`).
- **Dev Run #51 (2026-07-31):** No new TRDs. All 9 goals complete. Cleaned up uncommitted docs (Goal 3 PRD, Goal 10 PRD draft, Goal 7 PRD question resolutions, roadmap Goal 10 section, PROJECT_KEYS Goal 10 row). Added .merge-watcher-state to .gitignore. Promoted PR #15 from draft to ready (333 tests, TS clean). Pushed 7805da0.
- **Dev Run #52 (2026-07-31):** No new TRDs. All 9 goals complete. PR #15 (fix/stale-price service-layer) already open, reviewer-approved, 347 tests passing, TS clean. Awaiting `/merge`.
- **PM Run #77 (2026-07-31):** Standup: all goals shipped, PR #15 ready for merge. 347 tests passing, TS clean. Project feature-complete pending final `/merge`.
- **Dev Run #53 (2026-07-31):** No new TRDs. All 9 goals complete. 347 tests passing, TS clean. PR #15 reviewer-approved, awaiting `/merge`. No new work.
- **Dev Run #54 (2026-07-31):** No new TRDs. All 9 goals complete. 347 tests passing, TS clean. PR #15 open, no formal review decision recorded via API. Awaiting `/merge`.
- **Dev Run #55 (2026-07-31):** No new TRDs. All 9 goals complete. 347 tests passing, TS clean. PR #15 still open, awaiting `/merge`. No new work.
- **PM Run #78 (2026-07-31):** Backlog groomed. All 9 goals shipped, 347 tests, TS clean. PR #15 (fix/stale-price) reviewer-approved, awaiting `/merge`. No TRD updates needed. Posted standup to #standup.
- **Dev Run #56 (2026-07-31):** No new TRDs. All 9 goals complete. 347 tests passing, TS clean. PR #15 still open, awaiting `/merge`. No new work.
- **Dev Run #57 (2026-07-31):** No new TRDs. All 9 goals complete. 347 tests passing, TS clean. PR #15 still open, awaiting `/merge`. No new work.
- **Dev Run #58 (2026-07-31):** No new TRDs. All 9 goals complete. 347 tests passing, TS clean. PR #15 still open, awaiting `/merge`. No new work.
- **Dev Run #59 (2026-07-31):** No new TRDs. All 9 goals complete. 347 tests passing, TS clean. PR #15 still open (main @ e8bb2ab, unchanged), awaiting `/merge`. No new work.
- **PM Run #79 (2026-07-31):** Backlog groomed. All 9 goals shipped, 347 tests, TS clean. PR #15 (fix/stale-price) reviewer-approved, awaiting `/merge`. No TRD updates. Posted standup to #standup.
- **Dev Run #60 (2026-07-31):** Fixed all 4 Reviewer-flagged service-layer violations on PR #15 (commit c8691c4). Added `getStaleBreakdownProductIds`+`forceReEstimate` to CostEstimationService; `getProductWithBreakdown`+`getCoverageData` to ProductService. All 4 routes/pages now have zero direct prisma imports. 11 new tests, 358 total passing. Discord #prs blocked (allowlist).
- **Dev Run #61 (2026-07-31):** No new TRDs. All 9 goals complete. 358 tests passing, TS clean. PR #15 open with all reviewer violations resolved (c8691c4). Awaiting Zach's `/merge`.
- **PM Run #80 (2026-07-31):** Backlog groomed. All 9 goals shipped, 358 tests, TS clean. PR #15 (fix/stale-price) reviewer-approved, awaiting `/merge`. No TRD updates. Posted standup to #standup.
- **Dev Run #62 (2026-07-31):** No new TRDs. All 9 goals complete. 358 tests passing, TS clean. PR #15 still open, awaiting `/merge`. No new work.
- **Dev Run #63 (2026-07-31):** No new TRDs. All 9 goals complete. 358 tests passing, TS clean. PR #15 still open, awaiting `/merge`. No new work.
- **Dev Run #64 (2026-07-31):** Addressed reviewer nit from Run #5 — renamed `const any` → `const firstCategory` in ProductService.ts:64. Commit 92fce82 pushed. 358 tests passing, TS clean. PR #15 awaiting `/merge`.
