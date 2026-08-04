// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Env mock ─────────────────────────────────────────────────────────────────

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    DATABASE_URL: "postgresql://test:test@localhost/test",
    NODE_ENV: "test",
    RE_ESTIMATION_TTL_DAYS: 7,
    DIGEST_UNSUBSCRIBE_SECRET: "test-secret-32-bytes-long-enough!",
    FROM_EMAIL: "digest@trueprice.app",
    // No RESEND_API_KEY → sendWeeklyDigests short-circuits
  },
}));

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const {
  mockUserFindMany,
  mockUserFindUnique,
  mockUserUpdate,
  mockCostBreakdownFindMany,
} = vi.hoisted(() => ({
  mockUserFindMany: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockCostBreakdownFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: mockUserFindMany,
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
    costBreakdown: {
      findMany: mockCostBreakdownFindMany,
    },
  },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import {
  signUnsubscribeToken,
  verifyUnsubscribeToken,
  getFullDigestCandidates,
  getDigestPreferences,
  updateDigestPreferences,
  sendWeeklyDigests,
  buildDigestHtml,
  type FullDigestCandidate,
  type DigestHighlight,
} from "@/services/UserService";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── signUnsubscribeToken / verifyUnsubscribeToken ────────────────────────────

describe("signUnsubscribeToken", () => {
  it("returns a non-empty JWT string", async () => {
    const token = await signUnsubscribeToken("user-1");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
  });
});

describe("verifyUnsubscribeToken", () => {
  it("returns userId for a valid token", async () => {
    const token = await signUnsubscribeToken("user-abc");
    const result = await verifyUnsubscribeToken(token);
    expect(result).toEqual({ userId: "user-abc" });
  });

  it("returns null for a tampered token", async () => {
    const token = await signUnsubscribeToken("user-abc");
    const tampered = token.slice(0, -4) + "XXXX";
    const result = await verifyUnsubscribeToken(tampered);
    expect(result).toBeNull();
  });

  it("returns null for a random string", async () => {
    const result = await verifyUnsubscribeToken("not-a-jwt");
    expect(result).toBeNull();
  });
});

// ─── getFullDigestCandidates ──────────────────────────────────────────────────

describe("getFullDigestCandidates", () => {
  const mockUsers = [
    {
      id: "user-1",
      email: "alice@example.com",
      name: "Alice",
      savedProducts: [
        {
          product: {
            id: "prod-1",
            name: "Widget",
            brand: "Acme",
            imageUrl: null,
            retailPriceCents: 2999,
            costBreakdowns: [{ markupPercent: 120.5, confidence: "HIGH" }],
          },
        },
      ],
    },
    {
      id: "user-2",
      email: null, // filtered out
      name: "Bob",
      savedProducts: [{ product: { id: "prod-2", name: "Gadget", brand: null, imageUrl: null, retailPriceCents: null, costBreakdowns: [] } }],
    },
    {
      id: "user-3",
      email: "carol@example.com",
      name: null,
      savedProducts: [],
    },
  ];

  it("returns only users with non-null email, mapped to FullDigestCandidate", async () => {
    mockUserFindMany.mockResolvedValue(mockUsers);

    const result = await getFullDigestCandidates();

    // user-2 (null email) and user-3 (empty savedProducts on mock — they'd be filtered by DB query, but we map all returned rows)
    // Actually user-3 is returned by the mock — the DB filter handles this, but our mapper just maps what prisma returns
    // So we filter only on email !== null
    expect(result).toHaveLength(2); // user-1 and user-3 (carol)
    expect(result[0].email).toBe("alice@example.com");
    expect(result[0].products).toHaveLength(1);
    expect(result[0].products[0].markupPercent).toBe(120.5);
    expect(result[0].products[0].confidence).toBe("HIGH");
  });

  it("uses cursor when provided", async () => {
    mockUserFindMany.mockResolvedValue([]);
    await getFullDigestCandidates(100, "cursor-id");

    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 1,
        cursor: { id: "cursor-id" },
      })
    );
  });

  it("fills missing breakdown data with defaults", async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: "user-5",
        email: "dave@example.com",
        name: "Dave",
        savedProducts: [
          {
            product: {
              id: "prod-5",
              name: "No Breakdown",
              brand: null,
              imageUrl: null,
              retailPriceCents: null,
              costBreakdowns: [], // empty
            },
          },
        ],
      },
    ]);

    const result = await getFullDigestCandidates();

    expect(result[0].products[0].markupPercent).toBeNull();
    expect(result[0].products[0].confidence).toBe("LOW");
  });
});

