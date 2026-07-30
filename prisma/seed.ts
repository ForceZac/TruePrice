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

  const [foodBev, clothing, _electronics, _cosmetics, _homeKitchen] =
    categories;

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
    cotton: { unit: "kg", categoryTag: "textile", commodityKey: "COTTON" },
    polyester: { unit: "kg", categoryTag: "textile", commodityKey: "POLYESTER" },
    elastane: { unit: "kg", categoryTag: "textile" },
    sugar: { unit: "kg", categoryTag: "food", commodityKey: "SUGAR" },
    "cocoa butter": { unit: "kg", categoryTag: "food", commodityKey: "COCOA" },
    "milk powder": { unit: "kg", categoryTag: "food", commodityKey: "MILK_POWDER" },
    water: { unit: "liter", categoryTag: "food" },
    "citric acid": { unit: "kg", categoryTag: "food" },
    polycarbonate: { unit: "kg", categoryTag: "plastic", commodityKey: "POLYCARBONATE" },
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

  console.log("Materials seeded:", Object.keys(materials).join(", "));

  // ─── Products ─────────────────────────────────────────────────────────────

  // 1. T-shirt (60% cotton, 40% polyester, 200g, Vietnam)
  const tshirt = await prisma.product.upsert({
    where: { upc: "000000000001" },
    update: {},
    create: {
      name: "Classic Cotton T-Shirt",
      brand: "BasicWear",
      upc: "000000000001",
      categoryId: clothing.id,
      description: "A standard 200g cotton/polyester blend t-shirt.",
      retailPriceCents: 2499,
      weightGrams: 200,
      countryOfOrigin: "VN",
      ingredients: "60% cotton, 40% polyester",
      source: "manual",
    },
  });
  await prisma.productMaterial.createMany({
    skipDuplicates: true,
    data: [
      {
        productId: tshirt.id,
        materialId: materialRecords["cotton"].id,
        percentage: 0.60,
        weightGrams: 120,
        source: "label",
      },
      {
        productId: tshirt.id,
        materialId: materialRecords["polyester"].id,
        percentage: 0.40,
        weightGrams: 80,
        source: "label",
      },
    ],
  });

  // 2. Chocolate bar (sugar, cocoa butter, milk powder, 100g, Switzerland)
  const chocolate = await prisma.product.upsert({
    where: { upc: "000000000002" },
    update: {},
    create: {
      name: "Dark Chocolate Bar",
      brand: "AlpenSweet",
      upc: "000000000002",
      categoryId: foodBev.id,
      description: "70% dark chocolate bar made in Switzerland.",
      retailPriceCents: 399,
      weightGrams: 100,
      countryOfOrigin: "CH",
      ingredients: "sugar, cocoa butter, milk powder",
      source: "manual",
    },
  });
  await prisma.productMaterial.createMany({
    skipDuplicates: true,
    data: [
      {
        productId: chocolate.id,
        materialId: materialRecords["sugar"].id,
        percentage: 0.30,
        weightGrams: 30,
        source: "label",
      },
      {
        productId: chocolate.id,
        materialId: materialRecords["cocoa butter"].id,
        percentage: 0.50,
        weightGrams: 50,
        source: "label",
      },
      {
        productId: chocolate.id,
        materialId: materialRecords["milk powder"].id,
        percentage: 0.20,
        weightGrams: 20,
        source: "label",
      },
    ],
  });

  // 3. Can of soda (water, sugar, citric acid, 355ml, US)
  const soda = await prisma.product.upsert({
    where: { upc: "000000000003" },
    update: {},
    create: {
      name: "Cola Soda Can",
      brand: "FizzCo",
      upc: "000000000003",
      categoryId: foodBev.id,
      description: "355ml carbonated cola beverage.",
      retailPriceCents: 149,
      weightGrams: 380,
      countryOfOrigin: "US",
      ingredients: "water, sugar, citric acid, natural flavors",
      source: "manual",
    },
  });
  await prisma.productMaterial.createMany({
    skipDuplicates: true,
    data: [
      {
        productId: soda.id,
        materialId: materialRecords["water"].id,
        percentage: 0.88,
        weightGrams: 312,
        source: "estimate",
      },
      {
        productId: soda.id,
        materialId: materialRecords["sugar"].id,
        percentage: 0.10,
        weightGrams: 36,
        source: "estimate",
      },
      {
        productId: soda.id,
        materialId: materialRecords["citric acid"].id,
        percentage: 0.02,
        weightGrams: 7,
        source: "estimate",
      },
    ],
  });

  // 4. iPhone case (polycarbonate, 30g, China)
  const iphoneCase = await prisma.product.upsert({
    where: { upc: "000000000004" },
    update: {},
    create: {
      name: "Slim Polycarbonate Phone Case",
      brand: "TechShell",
      upc: "000000000004",
      categoryId: categories[2].id, // electronics
      description: "Thin polycarbonate protective case for smartphones.",
      retailPriceCents: 1499,
      weightGrams: 30,
      countryOfOrigin: "CN",
      ingredients: "polycarbonate plastic",
      source: "manual",
    },
  });
  await prisma.productMaterial.createMany({
    skipDuplicates: true,
    data: [
      {
        productId: iphoneCase.id,
        materialId: materialRecords["polycarbonate"].id,
        percentage: 1.0,
        weightGrams: 30,
        source: "teardown",
      },
    ],
  });

  // 5. Pair of jeans (98% cotton, 2% elastane, 800g, Bangladesh)
  const jeans = await prisma.product.upsert({
    where: { upc: "000000000005" },
    update: {},
    create: {
      name: "Classic Slim-Fit Jeans",
      brand: "DenimCo",
      upc: "000000000005",
      categoryId: clothing.id,
      description: "Slim-fit denim jeans, 98% cotton, 2% elastane.",
      retailPriceCents: 5999,
      weightGrams: 800,
      countryOfOrigin: "BD",
      ingredients: "98% cotton, 2% elastane",
      source: "manual",
    },
  });
  await prisma.productMaterial.createMany({
    skipDuplicates: true,
    data: [
      {
        productId: jeans.id,
        materialId: materialRecords["cotton"].id,
        percentage: 0.98,
        weightGrams: 784,
        source: "label",
      },
      {
        productId: jeans.id,
        materialId: materialRecords["elastane"].id,
        percentage: 0.02,
        weightGrams: 16,
        source: "label",
      },
    ],
  });

  console.log("Products seeded:", [tshirt, chocolate, soda, iphoneCase, jeans].map((p) => p.name).join(", "));
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
