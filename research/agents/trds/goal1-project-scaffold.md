# TRD: Goal 1 — Project Scaffold & Data Model

- **status:** `ready`
- **goal:** `Goal 1`
- **priority:** `P0`
- **branch:** `task/goal1-scaffold`
- **estimated_effort:** `Medium`

## Description

Set up the TruePrice Next.js project with all tooling, and define the Prisma data model for products, materials, commodity prices, and cost breakdowns. This is the foundation everything else builds on.

## Acceptance Criteria

- [ ] Next.js 15 project initialized with App Router and TypeScript
- [ ] Tailwind CSS configured with shadcn/ui installed
- [ ] TanStack Query and Zustand installed and configured
- [ ] Prisma ORM installed with PostgreSQL provider
- [ ] Docker Compose file for local PostgreSQL
- [ ] Typed `env.ts` config module (no raw `process.env` anywhere)
- [ ] TypeScript compiles clean with strict mode
- [ ] ESLint + Prettier configured
- [ ] Vitest configured with a passing sample test
- [ ] Playwright configured with a passing sample test
- [ ] Vercel deployment pipeline configured (`vercel.json` or via GitHub integration)
- [ ] Prisma schema defined with all models (see Data Model below)
- [ ] Seed script creates sample data (5-10 products with known materials)
- [ ] `npm run dev` starts cleanly and renders a placeholder homepage

## Data Model

### Product
```
id              String    @id @default(cuid())
name            String
brand           String?
upc             String?   @unique
ean             String?   @unique
category        ProductCategory @relation
categoryId      String
description     String?
imageUrl        String?
retailPriceCents Int?          // retail price in cents
weightGrams     Float?         // product weight in grams
countryOfOrigin String?        // ISO country code (e.g., "CN", "US", "VN")
ingredients     String?        // raw ingredient/material list from label
source          String         // where we got this data: "openfoodfacts", "upcitemdb", "manual"
sourceId        String?        // ID in the source system
lastLookedUp    DateTime?
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```

### ProductCategory
```
id              String    @id @default(cuid())
name            String    @unique   // e.g., "Food & Beverage", "Clothing", "Electronics"
slug            String    @unique
overheadPercent Float              // industry standard overhead % (e.g., 0.35 for 35%)
description     String?
createdAt       DateTime  @default(now())
```

### Material
```
id              String    @id @default(cuid())
name            String    @unique   // e.g., "cotton", "sugar", "aluminum"
commodityKey    String?             // key in the commodity price API
unit            String              // standard unit: "kg", "liter", "unit"
categoryTag     String?             // e.g., "textile", "metal", "food", "plastic"
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```

### ProductMaterial (join table — what materials a product contains)
```
id              String    @id @default(cuid())
productId       String
product         Product   @relation
materialId      String
material        Material  @relation
percentage      Float?             // percentage of product (0.0-1.0), null if unknown
weightGrams     Float?             // weight of this material in the product, if known
source          String             // "label", "teardown", "estimate", "community"
```

### CommodityPrice
```
id              String    @id @default(cuid())
materialId      String
material        Material  @relation
pricePerKgCents Int                // price in USD cents per kg (normalized)
source          String             // API source name
fetchedAt       DateTime           // when this price was fetched
createdAt       DateTime  @default(now())
```

### CostBreakdown (cached estimate for a product)
```
id                  String    @id @default(cuid())
productId           String
product             Product   @relation
materialCostCents   Int                // total raw material cost in cents
laborCostCents      Int                // estimated labor cost in cents
overheadCostCents   Int                // estimated overhead in cents
shippingCostCents   Int                // estimated shipping in cents
totalCostCents      Int                // sum of above
retailPriceCents    Int?               // retail price at time of estimate
markupPercent       Float?             // (retail - total) / total * 100
confidenceScore     Float              // 0.0-1.0
confidenceReason    String             // explanation of confidence rating
methodology         String             // human-readable explanation of how estimate was derived
calculatedAt        DateTime           // when this breakdown was computed
createdAt           DateTime  @default(now())
```

### LaborRate (reference data)
```
id              String    @id @default(cuid())
countryCode     String    @unique   // ISO 3166-1 alpha-2
countryName     String
hourlyRateCents Int                // manufacturing labor rate in USD cents/hour
source          String             // where this data came from
lastUpdated     DateTime
```

## Tasks

1. `npx create-next-app@latest TruePrice --typescript --tailwind --eslint --app --src-dir`
2. Install dependencies: `@tanstack/react-query`, `zustand`, `@prisma/client`, `prisma`, `zod`, `clsx`, `recharts`
3. Install dev dependencies: `vitest`, `@playwright/test`, `@testing-library/react`
4. Run `npx shadcn@latest init`
5. Create `docker-compose.yml` with PostgreSQL service
6. Create `src/lib/env.ts` — typed environment config
7. Create Prisma schema with all models above
8. Run `npx prisma migrate dev --name init`
9. Create seed script (`prisma/seed.ts`) with sample products:
   - A t-shirt (60% cotton, 40% polyester, ~200g, made in Vietnam)
   - A chocolate bar (sugar, cocoa butter, milk powder, ~100g, made in Switzerland)
   - A can of soda (water, sugar, citric acid, ~355ml, made in US)
   - An iPhone case (polycarbonate plastic, ~30g, made in China)
   - A pair of jeans (98% cotton, 2% elastane, ~800g, made in Bangladesh)
10. Seed LaborRate table with rates for: US, CN, VN, BD, MX, IN, TH, ID, DE, CH
11. Seed ProductCategory table with: Food & Beverage, Clothing & Textiles, Electronics, Cosmetics & Personal Care, Home & Kitchen
12. Create placeholder homepage with project name and search bar (non-functional)
13. Verify `npm run dev`, `npm run build`, `npx vitest run` all pass
14. Configure Vercel project and verify deployment

## Notes

- The seed data doesn't need real commodity prices yet — that's Goal 2. Just get the schema and relationships right.
- Use `cuid()` for IDs, not `uuid` — shorter, URL-friendly.
- Keep the homepage minimal — Goal 5 will build the real UI.
