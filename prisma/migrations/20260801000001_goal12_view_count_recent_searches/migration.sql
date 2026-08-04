-- Goal 12: Enhanced Search & Discovery
-- Add viewCount to Product for trending calculations
-- Add recentSearches to User for personalized search history

ALTER TABLE "Product" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "User" ADD COLUMN "recentSearches" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
