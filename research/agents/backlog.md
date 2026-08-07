# TruePrice Backlog

Last updated: 2026-08-07 (Dev Run #503 — Fix Goal 13 §10 SoC; PR #29 opened; 494/494 tests; tsc clean)

## Active

| Goal | PR | Status | Tests |
|------|----|--------|-------|
| Goal 13 — §10 SoC fix (digest email → NotificationService) | #29 | draft | 494 |
| Goal 15 — User-Submitted Products (final recovery) | #28 | LGTM + MERGEABLE | 492 |

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
| chore: service-layer refactoring | #16 | 2026-07-31 | 06cc5d9 |
| Goal 10 — User Accounts & Watchlist | #17 | 2026-08-01 | e292d87 |
| Goal 11a — Save as Image | #19 | 2026-08-01 | (merged in batch) |
| Goal 11b — Price Alerts | #20 | 2026-08-01 | (merged in batch) |
| chore: fix cron Discord SoC | #22 | 2026-08-01 | (merged in batch) |
| docs: add TRDs + roadmap (Goals 11a/11b/12/13) | #21 | 2026-08-04 | d6f3e66 |
| Goal 12 — Enhanced Search & Discovery | #23 | 2026-08-04 | 5c2e259 |
| Goal 13 — Weekly Digest Email | #24 | 2026-08-04 | 55d2011 |
| Goal 14 — SEO & Core Web Vitals | #25 | 2026-08-07 | d2cf1dc (landed via Dev Run #483 chore; PR #25 auto-closed after rebase) |

## Roadmap Status

- **Shipped:** Goals 1–14 ✅
- **Pending Merge:** Goal 15 (PR #28, LGTM, awaiting /merge)
- **Proposal:** Goals 16–24 (awaiting Zach approval + TRD review)

## Notes

- **PM Run #223 (2026-08-07):** Groomed backlog. TRD Watcher confirms 15/16 VALID. Critical blocker: Goal 13 §10 email dispatch violation (UserService calls Resend directly; should delegate to NotificationService). PR #28 (Goal 15) is LGTM + MERGEABLE but merge blocked until Goal 13 fixed. Recommending: (a) fix Goal 13 email delegation (~15 min), (b) re-validate TRDs, (c) merge PR #28 to finalize product launch.
- **Dev Run #502 (2026-08-07):** No new impl — Goals 1–15 complete; Goals 16–24 all PROPOSAL status awaiting Zach approval + TRDs. Synced PR #28 with main (d843822) → 66ed362. 492/492 tests pass on PR #28; tsc clean. Awaiting /merge for Goal 15.
- **Dev Run #501 (2026-08-07):** Goal 14 code confirmed already on main (landed in chore d2cf1dc, Dev Run #483). Rebase of PR #25 dropped all commits as upstream — PR auto-closed. PR #28 rebased cleanly onto main (442d022) → abe929d. 492/492 tests pass on PR #28; tsc clean. Awaiting /merge for Goal 15.

## TRD Validation (Latest)

**15/16 VALID** — 1 CRITICAL §10 violation:
- Goal 13 email dispatch not delegated to NotificationService
- Blocks PR #28 merge
- Recommended fix: Add NotificationService.sendDigestEmail() + update UserService delegation
- Effort: ~15 minutes
