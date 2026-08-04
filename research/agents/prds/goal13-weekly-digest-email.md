# PRD — Goal 13: Weekly Digest Email

**Goal reference:** Goal 13 — Weekly Digest Email
**Depends on:** Goal 10 (User Accounts — Resend, `digestEnabled`, `UserService`), Goal 11b (Price Alerts — `AlertService`, opt-out patterns)
**Written:** 2026-08-01 (PM Run #141)

---

## Problem Statement

Goal 10 scaffolded the plumbing for weekly digest emails: the `resend` package is installed, `User.digestEnabled` is in the schema (opt-out by default), `FROM_EMAIL` is a documented env var, and `UserService` owns digest candidates. But the actual digest cron, email template, and unsubscribe mechanism were deferred to "v2."

Signed-in users who add products to their watchlist have no ongoing reason to return to the site unless they happen to remember it. A weekly digest surfacing watchlist changes, new market prices, and platform-wide "most shocking" picks is the primary retention loop for authenticated users.

Without it, there's no email → site traffic loop and no way to reclaim churned users.

---

## User Stories

- **Watchlist owner:** "I added 8 products to my watchlist — I want a weekly summary showing how their markup has changed."
- **Casual browser:** "I signed up but haven't been back in 2 weeks. A good weekly highlight reel would pull me back."
- **Privacy-conscious user:** "I want a one-click unsubscribe link in every digest so I can opt out without digging through settings."
- **Power user:** "If none of my watchlisted products have had cost changes this week, I don't want a pointless email."
- **New user:** "I signed up 3 days ago but haven't added anything to my watchlist. I shouldn't get a digest yet."

---

## Requirements

### Must-Have

- **Weekly digest cron** — `GET /api/cron/send-digest` runs weekly at Saturday 08:00 UTC. Vercel Cron job definition in `vercel.json`.
- **Send to eligible users only** — A user is eligible if: `digestEnabled: true` AND has ≥1 item on their watchlist. Users with empty watchlists are skipped (no "empty" digest emails).
- **Watchlist section** — Up to 5 watchlisted products shown per digest. Each card shows: product name, latest markup multiplier, cost breakdown total, and a link to the product page.
- **Platform highlights** — 3 "Most Shocking Markups" platform-wide (same logic as Goal 12's `DiscoveryService.getMostShocking()`; if Goal 12 isn't merged yet, inline the query in `UserService`).
- **One-click unsubscribe** — Each digest contains a signed unsubscribe link (`/api/account/unsubscribe?token=<JWT>`). Clicking it sets `User.digestEnabled = false` without requiring sign-in. Token expires after 30 days.
- **Rate-limit guard** — If Resend is unreachable or returns a non-2xx, log the error and continue to next user. Do NOT crash the cron run.

### Should-Have

- **"No changes" skip** — If none of the user's watchlisted products had a cost breakdown re-estimation in the last 7 days, skip sending (no staleness to surface). Log skipped count in cron response.
- **Plain-text fallback** — Every email includes a `text` part for email clients that don't render HTML.
- **Unsubscribe from dashboard** — `dashboard/settings/page.tsx` already has alert settings; add a "Weekly Digest" toggle calling `PATCH /api/account/preferences`.

### Won't Have (this goal)

- ML-based personalized recommendations
- Frequency preference (weekly only; daily / monthly cadence deferred)
- Re-subscribe flow (setting `digestEnabled = true` via email link; users re-enable from dashboard settings)
- A/B tested subject lines or send-time optimization
- Open/click tracking pixels

---

## Acceptance Criteria

1. `GET /api/cron/send-digest` protected by `CRON_SECRET` (same as other cron routes).
2. Users with `digestEnabled: false` receive no email.
3. Users with `digestEnabled: true` but empty watchlist receive no email.
4. Users with ≥1 watchlist item receive an email containing: their watchlist products (up to 5), 3 platform-wide highlights, and a working unsubscribe link.
5. Clicking the unsubscribe link sets `User.digestEnabled = false` without requiring sign-in. Subsequent cron runs skip them.
6. Expired unsubscribe tokens (>30 days) return a 400 with a friendly message.
7. Resend API failure for one user does not stop the cron from processing remaining users.
8. Cron response body includes `{ sent: N, skipped: N, errors: N }`.
9. TypeScript compiles clean. All existing tests pass. ≥10 new tests covering: eligible user selection, skip-empty-watchlist, token signing/verification, token expiry, send error resilience, unsubscribe endpoint.

---

## Technical Notes

- **New cron route:** `GET /api/cron/send-digest` (handler delegates entirely to `UserService.sendWeeklyDigests()`). Register in `vercel.json`: `"cron": "0 8 * * 6"` (Saturday 08:00 UTC).
- **`UserService.getDigestCandidates()`** — already planned in Goal 10's architecture. Returns users with `digestEnabled: true` and ≥1 `SavedProduct`. Paginate with cursor if user count is large (>500).
- **Unsubscribe token:** `jsonwebtoken` (already in project via `next-auth`). Sign `{ userId, action: 'unsubscribe-digest' }` with `DIGEST_UNSUBSCRIBE_SECRET` (new env var), 30-day expiry.
- **Unsubscribe endpoint:** `GET /api/account/unsubscribe?token=<JWT>` — verifies, sets `digestEnabled = false`, redirects to a confirmation page (`/account/unsubscribed`).
- **Email template:** Use Resend's React Email SDK (`@react-email/components`) or a plain HTML string. If React Email, create `src/emails/WeeklyDigest.tsx`. Keep bundle small — do not import full shadcn/ui into email template.
- **`FROM_EMAIL`** env var already defined (default `digest@trueprice.app`). New var: `DIGEST_UNSUBSCRIBE_SECRET` (required; cron skips email send if missing, logs warning).
- **No Resend calls in components or API routes** — all send logic lives in `UserService`.
- **Goal 12 dependency:** If Goal 12 hasn't merged when this is developed, inline `getMostShocking()` query inside `UserService` temporarily. Remove duplication once Goal 12 lands.

---

## Open Questions

**Q13-1: Unsubscribe token expiry** — 30 days recommended. Shorter (7 days) is more security-conscious but frustrating if a user opens a digest late. Longer (90 days) is lenient but fine for a low-sensitivity action. 30 days is the industry default.
- **Owner:** Zach | **Priority:** Low (30-day default acceptable)

**Q13-2: Email template design** — Does Zach have a preferred style? Options: (A) Plain text, product-list style — fast to build, high deliverability. (B) Simple HTML card layout — more engaging. Recommendation: B (HTML cards), matching TruePrice's Tailwind color palette.
- **Owner:** Zach | **Priority:** Medium — affects user perception of the brand

**Q13-3: Resend plan & rate limits** — Free tier is 100 emails/day (3,000/month). What's the current user count? If >100 registered users, digest needs to stagger sends over multiple days or upgrade plan.
- **Owner:** Zach | **Priority:** High if user count is >100; blocks this goal if not addressed before implementation

**Q13-4: Digest send day/time** — Saturday 08:00 UTC proposed. This is ~3-4am US Eastern. Alternatively: Saturday 12:00 UTC (8am Eastern) — better for US users. Sunday morning also common for digests.
- **Owner:** Zach | **Priority:** Low (can adjust after first run)
