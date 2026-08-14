# PROJECT_KEYS.md — TruePrice Standards Reference

Used by TRD Watcher (sections 3 & 10) and referenced by implementation-roadmap-v2.md (section 12).

---

## Section 1 — Project Overview

TruePrice reveals the true manufacturing cost of consumer products. Users scan a barcode or search for a product, and TruePrice breaks down the raw material cost, labor, overhead, and shipping — showing them the markup they're paying at retail.

---

## Section 2 — Repository Structure

```
/workspace/TruePrice/
  src/
    app/              # Next.js App Router pages + API routes
    components/
      atoms/          # Single-purpose UI primitives (Button, Badge, AdSlot, Breadcrumb)
      molecules/      # Composed UI components (CostBreakdownChart, CategoryCard)
      layout/         # Layout wrappers (AdSenseLoader, Footer)
    hooks/            # TanStack Query hooks (useCostBreakdown, useTriggerRecalculate)
    services/         # Business logic services (see Section 10)
    data/             # Static lookup tables (assembly-hours, shipping-rates, country-regions)
    lib/              # Utilities, env config, API client types
  prisma/             # Schema, migrations, seed
  research/
    agents/
      trds/           # Technical Requirements Documents per goal
      prompts/        # Agent prompt files
      backlog.md      # Current task queue
  PROJECT_KEYS.md     # This file
```

---

## Section 3 — Approved Tech Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Framework | Next.js (App Router) + TypeScript | Strict mode. No Pages Router. Read `node_modules/next/dist/docs/` before writing Next.js code — this version has breaking changes. |
| UI | Tailwind CSS + shadcn/ui | No other CSS frameworks. |
| State | Zustand | Client-side global state only (`searchQuery`, etc.). |
| Data fetching | TanStack Query (React Query) | All client-side data fetching must use TanStack Query hooks. No raw fetch in components. |
| ORM | Prisma | PostgreSQL provider. No raw SQL — use Prisma query API. |
| Database | PostgreSQL | Local: Docker Compose. Prod: AWS RDS. No Railway, Supabase, or other hosted DB. |
| Charts | Recharts | `PieChart` + `ResponsiveContainer`. |
| Barcode | html5-qrcode | Mobile camera scanning. |
| Testing | Vitest (unit/integration) + Playwright (e2e) | All PRs must pass both. |
| Hosting | Vercel | `vercel.json` for cron + routing config. |
| Env config | `src/lib/env.server.ts` + `src/lib/env.client.ts` | Split server/client. No raw `process.env` anywhere in app code. |
| Auth | next-auth@5 + @auth/prisma-adapter | App Router native. Google OAuth + magic-link email. JWT session strategy. |
| Email | resend | Transactional email for weekly digest. Send gated on `RESEND_API_KEY` presence. |

**Prohibited:**
- Raw `fetch` in React components — use TanStack Query hooks instead.
- Raw `process.env` outside of `env.server.ts` / `env.client.ts`.
- Pages Router — App Router only.
- Railway, Supabase, PlanetScale, or other external DB services.
- Float arithmetic for monetary values — always integers (cents).

---

## Section 4 — Data Model Summary

Core models (defined in `prisma/schema.prisma`):
- `Product` — name, brand, UPC/EAN, category, weight, country of origin, retail price
- `ProductCategory` — name, slug, overhead percent, description
- `Material` — name, commodity key, unit
- `ProductMaterial` — product ↔ material join with percentage and weight
- `CommodityPrice` — material → price per kg (cents), fetched timestamp, source
- `CostBreakdown` — full cost breakdown per product (material, labor, overhead, shipping, total, markup, confidence)
- `LaborRate` — country code → hourly rate (cents)

---

## Section 5 — Monetary Rules

- All monetary values stored and computed as **integers (cents)**. Never floats.
- Display layer divides by 100 and formats with `Intl.NumberFormat`.
- Commodity prices normalized to **USD cents per kg** regardless of API source unit.
- Markup percent: `((retailCents - totalCostCents) / totalCostCents) * 100` — float is acceptable for display only.

---

