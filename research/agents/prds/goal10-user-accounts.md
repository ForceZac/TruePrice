# PRD: Goal 10 — User Accounts & Personalization

- **Goal reference:** Goal 10 — User Accounts & Personalization (PROPOSED — not yet in roadmap)
- **Status:** Draft — pending Zach approval to add to roadmap
- **Priority:** P1
- **Depends on:** Goal 5 (Product Page UI), Goal 9 (Comparison & Social)
- **Blocks:** nothing (engagement/retention layer)

> **Note:** This goal is not yet in the roadmap. Posting to #main for Zach's approval before scheduling. All scope decisions below are proposals, not commitments.

---

## Problem Statement

Goals 1–9 built a useful, shareable product — users can discover products, see what they cost to make, compare markups, and share their outrage. But there's no continuity between sessions. Every visit starts cold: no history, no saved products, no way to track whether the markup on a product changed since you last checked.

Three concrete problems this creates:

1. **Lost context:** "Recently viewed" in Goal 9 is localStorage-only — it disappears when the user clears their browser or switches devices. There's no durable record of products a user has looked at.

2. **No return-pull:** once a user leaves TruePrice, there's nothing to bring them back. If the commodity price of cotton drops 20% this week, the users who looked at that $80 t-shirt last month have no way to know the markup just got even more dramatic.

3. **No identity for future features:** community features (corrections, voting, comments), contributor credit, and personalized recommendations all require a concept of "user." Without accounts, every future social/community goal is blocked.

This goal adds lightweight authentication and a personal product watchlist. It's intentionally minimal: no social profiles, no public activity, no community features. Just "sign in, save products, get alerts when estimates change."

---

## User Stories

1. **As a returning user**, I want to sign in with Google or email so I can pick up where I left off across devices without remembering a password.

2. **As a user who found a shocking markup**, I want to save that product to my watchlist so I can track whether the estimate changes as commodity prices move.

3. **As a watchlist user**, I want to receive a weekly email digest showing which of my saved products had estimate changes in the past 7 days — so I don't have to check back manually.

4. **As a user who cleared my browser**, I want my recently-viewed products to still appear on my next visit because they're tied to my account, not my device.

5. **As a user with a watchlist**, I want a personal dashboard page (`/dashboard`) that shows all my saved products, their current markup, and any estimates that changed since I last visited.

6. **As a user who no longer wants an account**, I want to delete my account and all associated data from the Settings page, and receive confirmation that it's gone.

---

## Requirements

### Must-Have

- **Authentication** via NextAuth.js (or equivalent). Providers: Google OAuth + magic-link email (no passwords). Session stored in a signed JWT cookie.
- **User model** in Prisma: `User` (id, email, name, image, createdAt) + `Account` (OAuth provider records) + `Session` tables — standard NextAuth schema.
- **Watchlist** — `SavedProduct` join table (`userId`, `productId`, `savedAt`). Max 50 products per user (soft limit; show warning at 45).
- **Save/unsave button** on every product page and compare page. Button state reflects current watchlist status (client-side optimistic update via TanStack Query mutation).
- **Personal dashboard** at `/dashboard` — lists saved products with current markup, confidence tier, and "updated X days ago" freshness indicator. Requires sign-in; redirects to `/login` if not authenticated.
- **Cross-device recently viewed** — on sign-in, merge localStorage recently-viewed IDs into a `RecentlyViewed` DB table (`userId`, `productId`, `viewedAt`). Subsequent page views write to DB. `/dashboard` shows last 10 recently viewed products.
- **Account settings** at `/dashboard/settings` — display name, email (read-only for OAuth users), and a "Delete account" button that wipes `User`, `SavedProduct`, and `RecentlyViewed` rows.
- **API routes:**
  - `GET /api/user/watchlist` — current user's saved products
  - `POST /api/user/watchlist` — add product to watchlist
  - `DELETE /api/user/watchlist/[productId]` — remove from watchlist
  - `GET /api/user/recent` — recently viewed products
  - `POST /api/user/recent` — record a product view
  - `DELETE /api/user` — delete account (hard delete)

### Should-Have

- **Weekly email digest** — Vercel Cron (weekly Mon 09:00) queries watchlist products whose `CostBreakdown.calculatedAt` is within the past 7 days and `markupPercent` changed by >5%. Sends a summary email via Resend (or similar). Format: text/HTML listing product name, old markup %, new markup %, change direction.
- **"Save to watchlist" prompt on product pages for signed-out users** — a soft nudge ("Sign in to save this product and get notified of estimate changes") with a dismissible banner, not a modal gate.
- **Sign-in page** at `/login` — Google button + email input for magic link. No username/password form.
- **Redirect-after-login** — preserve the product page the user was on before clicking Sign In; return there after auth completes.

### Won't-Have (v1)

- Public user profiles or activity feeds
- Social follow / friend connections
- Sharing watchlists with other users
- Community product corrections or voting (deferred to a future goal)
- "Copy to image" feature (deferred from Goal 9 Q9-4 — revisit as Goal 11)
- Native push notifications (web push) — email only for v1
- Username or display name customization beyond what OAuth provides
- Admin tools for managing users

---

## Acceptance Criteria

