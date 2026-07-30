-- Goal 8: Data Expansion & Accuracy Improvements
-- Adds optional subcategory to Product, categorical confidence tier and updatedAt to CostBreakdown.

-- Product: optional subcategory for more precise material profile lookup
ALTER TABLE "Product" ADD COLUMN "subcategory" TEXT;

-- CostBreakdown: categorical confidence tier ("HIGH" | "MEDIUM" | "LOW")
ALTER TABLE "CostBreakdown" ADD COLUMN "confidence" TEXT NOT NULL DEFAULT 'LOW';

-- CostBreakdown: updatedAt for re-estimation cron staleness check
ALTER TABLE "CostBreakdown" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Index for re-estimation cron query
CREATE INDEX "CostBreakdown_updatedAt_idx" ON "CostBreakdown"("updatedAt");
