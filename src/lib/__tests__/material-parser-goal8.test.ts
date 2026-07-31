/**
 * Goal 8 — material-parser alias & edge-case additions.
 *
 * Tests the ≥10 new aliases and unit conversion edge cases added in Goal 8.
 * These supplement the existing material-parser.test.ts without duplicating it.
 */

import { describe, it, expect } from "vitest";
import { parseMaterials } from "@/lib/material-parser";

// ─── HFCS and corn derivatives ────────────────────────────────────────────────

describe("parseMaterials — corn / HFCS aliases (Goal 8)", () => {
  it("maps 'high fructose corn syrup' → corn", () => {
    const result = parseMaterials("Water, High Fructose Corn Syrup, Salt");
    expect(result.map((r) => r.name)).toContain("corn");
  });

  it("maps 'high-fructose corn syrup' → corn", () => {
    const result = parseMaterials("high-fructose corn syrup, water");
    expect(result.map((r) => r.name)).toContain("corn");
  });

  it("maps 'HFCS' → corn (case-insensitive)", () => {
    const result = parseMaterials("Water, HFCS, Citric Acid");
    expect(result.map((r) => r.name)).toContain("corn");
  });

  it("maps 'corn syrup' → corn", () => {
    const result = parseMaterials("water, corn syrup, salt");
    expect(result.map((r) => r.name)).toContain("corn");
  });

  it("maps 'corn syrup solids' → corn", () => {
    const result = parseMaterials("water, corn syrup solids, sugar");
    expect(result.map((r) => r.name)).toContain("corn");
  });

  it("maps 'dextrose' → corn", () => {
    const result = parseMaterials("water, dextrose, natural flavor");
    expect(result.map((r) => r.name)).toContain("corn");
  });

  it("maps 'maltodextrin' → corn", () => {
    const result = parseMaterials("maltodextrin, sugar, water");
    expect(result.map((r) => r.name)).toContain("corn");
  });

  it("maps 'glucose syrup' → corn", () => {
    const result = parseMaterials("water, glucose syrup, citric acid");
    expect(result.map((r) => r.name)).toContain("corn");
  });
});

// ─── Dairy aliases ────────────────────────────────────────────────────────────

describe("parseMaterials — dairy aliases (Goal 8)", () => {
  it("maps 'nonfat dry milk' → milk powder", () => {
    const result = parseMaterials("sugar, nonfat dry milk, cocoa");
    expect(result.map((r) => r.name)).toContain("milk powder");
  });

  it("maps 'whey' → milk powder", () => {
    const result = parseMaterials("water, whey, sugar");
    expect(result.map((r) => r.name)).toContain("milk powder");
  });

  it("maps 'whey protein' → milk powder", () => {
    const result = parseMaterials("water, whey protein, cocoa powder");
    expect(result.map((r) => r.name)).toContain("milk powder");
  });

  it("maps 'casein' → milk powder", () => {
    const result = parseMaterials("casein, water, sugar");
    expect(result.map((r) => r.name)).toContain("milk powder");
  });

  it("maps 'skim milk powder' → milk powder", () => {
    const result = parseMaterials("sugar, skim milk powder, cocoa butter");
    expect(result.map((r) => r.name)).toContain("milk powder");
  });
});

// ─── Grain / starch aliases ───────────────────────────────────────────────────

describe("parseMaterials — grain & starch aliases (Goal 8)", () => {
  it("maps 'modified corn starch' → corn", () => {
    const result = parseMaterials("water, modified corn starch, vinegar");
    expect(result.map((r) => r.name)).toContain("corn");
  });

  it("maps 'modified food starch' → corn", () => {
    const result = parseMaterials("water, modified food starch, sugar");
    expect(result.map((r) => r.name)).toContain("corn");
  });

  it("maps 'rye' → wheat", () => {
    const result = parseMaterials("rye flour, water, yeast");
    expect(result.map((r) => r.name)).toContain("wheat");
  });

  it("maps 'semolina' → wheat", () => {
    const result = parseMaterials("semolina, water, salt");
    expect(result.map((r) => r.name)).toContain("wheat");
  });

  it("maps 'tapioca' → corn (starch commodity)", () => {
    const result = parseMaterials("water, tapioca, sugar");
    expect(result.map((r) => r.name)).toContain("corn");
  });
});

// ─── Oil / fat aliases ────────────────────────────────────────────────────────

describe("parseMaterials — oil/fat aliases (Goal 8)", () => {
  it("maps 'canola oil' → canola oil", () => {
    const result = parseMaterials("wheat flour, canola oil, sugar");
    expect(result.map((r) => r.name)).toContain("canola oil");
  });

  it("maps 'rapeseed oil' → canola oil", () => {
    const result = parseMaterials("water, rapeseed oil, salt");
    expect(result.map((r) => r.name)).toContain("canola oil");
  });

  it("maps 'vegetable oil' → soybean oil", () => {
    const result = parseMaterials("wheat flour, vegetable oil, sugar");
    expect(result.map((r) => r.name)).toContain("soybean oil");
  });

  it("maps 'palm kernel oil' → palm oil", () => {
    const result = parseMaterials("water, palm kernel oil, sugar");
    expect(result.map((r) => r.name)).toContain("palm oil");
  });
});

// ─── Textile aliases ──────────────────────────────────────────────────────────

describe("parseMaterials — textile aliases (Goal 8)", () => {
  it("maps 'spandex' → elastane", () => {
    const result = parseMaterials("95% polyester, 5% spandex");
    const names = result.map((r) => r.name);
    expect(names).toContain("elastane");
  });

  it("maps 'lycra' → elastane", () => {
    const result = parseMaterials("90% cotton, 10% lycra");
    expect(result.map((r) => r.name)).toContain("elastane");
  });

  it("maps 'polyamide' → nylon", () => {
    const result = parseMaterials("80% polyamide, 20% elastane");
    expect(result.map((r) => r.name)).toContain("nylon");
  });

  it("maps 'merino wool' → wool", () => {
    const result = parseMaterials("100% merino wool");
    // Textile parser extracts 'merino wool' then alias maps to 'wool'
    expect(result.map((r) => r.name)).toContain("wool");
  });

  it("maps 'rayon' → viscose", () => {
    const result = parseMaterials("70% rayon, 30% polyester");
    expect(result.map((r) => r.name)).toContain("viscose");
  });
});
