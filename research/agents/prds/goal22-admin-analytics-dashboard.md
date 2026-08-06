# PRD: Goal 22 — Admin Analytics Dashboard

- **Goal reference:** Goal 22 (proposed — awaiting Zach approval before TRD is written)
- **Status:** PROPOSAL
- **Depends on:** Goal 8 (Data Expansion / Coverage Page), Goal 10 (User Accounts), Goal 12 (Enhanced Search / View Counts), Goal 15 (User-Submitted Products)
- **Proposed by:** PM Run #216 (2026-08-06)

---

## Problem Statement

TruePrice now has users, watchlists, price alerts, weekly digests, product submissions, and a growing catalog — but zero visibility into how any of it is performing. Zach is flying blind.

Three concrete gaps make this untenable as the product approaches public launch:

1. **No user growth visibility.** How many users signed up this week? What fraction have a non-empty watchlist? How many received a price alert in the last 30 days? Without these numbers, Zach can't tell whether retention hooks (Goals 11b, 13, 19) are working or silently broken.

2. **No submission pipeline monitoring.** Goal 15 opened a crowdsourced product submission channel. If 50 submissions pile up unapproved, the `/admin/submissions` UI (added in Goal 15) shows a list but provides no trend data: are submissions accelerating? What's the median approval time? How many are auto-rejected?

3. **Catalog health is opaque.** The current `/admin/coverage` page (Goal 8) shows aggregate product counts and confidence distribution — but it's a static snapshot. There's no way to see which categories are thinly covered, which products haven't been re-estimated in >30 days (stale data risk), or which products generate the most alert activity.

The existing `/admin/coverage` page is a seed — it proves the admin area exists. Goal 22 grows it into a proper analytics dashboard that gives Zach the signal he needs to operate the product confidently.

---

## User Stories

**US-1 — Weekly user growth at a glance**
As Zach, I want to see how many new users registered each week for the last 12 weeks, so I can tell whether the product is growing or stagnant after each marketing push.

**US-2 — Watchlist and alert engagement metrics**
As Zach, I want to see what fraction of users have ≥1 watchlisted product and what fraction received ≥1 price alert in the last 30 days, so I can assess whether the personalization features are driving real engagement.

**US-3 — Submission pipeline health**
As Zach, I want to see the current submission queue depth (pending / approved this month / rejected this month) and average time from submission to decision, so I can catch backlogs before they become a catalog gap.

**US-4 — Catalog coverage by category**
As Zach, I want to see how many products each category has (total), how many have HIGH/MEDIUM/LOW confidence estimates, and how many haven't been re-estimated in >14 days, so I can identify which categories need more seed data or a re-estimation trigger.

**US-5 — Alert activity summary**
As Zach, I want to see which products triggered the most price alerts in the last 30 days and the total alerts sent vs. suppressed (rate-limited), so I can verify `AlertService` is working and identify which products are most volatile.

---

## Requirements

### Must-Have

