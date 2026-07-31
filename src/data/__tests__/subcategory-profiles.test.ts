import { describe, it, expect } from "vitest";
import { getSubcategoryProfile, subcategoryProfiles } from "@/data/subcategory-profiles";

describe("getSubcategoryProfile", () => {
  it("returns null for unknown category/subcategory combo", () => {
    expect(getSubcategoryProfile("unknown-cat", "t-shirt")).toBeNull();
    expect(getSubcategoryProfile("clothing-textiles", "unknown-sub")).toBeNull();
  });

  it("returns null when subcategory is null", () => {
    expect(getSubcategoryProfile("clothing-textiles", null)).toBeNull();
    expect(getSubcategoryProfile("clothing-textiles", undefined)).toBeNull();
  });

  it("returns a t-shirt profile for clothing-textiles", () => {
    const p = getSubcategoryProfile("clothing-textiles", "t-shirt");
    expect(p).not.toBeNull();
    expect(p!.subcategory).toBe("t-shirt");
    expect(p!.categorySlug).toBe("clothing-textiles");
    expect(p!.defaultMaterialMix.length).toBeGreaterThanOrEqual(1);
    expect(p!.defaultWeightGrams).toBeGreaterThan(0);
    expect(p!.defaultLaborHours).toBeGreaterThan(0);
  });

  it("returns a jeans profile for clothing-textiles", () => {
    const p = getSubcategoryProfile("clothing-textiles", "jeans");
    expect(p).not.toBeNull();
    expect(p!.subcategory).toBe("jeans");
  });

  it("returns a shoes profile for clothing-textiles", () => {
    const p = getSubcategoryProfile("clothing-textiles", "shoes");
    expect(p).not.toBeNull();
  });

  it("returns a beverage profile for food-beverage", () => {
    const p = getSubcategoryProfile("food-beverage", "beverage");
    expect(p).not.toBeNull();
    expect(p!.defaultMaterialMix.length).toBeGreaterThanOrEqual(1);
  });

  it("returns a snack profile for food-beverage", () => {
    expect(getSubcategoryProfile("food-beverage", "snack")).not.toBeNull();
  });

  it("returns a canned-good profile for food-beverage", () => {
    expect(getSubcategoryProfile("food-beverage", "canned-good")).not.toBeNull();
  });

  it("returns a smartphone profile for electronics", () => {
    expect(getSubcategoryProfile("electronics", "smartphone")).not.toBeNull();
  });

  it("returns a laptop profile for electronics", () => {
    expect(getSubcategoryProfile("electronics", "laptop")).not.toBeNull();
  });

  it("returns a cable profile for electronics", () => {
    expect(getSubcategoryProfile("electronics", "cable")).not.toBeNull();
  });

  it("returns a moisturizer profile for cosmetics-personal-care", () => {
    expect(getSubcategoryProfile("cosmetics-personal-care", "moisturizer")).not.toBeNull();
  });

  it("returns a shampoo profile for cosmetics-personal-care", () => {
    expect(getSubcategoryProfile("cosmetics-personal-care", "shampoo")).not.toBeNull();
  });

  it("returns a lipstick profile for cosmetics-personal-care", () => {
    expect(getSubcategoryProfile("cosmetics-personal-care", "lipstick")).not.toBeNull();
  });

  it("returns a cookware profile for home-kitchen", () => {
    expect(getSubcategoryProfile("home-kitchen", "cookware")).not.toBeNull();
  });

  it("returns a cutting-board profile for home-kitchen", () => {
    expect(getSubcategoryProfile("home-kitchen", "cutting-board")).not.toBeNull();
  });

  it("returns a knife profile for home-kitchen", () => {
    expect(getSubcategoryProfile("home-kitchen", "knife")).not.toBeNull();
  });

  it("has material mix percentages that sum to ≤1.0 for every profile", () => {
    for (const p of subcategoryProfiles) {
      const sum = p.defaultMaterialMix.reduce((acc, m) => acc + m.percentage, 0);
      expect(sum).toBeLessThanOrEqual(1.001); // allow floating-point rounding
    }
  });

  it("has ≥3 subcategory profiles per required category", () => {
    const cats = [
      "clothing-textiles",
      "food-beverage",
      "electronics",
      "cosmetics-personal-care",
      "home-kitchen",
    ];
    for (const cat of cats) {
      const count = subcategoryProfiles.filter((p) => p.categorySlug === cat).length;
      expect(count, `${cat} should have ≥3 profiles`).toBeGreaterThanOrEqual(3);
    }
  });
});
