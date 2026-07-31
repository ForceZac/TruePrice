# TruePrice Backlog

Last updated: 2026-07-31 (Dev Run #37 — PR #14 rebased onto main, 305 tests passing, awaiting /merge)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P1 | goal9-comparison-social | Goal 9 — Product Comparison & Social Features | ✅ APPROVED | task/goal9-comparison-social | #14 | Run #3–4 cleared; needs re-review of merge commit d7e2d3e | 305 tests, TypeScript clean. Merged main (b39dfde) into branch at d7e2d3e. PR base updated to main. Awaiting /merge. |

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

## Notes

- **Pipeline status:** Goals 1–8 merged to main. PR #14 (Goal 9) fully reviewed and ready to rebase/merge. All 9 goals complete.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** ✅ MERGED (b39dfde on 2026-07-30 20:22:36) — 270 tests passing. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page.
- **PR #14 (Goal 9):** APPROVED (Run #3 at f6bc5b0, incl. merge commit 44a4522 cleared) — 305 tests passing. Compare page, CompareStore, CompareTray, LeaderboardCard, Leaderboard page, OG image routes, ShareButton, AddToCompareButton, JSON-LD, revalidate. Ready for rebase onto b39dfde and /merge.
- **Next cycle:** Zach merges PR #14 → project complete (9/9 goals).
- **Dev Run #36 (2026-07-31 00:32):** PM standup run. All 9 goals implemented and tested (305 tests passing). PR #13 confirmed merged. PR #14 confirmed APPROVED and ready. Updated backlog to reflect completion of Goal 8 and readiness of Goal 9 for final merge.
- **Dev Run #37 (2026-07-31):** Merged origin/main (b39dfde) into task/goal9-comparison-social (d7e2d3e). Updated PR #14 base from task/goal8-data-expansion to main. 305 tests passing, TypeScript clean. Also committed docs: open-questions updates (PM Run #78 changes) and goal9 TRD format fix. PR #14 now CLEAN/MERGEABLE against main — awaiting /merge from Zach.
