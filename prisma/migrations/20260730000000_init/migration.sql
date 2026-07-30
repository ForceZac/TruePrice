-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "overheadPercent" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "upc" TEXT,
    "ean" TEXT,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "retailPriceCents" INTEGER,
    "weightGrams" DOUBLE PRECISION,
    "countryOfOrigin" TEXT,
    "ingredients" TEXT,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "lastLookedUp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commodityKey" TEXT,
    "unit" TEXT NOT NULL,
    "categoryTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMaterial" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION,
    "weightGrams" DOUBLE PRECISION,
    "source" TEXT NOT NULL,

    CONSTRAINT "ProductMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommodityPrice" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "pricePerKgCents" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommodityPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostBreakdown" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "materialCostCents" INTEGER NOT NULL,
    "laborCostCents" INTEGER NOT NULL,
    "overheadCostCents" INTEGER NOT NULL,
    "shippingCostCents" INTEGER NOT NULL,
    "totalCostCents" INTEGER NOT NULL,
    "retailPriceCents" INTEGER,
    "markupPercent" DOUBLE PRECISION,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "confidenceReason" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaborRate" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "hourlyRateCents" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaborRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_upc_key" ON "Product"("upc");

-- CreateIndex
CREATE UNIQUE INDEX "Product_ean_key" ON "Product"("ean");

-- CreateIndex
CREATE UNIQUE INDEX "Material_name_key" ON "Material"("name");

-- CreateIndex
CREATE INDEX "ProductMaterial_productId_idx" ON "ProductMaterial"("productId");

-- CreateIndex
CREATE INDEX "ProductMaterial_materialId_idx" ON "ProductMaterial"("materialId");

-- CreateIndex
CREATE INDEX "CommodityPrice_materialId_idx" ON "CommodityPrice"("materialId");

-- CreateIndex
CREATE INDEX "CommodityPrice_fetchedAt_idx" ON "CommodityPrice"("fetchedAt");

-- CreateIndex
CREATE INDEX "CostBreakdown_productId_idx" ON "CostBreakdown"("productId");

-- CreateIndex
CREATE INDEX "CostBreakdown_calculatedAt_idx" ON "CostBreakdown"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LaborRate_countryCode_key" ON "LaborRate"("countryCode");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommodityPrice" ADD CONSTRAINT "CommodityPrice_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostBreakdown" ADD CONSTRAINT "CostBreakdown_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

