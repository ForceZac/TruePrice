import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const {
  mockUserFindMany,
  mockSavedProductUpdate,
  mockAlertLogCreate,
} = vi.hoisted(() => ({
  mockUserFindMany: vi.fn(),
  mockSavedProductUpdate: vi.fn(),
  mockAlertLogCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findMany: mockUserFindMany },
    savedProduct: { update: mockSavedProductUpdate },
    alertLog: { create: mockAlertLogCreate },
  },
}));

// ─── CostEstimationService mock ───────────────────────────────────────────────

const { mockGetCachedBreakdown } = vi.hoisted(() => ({
  mockGetCachedBreakdown: vi.fn(),
}));

vi.mock("@/services/CostEstimationService", () => ({
  getCachedBreakdown: mockGetCachedBreakdown,
}));

// ─── resend mock (package not installed in test env) ─────────────────────────

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: "email-id" }) },
  })),
}));

// ─── env mock ─────────────────────────────────────────────────────────────────

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    RESEND_API_KEY: undefined,
    FROM_EMAIL: "digest@trueprice.app",
    ALERT_FROM_EMAIL: undefined,
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import {
  resolveThreshold,
  exceedsThreshold,
  isRateLimited,
  checkWatchlistAlerts,
  DEFAULT_ALERT_THRESHOLD_PCT,
  VALID_THRESHOLDS,
} from "@/services/AlertService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = "user-1";
const PRODUCT_ID = "prod-1";

