CREATE TABLE page_entity_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL,
  score integer NOT NULL,
  evidence jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

