-- Up
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;
UPDATE "users" SET "name" = SPLIT_PART(email, '@', 1) WHERE "name" IS NULL;
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;

-- Down
ALTER TABLE "users" DROP COLUMN IF EXISTS "name"; 