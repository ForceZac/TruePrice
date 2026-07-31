# PRD: Goal 10 — User Accounts & Personalization

- **Goal reference:** Goal 10 — User Accounts & Personalization (proposed; pending roadmap addition)
- **Status:** Draft
- **Priority:** P1
- **Depends on:** Goal 9 (Comparison & Social Features)
- **Blocks:** nothing (engagement/retention layer; not a prerequisite for current features)

---

## Problem Statement

After Goal 9, TruePrice has a full social layer — users can compare products, share outrage-inducing markups, and browse a leaderboard of the most marked-up products. But there's no memory. Every session starts from zero.

Three problems this creates:

1. **No retention hook.** A user who finds five interesting products today has no way to come back to them tomorrow. "Recently viewed" is device-specific localStorage that clears with browser history. There's no reason to return to TruePrice other than a new scan — no watchlist, no alerts, nothing personalized.

2. **No price-change awareness.** Commodity prices update daily. A user who looked up a cashmere sweater in January might care if its estimated manufacturing cost changes in March when wool prices spike. But there's no mechanism to tell them. Without accounts, there's no way to know who to notify.

3. **No cross-device continuity.** A user who saves a comparison on their phone has no access to it on their laptop. The current localStorage-only approach (Goal 9, Won't-Have) means any meaningful session state is tied to a single device.

Goal 10 adds the identity layer: sign in, save products to a watchlist, and get email alerts when estimated costs change meaningfully. It closes the retention loop that Goals 5–9 left open.

---

## User Stories

1. **As a returning user**, I want to sign in with my Google account (or via email magic link) — so I don't have to remember a password and TruePrice doesn't need to store one.

2. **As a user who found a product I want to track**, I want to tap "Save" on a product page — so it appears in my watchlist the next time I visit, on any device.

3. **As a user who saved a product weeks ago**, I want to receive an email when the estimated manufacturing cost changes by more than 10% — so I know when to reconsider a purchase without checking TruePrice manually.

4. **As a user on my watchlist page**, I want to see all my saved products in one place with their current estimated cost and markup — so I can scan everything I'm tracking at once.

5. **As a user who saved a comparison in Goal 9**, I want that comparison to sync to my account — so it's available on my other devices, not just the one I used when I saved it.

---

## Requirements

### Must-Have

- **Authentication** — sign in with Google OAuth and/or email magic link (passwordless). No username/password for v1 — reduces liability and complexity. Use Auth.js (formerly NextAuth.js v5) as the auth library.
- **`User` model** — new Prisma model: `id`, `email`, `name`, `image`, `createdAt`. Linked to Auth.js session tables.
- **"Save" button on product pages** — authenticated users see a "Save to watchlist" toggle on every product page. Unauthenticated users see the button but clicking it prompts sign-in. Uses an optimistic UI update.
- **`SavedProduct` model** — join table: `userId`, `productId`, `savedAt`. A user can save any product; saving the same product twice is idempotent.
- **`/watchlist` page** — authenticated-only page showing the user's saved products as cards (same card design as category browsing). Shows current estimated cost, markup percent, confidence tier. Empty state with a prompt to scan or search.
- **Sign-in / sign-out UX** — sign-in button in the site nav (top-right). After sign-in, show user avatar or initials + sign-out option. Use Next.js middleware to redirect `/watchlist` to sign-in if unauthenticated.
- **API routes:**
  - `POST /api/user/watchlist` — add product to watchlist (requires auth)
  - `DELETE /api/user/watchlist/[productId]` — remove from watchlist (requires auth)
  - `GET /api/user/watchlist` — get all saved products for current user (requires auth)

### Should-Have

- **Price change alerts** — weekly cron job that checks `CostBreakdown.updatedAt` and `totalCostCents` for watchlisted products. If the estimated cost for a product has changed by ≥10% since the user saved it (or since the last alert), send an email. Use the `threshold` concept: store `lastAlertedCostCents` on `SavedProduct` to track what the user was last notified about.
- **Email delivery** — add Resend (or Postmark) for transactional email. Single template: "The estimated manufacturing cost of [Product] changed — here's what's new." Plain text + minimal HTML. No marketing email for v1.
- **Saved comparisons** — a `SavedComparison` model (`userId`, `productIdA`, `productIdB`, `savedAt`) with a "Save comparison" button on `/compare`. Syncs the comparison tray intent to the user's account.
- **Cross-device "recently viewed"** — if signed in, persist recently-viewed product IDs to `RecentlyViewed` table (capped at 10 per user) instead of (or in addition to) localStorage. Homepage "Recently Viewed" row reads from DB for signed-in users.

### Won't-Have (v1)

- Username/password auth — passwordless only
- User profile editing (name, avatar) — unnecessary for v1
- Social features tied to account: comments, public watchlists, follower graphs — defer to a later goal
- Admin user roles or permissions — `/admin/coverage` page from Goal 8 remains unauthenticated for v1
- Email preferences or notification frequency settings — weekly is the default; configurability deferred
- OAuth providers beyond Google — add more later if demand warrants
- Paid tier or ad-free experience gated behind an account

---

## Acceptance Criteria

- [ ] A user can sign in via Google OAuth; session persists across browser refreshes
- [ ] A user can sign in via email magic link; link is delivered within 60 seconds; clicking it signs them in
- [ ] Unauthenticated visit to `/watchlist` redirects to sign-in page with a redirect-back parameter
- [ ] Sign-in button appears in nav for unauthenticated users; avatar/sign-out dropdown appears for authenticated users
- [ ] "Save" button on product page: clicking while unauthenticated prompts sign-in; clicking while authenticated adds to watchlist with optimistic UI (button state toggles immediately)
- [ ] `GET /api/user/watchlist` returns only the current user's saved products (not other users')
- [ ] `/watchlist` page renders saved products with current estimated cost, markup %, and confidence tier; empty state shown for zero saves
- [ ] Saving the same product twice does not create a duplicate `SavedProduct` row (upsert / idempotent)
- [ ] Removing a saved product updates the watchlist without a full page reload
- [ ] `User` table and Auth.js session tables exist in Prisma schema; migration runs cleanly
- [ ] TypeScript compiles clean; no raw `process.env` in app code
- [ ] Existing tests for Goals 1–9 continue to pass (no regressions)
- [ ] Auth routes (`/api/auth/**`) handled by Auth.js; no manual session management

