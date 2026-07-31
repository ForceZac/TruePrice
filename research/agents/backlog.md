# TruePrice Backlog

Last updated: 2026-07-31 (Dev Run #88 — conflict resolved: PR #16 merged to main (06cc5d9); Goal 10 PR #17 still awaiting /merge; 360 tests pass)

## Active

| Goal | Branch | PR | Status |
|------|--------|----|--------|
| Goal 10 — User Accounts & Personalization | task/goal10-user-accounts | #17 | Ready to merge — all reviewer issues resolved; 360 tests pass; awaiting tech-stack sign-off + /merge from Zach |
| Goal 11b — Price Alerts | task/goal11b-price-alerts | #20 | Ready for review — all ACs done, 385 tests pass, tsc clean; depends on Goal 10 merge |

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
| Goal 8 — Data Expansion & Accuracy Improvements | #13 | 2026-07-30 | b39dfde |
| Goal 9 — Product Comparison & Social Features | #14 | 2026-07-31 | ea4e0ba |
| chore: service-layer refactoring | #16 | 2026-07-31 | 06cc5d9 |

## Notes

- **Pipeline status:** ✅ ALL 9 GOALS SHIPPED — main at 6dbcee0. 305 tests passing. Project complete.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** ✅ MERGED (b39dfde on 2026-07-30) — 270 tests. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page.
- **PR #14 (Goal 9):** ✅ MERGED (ea4e0ba on 2026-07-31) — 305 tests. Compare page, CompareStore, CompareTray, LeaderboardCard, Leaderboard page, OG image routes, ShareButton, AddToCompareButton, JSON-LD, revalidate.
- **PR #16 (service-layer):** ✅ MERGED (06cc5d9 on 2026-07-31) — service violations moved from routes to service layer; JSDoc fix on forceReEstimate.
- **Dev Run #39 (2026-07-31):** PR #14 confirmed merged to main (ea4e0ba). Synced local main. 305 tests passing.
- **Dev Run #40 (2026-07-31):** All 9 TRDs marked `done` to reflect merged state (6dbcee0).
- **Dev Run #41 (2026-07-31):** No new TRDs. Found stale incomplete merge (origin/task/goal1-scaffold batch-lookup commits never landed in main). Fixed failing CommodityService test (wrong env mock path), committed and pushed (81f0fd4). 329 tests passing.
- **Dev Run #42 (2026-07-31):** No new TRDs. Committed pending backlog.md + two missing PRDs (goal1, goal2) that were untracked. Project remains complete.
- **Dev Run #43 (2026-07-31):** Post-completion service-layer refactoring — moving Prisma violations from routes to service layer. 5 commits staged on task/fix-service-layer-to-main. PR #16 opened (DRAFT).
- **Dev Run #54 (2026-07-31):** Applied reviewer JSDoc fix on `forceReEstimate` (returns null, not throws). 358/358 tests passing, tsc clean. PR #16 marked ready for review.
- **Remaining Zach actions:** Q7-1 (AdSense publisher ID), Q7-3 (Privacy Policy data scope), Q-INFRA-2 (Discord allowlist — run `/discord:access`).
- **Dev Run #63 (2026-07-31):** 347 tests pass, tsc clean. No new TRDs. Updated PROJECT_KEYS.md to document Goal 10 additions (next-auth, @auth/prisma-adapter, resend in Section 3; new env vars in Section 7; UserService in Section 10; Goal 10 in Section 12 roadmap). Committed e814e20 to task/goal10-user-accounts. PR #17 ready to merge; PR #16 (service-layer) also awaiting /merge.
- **Dev Run #64 (2026-07-31):** 347 tests pass, tsc clean. All Goal 10 acceptance criteria verified against implementation. No new TRDs. PR #17 already open (not draft). No new work — pipeline blocked on Zach's tech-stack sign-off (next-auth, resend, @auth/prisma-adapter) + /merge.
- **Dev Run #65 (2026-07-31):** 347 tests pass, tsc clean. No new TRDs or work. Pipeline still blocked on Zach: PR #16 + PR #17 awaiting /merge; tech-stack approval required for next-auth, @auth/prisma-adapter, resend. Discord post failed (channel not allowlisted — needs `/discord:access`).
- **Dev Run #66 (2026-07-31):** Project Manager standup run. Status unchanged: 347 tests pass, tsc clean. Goal 10 (PR #17) + service-layer fixes (PR #16) both ready to merge, awaiting Zach's tech-stack approval + /merge authorization.
- **Dev Run #67 (2026-07-31):** Developer run. 347 tests pass, tsc clean. No new TRDs. Pipeline still blocked on Zach: PR #16 + PR #17 awaiting tech-stack sign-off (next-auth, @auth/prisma-adapter, resend) + /merge. No new implementation work.
- **Dev Run #68 (2026-07-31):** Developer run. 347 tests pass, tsc clean. No new TRDs. Pipeline still blocked on Zach: PR #16 + PR #17 awaiting tech-stack sign-off (next-auth, @auth/prisma-adapter, resend) + /merge. No new implementation work.
- **Dev Run #69 (2026-07-31):** Developer run. 347 tests pass, tsc clean. No new TRDs. Pipeline still blocked on Zach: PR #16 + PR #17 awaiting tech-stack sign-off (next-auth, @auth/prisma-adapter, resend) + /merge. No new implementation work.
- **PM Run #70 (2026-07-31):** Project Manager standup. Status snapshot: Goals 1–9 complete (305 tests from Goal 9), Goal 10 in-progress (PR #17 open, all acceptance criteria met, 347 tests pass, tsc clean). Pipeline blocked: awaiting Zach tech-stack approval (next-auth, @auth/prisma-adapter, resend) + `/merge` authorization for PR #16 (service-layer) and PR #17 (Goal 10).
- **Dev Run #71 (2026-07-31):** Developer run. 347 tests pass, tsc clean. No new TRDs. Pushed 2 backlog-update commits to origin. Pipeline still blocked on Zach: PR #16 + PR #17 awaiting tech-stack sign-off (next-auth, @auth/prisma-adapter, resend) + /merge. No new implementation work available.
- **Dev Run #72 (2026-07-31):** Implemented missing acceptance criterion 8 — localStorage recently-viewed sync on sign-in (c0491ec). Added: `recentlyViewedLocal.ts` (localStorage utils), `AuthProvider.tsx` (SessionProvider wrapper), `PostSigninSync.tsx` (detects auth, calls merge, clears localStorage), `mergeLocalRecent()` in `api.ts`. Updated `POST /api/user/recent` to make `productId` optional for local-only merges. `ProductPageClient` now writes to localStorage for unauthenticated users and merges on first authenticated view. 347 tests pass, tsc clean. Pushed to task/goal10-user-accounts; PR #17 updated.
- **PM Run #71 (2026-07-31):** Project Manager standup. Status: Goals 1–9 complete, Goal 10 ready for merge (all acceptance criteria verified, 347 tests pass, tsc clean). PR #17 and PR #16 both open and ready. Pipeline blocked on Zach: tech-stack approval (next-auth, @auth/prisma-adapter, resend) + `/merge` authorization. Posted standup to #standup (1494239168954503358).
- **Dev Run #73 (2026-07-31):** Developer run. Full audit of Goal 10 implementation — all 17 acceptance criteria confirmed implemented (auth.ts, NextAuth route, UserService, all API routes, SaveButton, useWatchlist hook, login/dashboard/settings pages, PostSigninSync, AuthProvider, recentlyViewedLocal). 347 tests pass, tsc clean. No new TRDs. Pipeline still blocked on Zach: PR #16 + PR #17 awaiting tech-stack sign-off (next-auth, @auth/prisma-adapter, resend) + /merge. No new implementation work.
- **Dev Run #74 (2026-07-31):** Developer run. 347 tests pass, tsc clean. No new TRDs. All Goal 10 files confirmed in place (auth.ts, SaveButton, useWatchlist, UserService, all API routes, dashboard/login/settings pages, weekly-digest cron). Pipeline still blocked on Zach: PR #16 + PR #17 awaiting tech-stack sign-off (next-auth, @auth/prisma-adapter, resend) + /merge. No new implementation work.
- **Dev Run #75 (2026-07-31):** Developer run. 347 tests pass, tsc clean. No new TRDs. All Goal 10 files confirmed in place. PRs #16 + #17 open and ready. Pipeline blocked on Zach: tech-stack sign-off (next-auth, @auth/prisma-adapter, resend) + /merge. No new implementation work.
- **Dev Run #76 (2026-07-31):** Developer run. 347 tests pass, tsc clean. No new TRDs. PRs #16 (service-layer) + #17 (Goal 10) both open and ready to merge. Pipeline still blocked on Zach: tech-stack approval (next-auth, @auth/prisma-adapter, resend) + /merge. No new implementation work.
- **PM Run #77 (2026-07-31):** Project Manager standup. Backlog grooming: Goals 1–9 complete and merged. Goal 10 (PR #17) + service-layer fixes (PR #16) both open and ready to merge; all acceptance criteria verified, 347 tests pass, tsc clean. Pipeline blocked: awaiting Zach's tech-stack approval for next-auth, @auth/prisma-adapter, resend + `/merge` authorization. No new TRDs.
- **Dev Run #78 (2026-07-31):** Developer run. 347 tests pass, tsc clean. No new TRDs. PRs #16 (service-layer) + #17 (Goal 10) both open and ready to merge. Pipeline still blocked on Zach: tech-stack approval (next-auth, @auth/prisma-adapter, resend) + /merge. No new implementation work.
- **PM Run #79 (2026-07-31):** Project Manager standup. Backlog grooming: Goals 1–9 complete and merged. Goal 10 (PR #17) + service-layer fixes (PR #16) both open and ready to merge; all 17 acceptance criteria fully implemented and verified, 347 tests pass, tsc clean. Pipeline blocked: awaiting Zach's tech-stack approval for next-auth, @auth/prisma-adapter, resend + `/merge` authorization. Draft PR #18 (labor-rates-2026 fix). No new TRDs.
- **Dev Run #80 (2026-07-31):** Addressed reviewer follow-ups on PR #17. (1) Fixed P2002 race condition in `addToWatchlist` — `create` now wrapped in try-catch; P2002 unique-constraint errors returned as `alreadySaved: true` instead of throwing. (2) Created `src/lib/__tests__/recentlyViewedLocal.test.ts` — 10 tests covering addLocalRecentView, getLocalRecentIds, clearLocalRecentIds. (3) Added 2 new UserService tests: P2002 race case and non-P2002 re-throw. 360 tests pass (was 347), tsc clean. Pushed 86e9cc5 to task/goal10-user-accounts. PR #17 now fully addresses all reviewer items.
- **Dev Run #86 (2026-07-31):** Implemented Goal 11b — Price Alerts. Full implementation: schema (AlertLog model, User/SavedProduct alert fields), migration 20260731000002, AlertService (checkWatchlistAlerts, getAlertHistory, threshold/rate-limit helpers), PATCH /api/user/alert-settings, GET /api/user/alerts, AlertSettingsForm component, /dashboard/settings Alert Settings section. 25 new AlertService tests. 385 tests pass, tsc clean. Opened draft PR #20 (base: task/goal10-user-accounts).
- **Dev Run #87 (2026-07-31):** PR #20 promoted draft → ready for review. 385 tests pass, tsc clean.
- **Dev Run #88 (2026-07-31):** Resolved merge conflict in task/goal10-user-accounts — PR #16 (service-layer) confirmed merged to main (06cc5d9). Backlog updated to reflect PR #16 complete. 360 tests pass, tsc clean.
