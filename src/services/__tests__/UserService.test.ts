import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Env mock (UserService now imports serverEnv for digest token functions) ──

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    DATABASE_URL: "postgresql://test:test@localhost/test",
    NODE_ENV: "test",
    RE_ESTIMATION_TTL_DAYS: 7,
    DIGEST_UNSUBSCRIBE_SECRET: "test-secret",
    FROM_EMAIL: "digest@trueprice.app",
  },
}));

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const {
  mockSavedProductFindUnique,
  mockSavedProductFindMany,
  mockSavedProductCount,
  mockSavedProductCreate,
  mockSavedProductDelete,
  mockSavedProductDeleteMany,
  mockRecentlyViewedFindMany,
  mockRecentlyViewedUpsert,
  mockRecentlyViewedDeleteMany,
  mockProductFindMany,
  mockUserFindMany,
  mockUserFindUnique,
  mockUserDelete,
  mockAccountDeleteMany,
  mockSessionDeleteMany,
  mockVerificationTokenDeleteMany,
  mockTransaction,
} = vi.hoisted(() => ({
  mockSavedProductFindUnique: vi.fn(),
  mockSavedProductFindMany: vi.fn(),
  mockSavedProductCount: vi.fn(),
  mockSavedProductCreate: vi.fn(),
  mockSavedProductDelete: vi.fn(),
  mockSavedProductDeleteMany: vi.fn(),
  mockRecentlyViewedFindMany: vi.fn(),
  mockRecentlyViewedUpsert: vi.fn(),
  mockRecentlyViewedDeleteMany: vi.fn(),
  mockProductFindMany: vi.fn(),
  mockUserFindMany: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserDelete: vi.fn(),
  mockAccountDeleteMany: vi.fn(),
  mockSessionDeleteMany: vi.fn(),
  mockVerificationTokenDeleteMany: vi.fn(),
  mockTransaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    savedProduct: {
      findUnique: mockSavedProductFindUnique,
      findMany: mockSavedProductFindMany,
      count: mockSavedProductCount,
      create: mockSavedProductCreate,
      delete: mockSavedProductDelete,
      deleteMany: mockSavedProductDeleteMany,
    },
    recentlyViewed: {
      findMany: mockRecentlyViewedFindMany,
      upsert: mockRecentlyViewedUpsert,
      deleteMany: mockRecentlyViewedDeleteMany,
    },
    product: {
      findMany: mockProductFindMany,
    },
    user: {
      findMany: mockUserFindMany,
      findUnique: mockUserFindUnique,
      delete: mockUserDelete,
    },
    account: {
      deleteMany: mockAccountDeleteMany,
    },
    session: {
      deleteMany: mockSessionDeleteMany,
    },
    verificationToken: {
      deleteMany: mockVerificationTokenDeleteMany,
    },
    $transaction: mockTransaction,
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  mergeLocalRecentlyViewed,
  getDigestCandidates,
  deleteAccount,
  WatchlistCapError,
  WATCHLIST_CAP,
  WATCHLIST_WARN_AT,
  RECENTLY_VIEWED_CAP,
} from "@/services/UserService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = "user-1";
const PRODUCT_ID = "prod-1";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── addToWatchlist ───────────────────────────────────────────────────────────

describe("addToWatchlist", () => {
  it("returns alreadySaved=true if product is already in watchlist", async () => {
    mockSavedProductFindUnique.mockResolvedValue({ userId: USER_ID });

    const result = await addToWatchlist(USER_ID, PRODUCT_ID);

    expect(result.alreadySaved).toBe(true);
    expect(mockSavedProductCreate).not.toHaveBeenCalled();
  });

  it("creates a SavedProduct row when not already saved", async () => {
    mockSavedProductFindUnique.mockResolvedValue(null);
    mockSavedProductCount.mockResolvedValue(0);
    mockSavedProductCreate.mockResolvedValue({ userId: USER_ID, productId: PRODUCT_ID });

    const result = await addToWatchlist(USER_ID, PRODUCT_ID);

    expect(result.alreadySaved).toBe(false);
    expect(mockSavedProductCreate).toHaveBeenCalledWith({
      data: { userId: USER_ID, productId: PRODUCT_ID },
    });
  });

  it("returns nearCap=true when count reaches WATCHLIST_WARN_AT", async () => {
    mockSavedProductFindUnique.mockResolvedValue(null);
    // count is WATCHLIST_WARN_AT - 1 → after create count becomes WATCHLIST_WARN_AT
    mockSavedProductCount.mockResolvedValue(WATCHLIST_WARN_AT - 1);
    mockSavedProductCreate.mockResolvedValue({});

    const result = await addToWatchlist(USER_ID, PRODUCT_ID);

    expect(result.nearCap).toBe(true);
  });

  it("throws WatchlistCapError when at WATCHLIST_CAP", async () => {
    mockSavedProductFindUnique.mockResolvedValue(null);
    mockSavedProductCount.mockResolvedValue(WATCHLIST_CAP);

    await expect(addToWatchlist(USER_ID, PRODUCT_ID)).rejects.toBeInstanceOf(
      WatchlistCapError
    );
    expect(mockSavedProductCreate).not.toHaveBeenCalled();
  });

  it("treats a P2002 unique-constraint error as alreadySaved (race condition)", async () => {
    mockSavedProductFindUnique.mockResolvedValue(null);
    mockSavedProductCount.mockResolvedValue(0);
    const p2002 = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
      name: "PrismaClientKnownRequestError",
      clientVersion: "5.0.0",
      meta: {},
    });
    // Make it an instance of PrismaClientKnownRequestError
    Object.setPrototypeOf(p2002, (await import("@prisma/client")).Prisma.PrismaClientKnownRequestError.prototype);
    mockSavedProductCreate.mockRejectedValue(p2002);

    const result = await addToWatchlist(USER_ID, PRODUCT_ID);

    expect(result.alreadySaved).toBe(true);
  });

  it("re-throws non-P2002 errors from create", async () => {
    mockSavedProductFindUnique.mockResolvedValue(null);
    mockSavedProductCount.mockResolvedValue(0);
    mockSavedProductCreate.mockRejectedValue(new Error("Connection lost"));

    await expect(addToWatchlist(USER_ID, PRODUCT_ID)).rejects.toThrow("Connection lost");
  });
});

