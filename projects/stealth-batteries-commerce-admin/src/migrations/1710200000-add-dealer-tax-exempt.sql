-- Add taxExempt column to dealers table with default value of false
ALTER TABLE "dealers" 
ADD COLUMN IF NOT EXISTS "taxExempt" BOOLEAN DEFAULT false;

-- Set all existing dealers to non-tax-exempt
UPDATE "dealers" 
SET "taxExempt" = false 
WHERE "taxExempt" IS NULL;

-- Down migration
-- ALTER TABLE "dealers" DROP COLUMN IF EXISTS "taxExempt"; 