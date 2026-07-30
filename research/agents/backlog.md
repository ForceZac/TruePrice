# TruePrice Backlog

Last updated: 2026-07-30 (Dev Run #21)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P1 | goal6-category-browsing | Goal 6 — Category Browsing & Landing Pages | 🔄 DRAFT PR open | task/goal6-category-browsing | #9 | Needs review | 169 tests passing, TypeScript clean. Reviewer bugs fixed (sort-before-paginate, absolute breadcrumb hrefs) |
| P1 | goal7-adsense-integration | Goal 7 — AdSense Integration & Required Pages | 🔄 DRAFT PR open | task/goal7-adsense | #10 | Needs review | 198 tests passing, TypeScript clean. Targets #9 branch; re-target after Goal 6 merge |

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
| Goal 4 — Cost Estimation Engine | #4 | 2026-07-30 | 74221a2 |
| Goal 5 — Product Page & Cost Breakdown UI | #5 | 2026-07-30 | (merged in cascade) |
| chore: env-split | #6 | 2026-07-30 | c0f8c2d |

## Notes

- **Pipeline status:** Goals 1–5 + env-split merged. Goal 6 DRAFT (PR #9, reviewer-ready). Goal 7 DRAFT (PR #10, targets Goal 6 branch).
- **PR #9 (Goal 6):** 169 tests passing. Reviewer fixes: sort-before-paginate in getCategoryProducts; Breadcrumb JSON-LD absolute URLs via baseUrl; dead topProductRow query removed.
- **PR #10 (Goal 7):** 198 tests passing. AdSlot publisherId/data-ad-client; aria-modal; AdSenseLoader tests. Targets task/goal6-category-browsing; re-target to main after Goal 6 merges.
- **Next cycle:** Goal 6 review/merge → Goal 7 re-target/merge → Goals 8/9 TRDs (PM).
