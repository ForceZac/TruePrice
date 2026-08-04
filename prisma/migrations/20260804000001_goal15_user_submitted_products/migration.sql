-- Goal 15: User-Submitted Products
-- Adds SubmissionStatus enum and ProductSubmission table for community product submissions.

-- ─── SubmissionStatus enum ───────────────────────────────────────────────────

CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- ─── ProductSubmission ───────────────────────────────────────────────────────

CREATE TABLE "ProductSubmission" (
    "id"               TEXT NOT NULL,
    "name"             TEXT NOT NULL,
    "upc"              TEXT NOT NULL,
    "brand"            TEXT,
    "categoryId"       TEXT NOT NULL,
    "retailPriceCents" INTEGER,
    "countryOfOrigin"  TEXT,
    "materials"        JSONB,
    "status"           "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedById"    TEXT NOT NULL,
    "reviewedAt"       TIMESTAMP(3),
    "rejectionReason"  TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductSubmission_submittedById_idx" ON "ProductSubmission"("submittedById");
CREATE INDEX "ProductSubmission_status_idx"        ON "ProductSubmission"("status");
CREATE INDEX "ProductSubmission_createdAt_idx"     ON "ProductSubmission"("createdAt");

ALTER TABLE "ProductSubmission" ADD CONSTRAINT "ProductSubmission_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductSubmission" ADD CONSTRAINT "ProductSubmission_submittedById_fkey"
    FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
