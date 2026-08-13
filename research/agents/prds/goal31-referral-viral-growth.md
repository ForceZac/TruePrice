# PRD: Goal 31 — Referral & Viral Growth Program

- **Goal reference:** Goal 31 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 10 (User Accounts), Goal 5 (Product Page UI), Goal 9 (Comparison & Social)
- **Proposed by:** PM Run #242 (2026-08-12)

---

## Problem Statement

TruePrice creates genuine "wow" moments — discovering a $80 sneaker costs $6 to make is the kind of fact people want to tell their friends. Goal 9 (Comparison & Social) added OG images and share buttons so users can broadcast discoveries. But sharing is anonymous and unattributed: when a friend clicks a shared link, lands on TruePrice, and signs up, there is no mechanism to (a) attribute that signup to the person who shared, (b) reward the referrer, or (c) welcome the new user in a way that connects them to what they came to see.

Three concrete gaps:

1. **Viral shares don't convert into users.** When someone tweets "I can't believe this phone costs $340 to make — check this out [link]," anyone who clicks lands on the product page. Some of them sign up. TruePrice has no idea who referred them, can't reward the referrer, and can't close the loop. Unattributed virality is wasted acquisition.

2. **No personal invite mechanic.** Word-of-mouth from friends-to-friends (not public social posts) is higher-converting than broadcasts. A user who thinks "my skeptical friend would love this" has no shareable link that says "my friend Zach showed me this" — just a raw URL. A personalized referral link with a small reward (a badge, a "first to find this" acknowledgment) converts better than a cold URL because it carries social proof from someone the recipient trusts.

3. **No incentive for power users to advocate.** Users who visit TruePrice regularly, maintain a watchlist, and set price alerts are TruePrice's most valuable organic marketers. There is no acknowledgment of this behavior, no referral dashboard to see how many people they've brought in, and no reward that signals TruePrice values their advocacy. A lightweight referral program converts passive advocates into active recruiters.

---

## User Stories

**US-1 — Generate a personal referral link**
As a logged-in user, I want to generate a personal referral link I can share with friends, so that when they sign up through my link, my contribution is recognized.

**US-2 — See how many people I've referred**
As a user who has shared my referral link, I want to see a simple stats page ("You've referred 3 people") so I can gauge my impact and be motivated to share more.

**US-3 — New user lands on a personalized welcome**
As a new user who clicked a friend's referral link, I want to see a personalized welcome message ("Zach found something shocking — here's the product that started it") when I arrive, so the social context travels with the link and makes my first experience feel warm rather than cold.

**US-4 — Earn a referral badge**
As a user who has successfully referred at least one person, I want to receive a "TruePrice Advocate" badge displayed on my profile, so there's a tangible acknowledgment of my contribution.

**US-5 — Share a product with a referral link attached**
As a user viewing a product page, I want a "Share & Earn" button that generates a referral-tagged URL for that specific product, so I can share the exact markup discovery that prompted me to invite someone.

---

## Requirements

### Must-Have

- **`ReferralService`** (`src/services/ReferralService.ts`) — sole owner of referral code generation, attribution, and stats. Methods:
  - `getOrCreateCode(userId)` — returns the user's referral code (creates one if none exists). Codes are 8-character alphanumeric, unique, stored in `User.referralCode`.
  - `trackClick(code, referredProductId?)` — increments `Referral.clickCount`, stores the optional `referredProductId` for the welcome page. Called by the `/r/[code]` route.
  - `attributeSignup(newUserId, code)` — links the new user to the referrer in the `Referral` table. Sets `referral.convertedAt`. Called during sign-up if a referral cookie is present. Idempotent — no double-attribution if called twice.
  - `getReferralStats(userId)` — returns `{ code, clickCount, convertedCount, badge: boolean }` for the referral dashboard.
  - `awardBadgeIfEligible(userId)` — checks if referrer has ≥ 1 successful conversion; if so, sets `User.referralBadge = true`. Called after `attributeSignup`.

- **Schema additions.** Extend the Prisma schema:
  - `User` model: add `referralCode String? @unique`, `referralBadge Boolean @default(false)`.
  - New `Referral` model: `id` (cuid), `referrerId` (FK → User), `referredProductId` (FK → Product, optional — the product being shared when the link was generated), `refereeId` (FK → User, optional — null until signup), `clickCount` (int, default 0), `convertedAt` (DateTime, optional), `createdAt`, `updatedAt`. Unique constraint: one `Referral` record per `referrerId`. (All clicks and conversions aggregate into a single referral record per user; simplest model for v1.)

