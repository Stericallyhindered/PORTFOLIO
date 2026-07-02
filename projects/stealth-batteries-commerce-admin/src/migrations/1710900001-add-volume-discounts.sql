-- Add volume discount fields to discount_tiers table
ALTER TABLE "discount_tiers"
ADD COLUMN "volumeDiscountThreshold" NUMERIC(10, 2) DEFAULT 15000,
ADD COLUMN "volumeDiscountPercentage" NUMERIC(5, 2) DEFAULT 10;

-- Add check constraints
ALTER TABLE "discount_tiers"
ADD CONSTRAINT "volume_discount_threshold_check" CHECK ("volumeDiscountThreshold" >= 0),
ADD CONSTRAINT "volume_discount_percentage_check" CHECK ("volumeDiscountPercentage" BETWEEN 0 AND 100);

-- Update existing tiers with default values
UPDATE "discount_tiers"
SET "volumeDiscountThreshold" = 15000,
    "volumeDiscountPercentage" = 10; 