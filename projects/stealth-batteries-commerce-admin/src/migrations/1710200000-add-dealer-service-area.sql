-- Add service area columns to dealers table
ALTER TABLE "dealers" 
ADD COLUMN IF NOT EXISTS "service_area_radius" INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS "service_area_will_travel" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "service_area_travel_notes" TEXT;

-- Add check constraint for valid radius
ALTER TABLE "dealers"
ADD CONSTRAINT "check_valid_radius" CHECK ("service_area_radius" >= 0 AND "service_area_radius" <= 500);

-- Down migration
-- ALTER TABLE "dealers" DROP COLUMN IF EXISTS "service_area_radius";
-- ALTER TABLE "dealers" DROP COLUMN IF NOT EXISTS "service_area_will_travel";
-- ALTER TABLE "dealers" DROP COLUMN IF NOT EXISTS "service_area_travel_notes"; 