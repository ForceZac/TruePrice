# TRD: Goal 15 — User-Submitted Products

- **status:** `ready`
- **goal:** `Goal 15`
- **priority:** `P2`
- **branch:** `task/goal15-user-submitted-products`
- **estimated_effort:** `Large`
- **depends_on:** `Goal 3, Goal 8, Goal 10`

## Description

Turn the "product not found" dead end into a contribution flow. Authenticated
users can submit a product (from a barcode scan or manual entry); submissions
go into a review queue at `/admin/submissions`; Zach approves or rejects.
Approved submissions are converted to `Product` rows with immediate cost
estimation and an approval email sent via Resend.

## Acceptance Criteria

- [ ] `POST /api/products/submit` returns 401 for unauthenticated requests
- [ ] `POST /api/products/submit` with a UPC that already exists returns 409 with the existing product's URL
- [ ] `POST /api/products/submit` with a valid payload creates a `ProductSubmission` row with `status: PENDING` and returns 201
- [ ] A user with 5 existing `PENDING` submissions cannot submit a 6th — receives 429
- [ ] `/admin/submissions` renders a list of all `PENDING` submissions; accessible only to admin users (email in `ADMIN_EMAILS` env var)
- [ ] Admin approving a submission creates a `Product` row, calls `CostEstimationService.estimateCost()`, and sends an approval email via Resend
- [ ] Admin rejecting a submission updates status to `REJECTED`; no product row is created
- [ ] The scan page "not found" screen includes a "Submit this product" CTA pre-populated with the scanned UPC (`/submit-product?upc=<upc>`)
- [ ] The search page `EmptyState` includes a "Submit it" link to `/submit-product`
- [ ] `tsc --noEmit` passes clean. All existing tests pass. ≥15 new tests covering: submission creation, UPC duplicate detection, rate limit enforcement, admin approve flow (creates Product + triggers estimate), admin reject flow, unauthenticated rejection, email send on approval

## Tasks

### 1. Prisma schema — ProductSubmission model + SubmissionStatus enum

Add `SubmissionStatus` enum and `ProductSubmission` model to `prisma/schema.prisma`.
Add `submissions` relation to `User` and `ProductCategory`.
Run `npx prisma generate` (migration skipped — no live DB in dev).

### 2. env.server.ts — ADMIN_EMAILS

Add `ADMIN_EMAILS` (optional, comma-separated) to the server env schema.

### 3. SubmissionService

Create `src/services/SubmissionService.ts` with:
- `createSubmission(userId, data)` — validates UPC uniqueness, enforces rate
  limit (max 5 PENDING per user), creates row
- `approveSubmission(id)` — wraps in `prisma.$transaction`: marks `APPROVED`,
  creates `Product`, triggers `estimateCost()`, sends approval email via
  `NotificationService.sendSubmissionApprovedEmail()`
- `rejectSubmission(id, reason?)` — marks `REJECTED`
- `getPendingSubmissions()` — returns all PENDING, newest first
- `getUserSubmissions(userId)` — returns user's own submissions

### 4. NotificationService — sendSubmissionApprovedEmail()

Add `sendSubmissionApprovedEmail({ to, productName, productId })` that
sends an approval email via Resend. Gated on `RESEND_API_KEY` being set.

### 5. isAdmin() helper

Create `src/lib/admin.ts` exporting `isAdmin(email: string | null | undefined): boolean`.
Reads `ADMIN_EMAILS` from `serverEnv`. Returns false if env var is not set.

### 6. API routes

- `POST /api/products/submit` — auth-gated submission creation
- `GET /api/admin/submissions` — list pending (admin only)
- `POST /api/admin/submissions/[id]/approve` — approve (admin only)
- `POST /api/admin/submissions/[id]/reject` — reject (admin only)
- `GET /api/account/submissions` — user's own submission history
- `GET /api/products/upc-prefill?upc=<upc>` — calls BarcodeService.lookupByBarcode(), returns pre-fill data

### 7. /submit-product page

New page at `src/app/submit-product/page.tsx` — a server component wrapping
a client form. `?upc=` query param pre-populates the UPC field. Requires
auth (redirects to sign-in if not logged in). Submits to `POST /api/products/submit`.

### 8. /admin/submissions page

`src/app/admin/submissions/page.tsx` — server component, checks `isAdmin`.
Shows list of pending submissions with approve/reject buttons (client actions).

### 9. /account/submissions page

`src/app/account/submissions/page.tsx` — server component, auth-gated.
Shows user's submission history with status badges.

### 10. Update scan page + search EmptyState

- `src/app/scan/page.tsx`: when barcode lookup returns `found: false`, render
  a "Submit this product" link to `/submit-product?upc=<barcode>`
- `src/app/search/SearchPageClient.tsx`: update `EmptyState` to add a "Submit it"
  link to `/submit-product`

### 11. Tests

Create `src/services/__tests__/SubmissionService.test.ts` with ≥15 tests.
