# TruePrice Backlog

Last updated: 2026-07-31 (Dev Run #95 — synced goal10 branch with main; PRs 17/19/20 all LGTM)

## Active

| Goal | PR | Status | Tests | Notes |
|------|----|----|-------|-------|
| Goal 10 — User Accounts & Watchlist | #17 | READY FOR MERGE | 360 | Merge conflict resolved (Dev Run #91 + #95), all 17 ACs verified |
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
| chore: service-layer refactoring | #16 | 2026-07-31 | 06cc5d9 |

## Notes

- **Pipeline status:** ✅ GOALS 1-9 SHIPPED + PR #16 (service-layer) merged. main at e15a8ce. 358 tests passing. Goals 10/11a/11b in review.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** ✅ MERGED (b39dfde on 2026-07-30) — 270 tests. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page.
- **PR #14 (Goal 9):** ✅ MERGED (ea4e0ba on 2026-07-31) — 305 tests. Compare page, CompareStore, CompareTray, LeaderboardCard, Leaderboard page, OG image routes, ShareButton, AddToCompareButton, JSON-LD, revalidate.
- **PR #16 (service-layer):** ✅ MERGED (06cc5d9 on 2026-07-31) — service violations moved from routes to service layer; JSDoc fix on forceReEstimate.
- **Dev Run #39 (2026-07-31):** PR #14 confirmed merged to main (ea4e0ba). Synced local main. 305 tests passing.
- **Dev Run #40 (2026-07-31):** All 9 TRDs marked `done` to reflect merged state (6dbcee0).
- **Dev Run #41 (2026-07-31):** No new TRDs. Found stale incomplete merge (origin/task/goal1-scaffold batch-lookup commits never landed in main). Fixed failing CommodityService test (wrong env mock path), committed and pushed (81f0fd4). 329 tests passing.
- **Dev Run #42 (2026-07-31):** No new TRDs. Committed pending backlog.md + two missing PRDs (goal1, goal2) that were untracked. Project remains complete.
- **Dev Run #43 (2026-07-31):** Post-completion service-layer refactoring — moving Prisma violations from routes to service layer. 5 commits staged on task/fix-service-layer-to-main. PR #16 opened (DRAFT).
- **Dev Run #54 (2026-07-31):** Applied reviewer JSDoc fix on `forceReEstimate` (returns null, not throws). 358/358 tests passing, tsc clean. PR #16 marked ready for review.
- **Remaining Zach actions:** /merge PR #17, tech-stack sign-off (next-auth + resend for PR #17; dom-to-image-more for PR #19), /approve PROPOSAL-001 (PR #18), Q7-1 (AdSense publisher ID), Q7-3 (Privacy Policy data scope), Q-INFRA-2 (Discord allowlist — run `/discord:access`).
- **Dev Run #63 (2026-07-31):** 347 tests pass, tsc clean. No new TRDs. Updated PROJECT_KEYS.md to document Goal 10 additions (next-auth, @auth/prisma-adapter, resend in Section 3; new env vars in Section 7; UserService in Section 10; Goal 10 in Section 12 roadmap). Committed e814e20 to task/goal10-user-accounts. PR #17 ready to merge; PR #16 (service-layer) also awaiting /merge.
- **Dev Run #80 (2026-07-31):** Addressed reviewer follow-ups on PR #17. Fixed P2002 race condition in `addToWatchlist`; created recentlyViewedLocal tests; added 2 new UserService tests. 360 tests pass (was 347), tsc clean. Pushed 86e9cc5 to task/goal10-user-accounts. PR #17 now fully addresses all reviewer items.
- **Dev Run #86 (2026-07-31):** Implemented Goal 11b — Price Alerts. Full implementation: schema (AlertLog model, User/SavedProduct alert fields), migration 20260731000002, AlertService, PATCH /api/user/alert-settings, GET /api/user/alerts, AlertSettingsForm, /dashboard/settings Alert Settings section. 25 new AlertService tests. 385 tests pass, tsc clean. Opened draft PR #20.
- **Dev Run #87 (2026-07-31):** PR #20 promoted draft → ready for review. 385 tests pass, tsc clean.
- **Dev Run #88 (2026-07-31):** Resolved merge conflict in task/goal10-user-accounts — PR #16 (service-layer) confirmed merged to main (06cc5d9). Backlog updated to reflect PR #16 complete. 360 tests pass, tsc clean.
- **Dev Run #89 (2026-07-31):** Fixed Goal 11b non-blockers — extracted `updateAlertSettings` into `AlertService` to eliminate direct Prisma calls in route. 389 tests pass (was 385), tsc clean. PR #20 now fully clean.
- **Dev Run #91 (2026-07-31):** PR #17 merge conflict resolved (main diverged after PR #16). 360 tests pass, tsc clean. All PRs clean.
- **Dev Run #92 (2026-07-31):** PR #20 synced with updated goal10 tip (goal10 had 2 new commits). 418 tests pass, tsc clean.
- **Dev Run #93 (2026-07-31):** PR #19 merge conflict resolved (main diverged after PR #16). 366 tests pass, tsc clean.
- **Dev Run #94 (2026-07-31):** No new TRDs or implementation work. All 3 PRs (17/19/20) are LGTM. Pipeline blocked — no dev work possible.
- **Dev Run #95 (2026-07-31):** Resolved merge conflict on task/goal10-user-accounts (main advanced to e15a8ce after Dev Run #94 backlog chore). 360 tests pass, tsc clean.
