# Open Questions Parking Lot

Last updated: 2026-08-04 (PM Run #154)

This file replaces the missing PROJECT_KEYS.md section 13. All unresolved product decisions go here. Answered questions are moved to the **Resolved** section below.

---

## Open

### Goal 4 — Cost Estimation Engine

**Q4-1: Cron-triggered re-estimation** — *moved to Resolved (PM Run #78)*

**Q4-2: Labor rate default for unknown country of origin** — *moved to Resolved (PM Run #78)*

### Goal 5 — Product Page & Cost Breakdown UI

**Q5-1: Chart type — stacked bar vs. donut** — *moved to Resolved (PM Run #78)*

### Goal 6 — Category Browsing & Landing Pages

**Q6-1: Category descriptions** — *moved to Resolved (PM Run #78)*

**Q6-2: Pagination vs. load more** — *moved to Resolved (PM Run #4)*

**Q6-3: Minimum product count for AdSense** — *moved to Resolved (PM Run #78)*

### Goal 7 — AdSense Integration

**Q7-1: AdSense account & publisher ID**
Has Zach created a Google AdSense account? Publisher ID (`ca-pub-XXXXXXXX`) needed before ads can serve. Review lag is typically 1–4 weeks after site submission.
- **Owner:** Zach | **Blocking:** Goal 7 launch

**Q7-2: Manual ad unit IDs** — *moved to Resolved (PM Run #4)*

**Q7-3: Privacy Policy data scope**
Now that Goal 10 (User Accounts) has shipped, TruePrice stores: email address, name, profile image (from OAuth provider), OAuth tokens (Account model), session tokens, watchlisted products, recently viewed products, and (after Goal 11b merges) alert settings and alert log history. The Privacy Policy must disclose all of this. The current Privacy Policy was written assuming "server logs only + AdSense cookies" — it needs a full update before any public marketing push.
- **Owner:** Zach | **Priority:** High (update before public launch)

### Infrastructure / Cross-cutting

**Q-INFRA-1: PROJECT_KEYS.md missing** — *moved to Resolved (PM Run #78)*

**Q-INFRA-2: Discord channels not allowlisted**
All agent runs have failed to post to Discord (#main, #standup, #prs, #alerts, #research).
- Requires user to run `/discord:access` in terminal
- All Discord posts since 2026-07-30 project init have silently failed
- **Action needed:** Zach runs `/discord:access` to configure allowlist
- **Owner:** Zach | **Priority:** High (agents can't close the loop)

### Goal 8 — Data Expansion & Accuracy Improvements

**Q8-1: Live lookup latency budget** — *moved to Resolved (PM Run #78)*

**Q8-2: 100-product seed sourcing** — *moved to Resolved (PM Run #78)*

**Q8-3: Subcategory field backfill** — *moved to Resolved (PM Run #4)*

**Q8-4: Admin page access** — *moved to Resolved (PM Run #78)*

**Q8-5: Re-estimation TTL configurability** — *moved to Resolved (PM Run #4)*

### Goal 10 — User Accounts & Personalization

**Q10-1: NextAuth version** — *moved to Resolved (PM Run #131)*

**Q10-2: Auth providers** — *moved to Resolved (PM Run #131)*

**Q10-3: Watchlist cap** — *moved to Resolved (PM Run #131)*

**Q10-4: Digest opt-in vs. opt-out** — *moved to Resolved (PM Run #131)*

**Q10-5: Recently viewed merge strategy on sign-in** — *moved to Resolved (PM Run #131)*

### Goal 9 — Product Comparison & Social Features

**Q9-1: OG image design** — *moved to Resolved (PM Run #78)*

**Q9-2: Compare page cold state** — *moved to Resolved (PM Run #4)*

**Q9-3: Leaderboard confidence filter** — *moved to Resolved (PM Run #4)*

**Q9-4: Copy-to-image scope** — *moved to Resolved (PM Run #78)*

### Goal 12 — Enhanced Search & Discovery

**Q12-1: View count session dedup strategy** — *moved to Resolved (PM Run #146)*

**Q12-2: Trending time window** — *moved to Resolved (PM Run #146)*

**Q12-3: Markup tier thresholds** — *moved to Resolved (PM Run #146)*

**Q12-4: `/trending` cold-state display**
What does `/trending` show on a fresh deploy before any products have accumulated view counts? Currently the page would render empty (no products with viewCount > 0). Consider falling back to `getMostShocking(20)` or a friendly empty-state with a prompt to browse categories.
- **Owner:** Zach | **Priority:** Low — not a launch blocker, but worth deciding before first marketing push
- **Suggested answer:** Fall back to `getMostShocking(20)` when trending returns fewer than 5 results. Avoids empty-page UX with zero additional implementation complexity. Implement when Goal 14 is in dev (the SEO goal includes a Lighthouse audit of the trending page).

### Goal 14 — SEO & Core Web Vitals

**Q14-1: Lighthouse CI integration**
Should Lighthouse CI run as a GitHub Actions check on every PR, or is a manual audit at the goal boundary sufficient? CI integration is the gold standard but adds ~2 minutes to each CI run.
- **Owner:** Zach | **Priority:** Low — manual audit acceptable for this goal; CI can be added later

**Q14-2: Google Search Console verification method**
Google supports four verification methods: HTML meta tag, HTML file, DNS TXT record, and Google Analytics. The meta tag approach (via `GOOGLE_SITE_VERIFICATION` env var) is simplest to implement without deploy-time file changes. Is that acceptable, or does Zach prefer DNS TXT?
- **Owner:** Zach | **Priority:** Medium — needed before submitting sitemap

**Q14-3: Sitemap URL format for products**
Product URLs are currently `/products/[id]` (numeric ID) or `/products/[slug]` (human-readable slug). If product slugs are not yet in the DB schema, the sitemap must use numeric IDs. Should we add a `slug` field to `Product` as part of this goal, or use numeric IDs for now?
- **Owner:** PM / Dev | **Priority:** High — affects sitemap and canonical URL implementation
- **Suggested answer:** Add a `slug` field to `Product` as part of Goal 14. Derived from `name` + `brand` (kebab-case, deduplicated). Better for SEO than numeric IDs; worth the migration complexity.

### Goal 15 — User-Submitted Products

**Q15-1: Admin notification on new submission**
Should Zach receive an email (or Discord message) when a new submission comes in, or just check `/admin/submissions` manually? A Discord ping via `NotificationService` would be low-effort to add.
- **Owner:** Zach | **Priority:** Low — manual queue check acceptable for low submission volumes

**Q15-2: Submitter approval email content**
When a submission is approved, what should the email say? Proposed: "Your submission for [product name] has been approved — [see the cost breakdown link]." Should include the markup multiplier in the email body to reward the contribution with immediate value.
- **Owner:** Zach | **Priority:** Medium — affects quality of the contribution loop

**Q15-3: Material composition input in submission form**
Should the submission form expose a materials input (ingredient picker from the existing `Material` table) for power users, or require name+UPC only?
- **Suggested answer:** Show materials input as optional/collapsible. Power users who know the ingredients can include them; casual submitters skip it. Materials stored as JSON in `ProductSubmission`; admin can edit before approving. Implement collapsible section with "Add ingredients (optional)" toggle.
- **Owner:** Zach | **Priority:** Medium — determines implementation complexity of the submission form

**Q15-4: ADMIN_EMAILS vs. role field**
Using an env var for admin auth is simpler but requires a redeploy to add new admins. A `User.role` field (`USER | ADMIN`) is more scalable. For v1 with one admin (Zach), env var is fine.
- **Owner:** PM / Dev | **Priority:** Low — can migrate to role field in a future goal if team grows

### Goal 13 — Weekly Digest Email

**Q13-1: Unsubscribe token expiry** — *moved to Resolved (PM Run #146)*

**Q13-2: Email template design** — *moved to Resolved (PM Run #146)*

**Q13-3: Resend plan & rate limits**
Resend free tier is 100 emails/day (3,000/month). If registered users with non-empty watchlists exceed 100, the Saturday digest cron will hit the daily cap and silently drop emails. Check current user count before first digest run; upgrade Resend plan or stagger sends across multiple days if needed.
- **Owner:** Zach | **Priority:** High if user count exceeds 100 before first digest run; blocks Goal 13 go-live

**Q13-4: Digest send day/time** — *moved to Resolved (PM Run #146)*

---

## Resolved

### Goal 4

**Q4-3: Manufacturing hour estimates** — Category-level defaults are acceptable for v1 launch. Subcategory granularity deferred to Goal 8 (Data Expansion). A confidence hit at category level is acceptable and disclosed to users.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q4-4: Async vs sync estimation** — Go sync first; optimize queries to stay under 500ms (batch fetches, indexed joins). Only introduce async (202 + polling) if profiling shows >500ms at p95. Don't add async complexity prematurely.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

### Goal 5

**Q5-2: "Calculate Cost" trigger** — Auto-trigger on page load for real users. Add `?bot=1` bypass or check user-agent to skip auto-trigger for known bot patterns. Avoids unnecessary compute from crawlers while keeping UX smooth.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q5-3: Markup framing** — Show both: primary display as multiplier ("5× markup"), secondary as "retail price is 400% above manufacturing cost." Multiplier is more visceral for sharing; percentage is technically precise.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q5-4: Low-confidence display** — Show category averages with disclaimer ("estimated for [category] products"). Never show empty state when we can give something useful. Prominent warning badge accompanies category-average estimates.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

**Q5-5: OG image generation** — Plain meta tags for launch (Goal 5). Add dynamic OG image (`opengraph-image.tsx`) in Goal 9 (Social) when sharing becomes a focus. Reduces Goal 5 complexity.
- **Resolved:** PM Run #2 (2026-07-30) — suggested answer accepted as working default

### Goal 6

**Q6-2: Pagination vs. load more** — Use URL-based pagination (`/category/[slug]?page=2`). Prioritize indexability over UX convenience at this stage; each page is independently crawlable, which is what AdSense approval requires.
- **Resolved:** PM Run #4 (2026-07-30) — working default set; Zach can override before TRD is written

### Goal 7

**Q7-2: Manual ad unit IDs** — Launch with auto-ads only (`strategy="afterInteractive"` script in layout). Add manual ad units after AdSense approves and issues unit IDs. Reduces pre-launch dependencies and avoids hardcoding placeholder IDs.
- **Resolved:** PM Run #4 (2026-07-30) — working default set; Zach can override before TRD is written

### Goal 8

**Q8-3: Subcategory field backfill** — Lazy fill. After the migration, `Product.subcategory` is null for existing products. The next re-estimation run selects the best subcategory profile based on ingredients/name. No migration-time inference needed; avoids complexity in the migration script.
- **Resolved:** PM Run #4 (2026-07-30) — working default set

**Q8-5: Re-estimation TTL configurability** — Use `REESTIMATION_TTL_DAYS` env var with default of 7. Cheap to add now; avoids a deploy to tune the window as catalog scales.
- **Resolved:** PM Run #4 (2026-07-30) — working default set

### Goal 9

**Q9-2: Compare page cold state** — Show an informational prompt: "Add two products to compare from any product page." No redirect, no pre-built pairs for v1. Simple and honest.
- **Resolved:** PM Run #4 (2026-07-30) — working default set

**Q9-3: Leaderboard confidence filter** — Show all products with estimates on the leaderboard; display a confidence badge on each card (HIGH/MEDIUM/LOW). Don't filter by confidence — it would hide too many products early on and punish the product for having young data.
- **Resolved:** PM Run #4 (2026-07-30) — working default set

### Added PM Run #78 (2026-07-31)

**Q4-1: Cron-triggered re-estimation** — Go with scheduled auto-compute (weekly, not daily). Goal 8 implements a `GET /api/cron/re-estimate` Vercel Cron (weekly Mon 08:00) that re-runs `estimateCost()` for products with stale breakdowns, ordered by most-recently-estimated descending (so the freshest rotate through). This avoids cold-page hits while keeping compute bounded.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 8 (PR #13)

**Q4-2: Labor rate default for unknown country of origin** — Use China rate ($3.50/hr). Implemented in `CostEstimationService` as the fallback for null `countryOfOrigin`. China accounts for the largest share of manufactured goods globally, making it the least-biased default.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 4 (PR #4)

**Q5-1: Chart type — stacked bar vs. donut** — Donut (Recharts `PieChart` + `ResponsiveContainer`). More visually striking on mobile; better for the "wow" sharing moment. Implemented in the `CostBreakdownChart` molecule component.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 5 (PR #5)

**Q6-1: Category descriptions** — AI-drafted 2–3 sentence blurbs seeded per category, written at Goal 6 time. 5 categories seeded (Food & Beverage, Clothing & Textiles, Electronics, Cosmetics & Personal Care, Home & Kitchen). No separate Zach review needed for launch — thin categories are acceptable for AdSense v1.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 6 (PR #10)

**Q6-3: Minimum product count for AdSense** — Resolved by Goal 8: 104 products seeded with estimates (26 HIGH confidence, mix of food, clothing, electronics). AdSense content threshold met.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 8 (PR #13)

**Q-INFRA-1: PROJECT_KEYS.md missing** — `PROJECT_KEYS.md` now exists at `/workspace/TruePrice/PROJECT_KEYS.md`, committed to task/goal8-data-expansion in commit c20f3d7. All agent prompts that reference it now have a valid file to read. TRD Watcher now validates against it successfully.
- **Resolved:** PM Run #78 (2026-07-31) — created during Dev Run #25 (2026-07-30)

**Q8-1: Live lookup latency** — Sync approach used in Goal 9. Product data returns immediately from DB; estimation is triggered by `GET /api/products/[id]/cost` (calculate if none cached). No polling pattern needed for v1 — re-estimate cron handles freshness. Revisit if p95 latency exceeds 500ms after launch.
- **Resolved:** PM Run #78 (2026-07-31) — confirmed working in Goal 9 implementation

**Q8-2: 100-product seed sourcing** — Used Option C (pre-defined popular UPC list) for electronics and clothing; Open Food Facts data for food products. Goal 8 seeded 104 products across all categories manually curated. Import script approach (Option A) deferred to future growth needs.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 8 (PR #13)

**Q8-4: Admin page access** — `/admin/coverage` is unauthenticated for v1. Aggregate stats (product counts, confidence distribution) are not sensitive. Add basic auth (env-var password) before any public marketing push if coverage data becomes a competitive concern.
- **Resolved:** PM Run #78 (2026-07-31) — accepted as working default for v1

**Q9-1: OG image design** — Option A (bold text card): product name + markup multiplier in large type. Text-forward cards perform best in social feeds and are simplest to build with Satori. Implemented in `src/app/api/og/product/[id]/route.ts` and `src/app/api/og/compare/route.ts`.
- **Resolved:** PM Run #78 (2026-07-31) — implemented in Goal 9 (PR #14)

**Q9-4: Copy-to-image scope** — Deferred. Not included in Goal 9 v1. Goal 9 focuses on comparison tray, leaderboard, and OG images. "Save as image" (html2canvas/dom-to-image) deferred to Goal 10+ due to bundle weight and Tailwind CSS edge cases.
- **Resolved:** PM Run #78 (2026-07-31) — confirmed cut from Goal 9 scope

### Goal 10 — User Accounts & Personalization

**Q10-1: NextAuth version** — Next-auth v5 (App Router native). Selected and implemented. v5 is the correct choice for the App Router — v4's Pages Router assumptions cause significant friction in App Router environments.
- **Resolved:** PM Run #131 (2026-08-01) — implemented in Goal 10 (PR #17, merged e292d87)

**Q10-2: Auth providers** — Google OAuth + magic-link email only. No GitHub OAuth for v1. Google covers the majority of users; magic-link covers those without Google. GitHub OAuth deferred until there's evidence of demand.
- **Resolved:** PM Run #131 (2026-08-01) — implemented in Goal 10 (PR #17)

**Q10-3: Watchlist cap** — 50 products (soft limit; warning at 45). Implemented in `UserService.addToWatchlist`. Prevents unbounded watchlist growth while being generous enough for real use cases.
- **Resolved:** PM Run #131 (2026-08-01) — implemented in Goal 10 (PR #17)

**Q10-4: Digest opt-in vs. opt-out** — Opted for opt-out (on by default) for the weekly digest. Goal 10 email implementation is "send only" — unsubscribe mechanism deferred to v2. Alert-specific opt-out is handled by `User.alertsEnabled` in Goal 11b.
- **Resolved:** PM Run #131 (2026-08-01) — implemented in Goal 10 (PR #17)

**Q10-5: Recently viewed merge strategy on sign-in** — Merge + deduplicate by `productId`, keep most-recent `viewedAt`, cap at 10. Implemented in `UserService.mergeLocalRecentlyViewed`. localStorage IDs are posted on sign-in and merged into DB state.
- **Resolved:** PM Run #131 (2026-08-01) — implemented in Goal 10 (PR #17)

### Goal 12 — Enhanced Search & Discovery

**Q12-1: View count session dedup strategy** — Cookie (server-authoritative, works without JS). Cookie name: `vw_<productId>`. `httpOnly: true`, `sameSite: lax`, `maxAge: 1800` (30 minutes). Set by `POST /api/products/[id]/view` on first view; subsequent calls within 30 min are ignored without a DB write.
- **Resolved:** PM Run #146 (2026-08-02) — implemented in Goal 12 (PR #23, TRD confirmed)

**Q12-2: Trending time window** — 7-day rolling window. Configurable via function param (`windowDays`, default 7). All-time view counts would over-represent old high-traffic products; 7 days reflects current interest. Can adjust via function call if Zach wants a different default.
- **Resolved:** PM Run #146 (2026-08-02) — implemented in Goal 12 (PR #23, TRD confirmed)

**Q12-3: Markup tier thresholds** — Under 3× (markupPercent < 300) / 3–7× (300 ≤ markupPercent < 700) / Over 7× (markupPercent ≥ 700). Applied client-side in `CategoryMarkupFilter.tsx`. No copy labels chosen for the tier names; filter badges display the multiplier range directly.
- **Resolved:** PM Run #146 (2026-08-02) — implemented in Goal 12 (PR #23, TRD confirmed)

### Goal 13 — Weekly Digest Email

**Q13-1: Unsubscribe token expiry** — 30 days. Signed with `DIGEST_UNSUBSCRIBE_SECRET` via `jose` (`SignJWT` / `jwtVerify`). Expired tokens return 400 with a friendly message. 30 days is the industry default and appropriate for a low-sensitivity unsubscribe action.
- **Resolved:** PM Run #146 (2026-08-02) — implemented in Goal 13 (PR #24, TRD confirmed)

**Q13-2: Email template design** — Plain HTML string with self-contained inline styles (no React Email SDK or external template library). Includes a `text` part for non-HTML clients. Keeps the bundle small and avoids importing UI framework dependencies into the email path.
- **Resolved:** PM Run #146 (2026-08-02) — implemented in Goal 13 (PR #24, TRD confirmed)

**Q13-4: Digest send day/time** — Saturday 08:00 UTC (`"0 8 * * 6"` in `vercel.json`). This is 4am US Eastern / 9am UK. Aligns with typical weekend digest open rates.
- **Resolved:** PM Run #146 (2026-08-02) — implemented in Goal 13 (PR #24, TRD confirmed)
