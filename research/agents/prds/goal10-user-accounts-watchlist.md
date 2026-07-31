# PRD: Goal 10 — User Accounts, Watchlist & Email Digest

- **Goal reference:** Goal 10 — User Accounts, Watchlist & Email Digest (roadmap: implementation-roadmap-v2.md)
- **Status:** Draft
- **Priority:** P1
- **Depends on:** Goal 5 (Product Page & Cost Breakdown UI), Goal 9 (Comparison & Social)
- **Blocks:** Goal 11 (Price Alerts & Save-as-Image)

---

## Problem Statement

TruePrice is currently an anonymous, stateless tool. A user who finds a $200 hoodie that costs $8 to make has no way to track it over time, save it for later, or know if the markup changes as cotton prices shift. Every session starts from scratch — there's no continuity, no personalization, and no reason to return unless you're actively scanning something new.

User accounts and a watchlist close this gap. They convert TruePrice from a one-time novelty into an ongoing utility: "I'm watching 12 products and I'll get an email if any of them get significantly cheaper or more expensive to make." That's a fundamentally stickier product, and it gives users a stake in the data staying fresh.

The weekly email digest is the primary re-engagement mechanism. When commodity prices shift — cotton up 8%, steel down 12% — a user's watchlisted products move with them. The digest surfaces those changes without requiring the user to remember to check back.

---

## User Stories

1. **As a user who discovered a high-markup product**, I want to add it to a watchlist so I can track whether the estimated cost changes as commodity prices fluctuate — without having to re-scan or re-search it later.

2. **As a returning user**, I want to sign in with just my email address (magic link) so I don't have to create a password or install anything — low friction, works on any device.

3. **As a watchlist user**, I want to receive a weekly email digest (Monday mornings) showing all my watched products with their current estimated costs and any changes since last week — so I know when something meaningful has shifted.

4. **As a user who wants to remove data**, I want to be able to delete my account and all associated watchlist data so TruePrice retains nothing about me after I leave.

5. **As a logged-in user**, I want to see a `/account/watchlist` page listing all my saved products with their current estimates and markup multiples — so I can review my list and remove stale entries.

6. **As a user browsing any product page**, I want to see a "Watch this product" button that adds it to my watchlist (or prompts me to sign in if not logged in) — so the action is discoverable in context.

---

## Requirements

### Must-Have

- **Magic link auth** — email-only sign-in via `next-auth@5` + `@auth/prisma-adapter`. No passwords. Resend handles the transactional "sign-in link" email. Session persists via a secure HTTP-only cookie.
- **Watchlist** — logged-in users can add and remove products from their personal watchlist. Max 50 products per user for v1. Stored in DB as a join between `User` and `Product`.
- **Watchlist page** — `/account/watchlist` shows all watched products with current estimated cost, retail price, markup multiplier, and confidence tier. Logged-out users are redirected to sign-in.
- **"Watch / Unwatch" button** — atom component that appears on every product page. Shows current state (watching / not watching). If not logged in, clicking opens a sign-in prompt (modal or redirect to `/account/sign-in`).
- **Weekly email digest** — Vercel Cron (`GET /api/cron/watchlist-digest`) fires Monday 09:00 America/New_York. For each user with a watchlist, send a digest email via Resend showing: product name, current estimated cost, change since last digest (if any), markup multiplier. If no watched products, skip the user.
- **Account deletion** — `DELETE /api/account` removes the user row and cascades to watchlist entries and auth sessions. Confirmation required in the UI (type "DELETE" to confirm).

### Should-Have

- **Sign-in page** — `/account/sign-in` with a simple email field and "Send magic link" button. After submission, show "Check your inbox" confirmation state. Redirect to previous page on success.
- **Account page** — `/account` shows email, member since date, watchlist item count, and a "Delete account" button.
- **Watchlist change tracking** — store the estimated cost at time of "watch" action so the digest can compute delta (`currentCost - costAtWatch`). Display as "▲ $0.23 since you started watching" in the digest.
- **Empty watchlist state** — friendly empty state on `/account/watchlist` with a CTA to search or scan a product.
- **Digest unsubscribe link** — every digest email includes a one-click unsubscribe link that disables digest emails without deleting the account.

### Won't-Have (v1)

- OAuth providers (Google, GitHub) — magic link only for launch
- Push notifications or in-app alerts — defer to Goal 11
- Shared / public watchlists
- Watchlist folders or tags
- Price history charts on the watchlist page — stateless per-run comparison only
- "Save as image" for cost breakdown — deferred to Goal 11

---

## Acceptance Criteria

