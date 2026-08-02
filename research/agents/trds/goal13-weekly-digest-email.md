# TRD: Goal 13 — Weekly Digest Email

- **status:** `done`
- **goal:** `Goal 13`
- **priority:** `P2`
- **branch:** `task/goal13-weekly-digest-email`
- **estimated_effort:** `Medium`
- **depends_on:** `Goal 10 (UserService, Resend, User schema), Goal 11b (alertsEnabled pattern)`, Goal 12 (DiscoveryService.getMostShocking — inlined temporarily if Goal 12 not merged)
- **blocks:** nothing

## Description

Send a weekly HTML digest email to opted-in users. Each digest contains up to 5 of their watchlisted products (with markup data), 3 platform-wide "most shocking" highlights, and a one-click JWT-signed unsubscribe link. Users can also toggle the digest on/off from their dashboard settings.

## Acceptance Criteria

- [x] `GET /api/cron/send-digest` protected by `CRON_SECRET` header
- [x] Users with `digestEnabled: false` receive no email
- [x] Users with `digestEnabled: true` but empty watchlist receive no email
- [x] Users with ≥1 watchlist item receive email containing: up to 5 watchlist products, 3 platform highlights, working unsubscribe link
- [x] Clicking the unsubscribe link sets `User.digestEnabled = false` without sign-in; subsequent cron runs skip them
- [x] Expired unsubscribe tokens (>30 days) return 400 with a friendly message
- [x] Resend API failure for one user does not stop cron from processing remaining users
- [x] Cron response body includes `{ sent: N, skipped: N, errors: N }`
- [x] `PATCH /api/account/preferences` with `{ digestEnabled: boolean }` updates the user's preference
- [x] Dashboard settings page shows a "Weekly Digest" toggle backed by `PATCH /api/account/preferences`
- [x] TypeScript compiles clean
- [x] ≥10 new tests (17 written)

## Tasks

- [x] Add `digestEnabled Boolean @default(true)` to User model in schema
- [x] Create Prisma migration
- [x] Add `DIGEST_UNSUBSCRIBE_SECRET` to `env.server.ts`
- [x] Add `signUnsubscribeToken(userId)` and `verifyUnsubscribeToken(token)` to `UserService`
- [x] Add `getFullDigestCandidates()` to `UserService` (users with digestEnabled + ≥1 watchlist item)
- [x] Add `sendWeeklyDigests()` to `UserService`
- [x] Create `GET /api/cron/send-digest/route.ts`
- [x] Create `GET /api/account/unsubscribe/route.ts`
- [x] Create `PATCH /api/account/preferences/route.ts`
- [x] Create `/account/unsubscribed/page.tsx` confirmation page
- [x] Update `dashboard/settings/page.tsx` with digest toggle
- [x] Update `vercel.json` with new cron entry
- [x] Write ≥10 tests (17 written)

## Implementation Notes

- **`digestEnabled`:** New field on User model (`Boolean @default(true)` — opt-out model). Add via Prisma migration.
- **Token signing:** Use `jose` (transitive dep of next-auth) — `SignJWT` / `jwtVerify`. Sign `{ userId, action: 'unsubscribe-digest' }` with `DIGEST_UNSUBSCRIBE_SECRET`, 30-day expiry.
- **Unsubscribe endpoint:** `GET /api/account/unsubscribe?token=<JWT>` — verifies token, sets `digestEnabled = false`, redirects to `/account/unsubscribed`. No sign-in required.
- **`getFullDigestCandidates()`:** Returns users with `digestEnabled: true` AND ≥1 `SavedProduct`. Selects up to 5 saved products per user with latest cost breakdown. Cursor-paginated (pageSize=500) for large user counts.
- **`sendWeeklyDigests()`:** Gets candidates + platform highlights, builds HTML email with `buildDigestHtml()`, sends via Resend, returns `{ sent, skipped, errors }`.
- **Platform highlights:** Inlined `getMostShocking()` query (HIGH confidence breakdowns, top 3 by markupPercent). Remove duplication once Goal 12 ships.
- **Email template:** Plain HTML string (no external template SDK). Self-contained inline styles. Must include `text` part for non-HTML clients.
- **`PATCH /api/account/preferences`:** Auth-gated, updates `digestEnabled` only. Returns `{ digestEnabled: boolean }`.
- **Dashboard toggle:** Server component reads current `digestEnabled` from DB; client sub-component `DigestToggle.tsx` calls PATCH via fetch.
- **No Resend calls outside UserService** — cron route delegates entirely to `sendWeeklyDigests()`.
- **vercel.json:** New cron entry: `{ "path": "/api/cron/send-digest", "schedule": "0 8 * * 6" }` (Saturday 08:00 UTC).

## New Env Variables

- `DIGEST_UNSUBSCRIBE_SECRET` — required for token signing; if missing, cron logs warning and skips email send

## Schema Changes

```prisma
model User {
  // ... existing fields ...
  digestEnabled  Boolean  @default(true)
  // ...
}
```
