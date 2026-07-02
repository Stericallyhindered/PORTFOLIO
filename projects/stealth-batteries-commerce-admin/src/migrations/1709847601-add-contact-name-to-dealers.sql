-- Up
ALTER TABLE "dealers" ADD COLUMN IF NOT EXISTS "contactName" TEXT;
UPDATE "dealers" SET "contactName" = SPLIT_PART(email, '@', 1) WHERE "contactName" IS NULL;
ALTER TABLE "dealers" ALTER COLUMN "contactName" SET NOT NULL;

-- Down
ALTER TABLE "dealers" DROP COLUMN IF EXISTS "contactName"; 