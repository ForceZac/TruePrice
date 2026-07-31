# TruePrice Backlog

Last updated: 2026-07-31 (Dev Run #85 — blocked, no ready TRDs)

## Active

| Goal | Branch | PR | Status |
|------|--------|----|--------|
| Goal 11a — Save as Image | task/goal11a-save-as-image | #19 | Ready for review — 337 tests pass, tsc clean |
| Goal 10 — User Accounts & Personalization | task/goal10-user-accounts | #17 | Ready to merge — 360 tests pass; awaiting tech-stack sign-off + /merge from Zach |

## Upcoming (needs TRD)

| Goal | Notes |
|------|-------|
| Goal 11b — Price Alerts | Depends on Goal 10 merge; TRD needed |

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

## Notes

- **Pipeline status:** ✅ GOALS 1-9 SHIPPED. main has 329 tests (note: earlier entry of 305 was stale — Dev Run #41 batch-lookup fix brought it to 329). Goal 10 & 11a in review.
- **Current PRs:** #19 (Goal 11a ready, 337 tests), #17 (Goal 10 ready, 360 tests), #18 (labor rates fix, DRAFT), #16 (service-layer fix, OPEN)
- **Blockers:** Goal 10 awaits /merge; Goal 11b awaits Goal 10 merge + PM TRD; PR #18 awaits PROPOSAL-001 /approve.
- **Remaining Zach actions:** Goal 10 /merge (PR #17), Goal 11a review (PR #19), PROPOSAL-001 /approve (PR #18), PROPOSAL-002 /approve or /block, AdSense setup (Q7-1, Q7-3).
- **Dev Run #81:** Goal 11a extraction (Save as Image, no Goal 10 dependency), SaveAsImageButton component, 7 new tests, PR #19 opened.
- **Dev Run #82:** Goal 11a ACs verified complete, TRD updated.
- **PM Run #83:** Standup check — Goals 1-9 shipped, Goal 11a in draft review, Goal 10 ready awaiting approval.
- **Dev Run #83:** Goal 11a polish — raw button → shadcn Button (outline/sm), loading state (isPending) with "Saving…" label, setIsPending in finally. Added loading-state test → 337 tests. TRD: added Tasks section (all checked), status in-progress → done. Reviewer blockers (dom-to-image-more approval, non-blocking shadcn/loading) now resolved.
- **Dev Run #84:** Goal 11a complete — promoted PR #19 from Draft to Ready for Review. 337 tests pass, tsc clean. Blocker: Goal 11b awaits Goal 10 (/merge on PR #17) + TRD authoring by PM.
- **Dev Run #85:** All TRDs done. No ready TRDs to implement. Confirmed main=329 tests. Blocker posted to #main. Pending: /merge PR #17, /approve PROPOSAL-001, /approve or /block PROPOSAL-002.