- [ ] `POST /api/auth` (next-auth magic link route) sends a sign-in email via Resend; email contains a valid one-time link that signs the user in
- [ ] Clicking the magic link signs the user in and redirects to `/account/watchlist` (or the pre-auth page if set)
- [ ] Signed-in session persists across browser refreshes (secure HTTP-only cookie)
- [ ] "Watch" button appears on every product page; clicking while signed in adds to watchlist and toggles to "Unwatch"
- [ ] Clicking "Watch" while signed out opens a sign-in prompt or redirects to sign-in
- [ ] `/account/watchlist` renders all watched products with estimated cost, retail price, markup multiplier, confidence badge; empty state shown if list is empty
- [ ] Watchlist enforces 50-item limit — "Watch" button is disabled on new products when limit is reached, with a tooltip explaining the cap
- [ ] `DELETE /api/account` with confirmation removes user, watchlist, and sessions; user is signed out immediately
- [ ] `GET /api/cron/watchlist-digest` is protected by `CRON_SECRET` header; triggers digest emails for all users with ≥1 watched product
- [ ] Digest email (Resend): renders product name, current estimated cost, retail price, markup multiplier, cost delta since last digest, confidence tier; includes unsubscribe link
- [ ] Unsubscribe link disables future digests for that user without deleting the account
- [ ] TypeScript compiles clean
- [ ] Auth flow tested with Playwright e2e (sign-in page loads, email field accepts input)
- [ ] `UserService` unit-tested: add/remove watchlist, get digest data, delete account

---

## Technical Notes

- **Auth library:** `next-auth@5` (Auth.js v5) + `@auth/prisma-adapter`. Route: `app/api/auth/[...nextauth]/route.ts`. Config in `auth.ts` at project root. Providers: `EmailProvider` only (magic link).
- **Email provider:** Resend (`resend` npm package). Use `RESEND_API_KEY` env var (server-only). Add to `env.server.ts`. From address: `noreply@trueprice.app` (configure in Resend dashboard).
- **New DB models** (add to `prisma/schema.prisma`):
  - `User` — `id`, `email`, `emailVerified`, `createdAt`, `digestEnabled` (bool, default true)
  - `Account`, `Session`, `VerificationToken` — standard next-auth models required by `@auth/prisma-adapter`
  - `WatchlistEntry` — `id`, `userId`, `productId`, `costAtWatchCents` (int, nullable), `addedAt`
  - Unique constraint: `(userId, productId)` on `WatchlistEntry`
- **Service ownership:** `UserService` (`src/services/UserService.ts`) owns all watchlist CRUD, digest data fetching, and account deletion. No Prisma calls outside this service for user/watchlist operations.
- **New API routes:**
  - `GET|POST /api/auth/[...nextauth]` — next-auth handler
  - `GET /api/account/watchlist` — returns current user's watchlist (TanStack Query)
  - `POST /api/account/watchlist` — add product to watchlist (body: `{ productId }`)
  - `DELETE /api/account/watchlist/[productId]` — remove product from watchlist
  - `DELETE /api/account` — delete account (body: `{ confirmation: "DELETE" }`)
  - `GET /api/cron/watchlist-digest` — Vercel Cron, Monday 09:00 ET, protected by `CRON_SECRET`
- **New pages/components:**
  - `app/account/sign-in/page.tsx` — sign-in page (server component wrapping client form)
  - `app/account/page.tsx` — account overview (server component, auth-gated)
  - `app/account/watchlist/page.tsx` — watchlist list (server component, auth-gated)
  - `src/components/atoms/WatchButton.tsx` — client component, uses `useSession()` + TanStack Query
  - `src/hooks/useWatchlist.ts` — TanStack Query hook for watchlist CRUD
- **Vercel Cron config:** Add to `vercel.json`:
  ```json
  { "path": "/api/cron/watchlist-digest", "schedule": "0 14 * * 1" }
  ```
  (09:00 ET = 14:00 UTC in standard time; adjust for DST by accepting ±1h drift)
- **New env vars:**
  - `RESEND_API_KEY` — server-only, Resend API key
  - `NEXTAUTH_SECRET` — server-only, random string for session signing (32+ chars)
  - `NEXTAUTH_URL` — server-only, canonical URL (`https://trueprice.app` in prod, `http://localhost:3000` locally)
  - Add all three to `env.server.ts`
- **Monetary rule:** `costAtWatchCents` stores the baseline in cents (integer). Delta = `currentEstimateCents - costAtWatchCents`. Display: `(delta / 100).toFixed(2)`.

---

## Open Questions

1. **Magic link email from-address:** Does Zach control a `trueprice.app` domain, or should the from-address be a temporary domain until launch? Resend requires a verified sending domain. If no domain is ready, use the Resend sandbox domain for testing and swap on launch.
   - **Owner:** Zach | **Blocking:** email delivery in production

2. **Digest send day/time:** Monday 09:00 ET is proposed. Does Zach have a preference? Should we A/B test send time after launch?
   - **Owner:** Zach | **Not blocking** (can be changed in `vercel.json` post-launch)

3. **Watchlist cap:** 50 products per user is proposed as a safe v1 limit. Should this be configurable via env var (`MAX_WATCHLIST_SIZE`, default 50) so it can be raised without a deploy?
   - **Suggested answer:** Yes — add `MAX_WATCHLIST_SIZE` env var with default 50.

4. **Auth session cookie duration:** Default next-auth session is 30 days. Is that appropriate, or should we use a shorter session (7 days) given no sensitive financial data is stored?
   - **Suggested answer:** 30 days is fine for v1; no financial data is at risk. Revisit if users report unexpected sign-outs.
