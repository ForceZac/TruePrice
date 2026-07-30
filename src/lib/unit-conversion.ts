/**
 * Unit Conversion Helpers
 *
 * All conversions produce USD per kg, since that's the internal standard
 * for commodity prices in TruePrice (stored as integer cents/kg in the DB).
 *
 * Usage: normalize a raw API price to USD/kg, then multiply by 100 to get cents.
 */

/** Multiply a USD/lb price to get USD/kg. */
export function lbToKg(usdPerLb: number): number {
  return usdPerLb * 2.20462;
}

/** Multiply a USD/metric-ton price to get USD/kg. */
export function metricTonToKg(usdPerTon: number): number {
  return usdPerTon * 0.001;
}

/** Multiply a USD/troy-oz price to get USD/kg. */
export function troyOzToKg(usdPerTroyOz: number): number {
  return usdPerTroyOz * 32.1507;
}

/** Multiply a USD/bushel-wheat price (~27.216 kg) to get USD/kg. */
export function bushelWheatToKg(usdPerBushel: number): number {
  return usdPerBushel / 27.216;
}

/** Multiply a USD/bushel-corn price (~25.4 kg) to get USD/kg. */
export function bushelCornToKg(usdPerBushel: number): number {
  return usdPerBushel / 25.4;
}

/** Multiply a USD/bushel-soybeans price (~27.216 kg) to get USD/kg. */
export function bushelSoybeansToKg(usdPerBushel: number): number {
  return usdPerBushel / 27.216;
}

/** Convert USD/liter to USD/kg using a specific liquid density (kg/liter). */
export function literToKg(usdPerLiter: number, densityKgPerLiter = 1.0): number {
  return usdPerLiter / densityKgPerLiter;
}

/**
 * Convert a USD/kg price to integer cents/kg (rounds to nearest cent).
 * This is the format stored in the CommodityPrice table.
 */
export function usdPerKgToCentsPerKg(usdPerKg: number): number {
  return Math.round(usdPerKg * 100);
}

/**
 * Convert integer cents/kg back to USD/kg (for display).
 */
export function centsPerKgToUsdPerKg(centsPerKg: number): number {
  return centsPerKg / 100;
}

/**
 * Generic normalization: apply a conversionToKg factor (from CommodityMapping)
 * to a raw API price and return USD/kg.
 *
 * The conversionToKg factor is: rawPrice × conversionToKg = USD/kg
 */
export function normalizeToUsdPerKg(
  rawPrice: number,
  conversionToKg: number
): number {
  return rawPrice * conversionToKg;
}

/**
 * Full pipeline: raw API price → integer cents/kg.
 *
 * @param rawPrice      Price as returned by the commodity API
 * @param conversionToKg  Factor from CommodityMapping.conversionToKg
 * @returns Integer cents per kg
 */
export function rawPriceToCentsPerKg(
  rawPrice: number,
  conversionToKg: number
): number {
  const usdPerKg = normalizeToUsdPerKg(rawPrice, conversionToKg);
  return usdPerKgToCentsPerKg(usdPerKg);
}