- **`/admin/analytics` route** — new page under the existing `/admin/` area; access-gated by the existing `isAdmin()` helper from `src/lib/admin.ts`. Renders server-side with server component data fetching (no TanStack Query needed — admin pages don't need reactive updates).
- **`AnalyticsService`** (`src/services/AnalyticsService.ts`) — sole owner of all analytics query logic. No direct Prisma calls in the page component or API routes.
- **Four dashboard panels:**

  **Panel 1 — User Growth**
  - Total registered users (all time)
  - New users by week for the last 12 weeks (bar chart — Recharts `BarChart` + `ResponsiveContainer`)
  - Users with ≥1 watchlisted product (count + % of total)
  - Users with ≥1 alert received in the last 30 days

  **Panel 2 — Submission Pipeline**
  - Pending submissions (count + list of 5 most recent with product name + submitted-at timestamp)
  - Approved this month / Rejected this month
  - Median approval time (hours) for the last 30 decisions

  **Panel 3 — Catalog Coverage**
  - Total products in DB
  - Products by confidence: HIGH / MEDIUM / LOW (count + percent)
  - Products per category with confidence breakdown (table: category name | total | HIGH | MEDIUM | LOW | stale >14d)
  - Stale products (last `CostBreakdown.createdAt` > 14 days ago) — count with link to list

  **Panel 4 — Alert Activity**
  - Total alerts sent in the last 30 days
  - Total alerts suppressed by rate limit in the last 30 days
  - Top 10 most-alerted products (product name | alert count | last alert date)

- **`/admin/analytics` linked from `/admin/coverage`** — add a nav link "Analytics Dashboard" to the existing coverage page header.
- **No new API routes required** — all data is fetched server-side in the page component via `AnalyticsService`. Admin pages don't need client-side data hooks.
- `tsc --noEmit` clean; all existing tests pass; new unit tests cover `AnalyticsService` query methods

### Should-Have

- **Digest delivery stats** — from the weekly digest cron (Goal 13): total recipients, successful sends, bounces, unsubscribes in the last 30 days. Requires storing per-run stats; add a `DigestRun` model (id, sentAt, recipientCount, successCount, failCount).
- **CSV export** — "Export as CSV" button on the Coverage panel that downloads a CSV of catalog coverage by category. Useful for sharing with Zach's team or investors.
- **"Re-estimate stale" trigger** — a button on the catalog panel that calls `POST /api/cron/re-estimate` with the admin's auth header, triggering an immediate re-estimation pass for stale products. For situations where Zach doesn't want to wait for the weekly cron.

### Won't Have (v1)

- Real-time dashboard (WebSocket updates) — server-render-on-load is sufficient for an admin monitoring tool
- Public-facing product analytics (showing view count data to regular users) — admin-only in v1
- Revenue analytics (affiliate commission tracking) — Goal 21 defers this to affiliate-provider dashboards
- A/B test result display — no A/B testing framework in the stack
- User-level drill-down (viewing a specific user's watchlist or alert history from the admin) — raises privacy concerns; defer to a specific need

---

## Acceptance Criteria

- [ ] `GET /admin/analytics` returns 200 for a logged-in admin user
- [ ] `GET /admin/analytics` returns 403/redirect for a non-admin user
- [ ] `GET /admin/analytics` returns 403/redirect for an unauthenticated visitor
- [ ] Panel 1 shows total user count, weekly new-user counts for 12 weeks, watchlist engagement count, and alert engagement count
- [ ] Panel 2 shows pending submission count, approved/rejected counts for the current month, and median approval time
- [ ] Panel 3 shows total product count, confidence distribution, per-category breakdown table, and stale product count
- [ ] Panel 4 shows alert sent/suppressed counts for 30 days and top 10 alerted products
- [ ] All data is read-only — no mutations from the analytics page
- [ ] `AnalyticsService` has unit tests for: weekly user aggregation, median approval time calculation, stale product query, and alert count query
- [ ] `tsc --noEmit` passes clean
- [ ] Existing `/admin/coverage` page still works and links to `/admin/analytics`

---

## Technical Notes

- **SoC:** `AnalyticsService` reads across multiple models (User, ProductSubmission, CostBreakdown, AlertLog) but never writes. This is acceptable — analytics services are inherently read-only cross-model aggregators. No other service module may call `AnalyticsService` (it is not part of the user-facing request path).
- **`AlertLog` dependency:** Panel 4 requires querying alert history. The `AlertLog` model was introduced in Goal 11b TRD. Confirm this model exists and has `createdAt`, `productId`, `userId`, and `suppressed: Boolean` fields before implementing. If `suppressed` is not present, `AlertService` needs a one-line addition to mark rate-limited alerts.
- **Weekly aggregation:** Prisma's `groupBy` can aggregate `User.createdAt` by week using `DATE_TRUNC('week', ...)` — requires a raw query via `prisma.$queryRaw`. The same pattern is used in Goal 20 (`CostBreakdown` history dedup) so precedent exists.
- **Median approval time:** SQL `PERCENTILE_CONT(0.5)` is the cleanest approach. If Prisma `$queryRaw` is used, this is straightforward. Fallback: fetch all approval timestamps for the last 30 decisions, compute median in JS (fine at this volume).
- **Server component rendering:** The `/admin/analytics` page is a server component that calls `AnalyticsService` directly — no TanStack Query hooks. This is the correct pattern for admin pages that don't need reactive updates and where the user count in `src/services/` can be imported server-side.
- **Chart rendering on server:** Recharts requires a browser DOM and can't render in server components. The bar chart (Panel 1 weekly growth) must be extracted into a `WeeklyGrowthChart` client component. The chart data is passed as a prop from the server component.
- **`isAdmin()` gating:** Implemented at `src/lib/admin.ts` (Goal 15). Reads `ADMIN_EMAILS` env var. The analytics page should call `isAdmin(session?.user?.email)` at the top of the server component and redirect to `/` if false.
- **Stale product definition:** A product is "stale" if its most recent `CostBreakdown.createdAt` is older than `RE_ESTIMATION_TTL_DAYS` (default: 7). Use the same env var already used by the re-estimation cron.

---

## Open Questions

**Q22-1: AlertLog model completeness**
Does `AlertLog` (from Goal 11b) have a `suppressed` boolean field to distinguish sent alerts from rate-limited (suppressed) ones? Panel 4 requires this distinction. If not, the field needs to be added in a migration — either as part of Goal 22 or as a patch to Goal 11b.
- Suggested default: Add `suppressed Boolean @default(false)` to `AlertLog` in the Goal 22 migration. Update `AlertService` to set `suppressed: true` when rate-limiting fires instead of skipping the DB write.
- **Owner:** Dev | **Priority:** Must clarify before implementation

**Q22-2: DigestRun model — add now or defer?**
Should `DigestRun` (for digest delivery stats) be added as a Should-Have in this goal, or deferred to a hypothetical Goal 23? The weekly digest cron (Goal 13) currently does not write a run record. Adding one requires a migration and a one-line addition to the cron handler.
- Suggested default: Include it as a Should-Have in Goal 22. The model is simple (5 fields) and the data is immediately useful — Zach will want to know if the digest is delivering successfully, especially given the Resend plan limits flagged in Q13-3.
- **Owner:** PM | **Priority:** Low — doesn't block core analytics panels

**Q22-3: Analytics data retention**
`AnalyticsService` queries raw model tables (User, ProductSubmission, CostBreakdown, AlertLog). If the `AlertLog` table grows large (thousands of alerts per month), the 30-day query could be slow without an index on `(createdAt)`. Should we add a covering index on `AlertLog` as part of this goal?
- Suggested default: Add `@@index([createdAt])` to `AlertLog` in the Goal 22 migration. At current scale this is a no-op performance-wise, but it future-proofs the alert activity panel.
- **Owner:** Dev | **Priority:** Low — add the index but don't block on it

**Q22-4: Admin dashboard vs. external analytics (Posthog/Mixpanel/Plausible)**
Should TruePrice adopt a lightweight external analytics tool (Plausible.io is open-source friendly, privacy-first, and free for low traffic) instead of building bespoke analytics queries? Plausible would give page view trends, referrer data, and device breakdown without any backend work.
- Suggested default: Keep bespoke analytics for product-specific data (watchlists, alerts, submissions) — these are TruePrice-specific signals no external tool can provide. Add Plausible (or a `<script>` tag to a managed analytics provider) for general web analytics (page views, referrers, geography) as a separate concern, outside Goal 22 scope. Goal 22 is for product health metrics, not general web analytics.
- **Owner:** Zach | **Priority:** Low — doesn't block core implementation; decide before public launch
