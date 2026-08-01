# TruePrice Backlog

Last updated: 2026-08-01 (Dev Run #200 — fixed recent-searches route path (/api/user/ → /api/account/ per TRD spec); marked Goal 12 AC done; 452 tests pass, tsc clean; PR #23 updated)

## Active

| Goal | PR | Status | Tests | Notes |
|------|----|----|-------|-------|
| Goal 11a — Save as Image Button | #19 | ✅ LGTM | 397 | All code review feedback addressed; 397 tests pass; clean branch |
| Goal 11b — Price Alerts | #20 | ✅ LGTM | 426 | Dev Run #177: fixed reviewer blocker (AlertService.getAlertSettings); 426 tests pass; clean branch |
| docs: add missing TRDs + roadmap update | #21 | ✅ LGTM | — | Adds Goal 11a/11b TRDs; updates roadmap to Goals 1–11b; fixes 10+ TRD Watcher alerts; clean branch |
| refactor: cron SoC fix (NotificationService) | #22 | ✅ LGTM | 393 | Fixes Goal 8 Discord SoC violation flagged 20+ runs; NotificationService.postDiscordAlert; Goal 8 TRD updated (Dev Run #179) — **blocker cleared** |
| Goal 12 — Enhanced Search & Discovery | #23 | 🔍 REVIEW | 452 | Dev Run #200: moved recent-searches route to /api/account/ (TRD spec); all AC done; 452 tests pass, tsc clean |

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
| Goal 10 — User Accounts & Watchlist | #17 | 2026-08-01 | e292d87 |

## Notes

- **Pipeline status:** ✅ GOALS 1-10 SHIPPED + PR #16 (service-layer) merged. main at e292d87. 397 tests passing. Goals 11a/11b in review.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** ✅ MERGED (b39dfde on 2026-07-30) — 270 tests. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page.
- **PR #14 (Goal 9):** ✅ MERGED (ea4e0ba on 2026-07-31) — 305 tests. Compare page, CompareStore, CompareTray, LeaderboardCard, Leaderboard page, OG image routes, ShareButton, AddToCompareButton, JSON-LD, revalidate.
- **PR #16 (service-layer):** ✅ MERGED (06cc5d9 on 2026-07-31) — service violations moved from routes to service layer; JSDoc fix on forceReEstimate.
- **Dev Run #54 (2026-07-31):** Applied reviewer JSDoc fix on `forceReEstimate` (returns null, not throws). 358/358 tests passing, tsc clean. PR #16 marked ready for review.
- **Remaining Zach actions:** tech-stack sign-off (dom-to-image-more for PR #19), /approve PROPOSAL-001 (PR #18), Q7-1 (AdSense publisher ID), Q7-3 (Privacy Policy data scope), Q-INFRA-2 (Discord allowlist — run `/discord:access`).
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
- **Dev Run #113 (2026-07-31):** main advanced to 91251c4 (Dev Run #112 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #114 (2026-07-31):** main advanced to a8adda1 (Dev Run #113 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #115 (2026-07-31):** main advanced to d2da53e (Dev Run #114 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #116 (2026-07-31):** main advanced to 90d6b1d (Dev Run #115 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #117 (2026-07-31):** main advanced to 983c0ba (Dev Run #116 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #118 (2026-07-31):** main advanced to a2362eb (Dev Run #117 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #119 (2026-07-31):** main advanced to fd39440 (Dev Run #118 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #120 (2026-07-31):** main advanced to b490321 (Dev Run #119 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #121 (2026-07-31):** main advanced to 8269e27 (Dev Run #120 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #122 (2026-07-31):** main advanced to 86ee0da (Dev Run #121 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #123 (2026-07-31):** main advanced to c5eac88 (Dev Run #122 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #124 (2026-07-31):** main advanced to 3181151 (Dev Run #123 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #125 (2026-07-31):** main advanced to 8dd0110 (Dev Run #124 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **PM Run #126 (2026-07-31):** Groomed backlog. Status: Goals 1-9 complete, Goal 10/11a/11b ready for review. **[LAUNCH-GATE]** Goals 10/11a/11b missing TRDs — required before merge.
- **Dev Run #126 (2026-07-31):** main advanced to 2e4dcee (PM Run #126 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #127 (2026-07-31):** main advanced to a8e535e (Dev Run #126 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #128 (2026-07-31):** main advanced to 6d5461a (Dev Run #127 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **PM Run #127 (2026-07-31):** Groomed backlog; status confirmed: Goals 1–9 complete (all merged); Goals 10/11a/11b MERGEABLE (389/366/426 tests). **[LAUNCH-GATE]** TRDs missing for Goals 10/11a/11b — blocking merge. Standup posted to #standup.
- **Dev Run #129 (2026-08-01):** main advanced to 5ca406e (PM Run #127 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #130 (2026-08-01):** main advanced to 780f766 (Dev Run #129 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal10=389, goal11a=366, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #131 (2026-08-01):** PR #17 (Goal 10) MERGED by Zach (e292d87). Re-synced PR #19 (goal11a) — resolved ProductPageClient.tsx conflict (useEffect+useRef+SaveAsImageButton+recentlyViewed imports combined); 397 tests pass. Re-synced PR #20 (goal11b) with updated goal11a tip; 426 tests pass. Both MERGEABLE.
- **Dev Run #132 (2026-08-01):** main advanced to edd85c9 (Dev Run #131 backlog chore). Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Both MERGEABLE.
- **PM Run #128 (2026-08-01):** Groomed backlog. Status: Goals 1–10 shipped (Goal 10 merged 2026-08-01). Goals 11a/11b MERGEABLE (397/426 tests). **[LAUNCH-GATE]** Goals 11a & 11b TRDs missing — blocking merge. Standup posted to #standup.
- **Dev Run #133 (2026-08-01):** main advanced to ceb07cc (PM Run #128 backlog chore). Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Both MERGEABLE.
- **Dev Run #134 (2026-08-01):** main advanced to 5842c89 (Dev Run #133 backlog chore). Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Both MERGEABLE.
- **Dev Run #135 (2026-08-01):** main advanced to 73a15c1 (Dev Run #134 backlog chore). Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Both MERGEABLE.
- **PM Run #129 (2026-08-01):** Groomed backlog. Status: Goals 1–10 complete (Goal 10 merged today), Goals 11a/11b MERGEABLE (397/426 tests). **[LAUNCH-GATE]** Goals 11a & 11b TRDs missing + roadmap outdated (only documents Goals 1–9; Goals 10–11 absent). Standup posted to #standup.
- **Dev Run #136 (2026-08-01):** main advanced to 90013e5 (Dev Run #135 backlog chore). Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Both MERGEABLE.
- **Dev Run #137 (2026-08-01):** main advanced to b81db22 (Dev Run #136 backlog chore). Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Both MERGEABLE.
- **PM Run #130 (2026-08-01):** Groomed backlog. Status: Goals 1–10 complete (Goal 10 merged 2026-08-01); Goals 11a/11b MERGEABLE (397/426 tests). **[LAUNCH-GATE]** Goal 11b TRD missing + roadmap outdated (only documents Goals 1–9; Goals 10–11 absent). Standup posted to #standup.
- **Dev Run #138 (2026-08-01):** main advanced to 3c0d1e5 (PM Run #130 backlog chore). Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Both MERGEABLE.
- **Dev Run #139 (2026-08-01):** main advanced to d57023a (Dev Run #138 backlog chore). Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Both MERGEABLE.
- **Dev Run #140 (2026-08-01):** main advanced to 8c5e940 (Dev Run #139 backlog chore). Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Both MERGEABLE.
- **Dev Run #141 (2026-08-01):** Aborted stale unauthorized merge (task/goal11b → main) that was left uncommitted. Re-synced PR #19 (goal11a) with main/12d7a6b (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). Fixed Goal 10 TRD status to `done`. Both PRs MERGEABLE.
- **PM Run #132 (2026-08-01):** Groomed backlog. Status: Goals 1–10 complete & merged; Goals 11a/11b MERGEABLE (397/426 tests). **[LAUNCH-GATE] Goals 11a & 11b TRDs missing + roadmap outdated (only documents Goals 1–9; Goals 10–11 absent).** Standup posted to #standup.
- **Dev Run #142 (2026-08-01):** Opened PR #21 (`docs/add-missing-trds-roadmap`) — adds Goal 11a + 11b TRDs to main, updates roadmap to Goals 1–11b. Root cause of 10+ TRD Watcher alerts fixed. Re-synced PR #19 (goal11a) with main (clean, 397 tests pass). Re-synced PR #20 (goal11b) with updated goal11a tip (clean, 426 tests pass). All 3 PRs MERGEABLE.
- **Dev Run #143 (2026-08-01):** Unstaged orphaned roadmap change that was left staged on main (already covered by PR #21). Synced docs/add-missing-trds-roadmap with main (de634f4) — clean merge, no conflicts. Promoted PR #21 draft → ready for review. No implementation work needed; all goals complete. All 3 PRs MERGEABLE.
- **Dev Run #144 (2026-08-01):** main advanced to 2617045 (Dev Run #143 backlog chore). Discarded orphaned staged change (prisma/seed.ts) on goal11b. Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #145 (2026-08-01):** Fixed PR #21 wrong base (task/goal1-scaffold → main; now MERGEABLE). Fixed PR #20 stale base (task/goal10-user-accounts → task/goal11a-save-as-image). Aborted orphaned merge on main. Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #146 (2026-08-01):** main advanced to af9137b (Dev Run #145 backlog chore). Re-synced all 3 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426. All 3 PRs MERGEABLE.
- **Dev Run #147 (2026-08-01):** Aborted orphaned merge (task/goal11a → main). Fixed Goal 8 SoC violation (11+ TRD Watcher flags): extracted Discord API call from cron route into NotificationService.postDiscordAlert(). 4 new tests. 393 tests pass, tsc clean. Opened PR #22 (task/fix-cron-discord-soc). PRs #19/20/21 unaffected (main unchanged).
- **Dev Run #148 (2026-08-01):** All TRDs done (Goals 1–11b); no new implementation work. Synced task/fix-cron-discord-soc with main (clean merge). 393 tests pass, tsc clean. All 4 PRs MERGEABLE (#19/20/21/22).
- **Dev Run #149 (2026-08-01):** main advanced to bcc9571 (Dev Run #148 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #150 (2026-08-01):** main advanced to ca49e8e (Dev Run #149 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **PM Run #131 (2026-08-01):** Groomed backlog. Status: Goals 1–10 shipped (Goal 10 merged today); Goals 11a/11b MERGEABLE (397/426 tests); PR #21 (TRDs+roadmap) & PR #22 (SoC fix) MERGEABLE (393 tests). **No blockers.** All 4 open PRs ready for merge. Standup posted to #standup.
- **Dev Run #151 (2026-08-01):** main advanced to 018096b (PM Run #131 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #152 (2026-08-01):** main advanced to d3c3f99 (Dev Run #151 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #153 (2026-08-01):** main advanced to 62578fd (Dev Run #152 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #154 (2026-08-01):** main advanced to 9e06a11 (Dev Run #153 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #155 (2026-08-01):** main advanced to 3a7189f (Dev Run #154 backlog chore). Discarded orphaned staged/unstaged Goal 11b files on goal11a branch. Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=426, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #156 (2026-08-01):** main advanced to 0c66993 (Dev Run #155 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **PM Run #132 (2026-08-01):** Groomed backlog. Status: Goals 1–10 complete & merged. Goals 11a/11b MERGEABLE (397/426 tests). PR #21 (TRDs+roadmap) & PR #22 (SoC fix) MERGEABLE (393 tests). **No blockers.** All 4 open PRs ready for merge. Standup posted to #standup.
- **Dev Run #157 (2026-08-01):** main advanced to ecc0108 (PM Run #132 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #158 (2026-08-01):** main advanced to 2817495 (Dev Run #157 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #159 (2026-08-01):** main advanced to ae76794 (Dev Run #158 backlog chore). Discarded orphaned staged prisma/seed.ts on goal11a. Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #160 (2026-08-01):** main advanced to 755d142 (PM Run #133 backlog chore + PRDs). Committed PM Run #133 unstaged changes (backlog + new PRD files for Goals 11a/11b). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #161 (2026-08-01):** main advanced to 99b8c6a (Dev Run #160 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #162 (2026-08-01):** main advanced to 349b9d3 (Dev Run #161 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #163 (2026-08-01):** main advanced to 31c5415 (Dev Run #162 backlog chore). Aborted orphaned merge on main. Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #164 (2026-08-01):** main advanced to a2c4628 (Dev Run #163 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #165 (2026-08-01):** main advanced to 7409b74 (Dev Run #164 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #166 (2026-08-01):** main advanced to 139b85b (Dev Run #165 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #167 (2026-08-01):** main advanced to 0fc487f (Dev Run #166 notes chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #168 (2026-08-01):** main at f252c0e. Discarded orphaned staged prisma/seed.ts on goal11a; aborted bad merge that fast-forwarded local main to goal11a (reset main to origin). Re-synced all 4 PR branches cleanly. Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #169 (2026-08-01):** main advanced to 2c62e23 (Dev Run #168 backlog chore). Discarded orphaned staged goal11b TRD + roadmap files on goal11a branch. Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #170 (2026-08-01):** Addressed PR #20 reviewer feedback (3 issues): (1) wrapped `alertLog.create` + `savedProduct.update` in `prisma.$transaction` to prevent duplicate alerts on crash; (2) renamed alert routes from `/api/user/` to `/api/account/` to match Goal 11b TRD spec; (3) memoized `getCachedBreakdown` per product ID to avoid N+1. 426 tests pass, tsc clean. PR #20 pushed.
- **Dev Run #171 (2026-08-01):** main advanced to e5ae1c9 (Dev Run #170 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **PM Run #134 (2026-08-01):** Groomed backlog. Status: Goals 1–10 shipped; Goals 11a/11b MERGEABLE (397/426 tests); PR #21 (TRDs+roadmap) & PR #22 (SoC fix) MERGEABLE (393 tests). **No blockers.** All 4 open PRs ready for merge. Standup posted to #standup.
- **Dev Run #172 (2026-08-01):** main advanced to c1175ad (PM Run #134 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #173 (2026-08-01):** main advanced to 02d2139 (Dev Run #172 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #174 (2026-08-01):** Discarded orphaned staged + untracked files on main (goal11a source + TRD leftovers from prior run). Re-synced all 4 PR branches with main 239158a (clean merges). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **PM Run #135 (2026-08-01):** Groomed backlog. Status: Goals 1–10 shipped; Goals 11a/11b MERGEABLE (397/426 tests); PR #21 (TRDs+roadmap) & PR #22 (SoC fix) MERGEABLE (393 tests). **No blockers.** All 4 open PRs ready for merge. Standup posted to #standup.
- **Dev Run #175 (2026-08-01):** main advanced to b875671 (Dev Run #174 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #176 (2026-08-01):** main advanced to 336cf15 (Dev Run #175 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #177 (2026-08-01):** Fixed PR #20 reviewer blocker — added `getAlertSettings(userId)` to AlertService and updated `dashboard/settings/page.tsx` to use it instead of direct `prisma.user.findUnique` call (SoC violation flagged by Reviewer Run #1). 426 tests pass, tsc clean. Re-synced all 4 PR branches with main c567b69 (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **PM Run #135 (2026-08-01):** Groomed backlog + checked reviewer status. All 4 open PRs are ✅ LGTM (Reviewer Run #2). Status: Goals 1–10 shipped; Goals 11a/11b MERGEABLE (397/426 tests). **BLOCKER TO MERGE:** PR #22 code is reviewed and clean, but Goal 8 TRD file still documents old flow (Discord posting from cron route). TRD needs update to reflect new NotificationService approach before PR #22 merge. Standup posted to #standup.
- **Dev Run #178 (2026-08-01):** Aborted orphaned merge (task/goal11a-save-as-image → main). Re-synced all 4 PR branches with main a224cae (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #179 (2026-08-01):** Updated Goal 8 TRD on task/fix-cron-discord-soc (PR #22) — replaced old inline `node discord-post.js` pattern with `NotificationService.postDiscordAlert()` in Stale Price Alert section; added NotificationService module docs. Cleared PM Run #135 blocker. 393 tests pass, tsc clean. All 4 PRs MERGEABLE.
- **Dev Run #180 (2026-08-01):** main unchanged at da1bcce (no new merges). Aborted orphaned merge on main. All 4 PR branches remain in sync with their bases; no rebase needed. No new implementation work — all goals (1–11b) complete. Pipeline awaiting Zach /merge. Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389.
- **Dev Run #181 (2026-08-01):** main advanced to 6c55452 (Dev Run #180 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #182 (2026-08-01):** main advanced to d52ae88 (Dev Run #181 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #183 (2026-08-01):** main advanced to d437c63 (Dev Run #182 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #184 (2026-08-01):** main at 7b0c0e7 (Dev Run #183 backlog chore). Discarded orphaned staged fix-cron files on goal11a branch. Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #185 (2026-08-01):** main at 8a2f90a (Dev Run #184 backlog chore). Discarded orphaned staged + untracked goal11a files from main working directory. Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #186 (2026-08-01):** main advanced to cf6ceda (Dev Run #185 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #187 (2026-08-01):** main advanced to c4172c4 (Dev Run #186 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #188 (2026-08-01):** main at 876ee56 (Dev Run #187 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393, docs=389. All 4 PRs MERGEABLE.
- **Dev Run #189 (2026-08-01):** main advanced to f81d944 (Dev Run #188 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: fix-cron=389. All 4 PRs MERGEABLE.
- **Dev Run #190 (2026-08-01):** main at 8d8dd85 (Dev Run #189 backlog chore). Re-synced all 4 PR branches with main (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=389, docs=389. All 4 PRs MERGEABLE.
- **PM Run #138 (2026-08-01):** Groomed backlog. Status: Goals 1–10 shipped; Goals 11a/11b MERGEABLE (397/426 tests); PR #21 (TRDs+roadmap) & PR #22 (SoC fix) MERGEABLE (393/389 tests). **✅ All 4 open PRs LGTM and ready.** No blockers. Awaiting Zach `/merge` to ship. Standup posted to #standup.
- **Dev Run #191 (2026-08-01):** Committed orphaned PM Run #138 backlog update. Re-synced all 4 PR branches with main f1bdc7c (clean rebases, no code conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #192 (2026-08-01):** Re-synced all 4 PR branches with main 2262583 (merge strategy; goal11a/goal11b had backlog.md conflicts resolved in favor of main). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #193 (2026-08-01):** Re-synced all 4 PR branches with main 7e368e8 (clean merges, no conflicts). All 4 PRs MERGEABLE and CLEAN. Pipeline awaiting Zach /merge.
- **PM Run #139 (2026-08-01):** Groomed backlog. Status: Goals 1–10 complete & shipped; Goals 11a/11b MERGEABLE (397/426 tests); PR #21 (TRDs+roadmap) & PR #22 (SoC fix) MERGEABLE (389/393 tests). **✅ All 4 open PRs LGTM and ready.** No blockers. Awaiting Zach `/merge` to finalize roadmap.
- **PM Run #140 (2026-08-01):** Groomed backlog + checked PR status. Status: Goals 1–10 shipped (main at 2dbf9a6). All 4 critical PRs LGTM + MERGEABLE: PR #19 (goal11a=397), PR #20 (goal11b=426), PR #21 (TRDs+roadmap), PR #22 (SoC fix=393). **✅ Zero blockers.** Pipeline ready for Zach `/merge` to ship roadmap + TRDs + fix-cron SoC.
- **Dev Run #194 (2026-08-01):** Committed orphaned PM Run #139 backlog update on main. Re-synced all 4 PR branches with main 2dbf9a6 (merge strategy, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE and CLEAN. Pipeline awaiting Zach /merge.
- **Dev Run #195 (2026-08-01):** Re-synced all 4 PR branches with main 134101f (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #196 (2026-08-01):** Re-synced all 4 PR branches with main 19018ad (clean merges, no conflicts). Tests: goal11a=397, goal11b=426, fix-cron=393. All 4 PRs MERGEABLE.
- **Dev Run #197 (2026-08-01):** Re-synced all 4 PR branches with main 6612d8b (clean merges, no conflicts). Tests: goal11a=397, fix-cron=393. All 4 PRs MERGEABLE.
- **PM Run #141 (2026-08-01):** Groomed backlog. Status: Goals 1–10 shipped (main at 464a0d0). All 4 critical PRs ready for review: PR #19 (goal11a=397), PR #20 (goal11b=426), PR #21 (TRDs+roadmap), PR #22 (SoC fix=393). ✅ All LGTM and MERGEABLE. **Zero blockers.** Awaiting Zach `/merge`.
- **Dev Run #199 (2026-08-01):** Fixed Goal 12 test failure (added BarcodeService mock to ProductService.goal12.test.ts); synced goal11b with main 464a0d0 (CONFLICTING → MERGEABLE); promoted PR #23 draft → ready for review. Goal 12 TRD updated to `done`. All 5 PRs MERGEABLE. Tests: goal11a=397, goal11b=426, fix-cron=393, goal12=415.
- **Dev Run #200 (2026-08-01):** Fixed Goal 12 route path: moved recent-searches from /api/user/ → /api/account/ per TRD spec; updated SearchInput.tsx accordingly; marked all Goal 12 AC as [x] done in TRD; aborted orphaned goal11b→goal12 merge. 452 tests pass, tsc clean. All 5 PRs remain MERGEABLE.
