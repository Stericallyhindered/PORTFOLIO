-- Migration: Initial Collaborative Judging System
-- Version: 20240101T000000_initial_collaborative_judging
-- Description: Add tables for collaborative judging system including judges, scores, sessions, and discussions
-- Created: 2024-01-01T00:00:00.000Z

-- ==== UP MIGRATION ====

-- Create contest_judges table
CREATE TABLE contest_judges (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  assigned_at TIMESTAMP DEFAULT NOW() NOT NULL,
  assigned_by INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
  specialties TEXT[],
  UNIQUE(contest_id, user_id)
);

-- Create judge_scores table
CREATE TABLE judge_scores (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER NOT NULL,
  judge_id INTEGER NOT NULL,
  session_id INTEGER,
  overall_score DECIMAL(4,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  criteria_scores JSONB,
  comments TEXT,
  scored_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(submission_id, judge_id, session_id)
);

-- Create judging_sessions table
CREATE TABLE judging_sessions (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  judging_mode TEXT NOT NULL DEFAULT 'independent' CHECK (judging_mode IN ('independent', 'collaborative', 'consensus')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  required_judges INTEGER DEFAULT 3,
  scoring_criteria JSONB,
  aggregation_method TEXT DEFAULT 'average' CHECK (aggregation_method IN ('average', 'median', 'weighted')),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create judge_discussions table
CREATE TABLE judge_discussions (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  submission_id INTEGER,
  judge_id INTEGER NOT NULL,
  parent_id INTEGER,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_contest_judges_contest_id ON contest_judges(contest_id);
CREATE INDEX idx_contest_judges_user_id ON contest_judges(user_id);
CREATE INDEX idx_judge_scores_submission_id ON judge_scores(submission_id);
CREATE INDEX idx_judge_scores_judge_id ON judge_scores(judge_id);
CREATE INDEX idx_judge_scores_session_id ON judge_scores(session_id);
CREATE INDEX idx_judging_sessions_contest_id ON judging_sessions(contest_id);
CREATE INDEX idx_judge_discussions_session_id ON judge_discussions(session_id);
CREATE INDEX idx_judge_discussions_submission_id ON judge_discussions(submission_id);
CREATE INDEX idx_judge_discussions_parent_id ON judge_discussions(parent_id);

-- ==== DOWN MIGRATION ====
-- This section is used for rollbacks

-- Drop indexes
DROP INDEX IF EXISTS idx_judge_discussions_parent_id;
DROP INDEX IF EXISTS idx_judge_discussions_submission_id;
DROP INDEX IF EXISTS idx_judge_discussions_session_id;
DROP INDEX IF EXISTS idx_judging_sessions_contest_id;
DROP INDEX IF EXISTS idx_judge_scores_session_id;
DROP INDEX IF EXISTS idx_judge_scores_judge_id;
DROP INDEX IF EXISTS idx_judge_scores_submission_id;
DROP INDEX IF EXISTS idx_contest_judges_user_id;
DROP INDEX IF EXISTS idx_contest_judges_contest_id;

-- Drop tables
DROP TABLE IF EXISTS judge_discussions;
DROP TABLE IF EXISTS judging_sessions;
DROP TABLE IF EXISTS judge_scores;
DROP TABLE IF EXISTS contest_judges;

-- ==== METADATA ====
-- Dependencies: []
-- Tags: [collaborative-judging, contests, judges] 