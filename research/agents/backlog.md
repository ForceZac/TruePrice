# TruePrice Backlog

Last updated: 2026-07-30 (Dev Run #33 — PR #12 merged, merge conflict resolved)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P1 | goal8-data-expansion | Goal 8 — Data Expansion & Accuracy Improvements | ✅ APPROVED | task/goal8-data-expansion | #13 | Approved — awaiting /merge | 240 tests passing, TypeScript clean. Reviewer Run #7 cleared all issues. Ready to merge. |
| P2 | goal9-comparison-social | Goal 9 — Product Comparison & Social Features | 🔄 DRAFT open | task/goal9-comparison-social | #14 | Needs rebase + review | 275 tests passing, TypeScript clean. All reviewer issues resolved. Needs rebase onto main after PR #13 merges. |

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

## Notes

- **Pipeline status:** Goals 1–7 merged to main. PR #13 (Goal 8) approved awaiting /merge. PR #14 (Goal 9) DRAFT awaiting rebase after PR #13 merges.
- **PR #12 (Goal 7):** ✅ MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt. All 3 reviewer issues fixed (consent.ts, aria-modal removed, env.client imports).
- **PR #13 (Goal 8):** APPROVED — Reviewer Run #7 cleared all issues. 240 tests passing. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page. Merged origin/main (Goal 7) into branch to resolve backlog.md conflict.
- **PR #14 (Goal 9):** All 3 reviewer issues resolved (leaderboard→CostEstimationService, centsToUsd import, AddToCompareButton+CompareTray tests). 275 tests passing, TypeScript clean. Still DRAFT — needs rebase onto main after PR #13 merges.
- **Next cycle:** Zach merges PR #13 → rebase PR #14 onto main → Reviewer clears PR #14 → Zach merges PR #14.
- **Dev Run #33:** PR #12 (Goal 7) merged by Zach. Merged origin/main into task/goal8-data-expansion to resolve backlog.md conflict. Tests confirmed passing post-merge.
- **Dev Run #32:** No new implementation — pipeline still idle. Verified 275 tests passing, TypeScript clean on task/goal9-comparison-social. PR #14 review run #2 already cleared all issues. PR #14 remains DRAFT pending rebase after PR #13 merges.
- **Dev Run #31:** No new implementation — all 9 goals implemented. Reviewer Run #7 cleared PR #13. Both PR #12 + PR #13 now approved. 275 tests confirmed passing on goal9 branch.
- **Dev Run #30:** Confirmed all 3 Reviewer issues on PR #14 already fixed in prior commits. 275 tests passing, TypeScript clean on goal9 branch.
- **Dev Run #29:** Fixed 2 remaining Reviewer issues on PR #13: Wireless Earbuds subcategory cable→earbuds; Screen Protector subcategory removed. Committed 6535476 and pushed.
- **Dev Run #28:** Full Goal 9 implementation committed and pushed. Draft PR #14 opened against task/goal8-data-expansion. 257 tests passing, TypeScript clean.
- **Dev Run #26:** Addressed all 3 Reviewer issues on PR #13: cron orderBy asc→desc; 6 electronics products wrong subcategory profiles fixed; leather added to Material seed. 240 tests passing.
