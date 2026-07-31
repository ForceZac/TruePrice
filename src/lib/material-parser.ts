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
    const rawName = normalizeName(match[2]);
    // Apply alias lookup to normalize trade names → canonical material names
    const name = INGREDIENT_ALIASES[rawName] ?? rawName;
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
  "high fructose corn syrup": "corn",   // HFCS is a corn derivative
  "high-fructose corn syrup": "corn",
  "hfcs": "corn",
  "corn syrup": "corn",
  "corn syrup solids": "corn",
  dextrose: "corn",                      // dextrose is glucose derived from corn
  maltodextrin: "corn",                  // starch hydrolysis product, typically corn
  "glucose syrup": "corn",
  "invert sugar": "sugar",
  "brown sugar": "sugar",
  "confectioners sugar": "sugar",
  "powdered sugar": "sugar",
  "turbinado sugar": "sugar",
  "honey": "sugar",                      // honey maps to sugar as primary commodity
  "agave": "sugar",
  "maple syrup": "sugar",
  "molasses": "sugar",

  // dairy
  milk: "milk",
  "whole milk": "milk",
  "skim milk": "milk",
  "nonfat milk": "milk",
  "low-fat milk": "milk",
  "reduced fat milk": "milk",
  "2% milk": "milk",
  "buttermilk": "milk",
  "condensed milk": "milk",
  "evaporated milk": "milk",
  "milk powder": "milk powder",
  "dried milk": "milk powder",
  "nonfat dry milk": "milk powder",
  "skim milk powder": "milk powder",
  "whole milk powder": "milk powder",
  "whey powder": "milk powder",
  "whey": "milk powder",
  "whey protein": "milk powder",
  "casein": "milk powder",
  cream: "milk",
  "heavy cream": "milk",
  "sour cream": "milk",
  butter: "milk",
  "butter oil": "milk",
  ghee: "milk",
  cheese: "milk",
  yogurt: "milk",

  // cocoa / chocolate
  cocoa: "cocoa",
  "cocoa powder": "cocoa",
  "cacao": "cocoa",
  "cacao powder": "cocoa",
  "cocoa butter": "cocoa butter",
  "cacao butter": "cocoa butter",
  chocolate: "cocoa",
  "dark chocolate": "cocoa",
  "milk chocolate": "cocoa",
  "white chocolate": "cocoa butter",
  "chocolate liquor": "cocoa",
  "unsweetened chocolate": "cocoa",

  // fats & oils
  "palm oil": "palm oil",
  "palm kernel oil": "palm oil",
  "vegetable oil": "soybean oil",
  "vegetable shortening": "soybean oil",
  "soybean oil": "soybean oil",
  "canola oil": "canola oil",
  "rapeseed oil": "canola oil",
  "sunflower oil": "sunflower oil",
  "olive oil": "olive oil",
  "extra virgin olive oil": "olive oil",
  "coconut oil": "coconut oil",
  "safflower oil": "sunflower oil",
  "cottonseed oil": "soybean oil",
  "corn oil": "corn",
  "sesame oil": "soybean oil",
  "lard": "palm oil",
  "shortening": "soybean oil",

  // starches & grains
  wheat: "wheat",
  "wheat flour": "wheat",
  flour: "wheat",
  "enriched flour": "wheat",
  "all-purpose flour": "wheat",
  "bread flour": "wheat",
  "whole wheat flour": "wheat",
  "wheat starch": "wheat",
  "semolina": "wheat",
  "durum wheat": "wheat",
  "spelt": "wheat",
  corn: "corn",
  "corn starch": "corn",
  cornstarch: "corn",
  "corn flour": "corn",
  "cornmeal": "corn",
  "modified corn starch": "corn",
  "modified food starch": "corn",      // usually corn-derived
  "modified starch": "corn",
  oats: "oats",
  "rolled oats": "oats",
  "oat flour": "oats",
  "oat bran": "oats",
  rice: "rice",
  "rice flour": "rice",
  "white rice": "rice",
  "brown rice": "rice",
  "rice starch": "rice",
  barley: "barley",
  "barley malt": "barley",
  "malt extract": "barley",
  "rye": "wheat",                       // rye maps to wheat as closest commodity
  "quinoa": "oats",
  "tapioca": "corn",                    // tapioca starch maps to starch commodity
  "potato starch": "corn",              // maps to starch commodity
  "arrowroot": "corn",

  // proteins
  "soy protein": "soybeans",
  "soy protein isolate": "soybeans",
  "soy protein concentrate": "soybeans",
  "textured soy protein": "soybeans",
  "textured vegetable protein": "soybeans",
  soy: "soybeans",
  soybeans: "soybeans",
  "soya": "soybeans",
  "tofu": "soybeans",
  "tempeh": "soybeans",
  "miso": "soybeans",
  "pea protein": "peas",
  "pea protein isolate": "peas",
  peas: "peas",
  "split peas": "peas",
  "chickpeas": "peas",
  "lentils": "peas",

  // water
  water: "water",
  aqua: "water",
  "purified water": "water",
  "filtered water": "water",
  "carbonated water": "water",
  "sparkling water": "water",
  "mineral water": "water",

  // coffee / tea
  coffee: "coffee",
  "coffee extract": "coffee",
  "coffee beans": "coffee",
  "ground coffee": "coffee",
  "instant coffee": "coffee",
  "espresso": "coffee",
  tea: "tea",
  "green tea": "tea",
  "black tea": "tea",
  "tea extract": "tea",
  "tea leaves": "tea",

  // cosmetics-specific ingredients
  glycerin: "glycerin",
  glycerol: "glycerin",
  "glycerine": "glycerin",
  "propylene glycol": "glycerin",       // PG is a synthetic glycol, similar cost bucket
  "butylene glycol": "glycerin",

  // textiles
  cotton: "cotton",
  polyester: "polyester",
  "polyester fiber": "polyester",
  "pet fiber": "polyester",            // PET fiber = polyester
  nylon: "nylon",
  "nylon 6": "nylon",
  "nylon 6,6": "nylon",
  "polyamide": "nylon",
  wool: "wool",
  "merino wool": "wool",
  "lambswool": "wool",
  "virgin wool": "wool",
  silk: "silk",
  linen: "linen",
  "flax": "linen",
  elastane: "elastane",
  spandex: "elastane",
  lycra: "elastane",
  "stretch fiber": "elastane",
  acrylic: "acrylic",
  "acrylic fiber": "acrylic",
  viscose: "viscose",
  rayon: "viscose",
  "modal fabric": "viscose",
  modal: "viscose",
  "lyocell": "viscose",
  "tencel": "viscose",
  polypropylene: "polypropylene",
  "pp fiber": "polypropylene",
  cashmere: "cashmere",
  "angora": "wool",                    // angora rabbit fiber, close to wool
  bamboo: "viscose",                   // bamboo fabric is usually bamboo viscose
  "bamboo fiber": "viscose",

  // metals (for electronics label hints)
  aluminum: "aluminum",
  aluminium: "aluminum",
  "aluminum alloy": "aluminum",
  steel: "steel",
  "stainless steel": "steel",
  "carbon steel": "steel",
  copper: "copper",
  gold: "gold",
  silver: "silver",
  "tin": "steel",                       // maps to steel as closest base metal
  "zinc": "steel",

  // plastics
  polycarbonate: "polycarbonate",
  "abs plastic": "abs plastic",
  abs: "abs plastic",
  "acrylonitrile butadiene styrene": "abs plastic",
  pvc: "pvc",
  "polyvinyl chloride": "pvc",
  "vinyl": "pvc",
  polyethylene: "polyethylene",
  hdpe: "polyethylene",
  ldpe: "polyethylene",
  "lldpe": "polyethylene",
  "pe plastic": "polyethylene",
  "pet plastic": "pet plastic",
  "polyethylene terephthalate": "pet plastic",
  "polyester resin": "pet plastic",
  rubber: "rubber",
  "natural rubber": "rubber",
  "synthetic rubber": "rubber",
  "silicone": "rubber",               // silicone rubber
  "tpe": "rubber",                    // thermoplastic elastomer
  "tpr": "rubber",
  "eva": "polyethylene",              // ethylene-vinyl acetate, PE derivative
  "polystyrene": "abs plastic",       // PS maps to ABS bucket
  "eps": "abs plastic",               // expanded polystyrene
  "neoprene": "rubber",
  "latex": "rubber",

  // paper / wood
  paper: "paper",
  cardboard: "paper",
  "paperboard": "paper",
  "kraft paper": "paper",
  wood: "wood",
  "hardwood": "wood",
  "softwood": "wood",
  "plywood": "wood",
  "mdf": "wood",                      // medium-density fiberboard
  "particle board": "wood",
  glass: "glass",
  "borosilicate glass": "glass",
  "tempered glass": "glass",
  leather: "leather",
  "genuine leather": "leather",
  "full grain leather": "leather",
  "suede": "leather",
  "bonded leather": "leather",
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
