# PRD: Goal 15 — User-Submitted Products

- **Goal reference:** Goal 15 (roadmap: `research/implementation-roadmap-v2.md`)
- **TRD:** `trds/goal15-user-submitted-products.md`
- **Status:** In Review (PR #26)
- **Priority:** P2
- **Depends on:** Goal 3, Goal 8, Goal 10

---

## Problem Statement

When TruePrice doesn't recognize a barcode or search query, users hit a dead end — no product, no cost breakdown, nothing actionable. The catalog is entirely gated on Zach manually seeding products. This creates two compounding problems: (1) users who scan unknown products churn immediately, and (2) catalog growth is a bottleneck that doesn't scale. Goal 15 converts the dead end into a contribution loop — authenticated users can submit products for review, and Zach approves them from a simple admin queue. Approved products immediately get a cost estimate and the submitter gets a confirmation email, creating a reward loop that incentivizes contribution.

---

## User Stories

**US-1 — Barcode scan dead end**
As a user who scans an unrecognized barcode, I want to see a "Submit this product" CTA so I don't hit a dead end and can contribute instead.

**US-2 — Search empty state**
As a user who searches for a product with no results, I want a "Submit it" link so I know TruePrice is aware of the gap and I can help fill it.

**US-3 — Submission form**
As an authenticated user, I want to fill out a product submission form (pre-populated with the UPC from the scan) so the process is low-friction and I don't have to re-enter data I already have.

**US-4 — Rate limit protection**
As a user, I should be blocked from submitting more than 5 pending products at once so the admin queue doesn't get flooded by any one submitter.

**US-5 — Admin review queue**
As Zach, I want a `/admin/submissions` page that lists all pending submissions so I can approve or reject them with one click.

**US-6 — Approval creates a live product**
As Zach, when I approve a submission, I want the product to immediately appear on TruePrice with a cost breakdown so there's no manual follow-up step.

**US-7 — Submitter notification**
As a user whose submission was approved, I want to receive an email with a link to the new product page so I know my contribution went live and I can see the cost breakdown.

**US-8 — Submission history**
As a logged-in user, I want to see my past submissions and their statuses at `/account/submissions` so I know what's pending or approved.

---

## Requirements

### Must-Have
- `POST /api/products/submit` — auth-gated; creates `ProductSubmission` with `status: PENDING`; returns 201 on success
- UPC duplicate check — returns 409 with existing product URL if UPC already in `Product` table
- Rate limit — users with 5+ `PENDING` submissions receive 429
- `/submit-product` page — server component wrapping client form; auth-redirect if not logged in; `?upc=` query param pre-populates the UPC field
- Admin queue — `GET /api/admin/submissions` and `GET /admin/submissions` page (admin-gated via `ADMIN_EMAILS` env var)
- Approve action — creates `Product`, calls `CostEstimationService.estimateCost()`, sends approval email via `NotificationService.sendSubmissionApprovedEmail()`; all in a single Prisma transaction
- Reject action — marks submission `REJECTED`; no product created
- Scan page "not found" CTA — "Submit this product" link to `/submit-product?upc=<barcode>`
- Search empty state CTA — "Submit it" link to `/submit-product`
- `tsc --noEmit` passes clean; ≥15 new tests

### Should-Have
- `GET /account/submissions` page + API — user's own submission history with status badges
- `GET /api/products/upc-prefill?upc=<upc>` — calls `BarcodeService.lookupByBarcode()`, returns pre-fill data to reduce manual entry

### Won't-Have (this goal)
- Material composition input on submission form — optional/collapsible materials picker deferred; Q15-3 tracks this
- Admin notification on new submission — manual queue check is acceptable for low volumes; Q15-1 tracks a Discord ping option
- Role-based admin (`User.role` field) — `ADMIN_EMAILS` env var is sufficient for v1 with one admin; Q15-4 tracks future migration

---

## Acceptance Criteria

1. `POST /api/products/submit` returns 401 for unauthenticated requests.
2. `POST /api/products/submit` with a UPC that already exists returns 409 with the existing product's URL.
3. `POST /api/products/submit` with a valid payload creates a `ProductSubmission` row with `status: PENDING` and returns 201.
4. A user with 5 existing `PENDING` submissions receives 429 on a 6th attempt.
5. `/admin/submissions` renders all `PENDING` submissions and is inaccessible to non-admin users.
6. Admin approving a submission creates a `Product` row, calls `CostEstimationService.estimateCost()`, and sends an approval email.
7. Admin rejecting a submission sets status to `REJECTED`; no `Product` row is created.
8. The scan page "not found" screen includes a "Submit this product" link pre-populated with the scanned UPC.
9. The search `EmptyState` includes a "Submit it" link to `/submit-product`.
10. `tsc --noEmit` passes clean. ≥15 new tests covering: submission creation, UPC duplicate detection, rate limit, admin approve flow, admin reject flow, unauthenticated rejection, approval email send.

---

## Technical Notes

- **Prisma schema** — New `SubmissionStatus` enum (`PENDING | APPROVED | REJECTED`) and `ProductSubmission` model. Relation to `User` (submitter) and `ProductCategory`. Migration skipped in dev; `prisma generate` run to regenerate client.
- **`SubmissionService`** — New `src/services/SubmissionService.ts` with: `createSubmission`, `approveSubmission` (transaction-wrapped), `rejectSubmission`, `getPendingSubmissions`, `getUserSubmissions`.
- **`NotificationService.sendSubmissionApprovedEmail()`** — New method on existing `NotificationService`. Sends via Resend. Gated on `RESEND_API_KEY` presence. Signature: `sendSubmissionApprovedEmail({ to, productName, productId })`.
- **`isAdmin()` helper** — `src/lib/admin.ts`; reads `ADMIN_EMAILS` (comma-separated) from `serverEnv`. Returns `false` if env var not set. Used by all admin routes.
- **`ADMIN_EMAILS` env var** — Added to `src/lib/env.server.ts` as optional string.
- **SoC** — `SubmissionService` is the sole owner of submission logic. No API routes may call Prisma directly on `ProductSubmission`. `CostEstimationService` is called from within `SubmissionService.approveSubmission()` (the one permitted cross-service call for the approval transaction).
- Stack constraints: App Router only. No raw `process.env`. No raw `fetch` in components.

---

## Open Questions

**Q15-1: Admin notification on new submission** *(Low priority)*
Should Zach receive a Discord ping when a new submission comes in, or just poll `/admin/submissions` manually? A `NotificationService` Discord ping is ~10 lines and would close the feedback loop without needing a polling habit.
- **Owner:** Zach | **Decision needed before:** First real submission volume

**Q15-2: Approval email content** *(Medium)*
Email implemented as `sendSubmissionApprovedEmail({ to, productName, productId })` — sends a link to the product page (`/product/[productId]`). Proposed body: "Your submission for [productName] has been approved — [see the cost breakdown] — it shows a [N×] markup." Including the markup in the email rewards the contribution with immediate value.
- **Owner:** Zach | **Decision needed before:** First approval email is sent

**Q15-3: Material composition input in submission form** *(Medium)*
Should the `/submit-product` form include an optional "Add ingredients" collapsible for power users who know the materials? Materials stored as JSON in `ProductSubmission`; admin can edit before approving. Suggested: implement as optional/collapsible in a follow-up goal; v1 uses name + UPC only.
- **Owner:** Zach | **Decision needed before:** Goal 15 follow-up scope is planned

**Q15-4: ADMIN_EMAILS env var vs. User.role field** *(Low — v1 decision resolved)*
`ADMIN_EMAILS` env var chosen for v1 (simpler; no schema migration; one admin). Requires a redeploy to add new admins. A `User.role` enum field is the right long-term path if the team grows. Plan to migrate when a second admin is needed.
- **Resolved for v1** — revisit when second admin is onboarded