- **`/r/[code]` route** (`src/app/r/[code]/page.tsx`) — server-rendered page that:
  1. Looks up the referral code via `ReferralService.trackClick(code, referredProductId?)`.
  2. Sets an `HttpOnly` cookie `tp_ref=<code>` with `maxAge` of 30 days, `sameSite: lax`.
  3. If `referredProductId` is present, redirects to `/product/[referredProductId]?ref=<code>` so the new user lands on the product that prompted the share.
  4. If no `referredProductId`, redirects to `/?ref=<code>` (homepage with a welcome banner).
  5. On redirect destination: if `?ref=<code>` is in the URL, display a dismissible welcome banner: "Welcome! [Referrer name] found something worth seeing on TruePrice." Banner is a server component reading the referrer's name from the code lookup.

- **Sign-up attribution.** In the NextAuth `signIn` callback (or `events.createUser` handler): read the `tp_ref` cookie; if present, call `ReferralService.attributeSignup(newUserId, code)`. Clear the cookie after attribution.

- **Referral dashboard** (`/account/referrals`). Simple page showing:
  - User's referral link (copy-to-clipboard button)
  - Stats: `clickCount` clicks, `convertedCount` signups
  - Referral badge status ("Advocate" badge if earned; "Refer 1 friend to earn your badge" if not)
  - Share buttons: copy link, share to Twitter/X (pre-composed tweet: "I found the true manufacturing cost of [product] on @TruePrice — it's shocking: [link]"), WhatsApp (mobile-only)
  - Link to the page from the account nav (`/account`)

- **"Share & Earn" button on product pages.** For logged-in users, the existing share section gains a "Share & Earn" button that calls `ReferralService.getOrCreateCode(userId)` server-side and generates a URL: `https://trueprice.app/r/[code]?product=[productId]`. For logged-out users, shows "Sign in to earn referral credit" text link instead.

- **`tsc --noEmit` clean; unit tests for `ReferralService`:** `getOrCreateCode` (creates code if missing, returns existing if present), `trackClick` (increments count, handles unknown code gracefully), `attributeSignup` (idempotent, no double-attribution), `getReferralStats`, `awardBadgeIfEligible` (awards at ≥ 1 conversion, does not re-award).

### Should-Have

- **Referral badge on profile page.** If `User.referralBadge = true`, display an "Advocate" badge on the user's public profile (if a public profile page exists or is added in a later goal). For v1: badge shown in account nav or `/account` page header.
- **Referral welcome email.** When `attributeSignup()` succeeds, send the referrer a transactional email via `NotificationService.sendEmail()`: "Good news — someone signed up through your link!" One email per conversion; rate-limited to once per day if multiple conversions happen. Gate on `RESEND_API_KEY` presence.
- **Admin referral overview.** A tab on the existing admin pages (`/admin/referrals`) showing total referral links generated, total clicks, total conversions, top referrers by conversion count. Read-only; uses Prisma aggregates from the `Referral` table.

### Won't Have (v1)

- Monetary rewards (cash, credits, discounts) — the badge is the only incentive for v1; monetary rewards require payment infrastructure and T&Cs
- Multi-tier referral ("refer someone who refers someone") — single-hop only; multi-hop adds attribution complexity with minimal gain at TruePrice's current scale
- Referral leaderboard (public ranking of top referrers) — gamification feature; deferred; privacy implications if users don't expect their activity to be public
- Time-limited referral campaigns ("refer 3 friends in 7 days, unlock X") — deferred; requires campaign management tooling
- Fraud detection (fake account spam, referral rings) — deferred; implement only if abuse is observed post-launch

---

## Acceptance Criteria

