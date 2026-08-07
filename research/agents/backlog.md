# TruePrice Backlog

Last updated: 2026-08-07 (Dev Run #523 — no new impl; synced PR#29 (eb845c1) + PR#28 (553a13a) with main 84ef2a0; 469/469 PR#29, 492/492 PR#28; tsc clean; awaiting /merge)

## Active

| Goal | PR | Status | Tests |
|------|----|--------|-------|
| Goal 13 — §10 SoC fix (digest email → NotificationService) | #29 | OPEN + MERGEABLE | 469 |
| Goal 15 — User-Submitted Products (final recovery) | #28 | OPEN (LGTM) | 492 |

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
- **Proposal:** Goals 16–26 (awaiting Zach approval + TRD review)

## Notes

- **Dev Run #523 (2026-08-07):** No new impl. Main at 84ef2a0; synced PR#29 (eb845c1) + PR#28 (553a13a) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #522 (2026-08-07):** No new impl. Main at f2107fa; synced PR#29 (ea14578) + PR#28 (ef84dc9) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **PM Run #228 (2026-08-07):** Standup posted to #standup. 16/16 TRDs VALID; 469/469 + 492/492 tests passing; tsc clean. PR#29 (Goal 13 §10 SoC) + PR#28 (Goal 15 recovery) both OPEN + MERGEABLE. Zero blockers. Main at 9e00874. Awaiting /merge.
- **Dev Run #521 (2026-08-07):** No new impl. Main at 42bca8f; synced PR#29 (6ce6893) + PR#28 (371ade7) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #520 (2026-08-07):** No new impl. Main at 9e00874; synced PR#29 (8da74be) + PR#28 (63abbb4) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #519 (2026-08-07):** No new impl. Main at d9eee98; synced PR#29 (5b36289) + PR#28 (0d9ed87) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #518 (2026-08-07):** No new impl. Main at 5c02ecc; synced PR#29 (c2c97c4) + PR#28 (adf8cb4) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #517 (2026-08-07):** No new impl. Main at 65b2cd8; synced PR#29 (329ce56) + PR#28 (0b1dcae) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #516 (2026-08-07):** No new impl. Main at 2495b3c; synced PR#29 (4962f79) + PR#28 (2f8fed3) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **PM Run #227 (2026-08-07):** Standup posted to #standup. 16/16 TRDs VALID; 492/492 tests pass; tsc clean. PR#29 (Goal 13 §10 SoC) + PR#28 (Goal 15 recovery) both LGTM + MERGEABLE. Zero blockers. Main at 058fd47 (latest backlog chore from Dev #514). Awaiting /merge.
- **PM Run #225 (2026-08-07):** TRD Watcher confirms 16/16 TRDs VALID (100%); zero blocking violations. Goal 13 fix (email SoC) verified. PR#29 (LGTM, 469/469 tests) + PR#28 (LGTM, 492/492 tests) both MERGEABLE. No blockers. Awaiting /merge command.
- **Dev Run #515 (2026-08-07):** No new impl. Main at 17647c0; synced PR#29 (0b07b89) + PR#28 (a7d076e) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #514 (2026-08-07):** No new impl. Main at 058fd47; synced PR#29 (6be087f) + PR#28 (0b54d8c) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #513 (2026-08-07):** No new impl. Main at 57ea333; synced PR#29 (064bf38) + PR#28 (6efa647) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #512 (2026-08-07):** No new impl. Main at 8cf786b; synced PR#29 (bf5a355) + PR#28 (baa70bb) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #511 (2026-08-07):** No new impl. Main at 2694f0b; synced PR#29 (57a953d) + PR#28 (9855537) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #510 (2026-08-07):** No new impl. Main at c6f375c; synced PR#29 (0eb597c) + PR#28 (68fb42f) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #509 (2026-08-07):** No new impl. Main at a2453f5; synced PR#29 (166c585) + PR#28 (4a1a9df) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #508 (2026-08-07):** No new impl. Main at f8171e8; synced PR#29 (49e0892) + PR#28 (c6bdec6) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #507 (2026-08-07):** No new impl. Main at 15e7e4c; synced PR#29 (4df029e) + PR#28 (9f1326e) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #506 (2026-08-07):** No new impl. Main at bb3faf6; synced PR#29 (edbf4ea) + PR#28 (27912f4) with main. 469/469 PR#29, 492/492 PR#28; tsc clean on both. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **Dev Run #505 (2026-08-07):** No new impl. Main at fec26d0; PRs #28 + #29 still OPEN, in sync with main. Found stale in-progress merge of origin/revert-7-task/goal6-category-browsing in PR#29 worktree — aborted it. 494/494 tests pass on PR#29. New PRDs goal25 (Internationalization) + goal26 (Public API) added as proposals. Goals 16–26 all PROPOSAL, no TRDs. Awaiting /merge for PR#28 + PR#29.
- **PM Run #223 (2026-08-07):** Groomed backlog. TRD Watcher confirms 15/16 VALID. Critical blocker: Goal 13 §10 email dispatch violation (UserService calls Resend directly; should delegate to NotificationService). PR #28 (Goal 15) is LGTM + MERGEABLE but merge blocked until Goal 13 fixed. Recommending: (a) fix Goal 13 email delegation (~15 min), (b) re-validate TRDs, (c) merge PR #28 to finalize product launch.
- **Dev Run #502 (2026-08-07):** No new impl — Goals 1–15 complete; Goals 16–24 all PROPOSAL status awaiting Zach approval + TRDs. Synced PR #28 with main (d843822) → 66ed362. 492/492 tests pass on PR #28; tsc clean. Awaiting /merge for Goal 15.
- **Dev Run #504 (2026-08-07):** No new impl. Synced PR#29 (fix/goal13-notification-soc) and PR#28 (fix/goal15-final-recovery) with main via merge (1f40549). Marked PR#29 DRAFT→OPEN; both OPEN + MERGEABLE. 494/494 PR#29, 492/492 PR#28; tsc clean. No new TRDs for Goals 16+. Awaiting /merge for both PRs.
- **Dev Run #501 (2026-08-07):** Goal 14 code confirmed already on main (landed in chore d2cf1dc, Dev Run #483). Rebase of PR #25 dropped all commits as upstream — PR auto-closed. PR #28 rebased cleanly onto main (442d022) → abe929d. 492/492 tests pass on PR #28; tsc clean. Awaiting /merge for Goal 15.

## TRD Validation (Latest)

✅ **16/16 TRDs VALID** — All standards met. §10 violation fixed in PR#29 (sendDigestEmail delegated to NotificationService). Zero blocking issues. Ready for merge.
