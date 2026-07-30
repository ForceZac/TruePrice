import { describe, it, expect } from "vitest";
import {
  lbToKg,
  metricTonToKg,
  troyOzToKg,
  bushelWheatToKg,
  bushelCornToKg,
  bushelSoybeansToKg,
  literToKg,
  usdPerKgToCentsPerKg,
  centsPerKgToUsdPerKg,
  normalizeToUsdPerKg,
  rawPriceToCentsPerKg,
} from "../unit-conversion";

describe("lbToKg", () => {
  it("converts USD/lb to USD/kg correctly", () => {
    // 1 USD/lb × 2.20462 = 2.20462 USD/kg
    expect(lbToKg(1)).toBeCloseTo(2.20462, 4);
  });

  it("handles cotton price (~0.85 USD/lb → ~1.87 USD/kg)", () => {
    expect(lbToKg(0.85)).toBeCloseTo(1.874, 2);
  });

  it("handles sugar price (~0.25 USD/lb → ~0.55 USD/kg)", () => {
    expect(lbToKg(0.25)).toBeCloseTo(0.551, 2);
  });
});

describe("metricTonToKg", () => {
  it("converts USD/metric-ton to USD/kg", () => {
    // 1000 USD/MT × 0.001 = 1 USD/kg
    expect(metricTonToKg(1000)).toBeCloseTo(1.0, 5);
  });

  it("handles copper price (~9500 USD/MT → ~9.5 USD/kg)", () => {
    expect(metricTonToKg(9500)).toBeCloseTo(9.5, 5);
  });

  it("handles steel price (~850 USD/MT → ~0.85 USD/kg)", () => {
    expect(metricTonToKg(850)).toBeCloseTo(0.85, 5);
  });
});

describe("troyOzToKg", () => {
  it("converts USD/troy-oz to USD/kg", () => {
    // 1 USD/troy-oz × 32.1507 = 32.1507 USD/kg
    expect(troyOzToKg(1)).toBeCloseTo(32.1507, 3);
  });

  it("handles gold price (~2000 USD/troy-oz → ~64301 USD/kg)", () => {
    expect(troyOzToKg(2000)).toBeCloseTo(64301.4, 0);
  });
});

describe("bushelWheatToKg", () => {
  it("converts USD/bushel-wheat to USD/kg (1 bushel = 27.216 kg)", () => {
    // 27.216 USD/bushel / 27.216 = 1 USD/kg
    expect(bushelWheatToKg(27.216)).toBeCloseTo(1.0, 4);
  });

  it("handles wheat price (~5.50 USD/bushel → ~0.20 USD/kg)", () => {
    expect(bushelWheatToKg(5.50)).toBeCloseTo(0.2021, 3);
  });
});

describe("bushelCornToKg", () => {
  it("converts USD/bushel-corn to USD/kg (1 bushel = 25.4 kg)", () => {
    expect(bushelCornToKg(25.4)).toBeCloseTo(1.0, 4);
  });

  it("handles corn price (~4.50 USD/bushel → ~0.177 USD/kg)", () => {
    expect(bushelCornToKg(4.50)).toBeCloseTo(0.1772, 3);
  });
});

describe("bushelSoybeansToKg", () => {
  it("converts USD/bushel-soybeans to USD/kg (1 bushel = 27.216 kg)", () => {
    expect(bushelSoybeansToKg(27.216)).toBeCloseTo(1.0, 4);
  });
});

describe("literToKg", () => {
  it("defaults to water density (1 kg/liter)", () => {
    expect(literToKg(2.0)).toBeCloseTo(2.0, 5);
  });

  it("uses custom density for denser liquids", () => {
    // Palm oil ≈ 0.91 kg/liter
    expect(literToKg(1.0, 0.91)).toBeCloseTo(1.099, 2);
  });
});

describe("usdPerKgToCentsPerKg", () => {
  it("converts 1.85 USD/kg to 185 cents/kg", () => {
    expect(usdPerKgToCentsPerKg(1.85)).toBe(185);
  });

  it("rounds fractional cents correctly", () => {
    expect(usdPerKgToCentsPerKg(1.856)).toBe(186);
    expect(usdPerKgToCentsPerKg(1.854)).toBe(185);
  });

  it("handles small prices like water (0.001 USD/kg → 0 cents)", () => {
    expect(usdPerKgToCentsPerKg(0.001)).toBe(0);
  });
});

describe("centsPerKgToUsdPerKg", () => {
  it("converts 185 cents to 1.85 USD", () => {
    expect(centsPerKgToUsdPerKg(185)).toBeCloseTo(1.85, 5);
  });

  it("is the inverse of usdPerKgToCentsPerKg (within rounding)", () => {
    const original = 2.349;
    const cents = usdPerKgToCentsPerKg(original);
    const back = centsPerKgToUsdPerKg(cents);
    expect(back).toBeCloseTo(original, 1);
  });
});

describe("normalizeToUsdPerKg", () => {
  it("passes through USD/kg unchanged (factor = 1)", () => {
    expect(normalizeToUsdPerKg(3.5, 1)).toBeCloseTo(3.5, 5);
  });

  it("applies lb→kg factor correctly", () => {
    // 0.85 USD/lb × 2.20462 = ~1.874 USD/kg
    expect(normalizeToUsdPerKg(0.85, 2.20462)).toBeCloseTo(1.874, 2);
  });

  it("applies ton→kg factor correctly", () => {
    // 9500 USD/MT × 0.001 = 9.5 USD/kg
    expect(normalizeToUsdPerKg(9500, 0.001)).toBeCloseTo(9.5, 5);
  });
});

describe("rawPriceToCentsPerKg", () => {
  it("converts cotton: 0.85 USD/lb → 187 cents/kg", () => {
    // 0.85 × 2.20462 = 1.87393 → 187 cents
    expect(rawPriceToCentsPerKg(0.85, 2.20462)).toBe(187);
  });

  it("converts copper: 9500 USD/MT → 950 cents/kg", () => {
    expect(rawPriceToCentsPerKg(9500, 0.001)).toBe(950);
  });

  it("converts sugar: 0.25 USD/lb → 55 cents/kg", () => {
    // 0.25 × 2.20462 = 0.55115 → 55 cents
    expect(rawPriceToCentsPerKg(0.25, 2.20462)).toBe(55);
  });

  it("converts wheat: 5.50 USD/bushel → 20 cents/kg", () => {
    // 5.50 / 27.216 = 0.20208 → 20 cents
    expect(rawPriceToCentsPerKg(5.50, 0.036743)).toBe(20);
  });

  it("converts polycarbonate fallback: 3.50 USD/kg → 350 cents/kg", () => {
    expect(rawPriceToCentsPerKg(3.50, 1)).toBe(350);
  });
});
