-- Add coordinates columns to dealers table
ALTER TABLE "dealers" 
ADD COLUMN IF NOT EXISTS "coordinates_latitude" DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS "coordinates_longitude" DECIMAL(11, 8);

-- Add check constraints for valid coordinates
ALTER TABLE "dealers"
ADD CONSTRAINT "check_valid_latitude" CHECK ("coordinates_latitude" >= -90 AND "coordinates_latitude" <= 90),
ADD CONSTRAINT "check_valid_longitude" CHECK ("coordinates_longitude" >= -180 AND "coordinates_longitude" <= 180);

-- Create an index for geospatial queries
CREATE INDEX IF NOT EXISTS "idx_dealer_coordinates" 
ON "dealers" ("coordinates_latitude", "coordinates_longitude");

-- Down migration
-- ALTER TABLE "dealers" DROP COLUMN IF EXISTS "coordinates_latitude";
-- ALTER TABLE "dealers" DROP COLUMN IF EXISTS "coordinates_longitude";
-- DROP INDEX IF EXISTS "idx_dealer_coordinates"; 