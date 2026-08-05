/**
 * SubmissionService — user-submitted product catalog crowdsourcing.
 *
 * All submission CRUD operations live here. Route handlers must call into
 * these functions; they must never touch Prisma directly.
 *
 * SoC constraints:
 * - approveSubmission() delegates cost estimation to CostEstimationService
 * - approveSubmission() delegates email to NotificationService
 * - No Prisma calls in API routes
 */

import { SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { estimateCost } from "@/services/CostEstimationService";
import { sendSubmissionApprovedEmail, postDiscordAlert } from "@/services/NotificationService";

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_PENDING_SUBMISSIONS = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateSubmissionInput {
  name: string;
  upc: string;
  brand?: string;
  categoryId: string;
  retailPriceCents?: number;
  countryOfOrigin?: string;
  materials?: Array<{ materialId: string; weightGrams: number }>;
}

export interface SubmissionRow {
  id: string;
  name: string;
  upc: string;
  brand: string | null;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  retailPriceCents: number | null;
  countryOfOrigin: string | null;
  materials: unknown;
  status: SubmissionStatus;
  submittedById: string;
  submittedBy: { id: string; email: string | null; name: string | null };
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Creates a new PENDING submission.
 *
 * Throws:
 * - `DUPLICATE_UPC` if a Product with the same UPC already exists
 * - `RATE_LIMITED` if the user already has MAX_PENDING_SUBMISSIONS pending
 */
export async function createSubmission(
  userId: string,
  input: CreateSubmissionInput
): Promise<SubmissionRow> {
  // Validate UPC format: 8–14 numeric digits
  if (!/^\d{8,14}$/.test(input.upc)) {
    throw Object.assign(new Error("Invalid UPC format. Must be 8–14 numeric digits."), {
      code: "INVALID_UPC",
    });
  }

  // Duplicate-UPC check
  const existing = await prisma.product.findUnique({
    where: { upc: input.upc },
    select: { id: true },
  });
  if (existing) {
    throw Object.assign(
      new Error(`Product with UPC ${input.upc} already exists.`),
      { code: "DUPLICATE_UPC", productId: existing.id }
    );
  }

  // Rate-limit check
  const pendingCount = await prisma.productSubmission.count({
    where: { submittedById: userId, status: "PENDING" },
  });
  if (pendingCount >= MAX_PENDING_SUBMISSIONS) {
    throw Object.assign(
      new Error(`You already have ${MAX_PENDING_SUBMISSIONS} pending submissions. Wait for them to be reviewed before submitting more.`),
      { code: "RATE_LIMITED" }
    );
  }

  const row = await prisma.productSubmission.create({
    data: {
      name: input.name,
      upc: input.upc,
      brand: input.brand ?? null,
      categoryId: input.categoryId,
      retailPriceCents: input.retailPriceCents ?? null,
      countryOfOrigin: input.countryOfOrigin ?? null,
      materials: input.materials !== undefined ? input.materials : undefined,
      submittedById: userId,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      submittedBy: { select: { id: true, email: true, name: true } },
    },
  });

  // Notify admin via Discord #alerts (fire-and-forget; no-op if bot token absent)
  void postDiscordAlert(
    "1494231981800820836",
    `📬 New product submission: ${input.name} (${input.upc}) — review at /admin/submissions`
  );

  return row as SubmissionRow;
}

/**
 * Approves a submission:
 * 1. Marks submission APPROVED
 * 2. Creates a Product row from the submission data
 * 3. Triggers CostEstimationService.estimateCost() (fire-and-forget after tx)
 * 4. Sends approval email to submitter via NotificationService
 *
 * All DB writes are wrapped in a transaction.
 */
export async function approveSubmission(id: string): Promise<{ productId: string }> {
  const submission = await prisma.productSubmission.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { email: true, name: true } },
    },
  });

  if (!submission) {
    throw Object.assign(new Error(`Submission ${id} not found.`), { code: "NOT_FOUND" });
  }
  if (submission.status !== "PENDING") {
    throw Object.assign(new Error(`Submission ${id} is not PENDING.`), { code: "INVALID_STATE" });
  }

  let productId: string;

  await prisma.$transaction(async (tx) => {
    // Mark submission approved
    await tx.productSubmission.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });

    // Create Product row from submission data
    const product = await tx.product.create({
      data: {
        name: submission.name,
        upc: submission.upc,
        brand: submission.brand,
        categoryId: submission.categoryId,
        retailPriceCents: submission.retailPriceCents,
        countryOfOrigin: submission.countryOfOrigin,
        source: "user-submission",
        sourceId: submission.id,
      },
    });

    productId = product.id;
  });

  // Fire-and-forget: trigger cost estimation after transaction
  const createdProductId = productId!;
  estimateCost(createdProductId).catch((err) => {
    console.error(`[SubmissionService] estimateCost failed for product ${createdProductId}:`, err);
  });

  // Send approval email (fire-and-forget)
  if (submission.submittedBy.email) {
    sendSubmissionApprovedEmail({
      to: submission.submittedBy.email,
      productName: submission.name,
      productId: createdProductId,
    }).catch((err) => {
      console.error(`[SubmissionService] sendSubmissionApprovedEmail failed for submission ${id}:`, err);
    });
  }

  return { productId: createdProductId };
}

/**
 * Rejects a submission. Updates status to REJECTED; no Product row is created.
 */
export async function rejectSubmission(id: string, reason?: string): Promise<void> {
  const submission = await prisma.productSubmission.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!submission) {
    throw Object.assign(new Error(`Submission ${id} not found.`), { code: "NOT_FOUND" });
  }
  if (submission.status !== "PENDING") {
    throw Object.assign(new Error(`Submission ${id} is not PENDING.`), { code: "INVALID_STATE" });
  }

  await prisma.productSubmission.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      rejectionReason: reason ?? null,
    },
  });
}

/**
 * Returns all PENDING submissions, newest first. Admin use only.
 */
export async function getPendingSubmissions(): Promise<SubmissionRow[]> {
  const rows = await prisma.productSubmission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      submittedBy: { select: { id: true, email: true, name: true } },
    },
  });
  return rows as SubmissionRow[];
}

/**
 * Returns all submissions for the given user, newest first.
 */
export async function getUserSubmissions(userId: string): Promise<SubmissionRow[]> {
  const rows = await prisma.productSubmission.findMany({
    where: { submittedById: userId },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      submittedBy: { select: { id: true, email: true, name: true } },
    },
  });
  return rows as SubmissionRow[];
}
