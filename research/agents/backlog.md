# TruePrice Backlog

Last updated: 2026-07-31 (Dev Run #82 — Goal 11a all ACs met, TRD marked in-progress, PR #19 open)

## Active

| Goal | Branch | PR | Status |
|------|--------|----|--------|
| Goal 11a — Save as Image | task/goal11a-save-as-image | #19 | Draft — 336 tests pass, tsc clean |
| Goal 10 — User Accounts & Personalization | task/goal10-user-accounts | #17 | Ready to merge — 360 tests pass; awaiting tech-stack sign-off + /merge from Zach |

## Upcoming (needs TRD)

| Goal | Notes |
|------|-------|
| Goal 11b — Price Alerts | Depends on Goal 10 merge; TRD needed |

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
- **Remaining Zach actions:** Q7-1 (AdSense publisher ID), Q7-3 (Privacy Policy data scope), Q-INFRA-2 (Discord allowlist — run `/discord:access`).
- **Dev Run #81 (2026-07-31):** No new TRDs for Goal 10 pipeline (still blocked on Zach's /merge). Identified Goal 11 PRD with a self-contained Save as Image sub-feature (no Goal 10 dependency). Wrote TRD goal11a-save-as-image.md, implemented SaveAsImageButton (dom-to-image-more, lazy-loaded, MIT license), wired into ProductPageClient. 7 new tests. 336 tests pass, tsc clean. Opened draft PR #19.
- **Dev Run #82 (2026-07-31):** Verified Goal 11a implementation — all 8 ACs confirmed met (button renders, no-op on null ref, 2× scale, correct filename slug, no auth gate, lazy-loaded import, tsc clean, 7 unit tests). TRD marked in-progress, ACs checked off. 336 tests pass, tsc clean. No new work items — next task (Goal 11b Price Alerts) awaits Goal 10 merge + TRD.
