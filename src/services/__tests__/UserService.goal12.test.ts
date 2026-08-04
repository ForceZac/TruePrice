/**
 * Goal 12 additions to UserService:
 *   - saveRecentSearch(userId, query) — prepend, dedup, cap at 10
 *   - getRecentSearches(userId) — return array
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Prisma mock ─────────────────────────────────────────────────────────────

const { mockUserFindUnique, mockUserUpdate } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
  },
}));

vi.mock("@/lib/env.server", () => ({
  serverEnv: {
    RESEND_API_KEY: undefined,
    DIGEST_UNSUBSCRIBE_SECRET: undefined,
    FROM_EMAIL: "noreply@example.com",
  },
}));

import { saveRecentSearch, getRecentSearches } from "../UserService";

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockUserFindUnique.mockReset();
  mockUserUpdate.mockReset();
});

describe("saveRecentSearch", () => {
  it("prepends the new query and trims to 10 entries", async () => {
    const existing = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"];
    mockUserFindUnique.mockResolvedValue({ recentSearches: existing });
    mockUserUpdate.mockResolvedValue({});

    await saveRecentSearch("user-1", "new-query");

    const updateCall = mockUserUpdate.mock.calls[0][0];
    const saved: string[] = updateCall.data.recentSearches;
    expect(saved[0]).toBe("new-query");
    expect(saved).toHaveLength(10);
  });

  it("deduplicates — removes prior occurrence before prepending", async () => {
    mockUserFindUnique.mockResolvedValue({ recentSearches: ["shoes", "shirts", "shoes"] });
    mockUserUpdate.mockResolvedValue({});

    await saveRecentSearch("user-1", "shoes");

    const updateCall = mockUserUpdate.mock.calls[0][0];
    const saved: string[] = updateCall.data.recentSearches;
    expect(saved.filter((s: string) => s === "shoes")).toHaveLength(1);
    expect(saved[0]).toBe("shoes");
  });

  it("does nothing when query is blank", async () => {
    await saveRecentSearch("user-1", "   ");

    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("does nothing when user does not exist", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await saveRecentSearch("nonexistent", "query");

    expect(mockUserUpdate).not.toHaveBeenCalled();
  });
});

describe("getRecentSearches", () => {
  it("returns the user's recentSearches array", async () => {
    mockUserFindUnique.mockResolvedValue({ recentSearches: ["boots", "socks"] });

    const result = await getRecentSearches("user-1");

    expect(result).toEqual(["boots", "socks"]);
  });

  it("returns empty array when user does not exist", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const result = await getRecentSearches("nobody");

    expect(result).toEqual([]);
  });
});
