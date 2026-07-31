import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Product Categories ───────────────────────────────────────────────────

  const categories = await Promise.all([
    prisma.productCategory.upsert({
      where: { slug: "food-beverage" },
      update: {},
      create: {
        name: "Food & Beverage",
        slug: "food-beverage",
        overheadPercent: 0.30,
        description: "Packaged food, drinks, snacks, and consumables.",
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: "clothing-textiles" },
      update: {},
      create: {
        name: "Clothing & Textiles",
        slug: "clothing-textiles",
        overheadPercent: 0.35,
        description: "Apparel, shoes, and fabric-based goods.",
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: "electronics" },
      update: {},
      create: {
        name: "Electronics",
        slug: "electronics",
        overheadPercent: 0.25,
        description: "Consumer electronics, accessories, and components.",
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: "cosmetics-personal-care" },
      update: {},
      create: {
        name: "Cosmetics & Personal Care",
        slug: "cosmetics-personal-care",
        overheadPercent: 0.45,
        description: "Beauty products, skincare, hygiene, and toiletries.",
      },
    }),
    prisma.productCategory.upsert({
      where: { slug: "home-kitchen" },
      update: {},
      create: {
        name: "Home & Kitchen",
        slug: "home-kitchen",
        overheadPercent: 0.30,
        description: "Household goods, kitchenware, and home accessories.",
      },
    }),
  ]);

  const [foodBev, clothing, electronics, cosmetics, homeKitchen] = categories;

  console.log("Categories seeded:", categories.map((c) => c.name).join(", "));

  // ─── Labor Rates ──────────────────────────────────────────────────────────

  const laborData = [
    { code: "US", name: "United States", cents: 2500 },
    { code: "CN", name: "China", cents: 350 },
    { code: "VN", name: "Vietnam", cents: 180 },
    { code: "BD", name: "Bangladesh", cents: 110 },
    { code: "MX", name: "Mexico", cents: 350 },
    { code: "IN", name: "India", cents: 200 },
    { code: "TH", name: "Thailand", cents: 280 },
    { code: "ID", name: "Indonesia", cents: 175 },
    { code: "DE", name: "Germany", cents: 2200 },
    { code: "CH", name: "Switzerland", cents: 3500 },
    { code: "JP", name: "Japan", cents: 1800 },
    { code: "KR", name: "South Korea", cents: 1400 },
    { code: "TW", name: "Taiwan", cents: 1000 },
    { code: "IT", name: "Italy", cents: 2000 },
    { code: "FR", name: "France", cents: 2100 },
  ];

  for (const lr of laborData) {
    await prisma.laborRate.upsert({
      where: { countryCode: lr.code },
      update: { hourlyRateCents: lr.cents },
      create: {
        countryCode: lr.code,
        countryName: lr.name,
        hourlyRateCents: lr.cents,
        source: "ILO World Employment and Social Outlook 2024",
        lastUpdated: new Date("2024-01-01"),
      },
    });
  }

  console.log("Labor rates seeded for:", laborData.map((l) => l.code).join(", "));

  // ─── Materials ────────────────────────────────────────────────────────────

  const materials: Record<string, { unit: string; categoryTag: string; commodityKey?: string }> = {
    // Textiles
    cotton: { unit: "kg", categoryTag: "textile", commodityKey: "COTTON" },
    polyester: { unit: "kg", categoryTag: "textile", commodityKey: "POLYESTER" },
    elastane: { unit: "kg", categoryTag: "textile" },
    nylon: { unit: "kg", categoryTag: "textile" },
    wool: { unit: "kg", categoryTag: "textile", commodityKey: "WOOL" },
    silk: { unit: "kg", categoryTag: "textile" },
    viscose: { unit: "kg", categoryTag: "textile" },
    linen: { unit: "kg", categoryTag: "textile" },
    acrylic: { unit: "kg", categoryTag: "textile" },
    // Food
    sugar: { unit: "kg", categoryTag: "food", commodityKey: "SUGAR" },
    "cocoa butter": { unit: "kg", categoryTag: "food", commodityKey: "COCOA" },
    "milk powder": { unit: "kg", categoryTag: "food", commodityKey: "MILK_POWDER" },
    water: { unit: "liter", categoryTag: "food" },
    "citric acid": { unit: "kg", categoryTag: "food" },
    wheat: { unit: "kg", categoryTag: "food", commodityKey: "WHEAT" },
    corn: { unit: "kg", categoryTag: "food", commodityKey: "CORN" },
    "palm oil": { unit: "kg", categoryTag: "food", commodityKey: "PALM_OIL" },
    "soybean oil": { unit: "kg", categoryTag: "food", commodityKey: "SOYBEAN_OIL" },
    coffee: { unit: "kg", categoryTag: "food", commodityKey: "COFFEE" },
    rice: { unit: "kg", categoryTag: "food", commodityKey: "RICE" },
    oats: { unit: "kg", categoryTag: "food", commodityKey: "OATS" },
    // Plastics & electronics
    polycarbonate: { unit: "kg", categoryTag: "plastic", commodityKey: "POLYCARBONATE" },
    abs: { unit: "kg", categoryTag: "plastic" },
    aluminum: { unit: "kg", categoryTag: "metal", commodityKey: "ALUMINUM" },
    copper: { unit: "kg", categoryTag: "metal", commodityKey: "COPPER" },
    steel: { unit: "kg", categoryTag: "metal", commodityKey: "STEEL" },
    glass: { unit: "kg", categoryTag: "mineral" },
    leather: { unit: "kg", categoryTag: "material" },
    rubber: { unit: "kg", categoryTag: "material" },
    silicone: { unit: "kg", categoryTag: "material" },
    lithium: { unit: "kg", categoryTag: "metal", commodityKey: "LITHIUM" },
    // Cosmetics
    glycerin: { unit: "kg", categoryTag: "cosmetic" },
    "sodium lauryl sulfate": { unit: "kg", categoryTag: "cosmetic" },
    "cetearyl alcohol": { unit: "kg", categoryTag: "cosmetic" },
    "shea butter": { unit: "kg", categoryTag: "cosmetic" },
    // Wood / home
    wood: { unit: "kg", categoryTag: "material" },
    bamboo: { unit: "kg", categoryTag: "material" },
    ceramic: { unit: "kg", categoryTag: "mineral" },
    stainless: { unit: "kg", categoryTag: "metal", commodityKey: "STEEL" },
    cast_iron: { unit: "kg", categoryTag: "metal", commodityKey: "STEEL" },
  };

  const materialRecords: Record<string, { id: string }> = {};
  for (const [name, meta] of Object.entries(materials)) {
    const record = await prisma.material.upsert({
      where: { name },
      update: {},
      create: {
        name,
        unit: meta.unit,
        categoryTag: meta.categoryTag,
        commodityKey: meta.commodityKey,
      },
    });
    materialRecords[name] = record;
  }

  console.log("Materials seeded:", Object.keys(materials).length, "materials");

  // ─── Helper ───────────────────────────────────────────────────────────────

  type MaterialEntry = { name: string; pct: number; grams?: number };

  async function upsertProduct(
    upc: string,
    data: {
      name: string;
      brand?: string;
      subcategory?: string;
      description?: string;
      categoryId: string;
      retailPriceCents?: number;
      weightGrams?: number;
      countryOfOrigin?: string;
      ingredients?: string;
    },
    mats?: MaterialEntry[]
  ) {
    const product = await prisma.product.upsert({
      where: { upc },
      update: {},
      create: { ...data, upc, source: "manual" },
    });

    if (mats?.length) {
      await prisma.productMaterial.createMany({
        skipDuplicates: true,
        data: mats.map((m) => ({
          productId: product.id,
          materialId: materialRecords[m.name].id,
          percentage: m.pct,
          weightGrams: m.grams ?? (data.weightGrams ? data.weightGrams * m.pct : null),
          source: "label",
        })),
      });
    }

    return product;
  }

  // ─── Products — Clothing & Textiles (25 products, 8 with materials) ───────

  await upsertProduct("000000000001", {
    name: "Classic Cotton T-Shirt",
    brand: "BasicWear",
    subcategory: "t-shirt",
    categoryId: clothing.id,
    description: "Standard 200g cotton/polyester blend t-shirt.",
    retailPriceCents: 2499,
    weightGrams: 200,
    countryOfOrigin: "VN",
    ingredients: "60% cotton, 40% polyester",
  }, [
    { name: "cotton", pct: 0.60, grams: 120 },
    { name: "polyester", pct: 0.40, grams: 80 },
  ]);

  await upsertProduct("000000000005", {
    name: "Classic Slim-Fit Jeans",
    brand: "DenimCo",
    subcategory: "jeans",
    categoryId: clothing.id,
    description: "Slim-fit denim jeans, 98% cotton, 2% elastane.",
    retailPriceCents: 5999,
    weightGrams: 800,
    countryOfOrigin: "BD",
    ingredients: "98% cotton, 2% elastane",
  }, [
    { name: "cotton", pct: 0.98, grams: 784 },
    { name: "elastane", pct: 0.02, grams: 16 },
  ]);

  await upsertProduct("000000000101", {
    name: "Running Athletic Socks (3-pack)",
    brand: "ActiveStep",
    subcategory: "socks",
    categoryId: clothing.id,
    description: "Moisture-wicking athletic socks, polyester blend.",
    retailPriceCents: 1299,
    weightGrams: 120,
    countryOfOrigin: "CN",
    ingredients: "75% polyester, 20% nylon, 5% elastane",
  }, [
    { name: "polyester", pct: 0.75, grams: 90 },
    { name: "nylon", pct: 0.20, grams: 24 },
    { name: "elastane", pct: 0.05, grams: 6 },
  ]);

  await upsertProduct("000000000102", {
    name: "Merino Wool Sweater",
    brand: "AlpineKnit",
    subcategory: "sweater",
    categoryId: clothing.id,
    description: "Soft merino wool pullover, mid-weight.",
    retailPriceCents: 8900,
    weightGrams: 450,
    countryOfOrigin: "IT",
    ingredients: "100% merino wool",
  }, [
    { name: "wool", pct: 1.0, grams: 450 },
  ]);

  await upsertProduct("000000000103", {
    name: "Waterproof Running Jacket",
    brand: "TrailPro",
    subcategory: "jacket",
    categoryId: clothing.id,
    description: "Lightweight waterproof jacket, nylon shell.",
    retailPriceCents: 12900,
    weightGrams: 350,
    countryOfOrigin: "VN",
    ingredients: "100% nylon",
  }, [
    { name: "nylon", pct: 1.0, grams: 350 },
  ]);

  await upsertProduct("000000000104", {
    name: "Silk Blouse",
    brand: "LuxeWear",
    subcategory: "blouse",
    categoryId: clothing.id,
    description: "100% mulberry silk blouse.",
    retailPriceCents: 18999,
    weightGrams: 150,
    countryOfOrigin: "CN",
    ingredients: "100% silk",
  }, [
    { name: "silk", pct: 1.0, grams: 150 },
  ]);

  await upsertProduct("000000000105", {
    name: "Linen Dress Shirt",
    brand: "CasualElegance",
    subcategory: "shirt",
    categoryId: clothing.id,
    description: "Breathable summer linen dress shirt.",
    retailPriceCents: 7900,
    weightGrams: 250,
    countryOfOrigin: "IN",
    ingredients: "100% linen",
  }, [
    { name: "linen", pct: 1.0, grams: 250 },
  ]);

  await upsertProduct("000000000106", {
    name: "Viscose Sundress",
    brand: "BreezeCo",
    subcategory: "dress",
    categoryId: clothing.id,
    description: "Lightweight viscose summer dress.",
    retailPriceCents: 4500,
    weightGrams: 200,
    countryOfOrigin: "BD",
    ingredients: "95% viscose, 5% elastane",
  }, [
    { name: "viscose", pct: 0.95, grams: 190 },
    { name: "elastane", pct: 0.05, grams: 10 },
  ]);

  // Clothing without materials (subcategory-based MEDIUM confidence)
  await upsertProduct("000000000107", { name: "Fleece Zip Hoodie", brand: "CozyLayer", subcategory: "hoodie", categoryId: clothing.id, retailPriceCents: 5999, weightGrams: 600, countryOfOrigin: "CN" });
  await upsertProduct("000000000108", { name: "Chino Pants", brand: "UrbanFit", subcategory: "pants", categoryId: clothing.id, retailPriceCents: 4999, weightGrams: 500, countryOfOrigin: "BD" });
  await upsertProduct("000000000109", { name: "Denim Jacket", brand: "VintageDenim", subcategory: "jacket", categoryId: clothing.id, retailPriceCents: 8900, weightGrams: 700, countryOfOrigin: "MX" });
  await upsertProduct("000000000110", { name: "Yoga Leggings", brand: "FlexForm", subcategory: "leggings", categoryId: clothing.id, retailPriceCents: 4500, weightGrams: 220, countryOfOrigin: "VN" });
  await upsertProduct("000000000111", { name: "Baseball Cap", brand: "HeadGear", subcategory: "cap", categoryId: clothing.id, retailPriceCents: 2499, weightGrams: 85, countryOfOrigin: "CN" });
  await upsertProduct("000000000112", { name: "Winter Beanie", brand: "WarmKnit", subcategory: "hat", categoryId: clothing.id, retailPriceCents: 1999, weightGrams: 100, countryOfOrigin: "CN" });
  await upsertProduct("000000000113", { name: "Ankle Boots", brand: "StrideWell", subcategory: "shoes", categoryId: clothing.id, retailPriceCents: 14900, weightGrams: 900, countryOfOrigin: "IT" });
  await upsertProduct("000000000114", { name: "Canvas Sneakers", brand: "UrbanKick", subcategory: "shoes", categoryId: clothing.id, retailPriceCents: 6999, weightGrams: 650, countryOfOrigin: "CN" });
  await upsertProduct("000000000115", { name: "Silk Scarf", brand: "LuxeWear", subcategory: "accessory", categoryId: clothing.id, retailPriceCents: 5999, weightGrams: 50, countryOfOrigin: "FR" });
  await upsertProduct("000000000116", { name: "Wool Dress Coat", brand: "WinterSelect", subcategory: "coat", categoryId: clothing.id, retailPriceCents: 24900, weightGrams: 1400, countryOfOrigin: "DE" });
  await upsertProduct("000000000117", { name: "Cargo Shorts", brand: "OutdoorLife", subcategory: "shorts", categoryId: clothing.id, retailPriceCents: 3499, weightGrams: 350, countryOfOrigin: "BD" });
  await upsertProduct("000000000118", { name: "Thermal Underwear Set", brand: "WarmLayer", subcategory: "underwear", categoryId: clothing.id, retailPriceCents: 3999, weightGrams: 280, countryOfOrigin: "CN" });
  await upsertProduct("000000000119", { name: "Swim Trunks", brand: "AquaFlex", subcategory: "swimwear", categoryId: clothing.id, retailPriceCents: 2999, weightGrams: 160, countryOfOrigin: "CN" });
  await upsertProduct("000000000120", { name: "Polo Shirt", brand: "ClassicWear", subcategory: "t-shirt", categoryId: clothing.id, retailPriceCents: 3999, weightGrams: 230, countryOfOrigin: "VN" });
  await upsertProduct("000000000121", { name: "Acrylic Knit Sweater", brand: "BudgetKnit", subcategory: "sweater", categoryId: clothing.id, retailPriceCents: 2999, weightGrams: 400, countryOfOrigin: "CN" });
  await upsertProduct("000000000122", { name: "Dress Socks (6-pack)", brand: "FormalStep", subcategory: "socks", categoryId: clothing.id, retailPriceCents: 1499, weightGrams: 180, countryOfOrigin: "CN" });

  // ─── Products — Food & Beverage (25 products, 6 with materials) ──────────

  await upsertProduct("000000000002", {
    name: "Dark Chocolate Bar",
    brand: "AlpenSweet",
    subcategory: "snack",
    categoryId: foodBev.id,
    description: "70% dark chocolate bar made in Switzerland.",
    retailPriceCents: 399,
    weightGrams: 100,
    countryOfOrigin: "CH",
    ingredients: "sugar, cocoa butter, milk powder",
  }, [
    { name: "sugar", pct: 0.30, grams: 30 },
    { name: "cocoa butter", pct: 0.50, grams: 50 },
    { name: "milk powder", pct: 0.20, grams: 20 },
  ]);

  await upsertProduct("000000000003", {
    name: "Cola Soda Can",
    brand: "FizzCo",
    subcategory: "beverage",
    categoryId: foodBev.id,
    description: "355ml carbonated cola beverage.",
    retailPriceCents: 149,
    weightGrams: 380,
    countryOfOrigin: "US",
    ingredients: "water, sugar, citric acid, natural flavors",
  }, [
    { name: "water", pct: 0.88, grams: 312 },
    { name: "sugar", pct: 0.10, grams: 36 },
    { name: "citric acid", pct: 0.02, grams: 7 },
  ]);

  await upsertProduct("000000000201", {
    name: "Instant Oatmeal (12-pack)",
    brand: "MorningGrain",
    subcategory: "snack",
    categoryId: foodBev.id,
    description: "Individual oatmeal packets, plain.",
    retailPriceCents: 499,
    weightGrams: 432,
    countryOfOrigin: "US",
    ingredients: "oats, sugar",
  }, [
    { name: "oats", pct: 0.85, grams: 367 },
    { name: "sugar", pct: 0.15, grams: 65 },
  ]);

  await upsertProduct("000000000202", {
    name: "Ground Coffee (340g)",
    brand: "BeanOrigin",
    subcategory: "beverage",
    categoryId: foodBev.id,
    description: "Medium roast ground coffee.",
    retailPriceCents: 1299,
    weightGrams: 340,
    countryOfOrigin: "US",
    ingredients: "100% arabica coffee",
  }, [
    { name: "coffee", pct: 1.0, grams: 340 },
  ]);

  await upsertProduct("000000000203", {
    name: "Jasmine Rice (2kg)",
    brand: "GoldenHarvest",
    subcategory: "canned-good",
    categoryId: foodBev.id,
    description: "Fragrant Thai jasmine rice.",
    retailPriceCents: 699,
    weightGrams: 2000,
    countryOfOrigin: "TH",
    ingredients: "jasmine rice",
  }, [
    { name: "rice", pct: 1.0, grams: 2000 },
  ]);

  await upsertProduct("000000000204", {
    name: "All-Purpose Flour (5lb)",
    brand: "MillCraft",
    subcategory: "canned-good",
    categoryId: foodBev.id,
    description: "Enriched all-purpose wheat flour.",
    retailPriceCents: 499,
    weightGrams: 2268,
    countryOfOrigin: "US",
    ingredients: "wheat flour",
  }, [
    { name: "wheat", pct: 1.0, grams: 2268 },
  ]);

  // Food without materials
  await upsertProduct("000000000205", { name: "Orange Juice (1L)", brand: "SunPress", subcategory: "beverage", categoryId: foodBev.id, retailPriceCents: 499, weightGrams: 1040, countryOfOrigin: "US" });
  await upsertProduct("000000000206", { name: "Greek Yogurt (32oz)", brand: "CultureFarm", subcategory: "snack", categoryId: foodBev.id, retailPriceCents: 699, weightGrams: 907, countryOfOrigin: "US" });
  await upsertProduct("000000000207", { name: "Whole Grain Crackers", brand: "CrunchBite", subcategory: "snack", categoryId: foodBev.id, retailPriceCents: 399, weightGrams: 200, countryOfOrigin: "US" });
  await upsertProduct("000000000208", { name: "Tomato Soup (can)", brand: "HearthKitchen", subcategory: "canned-good", categoryId: foodBev.id, retailPriceCents: 249, weightGrams: 305, countryOfOrigin: "US" });
  await upsertProduct("000000000209", { name: "Black Beans (can)", brand: "TerraGarden", subcategory: "canned-good", categoryId: foodBev.id, retailPriceCents: 189, weightGrams: 425, countryOfOrigin: "US" });
  await upsertProduct("000000000210", { name: "Olive Oil (500ml)", brand: "MedGrove", subcategory: "beverage", categoryId: foodBev.id, retailPriceCents: 999, weightGrams: 460, countryOfOrigin: "IT" });
  await upsertProduct("000000000211", { name: "Potato Chips (family size)", brand: "CrispCo", subcategory: "snack", categoryId: foodBev.id, retailPriceCents: 499, weightGrams: 283, countryOfOrigin: "US" });
  await upsertProduct("000000000212", { name: "Energy Drink (16oz)", brand: "BoltUp", subcategory: "beverage", categoryId: foodBev.id, retailPriceCents: 299, weightGrams: 470, countryOfOrigin: "US" });
  await upsertProduct("000000000213", { name: "Pasta (1lb)", brand: "BellaItaliana", subcategory: "canned-good", categoryId: foodBev.id, retailPriceCents: 199, weightGrams: 454, countryOfOrigin: "IT" });
  await upsertProduct("000000000214", { name: "Peanut Butter (18oz)", brand: "NutGrove", subcategory: "snack", categoryId: foodBev.id, retailPriceCents: 549, weightGrams: 510, countryOfOrigin: "US" });
  await upsertProduct("000000000215", { name: "Protein Bar (12-pack)", brand: "FuelUp", subcategory: "snack", categoryId: foodBev.id, retailPriceCents: 2499, weightGrams: 720, countryOfOrigin: "US" });
  await upsertProduct("000000000216", { name: "Green Tea (20 bags)", brand: "ZenLeaf", subcategory: "beverage", categoryId: foodBev.id, retailPriceCents: 599, weightGrams: 40, countryOfOrigin: "JP" });
  await upsertProduct("000000000217", { name: "Granola Cereal (18oz)", brand: "MorningCrunch", subcategory: "snack", categoryId: foodBev.id, retailPriceCents: 699, weightGrams: 510, countryOfOrigin: "US" });
  await upsertProduct("000000000218", { name: "Sparkling Water (12-pack)", brand: "BubbleFlow", subcategory: "beverage", categoryId: foodBev.id, retailPriceCents: 799, weightGrams: 4320, countryOfOrigin: "US" });
  await upsertProduct("000000000219", { name: "Honey (12oz)", brand: "GoldenHive", subcategory: "snack", categoryId: foodBev.id, retailPriceCents: 899, weightGrams: 340, countryOfOrigin: "US" });
  await upsertProduct("000000000220", { name: "Mixed Nuts (1lb)", brand: "NutSelect", subcategory: "snack", categoryId: foodBev.id, retailPriceCents: 1299, weightGrams: 454, countryOfOrigin: "US" });
  await upsertProduct("000000000221", { name: "Apple Cider Vinegar (32oz)", brand: "NaturalVine", subcategory: "beverage", categoryId: foodBev.id, retailPriceCents: 599, weightGrams: 960, countryOfOrigin: "US" });
  await upsertProduct("000000000222", { name: "Sriracha Hot Sauce (28oz)", brand: "FireRooster", subcategory: "canned-good", categoryId: foodBev.id, retailPriceCents: 499, weightGrams: 793, countryOfOrigin: "US" });
  await upsertProduct("000000000223", { name: "Almond Milk (64oz)", brand: "TreePure", subcategory: "beverage", categoryId: foodBev.id, retailPriceCents: 499, weightGrams: 1920, countryOfOrigin: "US" });

  // ─── Products — Electronics (20 products, 4 with materials) ─────────────

  await upsertProduct("000000000004", {
    name: "Slim Polycarbonate Phone Case",
    brand: "TechShell",
    subcategory: "cable",
    categoryId: electronics.id,
    description: "Thin polycarbonate protective case for smartphones.",
    retailPriceCents: 1499,
    weightGrams: 30,
    countryOfOrigin: "CN",
    ingredients: "polycarbonate plastic",
  }, [
    { name: "polycarbonate", pct: 1.0, grams: 30 },
  ]);

  await upsertProduct("000000000301", {
    name: "USB-C Charging Cable (6ft)",
    brand: "PowerLink",
    subcategory: "cable",
    categoryId: electronics.id,
    description: "Braided nylon USB-C cable, 6-foot length.",
    retailPriceCents: 1299,
    weightGrams: 45,
    countryOfOrigin: "CN",
    ingredients: "copper core, nylon braid, rubber",
  }, [
    { name: "copper", pct: 0.35, grams: 16 },
    { name: "nylon", pct: 0.40, grams: 18 },
    { name: "rubber", pct: 0.25, grams: 11 },
  ]);

  await upsertProduct("000000000302", {
    name: "Wireless Earbuds",
    brand: "SoundCore",
    subcategory: "earbuds",
    categoryId: electronics.id,
    description: "True wireless earbuds with charging case.",
    retailPriceCents: 4999,
    weightGrams: 60,
    countryOfOrigin: "CN",
    ingredients: "ABS plastic, silicone, copper",
  }, [
    { name: "abs", pct: 0.60, grams: 36 },
    { name: "silicone", pct: 0.20, grams: 12 },
    { name: "copper", pct: 0.20, grams: 12 },
  ]);

  await upsertProduct("000000000303", {
    name: "Aluminum Laptop Stand",
    brand: "DeskPro",
    subcategory: "laptop",
    categoryId: electronics.id,
    description: "Adjustable aluminum laptop stand.",
    retailPriceCents: 3999,
    weightGrams: 800,
    countryOfOrigin: "CN",
    ingredients: "aluminum",
  }, [
    { name: "aluminum", pct: 1.0, grams: 800 },
  ]);

  // Electronics without materials
  // Subcategory assignments: earbuds≈small speaker, charger≈powered accessories, cable≈passive accessories
  await upsertProduct("000000000304", { name: "Portable Bluetooth Speaker", brand: "BassBoom", subcategory: "earbuds", categoryId: electronics.id, retailPriceCents: 3999, weightGrams: 500, countryOfOrigin: "CN" });
  await upsertProduct("000000000305", { name: "Smart Watch", brand: "TimeTech", subcategory: "smartphone", categoryId: electronics.id, retailPriceCents: 19999, weightGrams: 52, countryOfOrigin: "CN" });
  await upsertProduct("000000000306", { name: "Laptop Backpack", brand: "TravelTech", categoryId: electronics.id, retailPriceCents: 5999, weightGrams: 900, countryOfOrigin: "CN" });
  await upsertProduct("000000000307", { name: "Mechanical Keyboard", brand: "TypeMaster", subcategory: "cable", categoryId: electronics.id, retailPriceCents: 12999, weightGrams: 1100, countryOfOrigin: "CN" });
  await upsertProduct("000000000308", { name: "HDMI Cable (10ft)", brand: "DisplayLink", subcategory: "cable", categoryId: electronics.id, retailPriceCents: 1499, weightGrams: 120, countryOfOrigin: "CN" });
  await upsertProduct("000000000309", { name: "Wireless Mouse", brand: "ClickPro", subcategory: "cable", categoryId: electronics.id, retailPriceCents: 3499, weightGrams: 90, countryOfOrigin: "CN" });
  await upsertProduct("000000000310", { name: "Phone Wallet Case", brand: "SlimCarry", subcategory: "smartphone", categoryId: electronics.id, retailPriceCents: 2499, weightGrams: 40, countryOfOrigin: "CN" });
  await upsertProduct("000000000311", { name: "USB Hub (7-port)", brand: "ConnectAll", subcategory: "cable", categoryId: electronics.id, retailPriceCents: 3999, weightGrams: 200, countryOfOrigin: "CN" });
  await upsertProduct("000000000312", { name: "Ring Light (10-inch)", brand: "LitUp", subcategory: "charger", categoryId: electronics.id, retailPriceCents: 2999, weightGrams: 600, countryOfOrigin: "CN" });
  await upsertProduct("000000000313", { name: "Webcam (1080p)", brand: "ClearView", subcategory: "laptop", categoryId: electronics.id, retailPriceCents: 5999, weightGrams: 150, countryOfOrigin: "CN" });
  await upsertProduct("000000000314", { name: "Power Bank (20000mAh)", brand: "ChargePack", subcategory: "charger", categoryId: electronics.id, retailPriceCents: 4999, weightGrams: 440, countryOfOrigin: "CN" });
  await upsertProduct("000000000315", { name: "Screen Protector (2-pack)", brand: "ClearGuard", categoryId: electronics.id, retailPriceCents: 999, weightGrams: 10, countryOfOrigin: "CN" });
  await upsertProduct("000000000316", { name: "Smart Plug (2-pack)", brand: "HomePower", subcategory: "charger", categoryId: electronics.id, retailPriceCents: 1999, weightGrams: 130, countryOfOrigin: "CN" });

  // ─── Products — Cosmetics & Personal Care (20 products, 4 with materials)

  await upsertProduct("000000000401", {
    name: "Daily Moisturizer SPF 30",
    brand: "SkinFirst",
    subcategory: "moisturizer",
    categoryId: cosmetics.id,
    description: "Lightweight daily moisturizer with SPF 30.",
    retailPriceCents: 2499,
    weightGrams: 60,
    countryOfOrigin: "US",
    ingredients: "water, glycerin, cetearyl alcohol",
  }, [
    { name: "water", pct: 0.70, grams: 42 },
    { name: "glycerin", pct: 0.15, grams: 9 },
    { name: "cetearyl alcohol", pct: 0.15, grams: 9 },
  ]);

  await upsertProduct("000000000402", {
    name: "Shea Butter Body Lotion (16oz)",
    brand: "SoftSkin",
    subcategory: "moisturizer",
    categoryId: cosmetics.id,
    description: "Rich shea butter body lotion, fragrance-free.",
    retailPriceCents: 1599,
    weightGrams: 454,
    countryOfOrigin: "US",
    ingredients: "water, shea butter, glycerin",
  }, [
    { name: "water", pct: 0.65, grams: 295 },
    { name: "shea butter", pct: 0.20, grams: 91 },
    { name: "glycerin", pct: 0.15, grams: 68 },
  ]);

  await upsertProduct("000000000403", {
    name: "Clarifying Shampoo (16oz)",
    brand: "CleanRoots",
    subcategory: "shampoo",
    categoryId: cosmetics.id,
    description: "Deep-cleansing shampoo for all hair types.",
    retailPriceCents: 1299,
    weightGrams: 454,
    countryOfOrigin: "US",
    ingredients: "water, sodium lauryl sulfate, glycerin",
  }, [
    { name: "water", pct: 0.70, grams: 318 },
    { name: "sodium lauryl sulfate", pct: 0.20, grams: 91 },
    { name: "glycerin", pct: 0.10, grams: 45 },
  ]);

  await upsertProduct("000000000404", {
    name: "Matte Red Lipstick",
    brand: "BoldColor",
    subcategory: "lipstick",
    categoryId: cosmetics.id,
    description: "Long-wear matte lipstick, bold red shade.",
    retailPriceCents: 1899,
    weightGrams: 10,
    countryOfOrigin: "US",
    ingredients: "castor oil, shea butter",
  }, [
    { name: "shea butter", pct: 0.30, grams: 3 },
    { name: "palm oil", pct: 0.70, grams: 7 },
  ]);

  // Cosmetics without materials
  await upsertProduct("000000000405", { name: "Facial Cleanser (6oz)", brand: "ClearGlow", subcategory: "moisturizer", categoryId: cosmetics.id, retailPriceCents: 1499, weightGrams: 170, countryOfOrigin: "US" });
  await upsertProduct("000000000406", { name: "Conditioner (16oz)", brand: "SilkHair", subcategory: "shampoo", categoryId: cosmetics.id, retailPriceCents: 1299, weightGrams: 454, countryOfOrigin: "US" });
  await upsertProduct("000000000407", { name: "Eye Shadow Palette", brand: "GlowUp", subcategory: "lipstick", categoryId: cosmetics.id, retailPriceCents: 3499, weightGrams: 80, countryOfOrigin: "CN" });
  await upsertProduct("000000000408", { name: "Mascara (0.3oz)", brand: "LashPro", subcategory: "lipstick", categoryId: cosmetics.id, retailPriceCents: 1299, weightGrams: 8, countryOfOrigin: "US" });
  await upsertProduct("000000000409", { name: "Deodorant Stick (2.6oz)", brand: "FreshGuard", subcategory: "shampoo", categoryId: cosmetics.id, retailPriceCents: 699, weightGrams: 74, countryOfOrigin: "US" });
  await upsertProduct("000000000410", { name: "Sunscreen SPF 50 (3oz)", brand: "SunDefend", subcategory: "moisturizer", categoryId: cosmetics.id, retailPriceCents: 1499, weightGrams: 85, countryOfOrigin: "US" });
  await upsertProduct("000000000411", { name: "Night Cream (1.7oz)", brand: "LunaGlow", subcategory: "moisturizer", categoryId: cosmetics.id, retailPriceCents: 3999, weightGrams: 48, countryOfOrigin: "FR" });
  await upsertProduct("000000000412", { name: "Vitamin C Serum (1oz)", brand: "BrightDerm", subcategory: "moisturizer", categoryId: cosmetics.id, retailPriceCents: 2999, weightGrams: 30, countryOfOrigin: "US" });
  await upsertProduct("000000000413", { name: "Toothpaste (6oz)", brand: "WhiteMint", subcategory: "shampoo", categoryId: cosmetics.id, retailPriceCents: 499, weightGrams: 170, countryOfOrigin: "US" });
  await upsertProduct("000000000414", { name: "Perfume (1.7oz)", brand: "AuraSense", subcategory: "lipstick", categoryId: cosmetics.id, retailPriceCents: 7999, weightGrams: 55, countryOfOrigin: "FR" });
  await upsertProduct("000000000415", { name: "Body Wash (18oz)", brand: "FreshLather", subcategory: "shampoo", categoryId: cosmetics.id, retailPriceCents: 999, weightGrams: 510, countryOfOrigin: "US" });
  await upsertProduct("000000000416", { name: "BB Cream SPF 35", brand: "FlawlessBase", subcategory: "moisturizer", categoryId: cosmetics.id, retailPriceCents: 1799, weightGrams: 40, countryOfOrigin: "KR" });

  // ─── Products — Home & Kitchen (25 products, 4 with materials) ───────────

  await upsertProduct("000000000501", {
    name: "Cast Iron Skillet (10-inch)",
    brand: "HearfhForge",
    subcategory: "cookware",
    categoryId: homeKitchen.id,
    description: "Pre-seasoned cast iron skillet.",
    retailPriceCents: 3999,
    weightGrams: 2700,
    countryOfOrigin: "CN",
    ingredients: "cast iron",
  }, [
    { name: "cast_iron", pct: 1.0, grams: 2700 },
  ]);

  await upsertProduct("000000000502", {
    name: "Bamboo Cutting Board",
    brand: "EcoSlice",
    subcategory: "cutting-board",
    categoryId: homeKitchen.id,
    description: "Large bamboo cutting board, eco-friendly.",
    retailPriceCents: 2999,
    weightGrams: 900,
    countryOfOrigin: "CN",
    ingredients: "bamboo",
  }, [
    { name: "bamboo", pct: 1.0, grams: 900 },
  ]);

  await upsertProduct("000000000503", {
    name: "Stainless Steel Chef's Knife",
    brand: "BladeEdge",
    subcategory: "knife",
    categoryId: homeKitchen.id,
    description: "8-inch German stainless steel chef's knife.",
    retailPriceCents: 8999,
    weightGrams: 300,
    countryOfOrigin: "DE",
    ingredients: "stainless steel",
  }, [
    { name: "stainless", pct: 1.0, grams: 300 },
  ]);

  await upsertProduct("000000000504", {
    name: "Ceramic Coffee Mug",
    brand: "BrewMorning",
    subcategory: "cookware",
    categoryId: homeKitchen.id,
    description: "16oz ceramic coffee mug, dishwasher safe.",
    retailPriceCents: 1499,
    weightGrams: 400,
    countryOfOrigin: "CN",
    ingredients: "ceramic",
  }, [
    { name: "ceramic", pct: 1.0, grams: 400 },
  ]);

  // Home & Kitchen without materials
  await upsertProduct("000000000505", { name: "Non-Stick Frying Pan (12-inch)", brand: "EasyCook", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 4999, weightGrams: 1100, countryOfOrigin: "CN" });
  await upsertProduct("000000000506", { name: "Wooden Spoon Set (3-pack)", brand: "OliveWood", subcategory: "cutting-board", categoryId: homeKitchen.id, retailPriceCents: 1299, weightGrams: 200, countryOfOrigin: "IT" });
  await upsertProduct("000000000507", { name: "Stainless Mixing Bowl Set", brand: "ChefStation", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 3999, weightGrams: 1200, countryOfOrigin: "CN" });
  await upsertProduct("000000000508", { name: "Paring Knife Set (3-piece)", brand: "BladeEdge", subcategory: "knife", categoryId: homeKitchen.id, retailPriceCents: 2999, weightGrams: 200, countryOfOrigin: "DE" });
  await upsertProduct("000000000509", { name: "Glass Food Storage (4-pack)", brand: "FreshLock", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 3499, weightGrams: 1600, countryOfOrigin: "CN" });
  await upsertProduct("000000000510", { name: "Silicone Baking Mat (2-pack)", brand: "BakePerfect", subcategory: "cutting-board", categoryId: homeKitchen.id, retailPriceCents: 1699, weightGrams: 280, countryOfOrigin: "CN" });
  await upsertProduct("000000000511", { name: "Dish Drying Rack", brand: "CleanDry", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 2499, weightGrams: 600, countryOfOrigin: "CN" });
  await upsertProduct("000000000512", { name: "Knife Block Set (5-piece)", brand: "CutRight", subcategory: "knife", categoryId: homeKitchen.id, retailPriceCents: 14999, weightGrams: 2200, countryOfOrigin: "DE" });
  await upsertProduct("000000000513", { name: "Instant Pot Liner", brand: "PotPerfect", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 1999, weightGrams: 800, countryOfOrigin: "CN" });
  await upsertProduct("000000000514", { name: "Kitchen Scale (digital)", brand: "WeighRight", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 2499, weightGrams: 400, countryOfOrigin: "CN" });
  await upsertProduct("000000000515", { name: "Immersion Blender", brand: "SmootheBlend", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 3999, weightGrams: 600, countryOfOrigin: "CN" });
  await upsertProduct("000000000516", { name: "Measuring Cup Set (4-piece)", brand: "PrecisePour", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 1499, weightGrams: 350, countryOfOrigin: "CN" });
  await upsertProduct("000000000517", { name: "Salad Bowl Set (2-piece)", brand: "FreshServe", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 2999, weightGrams: 900, countryOfOrigin: "CN" });
  await upsertProduct("000000000518", { name: "Box Grater", brand: "GrateRight", subcategory: "knife", categoryId: homeKitchen.id, retailPriceCents: 1799, weightGrams: 250, countryOfOrigin: "CN" });
  await upsertProduct("000000000519", { name: "Can Opener (manual)", brand: "EasyOpen", subcategory: "knife", categoryId: homeKitchen.id, retailPriceCents: 999, weightGrams: 180, countryOfOrigin: "CN" });
  await upsertProduct("000000000520", { name: "Pepper & Salt Mill Set", brand: "SeasonRight", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 2499, weightGrams: 350, countryOfOrigin: "CN" });
  await upsertProduct("000000000521", { name: "Colander (5-quart)", brand: "DrainPro", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 2299, weightGrams: 400, countryOfOrigin: "CN" });
  await upsertProduct("000000000522", { name: "Loaf Pan (set of 2)", brand: "BreadTime", subcategory: "cookware", categoryId: homeKitchen.id, retailPriceCents: 1799, weightGrams: 700, countryOfOrigin: "CN" });

  console.log("Seeding complete. ≥100 products seeded across 5 categories.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
