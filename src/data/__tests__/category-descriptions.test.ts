import { describe, it, expect } from "vitest";
import {
  getCategoryDescription,
  CATEGORY_DESCRIPTIONS,
  DEFAULT_CATEGORY_DESCRIPTION,
} from "../category-descriptions";

describe("getCategoryDescription", () => {
  it("returns a description for every seeded category slug", () => {
    const seededSlugs = [
      "food-beverage",
      "clothing-textiles",
      "electronics",
      "cosmetics-personal-care",
      "home-kitchen",
    ];
    for (const slug of seededSlugs) {
      const desc = getCategoryDescription(slug);
      expect(desc.length).toBeGreaterThan(0);
      expect(desc).not.toBe(DEFAULT_CATEGORY_DESCRIPTION);
    }
  });

  it("returns the default description for an unknown slug", () => {
    expect(getCategoryDescription("unknown-category")).toBe(
      DEFAULT_CATEGORY_DESCRIPTION
    );
  });

  it("all descriptions are non-empty strings", () => {
    for (const [slug, desc] of Object.entries(CATEGORY_DESCRIPTIONS)) {
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(20);
      // Should end with a period
      expect(desc.trim().endsWith(".")).toBe(true);
    }
    // Validate the slug field is present in the output too
    expect(Object.keys(CATEGORY_DESCRIPTIONS).length).toBeGreaterThanOrEqual(5);
  });

  it("no description contains raw HTML tags (XSS safety)", () => {
    for (const desc of Object.values(CATEGORY_DESCRIPTIONS)) {
      expect(desc).not.toMatch(/<[a-z]/i);
    }
  });
});