## Section 6 — API Route Conventions

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/products/search` | Text search |
| GET | `/api/products/[id]` | Product detail |
| GET | `/api/products/[id]/cost` | Current cost breakdown (calculate if none) |
| POST | `/api/products/[id]/cost/recalculate` | Force recalculation |
| POST | `/api/products/lookup` | Barcode/UPC lookup; returns `{ found, product, breakdown }` |
| GET | `/api/commodities/prices` | All current commodity prices |
| GET | `/api/commodities/prices/[materialId]` | Single material price |
| GET | `/api/cron/refresh-prices` | Vercel Cron — daily commodity price refresh; includes stale detection |
| GET | `/api/cron/refresh-retail-prices` | Vercel Cron (weekly Mon 07:00) — refresh stale retail prices via UPCitemdb |
| GET | `/api/cron/re-estimate` | Vercel Cron (weekly Mon 08:00) — re-run estimateCost() for stale breakdowns |

---

## Section 7 — Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | server | Prisma DB connection |
| `COMMODITY_API_KEY` | server | Commodity price API |
| `CRON_SECRET` | server | Vercel Cron auth header |
| `SENTRY_DSN` | server | Error tracking |
| `RE_ESTIMATION_TTL_DAYS` | server | Days before re-estimating a CostBreakdown (default: 7) |
| `DISCORD_CHANNEL_ALERTS` | server | Discord channel ID for stale price alerts |
| `NEXTAUTH_SECRET` | server | JWT signing key (required in prod) |
| `GOOGLE_CLIENT_ID` | server | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | server | Google OAuth client secret |
| `RESEND_API_KEY` | server | Resend API key (optional; email gated on presence) |
| `FROM_EMAIL` | server | Sender address for digest emails (default: `digest@trueprice.app`) |
| `NEXT_PUBLIC_APP_URL` | client | Canonical base URL |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | client | AdSense publisher ID (ca-pub-XXXXXXXX) |
| `NEXT_PUBLIC_ADSENSE_SLOT_BANNER` | client | AdSense manual banner slot ID |
| `NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR` | client | AdSense manual sidebar slot ID |

---

## Section 8 — Testing Standards

- Unit tests live in `src/**/__tests__/` alongside their source files.
- Every Service must have unit tests for its core logic and edge cases.
- Components with logic (chart rendering, tier mapping, etc.) must have Vitest tests.
- Playwright e2e covers: homepage search, barcode scan page loads, product page cost display.
- Minimum test count per goal: see individual TRDs.
- TypeScript must compile clean (`tsc --noEmit`) before any PR is opened.

---

## Section 9 — Git & PR Conventions

- **Branch naming:** `task/<trd-slug>` (e.g., `task/goal4-cost-estimation`)
- **Commit style:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **PRs:** Open as ready-for-review (not draft). One PR per TRD goal.
- **Merge:** Human-gated — Zach approves with `/merge` in Discord.
- **Base branch:** Always `main`. Re-target after dependencies merge.

---

## Section 10 — Separation of Concerns

### Service Ownership

| Service | File | Sole Responsibility |
|---------|------|-------------------|
| `CostEstimationService` | `src/services/CostEstimationService.ts` | All cost breakdown calculation. No other module may calculate costs. |
| `CommodityService` | `src/services/CommodityService.ts` | All external commodity API calls and price caching. |
| `ProductService` | `src/services/ProductService.ts` | Product lookup, search, barcode → DB reads/writes. |
| `BarcodeService` | `src/services/BarcodeService.ts` | Barcode decoding + external product DB lookup (UPCitemdb, Open Food Facts). |
| `CategoryService` | `src/services/CategoryService.ts` | Category listing, slug → products, slugs for sitemap. |
| `UserService` | `src/services/UserService.ts` | Watchlist CRUD, recently-viewed, weekly digest candidates, account deletion. |
| `DiscoveryService` | `src/services/DiscoveryService.ts` | View-count-based trending products and high-markup discovery lists. No routes or components may query these directly. |
| `NotificationService` | `src/services/NotificationService.ts` | All outbound notifications: Discord channel alerts and transactional emails. No other module may post to Discord or send email. |
| `AlertService` | `src/services/AlertService.ts` | All price alert logic: delta computation, threshold evaluation, rate-limit check, email dispatch, baseline update, history query. No alert logic in cron routes or UserService. |
| `SubmissionService` | `src/services/SubmissionService.ts` | All user-submitted product CRUD and moderation (create, approve, reject). Delegates cost estimation to CostEstimationService; delegates approval email to NotificationService. |

### Layer Call Flow

```
React Components / Pages (server or client)
  │
  ├─ Server components → call Services directly (server-side only)
  │
  └─ Client components → TanStack Query hooks only
                              │
                         API Routes (src/app/api/**/route.ts)
                              │
                         Services (src/services/*.ts)
                              │
                    Prisma ORM / External APIs
```

**Rules:**
- Client components must never import Services directly.
- Services must not call each other.
- No business logic in API routes — delegate to Services.
- No DB queries outside of Services (no Prisma calls in pages or API routes directly).

### File Naming

| Type | Pattern |
|------|---------|
| Service | `src/services/FooService.ts` |
| Hook | `src/hooks/useFoo.ts` |
| API route | `src/app/api/foo/[id]/route.ts` |
| Atom component | `src/components/atoms/Foo.tsx` |
| Molecule component | `src/components/molecules/Foo.tsx` |
| Layout component | `src/components/layout/Foo.tsx` |
| Test | `src/**/__tests__/Foo.test.ts(x)` |
| Static data | `src/data/foo.ts` |

---

## Section 11 — Agent Roles

| Agent | Cadence | Responsibility |
|-------|---------|---------------|
| Developer | every 10 min | Implements TRDs, opens PRs |
| Reviewer | every 5 min | Reviews open PRs for quality |
| Project Manager | every 30 min | Grooming, standup, backlog updates |
| Product Manager | every 4 hours | PRDs for upcoming goals |
| Domain Researcher | 7am daily | Commodity API research, competitor analysis |
| TRD Watcher | every 5 min | Validates TRDs against this file |
| Merge Watcher | every 5 min | Detects merges, posts notifications |
| System Reviewer | 9pm daily | Full system health digest |

---

## Section 12 — Roadmap

See `research/implementation-roadmap-v2.md` for full goal dependency graph and status.

| Goal | TRD | Status |
|------|-----|--------|
| Goal 1 — Project Scaffold | `trds/goal1-project-scaffold.md` | ✅ Merged (PR #1, 1e23896) |
| Goal 2 — Commodity Prices | `trds/goal2-commodity-prices.md` | ✅ Merged (PR #2) |
| Goal 3 — Product Lookup | `trds/goal3-product-lookup.md` | ✅ Merged (PR #3, 500c75d) |
| Goal 4 — Cost Estimation Engine | `trds/goal4-cost-estimation-engine.md` | ✅ Merged (PR #4, 74221a2) |
| Goal 5 — Product Page UI | `trds/goal5-product-page-ui.md` | ✅ Merged (PR #5) |
| chore: env-split | — | ✅ Merged (PR #6, c0f8c2d) |
| Goal 6 — Category Browsing | `trds/goal6-category-browsing.md` | ✅ Merged (PR #10, 06cf14e) |
| Goal 7 — AdSense Integration | `trds/goal7-adsense-integration.md` | ✅ Merged (PR #12, 752e8c1) |
| Goal 8 — Data Expansion | `trds/goal8-data-expansion.md` | ✅ Merged (PR #13, b39dfde) |
| Goal 9 — Comparison & Social | `trds/goal9-comparison-social.md` | ✅ Merged (PR #14, ea4e0ba) |
| Goal 10 — User Accounts & Personalization | `trds/goal10-user-accounts.md` | ✅ Merged (PR #17, e292d87) |
| Goal 11a — Save as Image | `trds/goal11a-save-as-image.md` | ✅ Merged (PR #19) |
| Goal 11b — Price Alerts | `trds/goal11b-price-alerts.md` | ✅ Merged (PR #20) |
| Goal 12 — Enhanced Search & Discovery | `trds/goal12-enhanced-search-discovery.md` | ✅ Merged (PR #23, 2026-08-04) |
| Goal 13 — Weekly Digest Email | `trds/goal13-weekly-digest-email.md` | ✅ Merged (PR #24, 2026-08-04) |
| Goal 14 — SEO & Core Web Vitals | `prds/goal14-seo-performance.md` | 📋 PRD written — TRD pending |
| Goal 15 — User-Submitted Products | `prds/goal15-user-submitted-products.md` | 📋 PRD written — TRD pending |