- [ ] Logged-in users can generate a referral link from `/account/referrals` or from any product page "Share & Earn" button
- [ ] Clicking a referral link sets a `tp_ref` cookie and redirects to the product or homepage with a welcome banner showing the referrer's name
- [ ] Welcome banner is dismissible and does not appear on subsequent page loads
- [ ] On signup, if `tp_ref` cookie is present, `ReferralService.attributeSignup()` is called and the cookie is cleared
- [ ] `attributeSignup()` is idempotent — calling it twice for the same user does not create duplicate records
- [ ] Referral dashboard at `/account/referrals` shows correct `clickCount` and `convertedCount`
- [ ] `referralBadge` is set to `true` on the referrer's account after their first successful conversion
- [ ] Logged-out users on product pages see "Sign in to earn referral credit" instead of the Share & Earn button
- [ ] `ReferralService` unit tests pass: code creation, idempotent attribution, badge award, stats query
- [ ] `tsc --noEmit` passes clean; all existing tests continue to pass

---

## Technical Notes

- **SoC:** `ReferralService` owns all referral logic. `UserService` does not call `ReferralService` — referral attribution is handled in the NextAuth callback (infrastructure layer), not in `UserService`. Components fetch referral stats via TanStack Query (`useReferralStats()` hook) — no direct service imports in client components.
- **Code generation:** Use `nanoid(8)` (already a transitive dep via NextAuth) with the default URL-safe alphabet. Codes are case-sensitive, 8 chars, ~47 bits of entropy — sufficient for non-adversarial use at TruePrice's scale. Store in `User.referralCode` with a `@unique` DB constraint.
- **Cookie security:** `HttpOnly: true`, `sameSite: lax`, `secure: true` in production. `maxAge: 30 * 24 * 60 * 60` (30 days). The cookie survives across sessions so a user who clicks a referral link but doesn't sign up immediately still gets attributed if they sign up later from the same browser.
- **Welcome banner:** Server component at the redirect destination reads the referral code from the URL param (`?ref=<code>`), fetches the referrer's name (first name only, from `User.name`), renders the banner. The banner itself is a client component (dismissible via `useState`; state not persisted — reappears on hard reload, disappears on dismiss). No cookie needed for banner dismissal.
- **Referral product link:** `/r/[code]?product=[productId]` — the `product` param is an optional product ID. `trackClick` records `referredProductId` if the param is a valid product ID (validate with `ProductService.exists(productId)` to prevent arbitrary IDs). If invalid, ignore gracefully.
- **New env vars:** None required. Existing `NEXTAUTH_SECRET` covers cookie signing; `RESEND_API_KEY` (already optional) gates the conversion email.
- **Performance:** `getOrCreateCode` is a server-side call on product page render (logged-in users only). It's a single Prisma upsert — negligible latency. The "Share & Earn" button uses a server action so the code is generated on demand, not on every product page load.

---

## Open Questions

**Q31-1: Should the referral badge be the only incentive, or should early referrers get a "Founding Advocate" distinction?**
If Zach wants to reward the first N referrers (e.g., first 100 people to get a conversion) with a rarer "Founding Advocate" badge vs. the standard "Advocate" badge, that's a simple addition: add `referralBadgeTier: 'FOUNDING' | 'STANDARD' | null` to `User`. Adds minimal complexity.
- Suggested default: Single "Advocate" badge for v1. Add tiers in a follow-on run if engagement data shows the badge is motivating behavior worth differentiating.
- **Owner:** Zach | **Priority:** Low — purely cosmetic; resolve before TRD

**Q31-2: Should the referral dashboard show the referred user's name or keep it anonymous?**
Showing "Alice signed up through your link" is more satisfying for the referrer but requires fetching the referee's name from `User` — a minor privacy consideration (the referred user didn't consent to having their signup attributed publicly to a referrer's dashboard).
- Suggested default: Keep it anonymous for v1. Show "3 people signed up through your link," not names. The referrer knows they shared; they don't need to know who specifically clicked.
- **Owner:** Zach | **Priority:** Low — privacy preference; resolve before TRD

**Q31-3: What happens if a referral code is shared publicly (e.g., posted in a Reddit thread) and generates thousands of clicks with no conversions?**
High click count with low conversion would look suspicious in admin reporting and could waste `trackClick` DB writes. Should `clickCount` be rate-limited (e.g., max 1 increment per IP per 24 hours)?
- Suggested default: No rate-limit for v1. At TruePrice's current scale, even a viral Reddit post won't generate enough clicks to cause DB write pressure. Add IP dedup if click counts start looking anomalous post-launch.
- **Owner:** PM/Dev | **Priority:** Low — can be resolved during TRD
