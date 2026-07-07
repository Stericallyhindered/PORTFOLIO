-- Database Restore SQL for Neon Console
-- Generated from production backup
-- Run this in Neon SQL Editor

-- Note: This file contains the schema structure
-- The actual data needs to be restored from the dump file using pg_restore
-- Or you can restore via Neon Console if they support dump file upload


-- Table: admin_analytics
-- Columns: 6
-- Current rows: 0

-- Table: brand_collaborations
-- Columns: 19
-- Current rows: 0

-- Table: brand_contracts
-- Columns: 12
-- Current rows: 0

-- Table: brand_proposals
-- Columns: 12
-- Current rows: 0

-- Table: collaboration_messages
-- Columns: 10
-- Current rows: 0

-- Table: contest_applications
-- Columns: 10
-- Current rows: 0

-- Table: contest_judges
-- Columns: 9
-- Current rows: 0

-- Table: contest_submissions
-- Columns: 16
-- Current rows: 0

-- Table: contests
-- Columns: 21
-- Current rows: 0

-- Table: dropbox_files
-- Columns: 14
-- Current rows: 0

-- Table: dropbox_sync_jobs
-- Columns: 12
-- Current rows: 0

-- Table: dropbox_sync_settings
-- Columns: 13
-- Current rows: 0

-- Table: file_uploads
-- Columns: 10
-- Current rows: 0

-- Table: giveaway_entries
-- Columns: 9
-- Current rows: 0

-- Table: giveaway_winners
-- Columns: 10
-- Current rows: 0

-- Table: giveaways
-- Columns: 16
-- Current rows: 0

-- Table: judge_discussions
-- Columns: 10
-- Current rows: 0

-- Table: judge_scores
-- Columns: 15
-- Current rows: 0

-- Table: judging_sessions
-- Columns: 16
-- Current rows: 0

-- Table: media_kit_analytics
-- Columns: 10
-- Current rows: 0

-- Table: media_kit_assets
-- Columns: 12
-- Current rows: 0

-- Table: media_kit_templates
-- Columns: 11
-- Current rows: 0

-- Table: media_kits
-- Columns: 18
-- Current rows: 0

-- Table: notifications
-- Columns: 8
-- Current rows: 0

-- Table: payment_history
-- Columns: 9
-- Current rows: 0

-- Table: points_transactions
-- Columns: 9
-- Current rows: 0

-- Table: portfolio_videos
-- Columns: 14
-- Current rows: 0

-- Table: user_settings
-- Columns: 12
-- Current rows: 0

-- Table: users
-- Columns: 24
-- Current rows: 0

-- Table: w9_form_notifications
-- Columns: 12
-- Current rows: 0

-- Table: w9_form_submissions
-- Columns: 14
-- Current rows: 0

-- Table: w9_form_verifications
-- Columns: 11
-- Current rows: 0

-- Table: w9_forms
-- Columns: 31
-- Current rows: 0


-- IMPORTANT: To restore actual data from the dump file:
-- 1. Use pg_restore: pg_restore -d <database_url> bass-clown-database.2025.08.07.dump
-- 2. Or use Neon Console Import feature if available
-- 3. Or extract SQL first: pg_restore -f extracted.sql bass-clown-database.2025.08.07.dump
