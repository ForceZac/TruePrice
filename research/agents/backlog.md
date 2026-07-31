# TruePrice Backlog

Last updated: 2026-07-31 (Dev Run #112 — re-synced all 3 PR branches with main (4e8b6cc); clean merges, no conflicts; all MERGEABLE)

## Active

| Goal | PR | Status | Tests | Notes |
|------|----|----|-------|-------|
| Goal 10 — User Accounts & Watchlist | #17 | READY FOR MERGE | 389 | Merge conflict resolved (Dev Run #91 + #95 + #97–#104), all 17 ACs verified |
| Goal 11a — Save as Image Button | #19 | READY FOR REVIEW | 366 | Merge conflict resolved (Dev Run #93 + #95 + #97–#105), dom-to-image-more + @testing-library/dom installed |
| Goal 11b — Price Alerts | #20 | READY FOR REVIEW | 426 | All blockers resolved (Dev Run #89), synced with goal11a (Dev Run #105); ProductPageClient conflict resolved; 426 tests pass |

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

- **Pipeline status:** ✅ GOALS 1-9 SHIPPED + PR #16 (service-layer) merged. main at 30afff0. 358 tests passing. Goals 10/11a/11b in review.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** ✅ MERGED (b39dfde on 2026-07-30) — 270 tests. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page.
- **PR #14 (Goal 9):** ✅ MERGED (ea4e0ba on 2026-07-31) — 305 tests. Compare page, CompareStore, CompareTray, LeaderboardCard, Leaderboard page, OG image routes, ShareButton, AddToCompareButton, JSON-LD, revalidate.
- **PR #16 (service-layer):** ✅ MERGED (06cc5d9 on 2026-07-31) — service violations moved from routes to service layer; JSDoc fix on forceReEstimate.
- **Dev Run #54 (2026-07-31):** Applied reviewer JSDoc fix on `forceReEstimate` (returns null, not throws). 358/358 tests passing, tsc clean. PR #16 marked ready for review.
- **Remaining Zach actions:** /merge PR #17, tech-stack sign-off (next-auth + resend for PR #17; dom-to-image-more for PR #19), /approve PROPOSAL-001 (PR #18), Q7-1 (AdSense publisher ID), Q7-3 (Privacy Policy data scope), Q-INFRA-2 (Discord allowlist — run `/discord:access`).
- **Dev Run #80 (2026-07-31):** Addressed reviewer follow-ups on PR #17. Fixed P2002 race condition in `addToWatchlist`; created recentlyViewedLocal tests; added 2 new UserService tests. 360 tests pass, tsc clean.
- **Dev Run #83 (2026-07-31):** Goal 11a polish — raw button → shadcn Button, loading state with "Saving…" label. 337 tests pass. TRD: status done.
- **Dev Run #86 (2026-07-31):** Implemented Goal 11b — Price Alerts. Full implementation: AlertLog model, AlertService, API routes, AlertSettingsForm, dashboard/settings section. 25 new tests. 385 tests pass, tsc clean. Opened draft PR #20.
- **Dev Run #89 (2026-07-31):** Fixed Goal 11b non-blockers — extracted `updateAlertSettings` into `AlertService`. 389 tests pass, tsc clean. PR #20 fully clean.
- **Dev Run #91 (2026-07-31):** PR #17 merge conflict resolved — main after PR #16. 360 tests pass, tsc clean.
- **Dev Run #92 (2026-07-31):** Synced task/goal11b-price-alerts with task/goal10-user-accounts tip. 418 tests pass, tsc clean.
- **Dev Run #93 (2026-07-31):** Synced task/goal11a-save-as-image with main after PR #16. 366 tests pass, tsc clean.
- **Dev Run #94 (2026-07-31):** No new TRDs or implementation work. All 3 PRs (17/19/20) are LGTM. Pipeline blocked — no dev work possible.
- **Dev Run #95 (2026-07-31):** Synced all 3 open PR branches with main/base (main advanced to e15a8ce). All branches pass tests: goal10=360, goal11a=366, goal11b=418. All 3 PRs now MERGEABLE.
- **Dev Run #97 (2026-07-31):** PR #17 + PR #19 DIRTY (main advanced to 3644bbe — Dev Run #95 chore). Resolved backlog.md conflicts on goal10 + goal11a; synced goal11b with updated goal10 tip. Tests: goal10=389, goal11a=366, goal11b=418. All 3 PRs now MERGEABLE.
- **Dev Run #98 (2026-07-31):** main advanced to 4161fd9 (Dev Run #97 backlog chore). Re-synced all 3 PR branches with main. All branches MERGEABLE.
- **Dev Run #99 (2026-07-31):** main advanced to bc25bd6 (Dev Run #98 backlog chore). Re-synced all 3 PR branches with main. All branches MERGEABLE.
- **Dev Run #100 (2026-07-31):** main advanced to 70fe165 (Dev Run #99 backlog chore). Re-synced all 3 PR branches with main. Tests: goal10=389, goal11a=366, goal11b=418. All 3 PRs MERGEABLE.
- **Dev Run #101 (2026-07-31):** main advanced to 30afff0 (Dev Run #100 backlog chore). Re-synced all 3 PR branches with main. Tests: goal10=389, goal11a=366, goal11b=418. All 3 PRs MERGEABLE.
- **Dev Run #102 (2026-07-31):** main advanced to 075a041 (Dev Run #101 backlog chore). Re-synced all 3 PR branches with main. Tests: goal10=389, goal11a=366, goal11b=418. All 3 PRs MERGEABLE.
- **Dev Run #103 (2026-07-31):** main advanced to 9e9e72c (Dev Run #102 backlog chore). Re-synced all 3 PR branches with main; fixed missing npm deps (dom-to-image-more, resend). Tests: goal10=389, goal11a=366, goal11b=418. All 3 PRs MERGEABLE.
- **Dev Run #104 (2026-07-31):** main advanced to 583c89e (Dev Run #103 backlog chore). Re-synced all 3 PR branches with main; fixed missing npm deps (dom-to-image-more on goal11a, resend on goal11b). Tests: goal10=389, goal11a=366, goal11b=418. All 3 PRs MERGEABLE.
- **Dev Run #105 (2026-07-31):** main advanced to 823cb7f (Dev Run #104 backlog chore). Re-synced all 3 PR branches with main; moved @testing-library/dom to devDependencies on goal11a; merged goal11a into goal11b and resolved ProductPageClient.tsx import conflict (useEffect+useRef, all imports combined). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #106 (2026-07-31):** main advanced to 0557fcd (Dev Run #105 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #107 (2026-07-31):** main advanced to cf3fa5d (Dev Run #106 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #108 (2026-07-31):** main advanced to 80c5a5f (Dev Run #107 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #109 (2026-07-31):** main advanced to d06bbf5 (Dev Run #108 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #110 (2026-07-31):** main advanced to 058d61b (Dev Run #109 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #111 (2026-07-31):** main advanced to 8e80d96 (Dev Run #110 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #112 (2026-07-31):** main advanced to 4e8b6cc (Dev Run #111 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
