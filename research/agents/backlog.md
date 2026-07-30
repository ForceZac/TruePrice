# TruePrice Backlog

Last updated: 2026-07-30 (Dev Run #23)

## Active

| Priority | TRD | Goal | Status | Branch | PR | Reviewer | Notes |
|----------|-----|------|--------|--------|-----|----------|-------|
| P1 | goal7-adsense-integration | Goal 7 — AdSense Integration & Required Pages | 🔄 DRAFT PR open | task/goal7-land | #12 | Needs review | 212 tests passing, TypeScript clean. Rebased onto main; dropped reviewer fixes re-applied (publisherId, aria-modal, AdSenseLoader tests, env slot IDs) |

## Upcoming (needs TRD)

| Priority | Goal | Status | Blocker |
|----------|------|--------|---------|
| P2 | Goal 8 — Data Expansion & Accuracy Improvements | PRD ready, needs TRD | — |
| P2 | Goal 9 — Product Comparison & Social Features | PRD ready, needs TRD | — |

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
| Goal 7 — AdSense Integration & Required Pages | #11 | 2026-07-30 | merged into goal6 branch (not main); re-opened as #12 |

## Notes

- **Pipeline status:** Goals 1–7 merged (Goal 7 via rebased PR #12). Goals 8 + 9 PRDs exist; TRDs needed before implementation can start.
- **PR #11 (Goal 7, old):** Was merged into task/goal6-category-browsing AFTER PR #10 merged that branch into main. Changes did NOT land in main. PR #12 (task/goal7-land) is the correct replacement.
- **PR #12 (Goal 7, clean rebase):** Rebased onto current main. Dropped reviewer fixes re-applied manually: AdSlot publisherId + data-ad-client, AdSenseLoader test suite (5 tests), CookieConsent aria-modal, env slot ID vars in env.client.ts. 212 tests passing, TypeScript clean.
- **Goals 8/9:** PRDs at research/agents/prds/goal8-data-expansion.md and goal9-comparison-social.md. PM needs to write TRDs before Dev can implement.
- **Next cycle:** Zach reviews/merges PR #12 → PM writes Goal 8 TRD → Dev implements Goal 8.
