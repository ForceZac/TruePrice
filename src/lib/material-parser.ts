/**
 * material-parser — extract material names and percentages from ingredient/composition text.
 *
 * Supports:
 *   - Food: comma-separated ingredient lists ("sugar, water, citric acid")
 *   - Textiles: percentage compositions ("60% Cotton, 40% Polyester")
 *   - Cosmetics: INCI lists ("Aqua, Glycerin, Sodium Lauryl Sulfate")
 *
 * Returns best-effort matches — unrecognized ingredients are skipped.
 * Confidence scoring happens in CostEstimationService (Goal 4).
 */

export interface ParsedMaterial {
  name: string; // normalized lowercase material name
  percentage?: number; // 0.0–1.0 fraction of product, if stated
  productWeightGrams?: number; // forwarded from caller for weight derivation
}

// ─── Textile parser ───────────────────────────────────────────────────────────

/** Matches patterns like "60% Cotton" or "40 % polyester" */
const TEXTILE_RE = /(\d+(?:\.\d+)?)\s*%\s*([a-zA-Z][\w\s-]*)/g;

function parseTextile(text: string): ParsedMaterial[] {
  const results: ParsedMaterial[] = [];
  let match: RegExpExecArray | null;

  TEXTILE_RE.lastIndex = 0;
  while ((match = TEXTILE_RE.exec(text)) !== null) {
    const percentage = parseFloat(match[1]) / 100;
    const name = normalizeName(match[2]);
    if (name && percentage > 0 && percentage <= 1) {
      results.push({ name, percentage });
    }
  }

  return results;
}

/** Returns true if the text looks like a textile composition. */
function isTextileComposition(text: string): boolean {
  return TEXTILE_RE.test(text.slice(0, 200));
}

// ─── Food / INCI parser ───────────────────────────────────────────────────────

/**
 * Known food/cosmetic ingredients → normalized material name.
 * Only includes ingredients that map to known Material rows (from seed data / commodity mappings).
 */
const INGREDIENT_ALIASES: Record<string, string> = {
  // sugars
  sugar: "sugar",
  "cane sugar": "sugar",
  "beet sugar": "sugar",
  sucrose: "sugar",
  glucose: "sugar",
  fructose: "sugar",
  "high fructose corn syrup": "sugar",
  "corn syrup": "sugar",
  dextrose: "sugar",

  // dairy
  milk: "milk",
  "whole milk": "milk",
  "skim milk": "milk",
  "nonfat milk": "milk",
  "milk powder": "milk powder",
  "dried milk": "milk powder",
  "whey powder": "milk powder",
  cream: "milk",
  butter: "milk",

  // cocoa / chocolate
  cocoa: "cocoa",
  "cocoa powder": "cocoa",
  "cocoa butter": "cocoa butter",
  chocolate: "cocoa",
  "dark chocolate": "cocoa",

  // fats & oils
  "palm oil": "palm oil",
  "vegetable oil": "soybean oil",
  "soybean oil": "soybean oil",
  "canola oil": "canola oil",
  "sunflower oil": "sunflower oil",
  "olive oil": "olive oil",
  "coconut oil": "coconut oil",

  // starches & grains
  wheat: "wheat",
  "wheat flour": "wheat",
  flour: "wheat",
  "enriched flour": "wheat",
  corn: "corn",
  "corn starch": "corn",
  cornstarch: "corn",
  oats: "oats",
  rice: "rice",
  "rice flour": "rice",
  barley: "barley",

  // proteins
  "soy protein": "soybeans",
  soy: "soybeans",
  soybeans: "soybeans",
  "pea protein": "peas",
  peas: "peas",

  // water
  water: "water",
  aqua: "water",

  // coffee / tea
  coffee: "coffee",
  "coffee extract": "coffee",
  tea: "tea",

  // textiles
  cotton: "cotton",
  polyester: "polyester",
  nylon: "nylon",
  wool: "wool",
  silk: "silk",
  linen: "linen",
  elastane: "elastane",
  spandex: "elastane",
  lycra: "elastane",
  acrylic: "acrylic",
  viscose: "viscose",
  rayon: "viscose",
  "modal fabric": "viscose",
  polypropylene: "polypropylene",
  cashmere: "cashmere",

  // metals (for electronics label hints)
  aluminum: "aluminum",
  aluminium: "aluminum",
  steel: "steel",
  copper: "copper",
  gold: "gold",
  silver: "silver",

  // plastics
  "polycarbonate": "polycarbonate",
  "abs plastic": "abs plastic",
  abs: "abs plastic",
  "pvc": "pvc",
  polyethylene: "polyethylene",
  "hdpe": "polyethylene",
  "ldpe": "polyethylene",
  "pet plastic": "pet plastic",
  "polyethylene terephthalate": "pet plastic",
  rubber: "rubber",

  // paper / wood
  paper: "paper",
  cardboard: "paper",
  wood: "wood",
  glass: "glass",
  leather: "leather",
};

function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, "") // strip parenthetical notes like "(antioxidant)"
    .replace(/\[[^\]]*\]/g, "") // strip bracketed notes like "[preservative]"
    .replace(/[*†‡#]+/g, "") // strip footnote markers
    .trim()
    .replace(/\s+/g, " ");
}

function resolveIngredient(raw: string): string | null {
  const normalized = normalizeName(raw);
  if (!normalized) return null;

  // Direct alias lookup
  if (INGREDIENT_ALIASES[normalized]) {
    return INGREDIENT_ALIASES[normalized];
  }

  // Partial prefix match (e.g. "modified corn starch" → "corn")
  for (const [alias, mapped] of Object.entries(INGREDIENT_ALIASES)) {
    if (normalized.startsWith(alias) || normalized.includes(alias)) {
      return mapped;
    }
  }

  return null;
}

/** Split an ingredient list by comma (but not commas inside parentheses). */
function splitIngredients(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const ch of text) {
    if (ch === "(" || ch === "[") {
      depth++;
      current += ch;
    } else if (ch === ")" || ch === "]") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseIngredientList(text: string): ParsedMaterial[] {
  const results: ParsedMaterial[] = [];
  const seen = new Set<string>();

  const parts = splitIngredients(text);
  for (const part of parts) {
    const resolved = resolveIngredient(part);
    if (resolved && !seen.has(resolved)) {
      seen.add(resolved);
      results.push({ name: resolved });
    }
  }

  return results;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Parse ingredient/composition text and return recognized material entries.
 *
 * @param text - Raw ingredient list or composition string from product label.
 * @param category - Optional product category hint ("clothing", "food", etc.).
 * @param productWeightGrams - Total product weight, used to derive material weights from percentages.
 */
export function parseMaterials(
  text: string,
  category?: string,
  productWeightGrams?: number
): ParsedMaterial[] {
  if (!text.trim()) return [];

  // Reset regex state
  TEXTILE_RE.lastIndex = 0;

  const isTextile =
    isTextileComposition(text) ||
    (category?.toLowerCase().match(/cloth|textile|apparel|fashion|wear/) != null);

  let results: ParsedMaterial[];

  if (isTextile) {
    results = parseTextile(text);
  } else {
    results = parseIngredientList(text);
  }

  if (productWeightGrams) {
    return results.map((r) => ({ ...r, productWeightGrams }));
  }

  return results;
}
