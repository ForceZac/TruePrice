/**
 * SubmissionService tests — Goal 15: User-Submitted Products
 *
 * Covers:
 *   - createSubmission: UPC validation, duplicate detection, rate limiting, success
 *   - approveSubmission: not found, invalid state, happy path (Product created, email sent)
 *   - rejectSubmission: not found, invalid state, happy path
 *   - getPendingSubmissions
 *   - getUserSubmissions
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ───────────────────────────────────────────────────────────

const {
  mockProductFindUnique,
  mockProductCreate,
  mockSubmissionCount,
  mockSubmissionCreate,
  mockSubmissionFindUnique,
  mockSubmissionUpdate,
  mockSubmissionFindMany,
  mockTransaction,
} = vi.hoisted(() => ({
  mockProductFindUnique: vi.fn(),
  mockProductCreate: vi.fn(),
  mockSubmissionCount: vi.fn(),
  mockSubmissionCreate: vi.fn(),
  mockSubmissionFindUnique: vi.fn(),
  mockSubmissionUpdate: vi.fn(),
  mockSubmissionFindMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    product: {
      findUnique: mockProductFindUnique,
      create: mockProductCreate,
    },
    productSubmission: {
      count: mockSubmissionCount,
      create: mockSubmissionCreate,
      findUnique: mockSubmissionFindUnique,
      update: mockSubmissionUpdate,
      findMany: mockSubmissionFindMany,
    },
    $transaction: mockTransaction,
  },
}));

const { mockEstimateCost } = vi.hoisted(() => ({ mockEstimateCost: vi.fn() }));
vi.mock("@/services/CostEstimationService", () => ({
  estimateCost: mockEstimateCost,
}));

const { mockSendApprovalEmail, mockPostDiscordAlert } = vi.hoisted(() => ({
  mockSendApprovalEmail: vi.fn(),
  mockPostDiscordAlert: vi.fn(),
}));
vi.mock("@/services/NotificationService", () => ({
  sendSubmissionApprovedEmail: mockSendApprovalEmail,
  postDiscordAlert: mockPostDiscordAlert,
}));

import {
  createSubmission,
  approveSubmission,
  rejectSubmission,
  getPendingSubmissions,
  getUserSubmissions,
  MAX_PENDING_SUBMISSIONS,
} from "../SubmissionService";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_INPUT = {
  name: "Test Ketchup",
  upc: "012345678901",
  brand: "Heinz",
  categoryId: "cat-1",
  retailPriceCents: 299,
};

const MOCK_CATEGORY = { id: "cat-1", name: "Condiments", slug: "condiments" };
const MOCK_USER = { id: "user-1", email: "test@example.com", name: "Test User" };

const MOCK_SUBMISSION_ROW = {
  id: "sub-1",
  name: "Test Ketchup",
  upc: "012345678901",
  brand: "Heinz",
  categoryId: "cat-1",
  category: MOCK_CATEGORY,
  retailPriceCents: 299,
  countryOfOrigin: null,
  materials: null,
  status: "PENDING" as const,
  submittedById: "user-1",
  submittedBy: MOCK_USER,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: new Date("2026-08-04"),
  updatedAt: new Date("2026-08-04"),
};

beforeEach(() => {
  vi.resetAllMocks();
  mockEstimateCost.mockResolvedValue(undefined);
  mockSendApprovalEmail.mockResolvedValue(undefined);
  mockPostDiscordAlert.mockResolvedValue(undefined);
});

// ─── createSubmission ─────────────────────────────────────────────────────────

describe("createSubmission", () => {
  it("rejects invalid UPC format (letters)", async () => {
    await expect(
      createSubmission("user-1", { ...VALID_INPUT, upc: "ABC123" })
    ).rejects.toMatchObject({ code: "INVALID_UPC" });
  });

  it("rejects UPC that is too short (< 8 digits)", async () => {
    await expect(
      createSubmission("user-1", { ...VALID_INPUT, upc: "1234567" })
    ).rejects.toMatchObject({ code: "INVALID_UPC" });
  });

  it("rejects when UPC already exists as a Product", async () => {
    mockProductFindUnique.mockResolvedValue({ id: "prod-existing" });

    await expect(
      createSubmission("user-1", VALID_INPUT)
    ).rejects.toMatchObject({ code: "DUPLICATE_UPC", productId: "prod-existing" });
  });

  it("rejects when user has MAX_PENDING_SUBMISSIONS pending submissions", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    mockSubmissionCount.mockResolvedValue(MAX_PENDING_SUBMISSIONS);

    await expect(
      createSubmission("user-1", VALID_INPUT)
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("creates a submission when UPC is new and user is under the limit", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    mockSubmissionCount.mockResolvedValue(0);
    mockSubmissionCreate.mockResolvedValue(MOCK_SUBMISSION_ROW);

    const result = await createSubmission("user-1", VALID_INPUT);

    expect(result.id).toBe("sub-1");
    expect(mockSubmissionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          upc: VALID_INPUT.upc,
          name: VALID_INPUT.name,
          submittedById: "user-1",
        }),
      })
    );
  });

  it("allows submission when user has fewer than MAX_PENDING_SUBMISSIONS", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    mockSubmissionCount.mockResolvedValue(MAX_PENDING_SUBMISSIONS - 1);
    mockSubmissionCreate.mockResolvedValue(MOCK_SUBMISSION_ROW);

    const result = await createSubmission("user-1", VALID_INPUT);
    expect(result).toBeDefined();
  });

  it("passes optional fields (brand, retailPriceCents) through to prisma", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    mockSubmissionCount.mockResolvedValue(0);
    mockSubmissionCreate.mockResolvedValue(MOCK_SUBMISSION_ROW);

    await createSubmission("user-1", VALID_INPUT);

    expect(mockSubmissionCreate.mock.calls[0][0].data).toMatchObject({
      brand: "Heinz",
      retailPriceCents: 299,
    });
  });

  it("accepts a 14-digit UPC", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    mockSubmissionCount.mockResolvedValue(0);
    mockSubmissionCreate.mockResolvedValue({ ...MOCK_SUBMISSION_ROW, upc: "12345678901234" });

    const result = await createSubmission("user-1", { ...VALID_INPUT, upc: "12345678901234" });
    expect(result.upc).toBe("12345678901234");
  });

  it("posts a Discord alert to #alerts after a successful submission", async () => {
    mockProductFindUnique.mockResolvedValue(null);
    mockSubmissionCount.mockResolvedValue(0);
    mockSubmissionCreate.mockResolvedValue(MOCK_SUBMISSION_ROW);

    await createSubmission("user-1", VALID_INPUT);

    expect(mockPostDiscordAlert).toHaveBeenCalledWith(
      "1494231981800820836",
      expect.stringContaining(VALID_INPUT.name)
    );
  });
});

// ─── approveSubmission ────────────────────────────────────────────────────────

describe("approveSubmission", () => {
  it("throws NOT_FOUND when submission does not exist", async () => {
    mockSubmissionFindUnique.mockResolvedValue(null);

    await expect(approveSubmission("sub-missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws INVALID_STATE when submission is not PENDING", async () => {
    mockSubmissionFindUnique.mockResolvedValue({
      ...MOCK_SUBMISSION_ROW,
      status: "APPROVED",
    });

    await expect(approveSubmission("sub-1")).rejects.toMatchObject({
      code: "INVALID_STATE",
    });
  });

  it("runs DB writes in a transaction and returns productId", async () => {
    mockSubmissionFindUnique.mockResolvedValue(MOCK_SUBMISSION_ROW);

    const txProduct = { id: "prod-new" };
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        productSubmission: { update: vi.fn() },
        product: { create: vi.fn().mockResolvedValue(txProduct) },
      };
      await fn(tx);
    });

    const result = await approveSubmission("sub-1");
    expect(result.productId).toBeDefined();
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("fires estimateCost after transaction (fire-and-forget)", async () => {
    mockSubmissionFindUnique.mockResolvedValue(MOCK_SUBMISSION_ROW);
    mockEstimateCost.mockResolvedValue(undefined);

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        productSubmission: { update: vi.fn() },
        product: { create: vi.fn().mockResolvedValue({ id: "prod-new" }) },
      };
      await fn(tx);
    });

    await approveSubmission("sub-1");
    expect(mockEstimateCost).toHaveBeenCalled();
  });

  it("sends approval email when submitter has an email address", async () => {
    mockSubmissionFindUnique.mockResolvedValue(MOCK_SUBMISSION_ROW);

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        productSubmission: { update: vi.fn() },
        product: { create: vi.fn().mockResolvedValue({ id: "prod-new" }) },
      };
      await fn(tx);
    });

    await approveSubmission("sub-1");
    expect(mockSendApprovalEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: MOCK_USER.email })
    );
  });

  it("skips approval email when submitter has no email", async () => {
    mockSubmissionFindUnique.mockResolvedValue({
      ...MOCK_SUBMISSION_ROW,
      submittedBy: { ...MOCK_USER, email: null },
    });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        productSubmission: { update: vi.fn() },
        product: { create: vi.fn().mockResolvedValue({ id: "prod-new" }) },
      };
      await fn(tx);
    });

    await approveSubmission("sub-1");
    expect(mockSendApprovalEmail).not.toHaveBeenCalled();
  });
});

// ─── rejectSubmission ─────────────────────────────────────────────────────────

describe("rejectSubmission", () => {
  it("throws NOT_FOUND when submission does not exist", async () => {
    mockSubmissionFindUnique.mockResolvedValue(null);

    await expect(rejectSubmission("sub-missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws INVALID_STATE when submission is already REJECTED", async () => {
    mockSubmissionFindUnique.mockResolvedValue({ status: "REJECTED" });

    await expect(rejectSubmission("sub-1")).rejects.toMatchObject({
      code: "INVALID_STATE",
    });
  });

  it("updates submission to REJECTED status", async () => {
    mockSubmissionFindUnique.mockResolvedValue({ status: "PENDING" });
    mockSubmissionUpdate.mockResolvedValue({});

    await rejectSubmission("sub-1");

    expect(mockSubmissionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-1" },
        data: expect.objectContaining({ status: "REJECTED" }),
      })
    );
  });

  it("stores rejection reason when provided", async () => {
    mockSubmissionFindUnique.mockResolvedValue({ status: "PENDING" });
    mockSubmissionUpdate.mockResolvedValue({});

    await rejectSubmission("sub-1", "Duplicate entry");

    expect(mockSubmissionUpdate.mock.calls[0][0].data.rejectionReason).toBe("Duplicate entry");
  });

  it("stores null rejection reason when not provided", async () => {
    mockSubmissionFindUnique.mockResolvedValue({ status: "PENDING" });
    mockSubmissionUpdate.mockResolvedValue({});

    await rejectSubmission("sub-1");

    expect(mockSubmissionUpdate.mock.calls[0][0].data.rejectionReason).toBeNull();
  });

  it("does NOT create a Product row when rejecting", async () => {
    mockSubmissionFindUnique.mockResolvedValue({ status: "PENDING" });
    mockSubmissionUpdate.mockResolvedValue({});

    await rejectSubmission("sub-1");

    expect(mockProductCreate).not.toHaveBeenCalled();
  });
});

// ─── getPendingSubmissions ────────────────────────────────────────────────────

describe("getPendingSubmissions", () => {
  it("returns all PENDING submissions ordered by createdAt desc", async () => {
    const rows = [MOCK_SUBMISSION_ROW];
    mockSubmissionFindMany.mockResolvedValue(rows);

    const result = await getPendingSubmissions();

    expect(result).toEqual(rows);
    expect(mockSubmissionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("returns empty array when no pending submissions exist", async () => {
    mockSubmissionFindMany.mockResolvedValue([]);

    const result = await getPendingSubmissions();
    expect(result).toHaveLength(0);
  });
});

// ─── getUserSubmissions ───────────────────────────────────────────────────────

describe("getUserSubmissions", () => {
  it("returns all submissions for the given user, newest first", async () => {
    const rows = [MOCK_SUBMISSION_ROW];
    mockSubmissionFindMany.mockResolvedValue(rows);

    const result = await getUserSubmissions("user-1");

    expect(result).toEqual(rows);
    expect(mockSubmissionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { submittedById: "user-1" },
        orderBy: { createdAt: "desc" },
      })
    );
  });

  it("returns empty array when user has no submissions", async () => {
    mockSubmissionFindMany.mockResolvedValue([]);

    const result = await getUserSubmissions("user-no-subs");
    expect(result).toHaveLength(0);
  });
});
