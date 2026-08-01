-- Goal 13: Add digestEnabled preference to User

ALTER TABLE "User" ADD COLUMN "digestEnabled" BOOLEAN NOT NULL DEFAULT true;