function makeUser(overrides: object = {}) {
  return {
    id: USER_ID,
    email: "user@example.com",
    name: "Alice",
    alertThresholdPct: null,
    savedProducts: [
      {
        productId: PRODUCT_ID,
        costAtWatchCents: 1000,
        lastAlertedCostCents: null,
        lastAlertedAt: null,
        product: { name: "Test Widget", retailPriceCents: 5000 },
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSavedProductUpdate.mockResolvedValue({});
  mockAlertLogCreate.mockResolvedValue({});
});

// ─── resolveThreshold ─────────────────────────────────────────────────────────

describe("resolveThreshold", () => {
  it("null → DEFAULT_ALERT_THRESHOLD_PCT / 100", () => {
    expect(resolveThreshold(null)).toBe(DEFAULT_ALERT_THRESHOLD_PCT / 100);
  });

  it("0 → 0 (any change)", () => {
    expect(resolveThreshold(0)).toBe(0);
  });

  it("5 → 0.05", () => {
    expect(resolveThreshold(5)).toBe(0.05);
  });

  it("10 → 0.10", () => {
    expect(resolveThreshold(10)).toBe(0.10);
  });

  it("20 → 0.20", () => {
    expect(resolveThreshold(20)).toBe(0.20);
  });

  it("covers every VALID_THRESHOLD value", () => {
    for (const t of VALID_THRESHOLDS) {
      expect(resolveThreshold(t)).toBe(t / 100);
    }
  });
});

// ─── exceedsThreshold ─────────────────────────────────────────────────────────

describe("exceedsThreshold", () => {
  it("returns false when oldCostCents is 0 (avoids divide-by-zero)", () => {
    expect(exceedsThreshold(0, 500, 0.1)).toBe(false);
  });

  it("threshold=0: returns true for any non-zero delta", () => {
    expect(exceedsThreshold(1000, 1001, 0)).toBe(true);
    expect(exceedsThreshold(1000, 999, 0)).toBe(true);
  });

  it("threshold=0: returns false when cost is unchanged", () => {
    expect(exceedsThreshold(1000, 1000, 0)).toBe(false);
  });

  it("fires when absolute delta equals threshold exactly", () => {
    // 10% change on 1000 = 100
    expect(exceedsThreshold(1000, 1100, 0.1)).toBe(true);
  });

  it("does not fire when delta is just below threshold", () => {
    // 9.9% change on 1000
    expect(exceedsThreshold(1000, 1099, 0.1)).toBe(false);
  });

  it("fires on downward movement exceeding threshold", () => {
    // 15% drop on 1000
    expect(exceedsThreshold(1000, 850, 0.1)).toBe(true);
  });
});

// ─── isRateLimited ────────────────────────────────────────────────────────────

describe("isRateLimited", () => {
  it("returns false when lastAlertedAt is null", () => {
    expect(isRateLimited(null, Date.now())).toBe(false);
  });

  it("returns true when last alert was less than 24 h ago", () => {
    const now = Date.now();
    const twentyThreeHoursAgo = new Date(now - 23 * 60 * 60 * 1000);
    expect(isRateLimited(twentyThreeHoursAgo, now)).toBe(true);
  });

  it("returns false when last alert was more than 24 h ago", () => {
    const now = Date.now();
    const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000);
    expect(isRateLimited(twentyFiveHoursAgo, now)).toBe(false);
  });

  it("returns false exactly at the 24 h boundary", () => {
    const now = Date.now();
    const exactlyTwentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    expect(isRateLimited(exactlyTwentyFourHoursAgo, now)).toBe(false);
  });
});

// ─── checkWatchlistAlerts ─────────────────────────────────────────────────────

describe("checkWatchlistAlerts", () => {
  it("returns zero counts when no users have alerts enabled", async () => {
    mockUserFindMany.mockResolvedValue([]);

    const result = await checkWatchlistAlerts();

    expect(result).toEqual({ usersChecked: 0, alertsFired: 0, alertsSkipped: 0 });
    expect(mockAlertLogCreate).not.toHaveBeenCalled();
  });

  it("skips the user when alertsEnabled is false (handled by DB query)", async () => {
    // alertsEnabled=false users are excluded by the where clause, so DB returns []
    mockUserFindMany.mockResolvedValue([]);

    const result = await checkWatchlistAlerts();

    expect(result.usersChecked).toBe(0);
    expect(result.alertsFired).toBe(0);
  });

  it("sets costAtWatchCents and skips when no baseline exists", async () => {
    const user = makeUser({
      savedProducts: [
        {
          productId: PRODUCT_ID,
          costAtWatchCents: null,
          lastAlertedCostCents: null,
          lastAlertedAt: null,
          product: { name: "Widget", retailPriceCents: null },
        },
      ],
    });
    mockUserFindMany.mockResolvedValue([user]);
    mockGetCachedBreakdown.mockResolvedValue({ totalCostCents: 1500 });

    const result = await checkWatchlistAlerts();

    // Sets the baseline
    expect(mockSavedProductUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { costAtWatchCents: 1500 },
      })
    );
    // No alert fired
    expect(mockAlertLogCreate).not.toHaveBeenCalled();
    expect(result.alertsSkipped).toBe(1);
    expect(result.alertsFired).toBe(0);
  });

  it("skips when rate-limited (lastAlertedAt within 24 h)", async () => {
    const recentAlert = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
    const user = makeUser({
      savedProducts: [
        {
          productId: PRODUCT_ID,
          costAtWatchCents: 1000,
          lastAlertedCostCents: 1000,
          lastAlertedAt: recentAlert,
          product: { name: "Widget", retailPriceCents: null },
        },
      ],
    });
    mockUserFindMany.mockResolvedValue([user]);
    mockGetCachedBreakdown.mockResolvedValue({ totalCostCents: 1500 });

    const result = await checkWatchlistAlerts();

    expect(mockAlertLogCreate).not.toHaveBeenCalled();
    expect(result.alertsSkipped).toBe(1);
    expect(result.alertsFired).toBe(0);
  });

  it("skips when cost change is below the threshold", async () => {
    const user = makeUser({ alertThresholdPct: 10 }); // 10% threshold
    mockUserFindMany.mockResolvedValue([user]);
    // costAtWatchCents=1000; newCost=1050 → 5% change → below 10%
    mockGetCachedBreakdown.mockResolvedValue({ totalCostCents: 1050 });

    const result = await checkWatchlistAlerts();

    expect(mockAlertLogCreate).not.toHaveBeenCalled();
    expect(result.alertsSkipped).toBe(1);
    expect(result.alertsFired).toBe(0);
  });

  it("fires alert and updates baseline when threshold is exceeded", async () => {
    const user = makeUser({ alertThresholdPct: 10 }); // 10% threshold
    // costAtWatchCents=1000; newCost=1200 → 20% change → exceeds 10%
    mockUserFindMany.mockResolvedValue([user]);
    mockGetCachedBreakdown.mockResolvedValue({ totalCostCents: 1200 });

    const result = await checkWatchlistAlerts();

    // AlertLog row created
    expect(mockAlertLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: USER_ID,
        productId: PRODUCT_ID,
        oldCostCents: 1000,
        newCostCents: 1200,
        deltaPercent: expect.closeTo(20, 5),
      }),
    });

    // SavedProduct baseline updated
    expect(mockSavedProductUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastAlertedCostCents: 1200,
          lastAlertedAt: expect.any(Date),
        }),
      })
    );

    expect(result.alertsFired).toBe(1);
    expect(result.alertsSkipped).toBe(0);
  });

  it("uses lastAlertedCostCents as baseline when set (not costAtWatchCents)", async () => {
    const user = makeUser({
      alertThresholdPct: 5,
      savedProducts: [
        {
          productId: PRODUCT_ID,
          costAtWatchCents: 800,      // old watch cost — should NOT be used
          lastAlertedCostCents: 1000, // should be used as baseline
          lastAlertedAt: null,
          product: { name: "Widget", retailPriceCents: null },
        },
      ],
    });
    mockUserFindMany.mockResolvedValue([user]);
    // 15% above lastAlertedCostCents baseline
    mockGetCachedBreakdown.mockResolvedValue({ totalCostCents: 1150 });

    const result = await checkWatchlistAlerts();

    expect(mockAlertLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        oldCostCents: 1000, // lastAlertedCostCents, not costAtWatchCents
        newCostCents: 1150,
      }),
    });
    expect(result.alertsFired).toBe(1);
  });

  it("fires alert for 'any change' threshold (0) on minimal delta", async () => {
    const user = makeUser({ alertThresholdPct: 0 }); // any change
    mockUserFindMany.mockResolvedValue([user]);
    // 1-cent change
    mockGetCachedBreakdown.mockResolvedValue({ totalCostCents: 1001 });

    const result = await checkWatchlistAlerts();

    expect(mockAlertLogCreate).toHaveBeenCalled();
    expect(result.alertsFired).toBe(1);
  });

  it("skips gracefully when getCachedBreakdown returns null", async () => {
    const user = makeUser();
    mockUserFindMany.mockResolvedValue([user]);
    mockGetCachedBreakdown.mockResolvedValue(null);

    const result = await checkWatchlistAlerts();

    expect(mockAlertLogCreate).not.toHaveBeenCalled();
    expect(result.alertsSkipped).toBe(1);
  });
});
