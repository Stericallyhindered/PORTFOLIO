-- Add brand_logo and brand_name to contests table (schema has these but production DB may not)
-- Run this in Neon SQL Editor or psql against your production database

-- Contests: brand columns
ALTER TABLE contests ADD COLUMN IF NOT EXISTS brand_logo TEXT;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);

-- Giveaways: additional_entry_price (if missing)
ALTER TABLE giveaways ADD COLUMN IF NOT EXISTS additional_entry_price DECIMAL(10, 2);