- [ ] User can sign in with Google OAuth; session persists across browser closes (persistent cookie)
- [ ] User can sign in via magic-link email; link expires after 15 minutes
- [ ] `POST /api/user/watchlist` with a valid `productId` saves a `SavedProduct` row; returns 409 if already saved
- [ ] `DELETE /api/user/watchlist/[productId]` removes the row; returns 404 if not saved
- [ ] Save button on product page shows filled/unfilled state reflecting watchlist membership; state updates optimistically on click
- [ ] `/dashboard` renders for authenticated users: saved products list + recently viewed list
- [ ] `/dashboard` redirects unauthenticated users to `/login?next=/dashboard`
- [ ] Recently viewed products sync from localStorage to DB on sign-in (merge, no duplicates)
- [ ] Product page views write a `RecentlyViewed` row for authenticated users (debounced — one write per product per session)
- [ ] `/dashboard/settings` shows account info and a "Delete account" button with a confirmation dialog
- [ ] Account deletion removes `User`, all `SavedProduct`, and all `RecentlyViewed` rows; session is invalidated
- [ ] `GET /api/user/watchlist` returns 401 for unauthenticated requests
- [ ] All new API routes return appropriate status codes
- [ ] TypeScript compiles clean
- [ ] Weekly digest cron: identifies products with >5% markup change in last 7 days; sends email to users with those products saved (mocked in tests; real send guarded by env var)
- [ ] Unit tests: watchlist CRUD, recently-viewed merge logic, digest query logic
- [ ] Playwright e2e: sign in flow, save/unsave product, dashboard renders saved product

---

## Technical Notes

- **Auth library:** NextAuth.js v5 (App Router native). Config at `src/lib/auth.ts`. Session exposed via `auth()` server-side and `useSession()` client-side.
- **New Prisma models:** `User`, `Account`, `Session`, `VerificationToken` (standard NextAuth schema), `SavedProduct`, `RecentlyViewed`. Migration required.
- **No user data beyond auth + watchlist** — no analytics, no behavioral tracking. Privacy Policy can be updated to reflect "account data and product watchlist stored; deleted on request."
- **Email provider:** Resend (`resend.com`) is the recommended transactional email service. Requires `RESEND_API_KEY` env var. Add to `env.server.ts`.
- **New env vars needed:**
  - `NEXTAUTH_SECRET` — JWT signing key
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
  - `RESEND_API_KEY` — email sends
  - `FROM_EMAIL` — sender address for digest emails
- **Watchlist API security:** all `/api/user/*` routes must verify session via `auth()` before touching DB. No user can access another user's watchlist.
- **Cron route:** `GET /api/cron/weekly-digest` — Vercel Cron (weekly Mon 09:00). Add to `vercel.json`. Auth via `CRON_SECRET` header (same pattern as existing cron routes).
- **Save button component:** `<SaveButton productId={id} />` — client component that uses TanStack Query `useWatchlist(productId)` hook for state and `useSaveProduct()` / `useUnsaveProduct()` mutations. Optimistic update pattern.
- **Account deletion:** use Prisma `$transaction` to delete all user rows atomically. Invalidate the session after deletion completes.
- **New routes/components:**
  - `app/login/page.tsx` — sign-in page (server component)
  - `app/dashboard/page.tsx` — personal dashboard (server component, requires auth)
  - `app/dashboard/settings/page.tsx` — account settings
  - `app/api/auth/[...nextauth]/route.ts` — NextAuth handler
  - `app/api/user/watchlist/route.ts` — GET/POST
  - `app/api/user/watchlist/[productId]/route.ts` — DELETE
  - `app/api/user/recent/route.ts` — GET/POST
  - `app/api/user/route.ts` — DELETE (account)
  - `app/api/cron/weekly-digest/route.ts` — digest cron
  - `src/components/atoms/SaveButton.tsx` — save/unsave toggle
  - `src/hooks/useWatchlist.ts` — TanStack Query hook
  - `src/services/UserService.ts` — watchlist CRUD, recently-viewed logic, digest query

---

## Open Questions

1. **NextAuth version:** NextAuth v5 (beta) has breaking changes from v4. Should we use v5 (App Router native, recommended) or v4 (stable but requires compatibility adapter)? Recommend v5 — it's designed for App Router and avoids a later migration.

2. **Magic-link vs. password:** the requirements say no passwords, but some users distrust "click a link in your email" as the only non-Google option. Should we add GitHub OAuth as a third provider? GitHub is common among tech-savvy users who are likely early adopters of TruePrice.

3. **Watchlist limit:** 50 products is proposed as a soft cap. Is this too low (power users may hit it quickly), or should it be unlimited for v1 since storage cost is negligible?

4. **Digest opt-in vs. opt-out:** should the email digest be opt-in (user explicitly enables it in settings) or opt-out (on by default, unsubscribe link in every email)? Opt-out maximizes engagement but risks unsubscribes if the emails aren't valuable. Opt-in is safer for reputation.

5. **Recently viewed merge strategy on sign-in:** if the user has 5 items in localStorage and 5 in the DB from a prior sign-in, do we show all 10 (capped at 10), or deduplicate and show most recent 10? Recommend: merge + deduplicate by productId, keep most-recent viewedAt, cap at 10.
