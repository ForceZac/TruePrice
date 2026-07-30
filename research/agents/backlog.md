# TruePrice Backlog

Last updated: 2026-07-30 (Dev Run #30)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P1 | goal7-adsense-integration | Goal 7 — AdSense Integration & Required Legal Pages | ✅ APPROVED | task/goal7-land | #12 | Approved — awaiting /merge | 212 tests passing, TypeScript clean. Reviewer Run #6 cleared all issues. Ready to merge. |
| P1 | goal8-data-expansion | Goal 8 — Data Expansion & Accuracy Improvements | 🔄 REVIEW open | task/goal8-data-expansion | #13 | Needs re-review | 240 tests passing, TypeScript clean. Dev Run #29: fixed final 2 reviewer issues (Wireless Earbuds cable→earbuds, Screen Protector subcategory removed). Awaiting Reviewer re-run. |
| P2 | goal9-comparison-social | Goal 9 — Product Comparison & Social Features | 🔄 DRAFT open | task/goal9-comparison-social | #14 | Needs re-review | 275 tests passing, TypeScript clean. Dev Run #30: all 3 reviewer issues fixed (leaderboard→CostEstimationService, centsToUsd import, AddToCompareButton+CompareTray tests). Still needs rebase onto main after PR #13 merges. |

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
| Goal 7 — AdSense Integration & Required Legal Pages | #11 | 2026-07-30 | (merged to task/goal6-category-browsing, not main) |

## Notes

- **Pipeline status:** Goals 1–6 + env-split merged to main. Goal 7 PR #12 approved (awaiting /merge). Goal 8 PR #13 reviewer fixes done (awaiting re-review). Goal 9 DRAFT PR #14 all fixes done (awaiting rebase+re-review).
- **PR #12 (Goal 7):** APPROVED by Reviewer. All 3 issues cleared (consent.ts extraction, aria-modal, env.client imports). Ready to merge — awaiting Zach's /merge.
- **PR #13 (Goal 8):** 240 tests passing. Final 2 seed fixes committed (6535476). Awaiting next Reviewer run to confirm clear.
- **PR #14 (Goal 9):** 275 tests passing (+18 from AddToCompareButton+CompareTray tests). All 3 reviewer issues fixed: leaderboard query moved to CostEstimationService, centsToUsd imported from @/lib/format, AddToCompareButton+CompareTray unit tests added. Needs rebase onto main once PR #13 merges.
- **Next cycle:** Zach merges PR #12 → Reviewer clears PR #13 → Zach merges PR #13 → rebase PR #14 onto main → Reviewer clears PR #14 → Zach merges PR #14.
- **Dev Run #23:** PR #13 marked ready for review (was draft). No new code work — Goal 9 awaits TRD.
- **Dev Run #25:** 240 tests passing, TypeScript clean. Committed and pushed PROJECT_KEYS.md (was untracked since PM run; updated Section 6/7/12 to reflect current routes, env vars, and merge state). No new feature work — pipeline waiting on PR #12 + PR #13 merges and Goal 9 TRD.
- **Dev Run #26:** Addressed all 3 Reviewer issues on PR #13: (1) re-estimate cron orderBy asc→desc; (2) fixed 6 electronics products with wrong subcategory profiles (Speaker→earbuds, Ring Light/Power Bank/Smart Plug→charger, Phone Wallet Case→smartphone, Keyboard/Mouse→cable, Laptop Backpack→no subcategory); (3) added leather to Material seed so shoes profile resolves. 240 tests passing, TypeScript clean. Committed 1326043 and pushed.
- **Dev Run #28:** Full Goal 9 implementation committed and pushed. Draft PR #14 opened against task/goal8-data-expansion. 257 tests passing (+17 from new compareStore + LeaderboardCard tests), TypeScript clean.
- **Dev Run #29:** Fixed 2 remaining Reviewer issues on PR #13: (1) Wireless Earbuds (000000000302) subcategory cable→earbuds; (2) Screen Protector (000000000315) subcategory removed (no matching profile). Committed 6535476 and pushed.
- **Dev Run #30:** Confirmed all 3 Reviewer issues on PR #14 already fixed in prior commits (8378e7e, 212cbd0, 0b2d7a9). 275 tests passing, TypeScript clean on goal9 branch. Backlog updated to reflect PR #12 approved status.
