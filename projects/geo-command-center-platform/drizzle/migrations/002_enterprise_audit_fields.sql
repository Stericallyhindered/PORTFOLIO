ALTER TABLE content_audits
  ADD COLUMN IF NOT EXISTS framework_version text,
  ADD COLUMN IF NOT EXISTS run_confidence integer,
  ADD COLUMN IF NOT EXISTS dimension_scores_json jsonb,
  ADD COLUMN IF NOT EXISTS sub_dimension_scores_json jsonb,
  ADD COLUMN IF NOT EXISTS model_judgment_json jsonb,
  ADD COLUMN IF NOT EXISTS engine_evidence_json jsonb,
  ADD COLUMN IF NOT EXISTS current_vs_improved_json jsonb;
