import { describe, it, expect } from "vitest";
import {
  COMMODITY_MAPPINGS,
  getMappingByMaterialName,
  getMappingsWithApiKey,
} from "../commodity-mappings";

describe("COMMODITY_MAPPINGS", () => {
  it("has at least 30 material mappings", () => {
    expect(COMMODITY_MAPPINGS.length).toBeGreaterThanOrEqual(30);
  });

  it("every mapping has a materialName", () => {
    for (const m of COMMODITY_MAPPINGS) {
      expect(m.materialName).toBeTruthy();
    }
  });

  it("every mapping has a positive fallbackUsdPerKg", () => {
    for (const m of COMMODITY_MAPPINGS) {
      expect(m.fallbackUsdPerKg).toBeGreaterThan(0);
    }
  });

  it("every mapping has a positive conversionToKg", () => {
    for (const m of COMMODITY_MAPPINGS) {
      expect(m.conversionToKg).toBeGreaterThan(0);
    }
  });

  it("has no duplicate materialNames", () => {
    const names = COMMODITY_MAPPINGS.map((m) => m.materialName);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it("covers all required textile materials", () => {
    const required = ["cotton", "polyester", "nylon", "wool", "silk", "elastane", "linen"];
    const names = COMMODITY_MAPPINGS.map((m) => m.materialName);
    for (const r of required) {
      expect(names).toContain(r);
    }
  });

  it("covers all required metal materials", () => {
    const required = ["steel", "aluminum", "copper", "zinc", "tin", "nickel"];
    const names = COMMODITY_MAPPINGS.map((m) => m.materialName);
    for (const r of required) {
      expect(names).toContain(r);
    }
  });

  it("covers all required plastic materials", () => {
    const required = ["polyethylene", "polypropylene", "pvc", "pet", "polycarbonate"];
    const names = COMMODITY_MAPPINGS.map((m) => m.materialName);
    for (const r of required) {
      expect(names).toContain(r);
    }
  });

  it("covers all required food materials", () => {
    const required = ["sugar", "wheat", "cocoa butter", "corn", "soybean oil", "palm oil", "coffee", "rice"];
    const names = COMMODITY_MAPPINGS.map((m) => m.materialName);
    for (const r of required) {
      expect(names).toContain(r);
    }
  });
});

describe("getMappingByMaterialName", () => {
  it("finds cotton by exact name", () => {
    const m = getMappingByMaterialName("cotton");
    expect(m).toBeDefined();
    expect(m!.category).toBe("textile");
  });

  it("is case-insensitive", () => {
    expect(getMappingByMaterialName("COTTON")).toBeDefined();
    expect(getMappingByMaterialName("Cotton")).toBeDefined();
    expect(getMappingByMaterialName("COCOA BUTTER")).toBeDefined();
  });

  it("trims whitespace", () => {
    expect(getMappingByMaterialName("  cotton  ")).toBeDefined();
  });

  it("returns undefined for unknown materials", () => {
    expect(getMappingByMaterialName("unobtanium")).toBeUndefined();
  });
});

describe("getMappingsWithApiKey", () => {
  it("returns only mappings with a non-null apiKey", () => {
    const withKey = getMappingsWithApiKey();
    for (const m of withKey) {
      expect(m.apiKey).not.toBeNull();
    }
  });

  it("includes cotton and copper", () => {
    const withKey = getMappingsWithApiKey();
    const names = withKey.map((m) => m.materialName);
    expect(names).toContain("cotton");
    expect(names).toContain("copper");
  });

  it("does not include polycarbonate (no API coverage)", () => {
    const withKey = getMappingsWithApiKey();
    const names = withKey.map((m) => m.materialName);
    expect(names).not.toContain("polycarbonate");
  });
});
