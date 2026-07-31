# PRD: Goal 1 — Project Scaffold & Data Model

**Goal reference:** Goal 1 — Project Scaffold & Data Model
**Status:** Implemented (PR #1, commit 1e23896, merged)
**Roadmap position:** Foundation — all other goals depend on this

---

## Problem Statement

TruePrice needs to reveal the true manufacturing cost of consumer products — but before any feature can be built, the project needs a solid foundation: a data model that captures what a product is made of, what those materials cost, and what the resulting cost breakdown looks like. Getting this wrong means painful migrations later. Getting it right means every subsequent goal plugs cleanly into a stable schema.

There is also a developer experience problem: the project must be set up in a way that lets agents and contributors move fast without stepping on each other — typed env config, clean build pipeline, testing infrastructure in place from day one.

---

## User Stories

**As a user scanning a product barcode,** I want the system to already know what model the product data lives in, so my scan returns structured results rather than raw blobs.

**As a developer building Goal 2 (Commodity Prices),** I want a `Material` table and `CommodityPrice` table already defined and migrated, so I can start wiring the API without touching the schema.

**As a developer building Goal 4 (Cost Estimation),** I want a `CostBreakdown` table already defined with all the fields I need (material cost, labor, overhead, shipping, markup, confidence), so estimation results have a home without schema churn.

**As Zach deploying the project,** I want a Vercel pipeline configured from day one, so every PR can be previewed without manual setup.

---

## Requirements

### Must-Have
- Next.js 15 project with App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui
- Prisma ORM with PostgreSQL provider; Docker Compose for local DB
- All core data models defined and migrated: `Product`, `ProductCategory`, `Material`, `ProductMaterial`, `CommodityPrice`, `CostBreakdown`, `LaborRate`
- Typed env config module (`src/lib/env.server.ts` / `src/lib/env.client.ts`) — no raw `process.env` anywhere in app code
- Vitest + Playwright configured with passing sample tests
- Vercel deployment pipeline configured (GitHub integration or `vercel.json`)
- Seed script with 5–10 products (known materials, realistic weights, country of origin)
- `LaborRate` seed covering the 10 most common manufacturing countries (US, CN, VN, BD, MX, IN, TH, ID, DE, CH)
- `ProductCategory` seed: Food & Beverage, Clothing & Textiles, Electronics, Cosmetics & Personal Care, Home & Kitchen
- ESLint + Prettier configured; `npm run build` and `tsc --noEmit` both pass clean

### Should-Have
- Placeholder homepage with project name + search bar (non-functional) so Vercel deploy has something to show
- `cuid()` IDs throughout (shorter, URL-friendly vs UUID)
- Clear comments in schema explaining units (cents, grams, kg) to prevent future confusion

### Won't-Have (this goal)
- Real commodity prices — that's Goal 2
- Any business logic — this goal is schema + tooling only
- Functional search or barcode scanning — Goals 3 and 5

---

## Acceptance Criteria

- [ ] `npm run dev` starts cleanly; placeholder homepage renders
- [ ] `npm run build` completes with no errors
- [ ] `tsc --noEmit` passes with strict mode
- [ ] `npx vitest run` passes (sample test included)
- [ ] `npx playwright test` passes (sample e2e included)
- [ ] `npx prisma migrate dev` runs cleanly against local Docker PostgreSQL
- [ ] `npx prisma db seed` creates all seed products, categories, and labor rates without errors
- [ ] `src/lib/env.server.ts` and `src/lib/env.client.ts` exist; no raw `process.env` in app code
- [ ] Vercel preview deploy succeeds on a test branch
- [ ] All 7 data models present in schema with correct field types and relations

---

## Technical Notes

- **Framework:** Next.js 15 App Router. Read `node_modules/next/dist/docs/` before writing any Next.js code — this version has breaking changes from training data.
- **ORM:** Prisma with PostgreSQL. No raw SQL. Use `cuid()` for IDs.
- **Monetary values:** All prices stored as integers (cents). `retailPriceCents`, `pricePerKgCents`, `hourlyRateCents` — never floats.
- **Weights:** grams (Float) for product weights; kg used as the normalized unit for commodity prices.
- **Env split:** `env.server.ts` exports server-only vars (DATABASE_URL, API keys). `env.client.ts` exports only `NEXT_PUBLIC_*` vars. This split is enforced throughout the codebase.
- **Testing:** Vitest for unit/integration, Playwright for e2e. Both must be wired up from day one — retrofitting test config mid-project is painful.
- **Seed data:** Seed products don't need real commodity prices. The seed just validates relations (product → category, product → materials). Real prices come in Goal 2.

---

## Open Questions

None for this goal — the data model is foundational and well-defined. Any schema changes discovered during later goals should go through a migration, not a redesign.