// ─── getDigestPreferences ─────────────────────────────────────────────────────

describe("getDigestPreferences", () => {
  it("returns { digestEnabled } for a found user", async () => {
    mockUserFindUnique.mockResolvedValue({ digestEnabled: true });
    const result = await getDigestPreferences("user-1");
    expect(result).toEqual({ digestEnabled: true });
  });

  it("returns null when user is not found", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const result = await getDigestPreferences("nonexistent");
    expect(result).toBeNull();
  });
});

// ─── updateDigestPreferences ──────────────────────────────────────────────────

describe("updateDigestPreferences", () => {
  it("calls prisma.user.update with the correct fields", async () => {
    mockUserUpdate.mockResolvedValue({ digestEnabled: false });

    const result = await updateDigestPreferences("user-1", false);

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { digestEnabled: false },
      select: { digestEnabled: true },
    });
    expect(result).toEqual({ digestEnabled: false });
  });

  it("returns the updated digestEnabled value", async () => {
    mockUserUpdate.mockResolvedValue({ digestEnabled: true });
    const result = await updateDigestPreferences("user-1", true);
    expect(result.digestEnabled).toBe(true);
  });
});

// ─── sendWeeklyDigests ────────────────────────────────────────────────────────

describe("sendWeeklyDigests", () => {
  it("returns { sent: 0, skipped: 0, errors: 0 } when RESEND_API_KEY is not set", async () => {
    // Our mock env has no RESEND_API_KEY, so the function should short-circuit
    const result = await sendWeeklyDigests();
    expect(result).toEqual({ sent: 0, skipped: 0, errors: 0 });
    // Prisma should not have been queried
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });
});

// ─── buildDigestHtml ──────────────────────────────────────────────────────────

describe("buildDigestHtml", () => {
  const candidate: FullDigestCandidate = {
    userId: "user-1",
    email: "alice@example.com",
    name: "Alice",
    products: [
      {
        id: "p1",
        name: "Test Widget",
        brand: "Acme",
        imageUrl: null,
        retailPriceCents: 2999,
        markupPercent: 200,
        confidence: "HIGH",
      },
    ],
  };

  const highlights: DigestHighlight[] = [
    { id: "h1", name: "Expensive Gadget", brand: "LuxCo", markupPercent: 500 },
  ];

  it("includes the user name in the greeting", () => {
    const html = buildDigestHtml(candidate, highlights, "fake-token");
    expect(html).toContain("Hi Alice");
  });

  it("includes the product name in the watchlist table", () => {
    const html = buildDigestHtml(candidate, highlights, "fake-token");
    expect(html).toContain("Test Widget");
    expect(html).toContain("200.0%");
  });

  it("includes the platform highlight", () => {
    const html = buildDigestHtml(candidate, highlights, "fake-token");
    expect(html).toContain("Expensive Gadget");
    expect(html).toContain("500.0%");
  });

  it("includes the unsubscribe link with the token", () => {
    const html = buildDigestHtml(candidate, highlights, "my-token");
    expect(html).toContain("my-token");
    expect(html).toContain("/api/account/unsubscribe");
  });

  it("escapes HTML in product names", () => {
    const xssCandidate: FullDigestCandidate = {
      ...candidate,
      name: "<script>alert(1)</script>",
      products: [{ ...candidate.products[0], name: "<b>Bold</b>" }],
    };
    const html = buildDigestHtml(xssCandidate, [], "token");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;");
  });
});
