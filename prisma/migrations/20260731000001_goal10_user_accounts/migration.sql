-- Goal 10: User Accounts & Personalization
-- Adds NextAuth v5 tables (User, Account, Session, VerificationToken)
-- plus SavedProduct and RecentlyViewed for watchlist and history features.

-- ─── User ────────────────────────────────────────────────────────────────────

CREATE TABLE "User" (
    "id"            TEXT NOT NULL,
    "name"          TEXT,
    "email"         TEXT,
    "emailVerified" TIMESTAMP(3),
    "image"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- ─── Account ─────────────────────────────────────────────────────────────────

CREATE TABLE "Account" (
    "userId"            TEXT NOT NULL,
    "type"              TEXT NOT NULL,
    "provider"          TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token"     TEXT,
    "access_token"      TEXT,
    "expires_at"        INTEGER,
    "token_type"        TEXT,
    "scope"             TEXT,
    "id_token"          TEXT,
    "session_state"     TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

CREATE INDEX "Account_userId_idx" ON "Account"("userId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Session ──────────────────────────────────────────────────────────────────

CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "expires"      TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── VerificationToken ────────────────────────────────────────────────────────

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "expires"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- ─── SavedProduct ─────────────────────────────────────────────────────────────

CREATE TABLE "SavedProduct" (
    "userId"    TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "savedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedProduct_pkey" PRIMARY KEY ("userId","productId")
);

CREATE INDEX "SavedProduct_userId_idx" ON "SavedProduct"("userId");

ALTER TABLE "SavedProduct" ADD CONSTRAINT "SavedProduct_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedProduct" ADD CONSTRAINT "SavedProduct_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── RecentlyViewed ───────────────────────────────────────────────────────────

CREATE TABLE "RecentlyViewed" (
    "userId"    TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "viewedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecentlyViewed_pkey" PRIMARY KEY ("userId","productId")
);

CREATE INDEX "RecentlyViewed_userId_idx" ON "RecentlyViewed"("userId");
CREATE INDEX "RecentlyViewed_viewedAt_idx" ON "RecentlyViewed"("viewedAt");

ALTER TABLE "RecentlyViewed" ADD CONSTRAINT "RecentlyViewed_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecentlyViewed" ADD CONSTRAINT "RecentlyViewed_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
