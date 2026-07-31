import { describe, it, expect } from "vitest";
import { parseMaterials } from "@/lib/material-parser";

// ─── Textile composition parsing ──────────────────────────────────────────────

describe("parseMaterials — textile compositions", () => {
  it("parses a simple 2-material blend", () => {
    const result = parseMaterials("60% Cotton, 40% Polyester");
    expect(result).toHaveLength(2);

    const cotton = result.find((r) => r.name === "cotton");
    const polyester = result.find((r) => r.name === "polyester");

    expect(cotton).toBeDefined();
    expect(cotton?.percentage).toBeCloseTo(0.6);
    expect(polyester).toBeDefined();
    expect(polyester?.percentage).toBeCloseTo(0.4);
  });

  it("parses 3-material blend with decimals", () => {
    const result = parseMaterials("98% Cotton, 1.5% Elastane, 0.5% Nylon");
    expect(result).toHaveLength(3);
    expect(result.find((r) => r.name === "cotton")?.percentage).toBeCloseTo(0.98);
    expect(result.find((r) => r.name === "elastane")?.percentage).toBeCloseTo(0.015);
    expect(result.find((r) => r.name === "nylon")?.percentage).toBeCloseTo(0.005);
  });

  it("is case-insensitive for textile materials", () => {
    const result = parseMaterials("50% WOOL, 50% silk");
    const wool = result.find((r) => r.name === "wool");
    const silk = result.find((r) => r.name === "silk");
    expect(wool).toBeDefined();
    expect(silk).toBeDefined();
  });

  it("handles spaces around percent sign", () => {
    const result = parseMaterials("70 % linen, 30 % viscose");
    expect(result.find((r) => r.name === "linen")?.percentage).toBeCloseTo(0.7);
    expect(result.find((r) => r.name === "viscose")?.percentage).toBeCloseTo(0.3);
  });

  it("attaches productWeightGrams when provided", () => {
    const result = parseMaterials("60% Cotton, 40% Polyester", undefined, 200);
    for (const r of result) {
      expect(r.productWeightGrams).toBe(200);
    }
  });

  it("respects textile category hint even without percent signs", () => {
    // If no percent signs are found, should return empty for a textile hint
    const result = parseMaterials("Cotton Polyester blend", "clothing");
    // It will attempt textile parse first — won't find percentages so returns []
    expect(result).toHaveLength(0);
  });
});

// ─── Food ingredient list parsing ─────────────────────────────────────────────

describe("parseMaterials — food ingredients", () => {
  it("extracts known ingredients from a comma list", () => {
    const result = parseMaterials("Water, Sugar, Citric Acid, Natural Flavors");
    const names = result.map((r) => r.name);
    expect(names).toContain("water");
    expect(names).toContain("sugar");
  });

  it("deduplicates repeated ingredients", () => {
    const result = parseMaterials("Sugar, Cane Sugar, Water");
    const sugars = result.filter((r) => r.name === "sugar");
    expect(sugars).toHaveLength(1);
  });

  it("handles parenthetical notes without crashing", () => {
    const result = parseMaterials(
      "Enriched Flour (Wheat Flour, Niacin, Reduced Iron), Sugar, Palm Oil"
    );
    const names = result.map((r) => r.name);
    expect(names).toContain("wheat");
    expect(names).toContain("sugar");
    expect(names).toContain("palm oil");
  });

  it("maps alias ingredients to canonical names", () => {
    const result = parseMaterials("Aqua, Glycerin, Sucrose");
    const names = result.map((r) => r.name);
    expect(names).toContain("water"); // Aqua → water
    expect(names).toContain("sugar"); // Sucrose → sugar
  });

  it("skips unrecognized ingredients without error", () => {
    const result = parseMaterials("Water, Xanthan Gum, Sodium Benzoate, Sugar");
    const names = result.map((r) => r.name);
    expect(names).toContain("water");
    expect(names).toContain("sugar");
    // xanthan gum and sodium benzoate are not in our alias map — silently skipped
    expect(names).not.toContain("xanthan gum");
  });

  it("returns empty array for empty string", () => {
    expect(parseMaterials("")).toHaveLength(0);
    expect(parseMaterials("   ")).toHaveLength(0);
  });

  it("handles chocolate bar ingredients", () => {
    const text = "Cocoa butter, Sugar, Milk powder, Cocoa mass";
    const result = parseMaterials(text);
    const names = result.map((r) => r.name);
    expect(names).toContain("cocoa butter");
    expect(names).toContain("sugar");
    expect(names).toContain("milk powder");
    expect(names).toContain("cocoa");
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("parseMaterials — edge cases", () => {
  it("handles null-ish category without throwing", () => {
    expect(() => parseMaterials("Sugar, Water", undefined)).not.toThrow();
    expect(() => parseMaterials("60% Cotton", "")).not.toThrow();
  });

  it("textile wins when both percent signs and ingredient keywords exist", () => {
    const result = parseMaterials("60% Cotton, 40% Sugar (food?)");
    // The percent sign triggers textile mode — cotton should have a percentage
    const cotton = result.find((r) => r.name === "cotton");
    expect(cotton?.percentage).toBeCloseTo(0.6);
  });
});