---

## Technical Notes

- **Tech stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL — same as prior goals
- **Auth library:** Auth.js v5 (`next-auth@beta`). Use the Prisma Adapter to store sessions in PostgreSQL (no separate session store). Configure in `src/lib/auth.ts`. Providers: `GoogleProvider` + `EmailProvider` (magic link via email).
- **New env vars:**
  - `AUTH_SECRET` (server) — Auth.js signing secret
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (server) — Google OAuth app credentials
  - `EMAIL_FROM` (server) — "from" address for magic link emails
  - `EMAIL_SERVER` (server) — SMTP connection string or Resend API key, depending on email provider
- **New Prisma models** (Auth.js Prisma adapter schema additions):
  - `User` — `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`
  - `Account` — OAuth account links (Auth.js standard)
  - `Session` — active sessions (Auth.js standard)
  - `VerificationToken` — magic link tokens (Auth.js standard)
  - `SavedProduct` — `id`, `userId`, `productId`, `savedAt` (unique on `[userId, productId]`)
- **Save button state:** `"use client"` component. On mount, call `GET /api/user/watchlist` to pre-populate saved state. On click, call `POST` or `DELETE` optimistically then revalidate with TanStack Query. If unauthenticated, call `signIn()` from Auth.js client.
- **Middleware:** `src/middleware.ts` — use Auth.js `auth()` middleware to protect `/watchlist`. Redirect to `/api/auth/signin?callbackUrl=/watchlist` if no session.
- **Watchlist page:** Server component. Call `auth()` to get session; query `SavedProduct` with Prisma through `ProductService`. Render cards using the existing product card component.
- **Price alert cron:** New cron route `GET /api/cron/price-alerts`. Runs weekly (e.g., Sunday 09:00). For each `SavedProduct` row: compare `CostBreakdown.totalCostCents` now vs. `lastAlertedCostCents` (stored on `SavedProduct`). If `|delta| / lastAlertedCostCents >= 0.10`, send alert email and update `lastAlertedCostCents`. Batch in chunks of 50 users to avoid DB pressure.
- **New routes/components:**
  - `app/watchlist/page.tsx` — watchlist page (server component, auth-gated)
  - `app/api/auth/[...nextauth]/route.ts` — Auth.js handler
  - `app/api/user/watchlist/route.ts` — GET + POST
  - `app/api/user/watchlist/[productId]/route.ts` — DELETE
  - `app/api/cron/price-alerts/route.ts` — price change alert cron
  - `src/components/atoms/SaveButton.tsx` — save/unsave toggle (client component)
  - `src/components/layout/UserNav.tsx` — nav sign-in/avatar component (client component)
  - `src/lib/auth.ts` — Auth.js config
  - `src/lib/email.ts` — email delivery helper (wraps Resend or nodemailer)

---

## Open Questions

1. **Google OAuth app:** Has a Google OAuth app been created in Google Cloud Console with the TruePrice redirect URI (`/api/auth/callback/google`)? If not, this is a prerequisite before development starts. Credentials go in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

2. **Email provider:** Magic link emails require an SMTP sender. Options: (a) Resend (simple API, generous free tier, excellent deliverability), (b) Postmark, (c) self-hosted SMTP via Gmail. Recommend Resend for v1 — one API key, no SMTP config.

3. **Alert threshold:** 10% cost change as the alert trigger is an assumption. Is this the right threshold? Too sensitive (5%) could generate alert fatigue; too loose (25%) misses meaningful price moves. Consider making this configurable per saved product in a later goal.

4. **Watchlist visibility:** Should saved watchlists be private (only visible to the user) or should there be an option to make a watchlist public/shareable? Recommend private-only for v1 — public lists add moderation scope.

5. **Migration strategy for existing data:** When the `User` and `SavedProduct` tables are added, existing `Product` and `CostBreakdown` data is untouched. However, the `SavedProduct.lastAlertedCostCents` field needs to be populated on first save (use the current `totalCostCents` at save time) so the delta calculation starts from a known baseline. Confirm this is the right initialization approach.

6. **Auth.js v5 compatibility:** Auth.js v5 (`next-auth@beta`) is still in beta as of the last assessment. If stability is a concern, Auth.js v4 with Next.js App Router is more battle-tested but requires a wrapper for server component access. Confirm which version to use before implementation.
