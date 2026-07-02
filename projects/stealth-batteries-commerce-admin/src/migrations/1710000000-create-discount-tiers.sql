-- Create discount_tiers table
CREATE TABLE "discount_tiers" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "discountPercentage" INTEGER NOT NULL,
    "description" TEXT,
    "active" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tiers
INSERT INTO "discount_tiers" ("name", "discountPercentage", "description", "active")
VALUES 
    ('Standard', 10, 'Standard dealer discount tier', true),
    ('Premium', 15, 'Premium dealer discount tier with increased benefits', true),
    ('Elite', 20, 'Elite dealer discount tier with maximum benefits', true);

-- Add discount_tier_id column to dealers
ALTER TABLE "dealers" 
ADD COLUMN "discountTierId" INTEGER REFERENCES "discount_tiers"(id);

-- Migrate existing dealer discount tiers
UPDATE "dealers" 
SET "discountTierId" = (
    SELECT id FROM "discount_tiers" 
    WHERE LOWER(name) = LOWER(COALESCE("discountTier", 'standard'))
);

-- Make discountTierId required after migration
ALTER TABLE "dealers" 
ALTER COLUMN "discountTierId" SET NOT NULL;

-- Drop old discountTier column
ALTER TABLE "dealers" 
DROP COLUMN IF EXISTS "discountTier"; 