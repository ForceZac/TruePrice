# TruePrice Backlog

Last updated: 2026-07-30 (Dev Run #27)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P1 | goal7-adsense-integration | Goal 7 — AdSense Integration & Required Legal Pages | 🔄 REVIEW open | task/goal7-land | #12 | Needs re-review | 212 tests passing, TypeScript clean. Dev Run #27: addressed all 3 reviewer issues (consent constants, aria-modal, env imports). |
| P1 | goal8-data-expansion | Goal 8 — Data Expansion & Accuracy Improvements | 🔄 REVIEW open | task/goal8-data-expansion | #13 | Needs review | 240 tests passing, TypeScript clean. Dev Run #26: addressed all 3 reviewer issues (cron orderBy, 6 electronics subcategories, leather material). |

## Upcoming (needs TRD)

| Priority | Goal | Status | Blocker |
|----------|------|--------|---------|
| P2 | Goal 9 — Product Comparison & Social Features | needs TRD | Awaiting PM to write TRD |

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
| Goal 7 — AdSense Integration & Required Legal Pages | #11 | 2026-07-30 | merged into goal6 branch (not main); re-opened as PR #12 |

## Notes

- **Pipeline status:** Goals 1–6 + env-split merged to main. Goal 7 re-targeted PR #12 awaiting review. Goal 8 in review (PR #13, 240 tests). Goal 9 awaiting TRD.
- **PR #12 (Goal 7 re-targeted):** 212 tests passing. Includes privacy pages, footer, cookie consent, AdSense loader, ad slots, robots.txt, and AdSense env vars. Dev Run #27: all 3 reviewer issues fixed (consent constants extracted to src/lib/consent.ts, aria-modal removed, env imports switched to @/lib/env.client).
- **PR #13 (Goal 8):** 240 tests passing. Confidence tiers (HIGH/MEDIUM/LOW), subcategory profiles (15 profiles across 5 categories), product overrides, 104 seeded products (26 HIGH confidence), textile alias fix in material-parser, lookup returns breakdown, 2 new cron routes, stale commodity detection, /admin/coverage page. Dev Run #26: all 3 reviewer issues fixed.
- **Next cycle:** Zach reviews/merges PR #12 + PR #13 → PM writes Goal 9 TRD → Dev implements Goal 9.
