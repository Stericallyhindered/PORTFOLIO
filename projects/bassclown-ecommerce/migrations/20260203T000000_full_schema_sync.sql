-- Full schema sync migration
-- Run this in Neon SQL Editor against production database
-- All statements use IF NOT EXISTS so they are safe to re-run

-- =============================================================
-- CONTESTS: add brand columns (may already exist from prior migration)
-- =============================================================
ALTER TABLE contests ADD COLUMN IF NOT EXISTS brand_logo TEXT;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);

-- =============================================================
-- GIVEAWAYS: add additional_entry_price
-- =============================================================
ALTER TABLE giveaways ADD COLUMN IF NOT EXISTS additional_entry_price DECIMAL(10, 2);

-- =============================================================
-- GIVEAWAY ENTRIES: add entry_type, purchase_price, stripe columns
-- =============================================================
ALTER TABLE giveaway_entries ADD COLUMN IF NOT EXISTS entry_type VARCHAR(50) DEFAULT 'free' NOT NULL;
ALTER TABLE giveaway_entries ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2);
ALTER TABLE giveaway_entries ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- =============================================================
-- PORTFOLIO VIDEOS table
-- =============================================================
CREATE TABLE IF NOT EXISTS portfolio_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category VARCHAR(100) DEFAULT 'commercial',
  client_name VARCHAR(255),
  featured BOOLEAN DEFAULT false,
  featured_order INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================
-- BLOG POSTS table
-- =============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image TEXT,
  images JSONB DEFAULT '[]',
  videos JSONB DEFAULT '[]',
  category VARCHAR(100) DEFAULT 'General',
  tags JSONB DEFAULT '[]',
  author_id UUID REFERENCES users(id),
  author_name VARCHAR(255),
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  seo_title VARCHAR(255),
  seo_description TEXT,
  meta_keywords JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