// ─── removeFromWatchlist ──────────────────────────────────────────────────────

describe("removeFromWatchlist", () => {
  it("returns false if the product is not in the watchlist", async () => {
    mockSavedProductFindUnique.mockResolvedValue(null);

    const result = await removeFromWatchlist(USER_ID, PRODUCT_ID);

    expect(result).toBe(false);
    expect(mockSavedProductDelete).not.toHaveBeenCalled();
  });

  it("deletes the row and returns true when found", async () => {
    mockSavedProductFindUnique.mockResolvedValue({ userId: USER_ID });
    mockSavedProductDelete.mockResolvedValue({});

    const result = await removeFromWatchlist(USER_ID, PRODUCT_ID);

    expect(result).toBe(true);
    expect(mockSavedProductDelete).toHaveBeenCalledWith({
      where: { userId_productId: { userId: USER_ID, productId: PRODUCT_ID } },
    });
  });
});

// ─── isInWatchlist ────────────────────────────────────────────────────────────

describe("isInWatchlist", () => {
  it("returns true when row exists", async () => {
    mockSavedProductFindUnique.mockResolvedValue({ userId: USER_ID });
    expect(await isInWatchlist(USER_ID, PRODUCT_ID)).toBe(true);
  });

  it("returns false when row does not exist", async () => {
    mockSavedProductFindUnique.mockResolvedValue(null);
    expect(await isInWatchlist(USER_ID, PRODUCT_ID)).toBe(false);
  });
});

// ─── mergeLocalRecentlyViewed ─────────────────────────────────────────────────

describe("mergeLocalRecentlyViewed", () => {
  it("no-ops when localProductIds is empty", async () => {
    await mergeLocalRecentlyViewed(USER_ID, []);
    expect(mockProductFindMany).not.toHaveBeenCalled();
  });

  it("skips IDs that don't exist in the DB", async () => {
    mockProductFindMany.mockResolvedValue([{ id: "prod-2" }]);
    mockRecentlyViewedFindMany.mockResolvedValue([]);

    await mergeLocalRecentlyViewed(USER_ID, ["prod-1-invalid", "prod-2"]);

    // Only prod-2 is valid — one upsert
    expect(mockRecentlyViewedUpsert).toHaveBeenCalledTimes(1);
    expect(mockRecentlyViewedUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_productId: { userId: USER_ID, productId: "prod-2" } } })
    );
  });

  it("deduplicates and caps at RECENTLY_VIEWED_CAP", async () => {
    const validIds = Array.from({ length: 3 }, (_, i) => `prod-${i}`);
    mockProductFindMany.mockResolvedValue(validIds.map((id) => ({ id })));

    // Simulate 12 existing rows (above cap of 10) after upserts
    const existingRows = Array.from({ length: 12 }, (_, i) => ({ productId: `existing-${i}` }));
    mockRecentlyViewedFindMany.mockResolvedValue(existingRows);
    mockRecentlyViewedUpsert.mockResolvedValue({});
    mockRecentlyViewedDeleteMany.mockResolvedValue({});

    await mergeLocalRecentlyViewed(USER_ID, validIds);

    // Should delete the 2 oldest rows beyond the cap
    expect(mockRecentlyViewedDeleteMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
        productId: { in: ["existing-10", "existing-11"] },
      },
    });
  });

  it("does not delete anything when total is within cap", async () => {
    const validIds = ["prod-1"];
    mockProductFindMany.mockResolvedValue([{ id: "prod-1" }]);
    // Only 5 existing rows — well under cap
    const existingRows = Array.from({ length: 5 }, (_, i) => ({ productId: `existing-${i}` }));
    mockRecentlyViewedFindMany.mockResolvedValue(existingRows);
    mockRecentlyViewedUpsert.mockResolvedValue({});

    await mergeLocalRecentlyViewed(USER_ID, validIds);

    expect(mockRecentlyViewedDeleteMany).not.toHaveBeenCalled();
  });
});

