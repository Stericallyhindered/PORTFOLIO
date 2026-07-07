-- Migration: Media Kit Generation System
-- Version: 20240102T000000_media_kit_system
-- Description: Add tables for media kit templates, generated kits, assets, and analytics
-- Created: 2024-01-02T00:00:00.000Z

-- ==== UP MIGRATION ====

-- Create media_kit_templates table
CREATE TABLE media_kit_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('brand', 'creator', 'contest')),
  template_data JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create media_kits table
CREATE TABLE media_kits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  template_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('brand', 'creator', 'contest')),
  data JSONB NOT NULL,
  share_token TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_accessed_at TIMESTAMP
);

-- Create media_kit_assets table
CREATE TABLE media_kit_assets (
  id SERIAL PRIMARY KEY,
  media_kit_id INTEGER NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'document', 'logo')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  alt_text TEXT,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create media_kit_analytics table
CREATE TABLE media_kit_analytics (
  id SERIAL PRIMARY KEY,
  media_kit_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download', 'share', 'contact')),
  visitor_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_media_kit_templates_type ON media_kit_templates(type);
CREATE INDEX idx_media_kit_templates_active ON media_kit_templates(is_active);
CREATE INDEX idx_media_kits_user_id ON media_kits(user_id);
CREATE INDEX idx_media_kits_template_id ON media_kits(template_id);
CREATE INDEX idx_media_kits_type ON media_kits(type);
CREATE INDEX idx_media_kits_share_token ON media_kits(share_token);
CREATE INDEX idx_media_kits_public ON media_kits(is_public);
CREATE INDEX idx_media_kit_assets_kit_id ON media_kit_assets(media_kit_id);
CREATE INDEX idx_media_kit_assets_type ON media_kit_assets(asset_type);
CREATE INDEX idx_media_kit_analytics_kit_id ON media_kit_analytics(media_kit_id);
CREATE INDEX idx_media_kit_analytics_event_type ON media_kit_analytics(event_type);
CREATE INDEX idx_media_kit_analytics_created_at ON media_kit_analytics(created_at);

-- Add foreign key constraints (assuming users table exists)
-- ALTER TABLE media_kits ADD CONSTRAINT fk_media_kits_user_id FOREIGN KEY (user_id) REFERENCES users(id);
-- ALTER TABLE media_kits ADD CONSTRAINT fk_media_kits_template_id FOREIGN KEY (template_id) REFERENCES media_kit_templates(id);
-- ALTER TABLE media_kit_assets ADD CONSTRAINT fk_media_kit_assets_kit_id FOREIGN KEY (media_kit_id) REFERENCES media_kits(id) ON DELETE CASCADE;
-- ALTER TABLE media_kit_analytics ADD CONSTRAINT fk_media_kit_analytics_kit_id FOREIGN KEY (media_kit_id) REFERENCES media_kits(id) ON DELETE CASCADE;

-- Insert default templates
INSERT INTO media_kit_templates (name, description, type, template_data) VALUES
(
  'Creator Portfolio',
  'Standard template for content creators showcasing their work and statistics',
  'creator',
  '{
    "sections": [
      {"type": "header", "title": "About Me", "required": true},
      {"type": "statistics", "title": "My Performance", "required": true},
      {"type": "portfolio", "title": "Best Submissions", "required": true},
      {"type": "contact", "title": "Get In Touch", "required": true}
    ],
    "styling": {
      "primaryColor": "#3B82F6",
      "font": "Inter",
      "layout": "modern"
    }
  }'
),
(
  'Brand Showcase',
  'Professional template for brands to showcase their collaborations and reach',
  'brand',
  '{
    "sections": [
      {"type": "header", "title": "Brand Overview", "required": true},
      {"type": "collaborations", "title": "Our Partnerships", "required": true},
      {"type": "statistics", "title": "Reach & Engagement", "required": true},
      {"type": "contact", "title": "Partnership Opportunities", "required": true}
    ],
    "styling": {
      "primaryColor": "#059669",
      "font": "Inter",
      "layout": "corporate"
    }
  }'
),
(
  'Contest Summary',
  'Template for contest organizers to showcase contest results and highlights',
  'contest',
  '{
    "sections": [
      {"type": "header", "title": "Contest Overview", "required": true},
      {"type": "winners", "title": "Contest Winners", "required": true},
      {"type": "highlights", "title": "Best Submissions", "required": true},
      {"type": "statistics", "title": "Contest Stats", "required": true}
    ],
    "styling": {
      "primaryColor": "#DC2626",
      "font": "Inter",
      "layout": "showcase"
    }
  }'
);

-- ==== DOWN MIGRATION ====
-- This section is used for rollbacks

-- Drop foreign key constraints
-- ALTER TABLE media_kit_analytics DROP CONSTRAINT IF EXISTS fk_media_kit_analytics_kit_id;
-- ALTER TABLE media_kit_assets DROP CONSTRAINT IF EXISTS fk_media_kit_assets_kit_id;
-- ALTER TABLE media_kits DROP CONSTRAINT IF EXISTS fk_media_kits_template_id;
-- ALTER TABLE media_kits DROP CONSTRAINT IF EXISTS fk_media_kits_user_id;

-- Drop indexes
DROP INDEX IF EXISTS idx_media_kit_analytics_created_at;
DROP INDEX IF EXISTS idx_media_kit_analytics_event_type;
DROP INDEX IF EXISTS idx_media_kit_analytics_kit_id;
DROP INDEX IF EXISTS idx_media_kit_assets_type;
DROP INDEX IF EXISTS idx_media_kit_assets_kit_id;
DROP INDEX IF EXISTS idx_media_kits_public;
DROP INDEX IF EXISTS idx_media_kits_share_token;
DROP INDEX IF EXISTS idx_media_kits_type;
DROP INDEX IF EXISTS idx_media_kits_template_id;
DROP INDEX IF EXISTS idx_media_kits_user_id;
DROP INDEX IF EXISTS idx_media_kit_templates_active;
DROP INDEX IF EXISTS idx_media_kit_templates_type;

-- Drop tables
DROP TABLE IF EXISTS media_kit_analytics;
DROP TABLE IF EXISTS media_kit_assets;
DROP TABLE IF EXISTS media_kits;
DROP TABLE IF EXISTS media_kit_templates;

-- ==== METADATA ====
-- Dependencies: []
-- Tags: [media-kit, templates, assets, analytics] 