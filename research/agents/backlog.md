# TruePrice Backlog

Last updated: 2026-07-31 (Dev Run #35 — 305 tests confirmed, TypeScript clean, pipeline idle)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P1 | goal8-data-expansion | Goal 8 — Data Expansion & Accuracy Improvements | ✅ APPROVED | task/goal8-data-expansion | #13 | Run #10 cleared at bcdceb0 — awaiting /merge | 270 tests passing, TypeScript clean. Ready to merge. |
| P2 | goal9-comparison-social | Goal 9 — Product Comparison & Social Features | ✅ APPROVED | task/goal9-comparison-social | #14 | Run #3 cleared at f6bc5b0 (incl. merge commit 44a4522) | 305 tests, TypeScript clean. Awaits PR #13 merge then rebase onto main before /merge. |

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

- **Pipeline status:** Goals 1–7 merged to main. PR #13 (Goal 8) approved awaiting /merge. PR #14 (Goal 9) fully reviewed, awaiting PR #13 merge then rebase.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** APPROVED (Run #10 at bcdceb0) — 270 tests passing. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page. All reviewer issues resolved.
- **PR #14 (Goal 9):** APPROVED (Run #3 at f6bc5b0, incl. merge commit 44a4522 cleared) — 305 tests passing. Compare page, CompareStore, CompareTray, LeaderboardCard, Leaderboard page, OG image routes, ShareButton, AddToCompareButton, JSON-LD, revalidate. Awaits PR #13 merge then rebase onto main.
- **Next cycle:** Zach merges PR #13 → rebase PR #14 onto main → Zach merges PR #14.
- **Dev Run #33:** PR #12 merged. Merged origin/main into task/goal8-data-expansion (backlog.md conflict). Merged task/goal8-data-expansion into task/goal9-comparison-social (4-file merge: backlog.md, layout.tsx, Footer.tsx, product/[id]/page.tsx).
- **Dev Run #34:** No new implementation — all 9 goals done. Verified 305 tests passing, TypeScript clean on task/goal9-comparison-social (HEAD: 44a4522). PR #13 APPROVED awaiting /merge; PR #14 Reviewer Run #3 cleared merge commit 44a4522 at f6bc5b0.
- **Dev Run #35 (2026-07-31):** No new implementation — all 9 goals done. Verified 305 tests passing, TypeScript clean on task/goal9-comparison-social (HEAD: f6bc5b0). Updated backlog: PR #14 status corrected to APPROVED (Run #3 cleared f6bc5b0 including 44a4522). Pipeline idle awaiting /merge decisions.
