import { describe, it, expect, beforeEach } from "vitest";
import {
  addLocalRecentView,
  getLocalRecentIds,
  clearLocalRecentIds,
} from "@/lib/recentlyViewedLocal";

const KEY = "tp:recentlyViewed";
const LOCAL_CAP = 20;

beforeEach(() => {
  localStorage.clear();
});

// ─── getLocalRecentIds ────────────────────────────────────────────────────────

describe("getLocalRecentIds", () => {
  it("returns empty array when nothing is stored", () => {
    expect(getLocalRecentIds()).toEqual([]);
  });

  it("returns parsed array from localStorage", () => {
    localStorage.setItem(KEY, JSON.stringify(["p1", "p2"]));
    expect(getLocalRecentIds()).toEqual(["p1", "p2"]);
  });

  it("filters out non-string entries", () => {
    localStorage.setItem(KEY, JSON.stringify(["p1", 42, null, "p2"]));
    expect(getLocalRecentIds()).toEqual(["p1", "p2"]);
  });

  it("returns empty array on JSON parse error", () => {
    localStorage.setItem(KEY, "not-valid-json{{");
    expect(getLocalRecentIds()).toEqual([]);
  });

  it("returns empty array when stored value is not an array", () => {
    localStorage.setItem(KEY, JSON.stringify({ foo: "bar" }));
    expect(getLocalRecentIds()).toEqual([]);
  });
});

// ─── addLocalRecentView ───────────────────────────────────────────────────────

describe("addLocalRecentView", () => {
  it("adds an ID to an empty list", () => {
    addLocalRecentView("p1");
    expect(getLocalRecentIds()).toEqual(["p1"]);
  });

  it("prepends new IDs so most-recent is first", () => {
    addLocalRecentView("p1");
    addLocalRecentView("p2");
    expect(getLocalRecentIds()).toEqual(["p2", "p1"]);
  });

  it("deduplicates by moving an existing ID to the front", () => {
    addLocalRecentView("p1");
    addLocalRecentView("p2");
    addLocalRecentView("p1");
    expect(getLocalRecentIds()).toEqual(["p1", "p2"]);
  });

  it(`caps the list at ${LOCAL_CAP} entries`, () => {
    for (let i = 0; i < LOCAL_CAP + 5; i++) {
      addLocalRecentView(`prod-${i}`);
    }
    const ids = getLocalRecentIds();
    expect(ids.length).toBe(LOCAL_CAP);
    expect(ids[0]).toBe(`prod-${LOCAL_CAP + 4}`); // most recent at front
  });
});

// ─── clearLocalRecentIds ──────────────────────────────────────────────────────

describe("clearLocalRecentIds", () => {
  it("removes all stored IDs", () => {
    addLocalRecentView("p1");
    addLocalRecentView("p2");
    clearLocalRecentIds();
    expect(getLocalRecentIds()).toEqual([]);
  });

  it("is a no-op when nothing is stored", () => {
    expect(() => clearLocalRecentIds()).not.toThrow();
    expect(getLocalRecentIds()).toEqual([]);
  });
});
