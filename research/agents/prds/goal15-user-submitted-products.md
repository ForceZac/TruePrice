# PRD — Goal 15: User-Submitted Products

**Goal reference:** Goal 15 — User-Submitted Products (Catalog Crowdsourcing)  
**Depends on:** Goal 3 (Product Lookup — BarcodeService, UPCitemdb integration), Goal 8 (Data Expansion — seed pipeline, confidence tiers), Goal 10 (User Accounts — auth, UserService)  
**Written:** 2026-08-04 (PM Run #154)

---

## Problem Statement

TruePrice launched with 104 manually seeded products. Growing the catalog requires Zach to write seed scripts, source UPC lists, and run migrations — a manual bottleneck that doesn't scale.

The barcode scanner (Goal 3) already handles the "product not found" case with a fallback message. Every time a user scans a barcode that isn't in the DB, they hit a dead end and likely leave. That's both a lost engagement opportunity and wasted signal about what users actually want to look up.

User-submitted products turn the "not found" dead end into a contribution flow: authenticated users can submit a product (from a barcode scan or manual entry), the submission goes into a review queue, and Zach approves it from the admin panel. Approved products immediately get a cost estimate via the existing `CostEstimationService`. Over 6–12 months this can grow the catalog by 10–100× without proportional manual effort.

---

## User Stories

- **Barcode scanner (not found):** "I scanned my protein powder and got 'Product not found.' There should be a way for me to say 'hey, this should be here' — even just submitting the barcode so someone can add it later."
- **Power user:** "I know the ingredient list on this shampoo. I want to submit it with the full material composition so TruePrice can estimate its real cost."
- **Casual user:** "I don't know the ingredients — I just want to submit the product name and UPC. Let TruePrice figure out the rest."
- **Admin (Zach):** "I get 5–10 submissions a day. I want a simple queue at `/admin/submissions` where I can see the product name, UPC, category guess, and approve or reject with one click."
- **Approved submitter:** "I submitted a product last week and got an email saying it was approved. Now I can see the cost breakdown I was curious about."

---

## Requirements

### Must-Have

- **Submission form** — Authenticated users can submit a product via:
  - Route: `POST /api/products/submit`
  - Minimum required fields: `name` (string), `upc` (string, validated as numeric 8–14 digits), `categoryId` (FK to existing `ProductCategory`)
  - Optional fields: `brand`, `retailPriceCents`, `countryOfOrigin`, `materials` (array of `{ materialId, weightGrams }`)
  - Submission stored in a new `ProductSubmission` model (status: `PENDING | APPROVED | REJECTED`)
- **Submission entry points:**
  - "Not found" screen after a failed barcode scan — "Submit this product" CTA
  - Product search results page — "Don't see what you're looking for? Submit it" link
- **Admin queue** — `/admin/submissions` lists pending submissions with: product name, UPC, submitter email, category, submission date, status badge. Zach can click a submission to open a detail view and approve or reject it.
- **Approve action** — On approval, the submission is converted to a real `Product` row; `CostEstimationService.estimateCost()` is called immediately; submitter is notified via email (Resend).
- **Reject action** — Submission marked `REJECTED`; optional rejection reason stored; no email to submitter for now (avoids abuse vectors).
- **Duplicate detection** — Before creating a submission, check if a `Product` with the same UPC already exists. If so, return a 409 with a link to the existing product page.

### Should-Have

- **UPCitemdb pre-fill** — On UPC entry, call `BarcodeService` in the background to pre-fill `name`, `brand`, and `retailPriceCents` from UPCitemdb before the user submits. Reduces friction; user only needs to confirm and pick a category.
- **Submission status page** — Authenticated users can see their submission history at `/account/submissions`: list of their submitted products with status badges (Pending / Approved / Rejected). Links to the product page if approved.
- **Rate limiting** — Max 5 pending submissions per user at a time. Prevents queue flooding. Return 429 with message when exceeded.
- **Admin bulk actions** — Select multiple pending submissions and approve/reject in bulk. Useful when the queue builds up.

### Won't Have (this goal)

- Community voting on submissions (upvotes/downvotes) — too complex for v1 of this flow
- Auto-approval without admin review — quality control requires human review at this stage
- Submitter-editable material compositions after submission — submit-and-wait model for v1
- Public-facing submission counts or leaderboards — deferred
- Submitter reward/badge system — deferred
- Webhook or Slack notification when a new submission arrives — Zach can check the queue manually or set up a cron notification later

---

## Acceptance Criteria

1. `POST /api/products/submit` returns 401 for unauthenticated requests.
2. `POST /api/products/submit` with a UPC that already exists returns 409 with the existing product's URL in the response body.
3. `POST /api/products/submit` with a valid payload creates a `ProductSubmission` row with `status: PENDING` and returns 201.
4. A user with 5 existing `PENDING` submissions cannot submit a 6th — receives 429.
5. `/admin/submissions` renders a list of all `PENDING` submissions. Accessible only to admin users (defined by `User.email` in an `ADMIN_EMAILS` env var allow-list).
6. Admin approving a submission creates a `Product` row, triggers `CostEstimationService.estimateCost()`, and sends an approval email to the submitter via Resend.
7. Admin rejecting a submission updates status to `REJECTED`; no product row is created.
8. The "not found" barcode screen includes a "Submit this product" CTA that pre-populates the submission form with the scanned UPC.
9. `tsc --noEmit` passes clean. All existing tests pass. ≥15 new tests covering: submission creation, UPC duplicate detection, rate limit enforcement, admin approve flow (creates Product + triggers estimate), admin reject flow, unauthenticated rejection, email send on approval.

---

## Technical Notes

- **New Prisma model:**
  ```prisma
  model ProductSubmission {
    id           String    @id @default(cuid())
    name         String
    upc          String
    brand        String?
    categoryId   String
    category     ProductCategory @relation(fields: [categoryId], references: [id])
    retailPriceCents Int?
    countryOfOrigin  String?
    materials    Json?     // Array of { materialId, weightGrams }; stored raw until approved
    status       SubmissionStatus @default(PENDING)
    submittedById String
    submittedBy  User      @relation(fields: [submittedById], references: [id])
    reviewedAt   DateTime?
    rejectionReason String?
    createdAt    DateTime  @default(now())
    updatedAt    DateTime  @updatedAt
  }
  
  enum SubmissionStatus {
    PENDING
    APPROVED
    REJECTED
  }
  ```
- **New service: `SubmissionService`** — owns all submission CRUD. Methods: `createSubmission()`, `approveSubmission()`, `rejectSubmission()`, `getPendingSubmissions()`, `getUserSubmissions(userId)`. `approveSubmission()` calls `CostEstimationService` (acceptable SoC: submission service delegates estimation to the canonical service) and Resend via a new `NotificationService.sendSubmissionApprovedEmail()` method.
- **Admin auth:** `ADMIN_EMAILS` env var (comma-separated list). Admin check implemented as a middleware helper (`isAdmin(session)`) reused across `/admin/**` routes. Do not use a separate `role` field on `User` for v1 — env var is simpler and avoids a migration.
- **New env var:** `ADMIN_EMAILS` (server-side; comma-separated email addresses).
- **API routes:**
  - `POST /api/products/submit` — create submission
  - `GET /api/admin/submissions` — list pending (admin only)
  - `POST /api/admin/submissions/[id]/approve` — approve (admin only)
  - `POST /api/admin/submissions/[id]/reject` — reject (admin only)
  - `GET /api/account/submissions` — user's own submission history
- **UPCitemdb pre-fill:** Reuse `BarcodeService.lookupByUpc(upc)` from Goal 3. Call from a new API route (`GET /api/products/upc-prefill?upc=<upc>`) so the submission form can fire it client-side via TanStack Query without importing BarcodeService directly.
- **SoC:** All DB writes go through `SubmissionService`. No Prisma calls in API routes. Admin routes must verify admin status before calling service methods.

---

## Open Questions

**Q15-1: Admin notification on new submission**  
Should Zach receive an email (or Discord message) when a new submission comes in, or just check `/admin/submissions` manually? A Discord ping via `NotificationService` would be low-effort to add.  
- **Owner:** Zach | **Priority:** Low — manual queue check is acceptable for low submission volumes

**Q15-2: Submitter approval email content**  
When a submission is approved, what should the email say? Proposed: "Your submission for [product name] has been approved — [see the cost breakdown link]." Should include the markup multiplier in the email body to reward the contribution with immediate value.  
- **Owner:** Zach | **Priority:** Medium — affects perceived quality of the contribution loop

**Q15-3: Material composition input in submission form**  
Should the submission form expose a materials input (ingredient picker from the existing `Material` table) for power users, or require users to submit name+UPC only and let Zach's admin approval fill in materials?  
- Recommendation: Show the materials input as optional / collapsible. Power users who know the ingredients should be able to include them; casual submitters can skip it. Materials entered by the user go into `materials JSON`; admin can edit before approving.  
- **Owner:** Zach | **Priority:** Medium — determines implementation complexity of the submission form

**Q15-4: ADMIN_EMAILS vs. role field**  
Using an env var for admin auth is simpler but requires a redeploy to add new admins. A `User.role` field (`USER | ADMIN`) is more scalable. For v1 with one admin (Zach), env var is fine.  
- **Owner:** PM / Dev | **Priority:** Low — can migrate to role field in a future goal if team grows
