# TruePrice Backlog

Last updated: 2026-07-30 (Dev Run #34 — 305 tests confirmed, pipeline idle)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P1 | goal8-data-expansion | Goal 8 — Data Expansion & Accuracy Improvements | ✅ APPROVED | task/goal8-data-expansion | #13 | Approved — awaiting /merge | 270 tests passing (includes Goal 7 tests), TypeScript clean. Ready to merge. |
| P2 | goal9-comparison-social | Goal 9 — Product Comparison & Social Features | 📋 REVIEW | task/goal9-comparison-social | #14 | Reviewer Run #2 cleared (70d4fab); merge commit 44a4522 unreviewed | 305 tests, TypeScript clean. Merged goal8 (Goal 7+8) into branch. Needs reviewer run for 44a4522. |

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

- **Pipeline status:** Goals 1–7 merged to main. PR #13 (Goal 8) approved awaiting /merge. PR #14 (Goal 9) DRAFT updated with Goal 7+8 changes.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** APPROVED — 270 tests passing (Goal 7 tests included). Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page.
- **PR #14 (Goal 9):** Merged task/goal8-data-expansion. Conflicts resolved: Footer has Leaderboard + legal links; layout.tsx has AdSenseLoader + CookieConsent; product page has AdSlot + CompareTray. Needs test run + review.
- **Next cycle:** Zach merges PR #13 -> rebase PR #14 onto main -> Reviewer clears PR #14 -> Zach merges PR #14.
- **Dev Run #33:** PR #12 merged. Merged origin/main into task/goal8-data-expansion (backlog.md conflict). Merged task/goal8-data-expansion into task/goal9-comparison-social (4-file merge: backlog.md, layout.tsx, Footer.tsx, product/[id]/page.tsx).
- **Dev Run #34:** No new implementation — all 9 goals done. Verified 305 tests passing, TypeScript clean on task/goal9-comparison-social (HEAD: 44a4522). PR #13 APPROVED awaiting /merge; PR #14 needs reviewer run for merge commit 44a4522 then awaits /merge after PR #13 merges.