// ─── getDigestCandidates ──────────────────────────────────────────────────────

describe("getDigestCandidates", () => {
  const since = new Date("2026-07-24T00:00:00Z");

  it("returns empty array when no users have saved products", async () => {
    mockUserFindMany.mockResolvedValue([]);
    const result = await getDigestCandidates(since);
    expect(result).toEqual([]);
  });

  it("excludes products with fewer than 2 breakdowns in the window", async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: USER_ID,
        email: "test@example.com",
        name: "Test",
        savedProducts: [
          {
            productId: PRODUCT_ID,
            product: {
              id: PRODUCT_ID,
              name: "Widget",
              costBreakdowns: [{ markupPercent: 50, calculatedAt: new Date() }],
            },
          },
        ],
      },
    ]);

    const result = await getDigestCandidates(since);
    expect(result).toEqual([]);
  });

  it("includes products with markup change >= minChangePercent", async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: USER_ID,
        email: "test@example.com",
        name: "Alice",
        savedProducts: [
          {
            productId: PRODUCT_ID,
            product: {
              id: PRODUCT_ID,
              name: "Gizmo",
              costBreakdowns: [
                { markupPercent: 100, calculatedAt: new Date("2026-07-24T01:00:00Z") },
                { markupPercent: 110, calculatedAt: new Date("2026-07-30T01:00:00Z") },
              ],
            },
          },
        ],
      },
    ]);

    const result = await getDigestCandidates(since, 5);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(USER_ID);
    expect(result[0].products[0].productName).toBe("Gizmo");
    expect(result[0].products[0].changePercent).toBe(10);
  });

  it("excludes products below the minChangePercent threshold", async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: USER_ID,
        email: "test@example.com",
        name: "Bob",
        savedProducts: [
          {
            productId: PRODUCT_ID,
            product: {
              id: PRODUCT_ID,
              name: "Widget",
              costBreakdowns: [
                { markupPercent: 100, calculatedAt: new Date("2026-07-24T01:00:00Z") },
                { markupPercent: 102, calculatedAt: new Date("2026-07-30T01:00:00Z") },
              ],
            },
          },
        ],
      },
    ]);

    const result = await getDigestCandidates(since, 5);
    expect(result).toEqual([]);
  });
});

// ─── deleteAccount ────────────────────────────────────────────────────────────

describe("deleteAccount", () => {
  beforeEach(() => {
    mockTransaction.mockImplementation(async (ops: unknown[]) => {
      for (const op of ops) await (op as Promise<unknown>);
    });
    mockRecentlyViewedDeleteMany.mockResolvedValue({});
    mockSavedProductDeleteMany.mockResolvedValue({});
    mockSessionDeleteMany.mockResolvedValue({});
    mockAccountDeleteMany.mockResolvedValue({});
    mockVerificationTokenDeleteMany.mockResolvedValue({});
    mockUserDelete.mockResolvedValue({});
  });

  it("includes VerificationToken cleanup when user has an email", async () => {
    mockUserFindUnique.mockResolvedValue({ email: "alice@example.com" });

    await deleteAccount(USER_ID);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // 5 base operations + 1 verificationToken.deleteMany = 6
    const [ops] = mockTransaction.mock.calls[0] as [unknown[]];
    expect(ops).toHaveLength(6);
    expect(mockVerificationTokenDeleteMany).toHaveBeenCalledWith({
      where: { identifier: "alice@example.com" },
    });
  });

  it("skips VerificationToken cleanup when user has no email", async () => {
    mockUserFindUnique.mockResolvedValue({ email: null });

    await deleteAccount(USER_ID);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // Only 5 base operations — no verificationToken step
    const [ops] = mockTransaction.mock.calls[0] as [unknown[]];
    expect(ops).toHaveLength(5);
    expect(mockVerificationTokenDeleteMany).not.toHaveBeenCalled();
  });
});
