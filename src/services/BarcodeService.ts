/**
 * BarcodeService — external API integration layer for barcode/UPC lookups.
 *
 * Lookup strategy:
 *   1. Open Food Facts (free, unlimited) — food & beverage
 *   2. UPCitemdb (free tier: 100 req/day) — general products
 *
 * This service does NOT cache — caching is ProductService's responsibility.
 */

import { env } from "@/lib/env";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExternalProductData {
  name: string;
  brand?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  ingredients?: string; // raw ingredient/composition text
  weightGrams?: number;
  countryOfOrigin?: string;
  source: "openfoodfacts" | "upcitemdb";
  sourceId?: string;
}

// ─── Open Food Facts ─────────────────────────────────────────────────────────

interface OFFProductResponse {
  status: number; // 1 = found, 0 = not found
  product?: {
    product_name?: string;
    product_name_en?: string;
    brands?: string;
    generic_name?: string;
    image_front_url?: string;
    categories?: string;
    countries_tags?: string[];
    ingredients_text?: string;
    ingredients_text_en?: string;
    quantity?: string;
    serving_size?: string;
    product_quantity?: string; // numeric grams
  };
}

async function lookupOpenFoodFacts(
  barcode: string
): Promise<ExternalProductData | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "TruePrice/1.0 (trueprice.app)" },
      next: { revalidate: 0 },
    });
  } catch (err) {
    console.error("[BarcodeService] Open Food Facts fetch failed:", err);
    return null;
  }

  if (!res.ok) {
    console.warn(`[BarcodeService] Open Food Facts HTTP ${res.status} for ${barcode}`);
    return null;
  }

  const data = (await res.json()) as OFFProductResponse;

  if (data.status !== 1 || !data.product) {
    return null;
  }

  const p = data.product;

  const name = p.product_name_en || p.product_name;
  if (!name) return null;

  // Parse weight from quantity string like "200 g" or "1.5 kg"
  let weightGrams: number | undefined;
  const weightStr = p.product_quantity || p.quantity;
  if (weightStr) {
    const match = weightStr.match(/^([\d.]+)\s*(g|kg|ml|l)$/i);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === "g" || unit === "ml") weightGrams = val;
      else if (unit === "kg" || unit === "l") weightGrams = val * 1000;
    }
  }

  // Extract ISO country from tags like "en:france" → "FR"
  let countryOfOrigin: string | undefined;
  const countryTags = p.countries_tags ?? [];
  if (countryTags.length > 0) {
    const tag = countryTags[0]; // e.g. "en:france"
    const tagName = tag.split(":")[1];
    if (tagName) {
      countryOfOrigin = TAG_TO_ISO[tagName] ?? tagName.toUpperCase().slice(0, 2);
    }
  }

  return {
    name,
    brand: p.brands?.split(",")[0]?.trim() || undefined,
    description: p.generic_name || undefined,
    imageUrl: p.image_front_url || undefined,
    category: p.categories?.split(",")[0]?.trim() || undefined,
    ingredients: p.ingredients_text_en || p.ingredients_text || undefined,
    weightGrams,
    countryOfOrigin,
    source: "openfoodfacts",
    sourceId: barcode,
  };
}

// Minimal country tag → ISO 3166-1 alpha-2 map for the most common countries
const TAG_TO_ISO: Record<string, string> = {
  "united-states": "US",
  france: "FR",
  germany: "DE",
  "united-kingdom": "GB",
  china: "CN",
  italy: "IT",
  spain: "ES",
  canada: "CA",
  japan: "JP",
  india: "IN",
  vietnam: "VN",
  bangladesh: "BD",
  mexico: "MX",
  switzerland: "CH",
  indonesia: "ID",
  thailand: "TH",
};

// ─── UPCitemdb ────────────────────────────────────────────────────────────────

interface UPCItemDbResponse {
  code: string; // "OK" on success
  items?: Array<{
    title?: string;
    description?: string;
    brand?: string;
    category?: string;
    images?: string[];
    ean?: string;
    upc?: string;
  }>;
  message?: string;
}

async function lookupUPCItemDb(
  barcode: string
): Promise<ExternalProductData | null> {
  const apiKey = env.UPCITEMDB_API_KEY;
  const baseUrl = apiKey
    ? "https://api.upcitemdb.com/prod/v1/lookup"
    : "https://api.upcitemdb.com/prod/trial/lookup";

  const url = `${baseUrl}?upc=${encodeURIComponent(barcode)}`;

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["user_key"] = apiKey;
  }

  let res: Response;
  try {
    res = await fetch(url, { headers, next: { revalidate: 0 } });
  } catch (err) {
    console.error("[BarcodeService] UPCitemdb fetch failed:", err);
    return null;
  }

  if (!res.ok) {
    console.warn(`[BarcodeService] UPCitemdb HTTP ${res.status} for ${barcode}`);
    return null;
  }

  const data = (await res.json()) as UPCItemDbResponse;

  if (data.code !== "OK" || !data.items?.length) {
    return null;
  }

  const item = data.items[0];
  if (!item.title) return null;

  return {
    name: item.title,
    brand: item.brand || undefined,
    description: item.description || undefined,
    imageUrl: item.images?.[0] || undefined,
    category: item.category || undefined,
    source: "upcitemdb",
    sourceId: item.ean || item.upc || barcode,
  };
}

// ─── Food prefix heuristic ────────────────────────────────────────────────────

/**
 * Returns true if the barcode is likely a food/beverage product.
 * Open Food Facts is tried first for these.
 */
function looksLikeFood(barcode: string): boolean {
  // EAN-8 and EAN-13 are common for food. GS1 company prefixes 0-9 (US) are
  // predominantly food; we just try OFF for all 13-digit barcodes since it's free.
  return barcode.length === 8 || barcode.length === 12 || barcode.length === 13;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Look up a product by UPC/EAN barcode.
 * Tries Open Food Facts first for food-length barcodes, then UPCitemdb.
 */
export async function lookupByBarcode(
  barcode: string
): Promise<ExternalProductData | null> {
  const clean = barcode.replace(/\s/g, "");

  if (looksLikeFood(clean)) {
    const off = await lookupOpenFoodFacts(clean);
    if (off) return off;
  }

  const upc = await lookupUPCItemDb(clean);
  return upc;
}

/**
 * Validate a barcode string — returns true if it looks like a valid UPC-A, UPC-E, EAN-8, or EAN-13.
 */
export function isValidBarcode(barcode: string): boolean {
  return /^(\d{6}|\d{8}|\d{12}|\d{13})$/.test(barcode.trim());
}
