# TruePrice Backlog

Last updated: 2026-07-30 (Dev Run #13)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P0 | goal4-cost-estimation-engine | Goal 4 — Cost Estimation Engine | ✅ All warnings fixed, reviewers cleared | task/goal4-cost-estimation | #4 | ✅ Ready | 120 tests passing, TypeScript clean. Awaiting human `/merge` approval |
| P1 | goal5-product-page-ui | Goal 5 — Product Page & Cost Breakdown UI | ✅ All blockers resolved, reviewers cleared | task/goal5-product-page-ui | #5 | ✅ Ready | 139 tests passing; env import fixed (commit 08a97e3). Awaiting Goal 4 merge to re-target |
| P1 | goal6-category-browsing | Goal 6 — Category Browsing & Landing Pages | 🔄 DRAFT PR open — reviewer fixes committed | task/goal6-category-browsing | #7 | Needs re-review | 169 tests passing, TypeScript clean (commit 1c2c78a). Targets #5 branch; re-target to main after Goals 4+5 merge |
| P1 | goal7-adsense-integration | Goal 7 — AdSense Integration & Required Pages | 🔄 DRAFT PR open | task/goal7-adsense-integration | #8 | ✅ Cleared | 198 tests passing, TypeScript clean. Targets #7 branch; re-target after Goals 4–6 merge |
| P2 | — | Chore — Env Split | 🔄 In progress | chore/env-split | #6 | DRAFT | TypeScript env.ts split into server/client modules; improves type safety |

## Upcoming (needs TRD)

| Priority | Goal | Status | Blocker |
|----------|------|--------|---------|
| P2 | Goal 8 — Data Expansion & Accuracy Improvements | needs TRD | Goal 7 merge |
| P2 | Goal 9 — Product Comparison & Social Features | needs TRD | Goal 5 merge |

## Completed

| Goal | PR | Merged | Commit |
|------|----|--------|--------|
| Goal 1 — Project Scaffold & Data Model | #1 | 2026-07-30 | 1e23896 |
| Goal 2 — Commodity Price Integration | #2 | 2026-07-30 | (merged in batch) |
| Goal 3 — Product Lookup (Search + Barcode) | #3 | 2026-07-30 | 500c75d |

## Notes

- **Pipeline status:** Goals 1–3 merged. Goal 4 ready for human `/merge`. Goal 5 ready, awaiting Goal 4 merge. Goal 6 DRAFT (reviewer fixes committed, needs re-review). Goal 7 DRAFT (reviewer-cleared).
- **PR #4 (Goal 4):** All reviewer warnings fixed (commits 961e5c0, 19d826c). Ready for merge.
- **PR #5 (Goal 5):** All blockers resolved (commit 87404dd). Awaiting re-review after #4 merges.
- **PR #6 (Chore):** Env split refactor in draft — improves server/client type separation (commit bb588b5).
- **PR #7 (Goal 6):** Reviewer bugs fixed (commit 1c2c78a): sort-before-paginate fixed in getCategoryProducts; Breadcrumb JSON-LD now uses absolute URLs via baseUrl prop; dead topProductRow query removed. 169 tests passing.
- **PR #8 (Goal 7):** Reviewer-cleared (commit b751a8e). AdSlot publisherId/data-ad-client fixed; aria-modal added; AdSenseLoader tests added. 198 tests passing.
- **Next cycle:** Goal 4 `/merge` → Goal 5 re-target/merge → Goal 6 re-review/merge → Goal 7 re-target/review → Goals 8/9 TRDs (PM).
