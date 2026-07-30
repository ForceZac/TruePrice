# TruePrice Backlog

Last updated: 2026-07-30 (PM Standup Run #3, 10:02 UTC)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P0 | goal4-cost-estimation-engine | Goal 4 — Cost Estimation Engine | ✅ All warnings fixed, reviewers cleared | task/goal4-cost-estimation | #4 | ✅ Ready | 120 tests passing, TypeScript clean. Awaiting human `/merge` approval |
| P1 | goal5-product-page-ui | Goal 5 — Product Page & Cost Breakdown UI | ✅ All blockers resolved, reviewers cleared | task/goal5-product-page-ui | #5 | ✅ Ready | 139 tests passing; env import fixed (commit 08a97e3). Awaiting Goal 4 merge to re-target |

## Upcoming (needs TRD)

| Priority | Goal | Status | Blocker |
|----------|------|--------|---------|
| P1 | Goal 6 — Category Browsing & Landing Pages | needs TRD | Goal 5 merge |
| P1 | Goal 7 — AdSense Integration & Required Pages | needs TRD | Goal 6 merge |
| P2 | Goal 8 — Data Expansion & Accuracy Improvements | needs TRD | Goal 7 merge |
| P2 | Goal 9 — Product Comparison & Social Features | needs TRD | Goal 5 merge |

## Completed

| Goal | PR | Merged | Commit |
|------|----|--------|--------|
| Goal 1 — Project Scaffold & Data Model | #1 | 2026-07-30 | 1e23896 |
| Goal 2 — Commodity Price Integration | #2 | 2026-07-30 | (merged in batch) |
| Goal 3 — Product Lookup (Search + Barcode) | #3 | 2026-07-30 | 500c75d |

## Notes

- **Pipeline status:** Goals 1–3 complete (merged 08:12 UTC). Goal 4 ready for human `/merge` approval.
- **PR #4 (Goal 4):** All reviewer warnings fixed (commits 961e5c0, 19d826c). Ready for merge.
- **PR #5 (Goal 5):** All blockers resolved (commit 87404dd). Fragment key fix, typed ApiError, centsToUsd extracted, MaterialCostList renamed. Awaiting re-review after #4 merges.
- **Developer notes:** 91 tests passing on Goal 5; all acceptance criteria met. Build fully passing when DB available.
- **Next cycle:** Goal 4 `/merge` → Goal 5 re-review → Goal 6 TRD (PM) → Goal 6 implementation.
