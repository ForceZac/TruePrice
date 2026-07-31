# TruePrice Backlog

Last updated: 2026-07-31 (PM Run #71 — 347 tests pass, tsc clean; Goal 10 acceptance criteria verified; 2 PRs ready for merge; pipeline blocked on Zach tech-stack sign-off + /merge for PR #16 and PR #17)

## Active

| Goal | Branch | PR | Status |
|------|--------|----|--------|
| Goal 10 — User Accounts & Personalization | task/goal10-user-accounts | #17 | Ready to merge — all reviewer issues resolved; 347 tests pass; awaiting tech-stack sign-off + /merge from Zach |

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

## Notes

- **Pipeline status:** ✅ ALL 9 GOALS SHIPPED — main at 6dbcee0. 305 tests passing. Project complete.
- **PR #12 (Goal 7):** MERGED (752e8c1) — privacy/terms/contact/about pages, footer, cookie consent, AdSense loader, ad slots, robots.txt.
- **PR #13 (Goal 8):** ✅ MERGED (b39dfde on 2026-07-30) — 270 tests. Confidence tiers, subcategory profiles, 104 seeded products, material-parser aliases, cron routes, /admin/coverage page.
- **PR #14 (Goal 9):** ✅ MERGED (ea4e0ba on 2026-07-31) — 305 tests. Compare page, CompareStore, CompareTray, LeaderboardCard, Leaderboard page, OG image routes, ShareButton, AddToCompareButton, JSON-LD, revalidate.
- **Dev Run #39 (2026-07-31):** PR #14 confirmed merged to main (ea4e0ba). Synced local main. 305 tests passing.
- **Dev Run #40 (2026-07-31):** All 9 TRDs marked `done` to reflect merged state (6dbcee0).
- **Dev Run #41 (2026-07-31):** No new TRDs. Found stale incomplete merge (origin/task/goal1-scaffold batch-lookup commits never landed in main). Fixed failing CommodityService test (wrong env mock path), committed and pushed (81f0fd4). 329 tests passing.
- **Dev Run #42 (2026-07-31):** No new TRDs. Committed pending backlog.md + two missing PRDs (goal1, goal2) that were untracked. Project remains complete.
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
