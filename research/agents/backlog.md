# TruePrice Backlog

Last updated: 2026-07-31 (Dev Run #94 — all PRs clean, no new TRDs, pipeline blocked on /merge + tech-stack sign-offs)

## Active

| Goal | PR | Status | Tests | Notes |
|------|----|----|-------|-------|
| Goal 10 — User Accounts & Watchlist | #17 | READY FOR MERGE | 360 | Merge conflict resolved (Dev Run #91), all 17 ACs verified |
| Goal 11a — Save as Image Button | #19 | READY FOR REVIEW | 366 | Merge conflict resolved (Dev Run #93), dom-to-image-more installed |
| Goal 11b — Price Alerts | #20 | READY FOR REVIEW | 418 | All blockers resolved (Dev Run #89), synced to Goal 10 tip (Dev Run #92) |

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

- **Pipeline status:** ✅ GOALS 1-9 SHIPPED + PR #16 (service-layer) merged. main at 06cc5d9. 329 tests passing. Goals 10/11a/11b in review.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** ✅ MERGED (b39dfde on 2026-07-30) — 270 tests. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page.
- **PR #14 (Goal 9):** ✅ MERGED (ea4e0ba on 2026-07-31) — 305 tests. Compare page, CompareStore, CompareTray, LeaderboardCard, Leaderboard page, OG image routes, ShareButton, AddToCompareButton, JSON-LD, revalidate.
- **Dev Run #39 (2026-07-31):** PR #14 confirmed merged to main (ea4e0ba). Synced local main. 305 tests passing.
- **Dev Run #40 (2026-07-31):** All 9 TRDs marked `done` to reflect merged state (6dbcee0).
- **Dev Run #41 (2026-07-31):** No new TRDs. Found stale incomplete merge (origin/task/goal1-scaffold batch-lookup commits never landed in main). Fixed failing CommodityService test (wrong env mock path), committed and pushed (81f0fd4). 329 tests passing.
- **Dev Run #42 (2026-07-31):** No new TRDs. Committed pending backlog.md + two missing PRDs (goal1, goal2) that were untracked. Project remains complete.
- **Dev Run #43 (2026-07-31):** Post-completion service-layer refactoring — moving Prisma violations from routes to service layer. 5 commits staged on task/fix-service-layer-to-main. PR #16 opened (DRAFT).
- **Dev Run #54 (2026-07-31):** Applied reviewer JSDoc fix on `forceReEstimate` (returns null, not throws). 358/358 tests passing, tsc clean. PR #16 marked ready for review.
- **PR #16 (service-layer):** ✅ MERGED (06cc5d9 on 2026-07-31) — service violations moved from routes to service layer; JSDoc fix on forceReEstimate.
- **Dev Run #81–93:** Goal 11a and 11b implemented, reviewed, and synced. All 3 open PRs clean with LGTM verdicts.
- **Dev Run #94 (2026-07-31):** No new TRDs or implementation work. All 3 PRs (17/19/20) are LGTM. Pipeline blocked — no dev work possible.
- **Remaining Zach actions:** /merge PR #17, tech-stack sign-off (next-auth + resend for PR #17; dom-to-image-more for PR #19), /approve PROPOSAL-001 (PR #18), Q7-1 (AdSense publisher ID), Q7-3 (Privacy Policy data scope), Q-INFRA-2 (Discord allowlist — run `/discord:access`).
