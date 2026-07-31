-- Goal 11b: Price Alerts
-- Adds alert preferences to User, alert tracking fields to SavedProduct,
-- and a new AlertLog table for alert history.

-- ─── User: alert preferences ──────────────────────────────────────────────────

ALTER TABLE "User"
    ADD COLUMN "alertThresholdPct" INTEGER,
    ADD COLUMN "alertsEnabled"     BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── SavedProduct: alert tracking ────────────────────────────────────────────

ALTER TABLE "SavedProduct"
    ADD COLUMN "costAtWatchCents"     INTEGER,
    ADD COLUMN "lastAlertedCostCents" INTEGER,
    ADD COLUMN "lastAlertedAt"        TIMESTAMP(3);

-- ─── AlertLog ─────────────────────────────────────────────────────────────────

CREATE TABLE "AlertLog" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "productId"    TEXT NOT NULL,
    "oldCostCents" INTEGER NOT NULL,
    "newCostCents" INTEGER NOT NULL,
    "deltaPercent" DOUBLE PRECISION NOT NULL,
    "sentAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AlertLog_userId_idx"            ON "AlertLog"("userId");
CREATE INDEX "AlertLog_userId_productId_idx"  ON "AlertLog"("userId", "productId");
CREATE INDEX "AlertLog_sentAt_idx"            ON "AlertLog"("sentAt");

ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
