-- Core enums
CREATE TYPE org_type AS ENUM ('agency', 'client');
CREATE TYPE role AS ENUM (
  'super_admin',
  'agency_admin',
  'strategist',
  'writer',
  'analyst',
  'client_admin',
  'client_viewer'
);
CREATE TYPE integration_type AS ENUM ('ga4', 'gsc', 'ahrefs', 'semrush', 'cms');
CREATE TYPE engine_run_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE schema_status AS ENUM ('proposed', 'in_progress', 'implemented');
CREATE TYPE brief_status AS ENUM ('draft', 'in_review', 'approved', 'archived');
CREATE TYPE deliverable_type AS ENUM (
  'monthly_report',
  'content_piece',
  'pr_pitch',
  'schema_update',
  'tech_fix'
);
CREATE TYPE deliverable_status AS ENUM (
  'planned',
  'in_progress',
  'in_review',
  'approved',
  'shipped'
);
CREATE TYPE cadence AS ENUM ('monthly');
CREATE TYPE task_status AS ENUM (
  'backlog',
  'in_progress',
  'in_review',
  'blocked',
  'done'
);
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Core multi-tenant
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type org_type NOT NULL,
  billing_tier text,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_user_org_unique UNIQUE (user_id, org_id)
);

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  industry text,
  website_url text NOT NULL,
  regions jsonb,
  competitors jsonb,
  active_program_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type integration_type NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  config_json jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE brand_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  aliases jsonb,
  knowledge_sources jsonb,
  canonical_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE competitor_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  entity_name text NOT NULL,
  entity_type text NOT NULL,
  aliases jsonb,
  canonical_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- GEO monitoring
CREATE TABLE ai_engines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  is_active integer NOT NULL DEFAULT 1,
  capabilities_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tracked_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  query_text text NOT NULL,
  intent text,
  priority text,
  region text,
  language text,
  active integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE engine_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_query_id uuid NOT NULL REFERENCES tracked_queries(id) ON DELETE CASCADE,
  engine_id uuid NOT NULL REFERENCES ai_engines(id) ON DELETE CASCADE,
  run_time timestamptz NOT NULL,
  raw_response jsonb,
  citations jsonb,
  mentioned_brands jsonb,
  confidence numeric(4,3),
  duration_ms integer,
  status engine_run_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_run_id uuid NOT NULL REFERENCES engine_runs(id) ON DELETE CASCADE,
  cited_domain text NOT NULL,
  cited_url text NOT NULL,
  snippet text,
  position_weight numeric(4,3),
  rank integer
);

CREATE TABLE visibility_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  engine_id uuid NOT NULL REFERENCES ai_engines(id) ON DELETE CASCADE,
  date date NOT NULL,
  share_of_voice numeric(5,2),
  citation_count integer NOT NULL DEFAULT 0,
  mention_count integer NOT NULL DEFAULT 0,
  avg_position_weight numeric(4,3),
  competitor_share_json jsonb
);

CREATE TABLE artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_run_id uuid NOT NULL REFERENCES engine_runs(id) ON DELETE CASCADE,
  type text NOT NULL,
  storage_path text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Content & assets
CREATE TABLE pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  url text NOT NULL,
  page_type text,
  topic_cluster text,
  last_crawled_at timestamptz,
  last_updated_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  audit_date timestamptz NOT NULL,
  issues_json jsonb,
  recommendations_json jsonb,
  score integer,
  engine_run_id uuid REFERENCES engine_runs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE schema_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  schema_type text NOT NULL,
  json_ld text NOT NULL,
  status schema_status NOT NULL DEFAULT 'proposed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE content_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_queries jsonb,
  entities jsonb,
  outline jsonb,
  "references" jsonb,
  status brief_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  type deliverable_type NOT NULL,
  title text NOT NULL,
  description text,
  sprint_id uuid,
  content_json jsonb,
  status deliverable_status NOT NULL DEFAULT 'planned',
  storage_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Programs, sprints, tasks, approvals, notes
CREATE TABLE programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  org_id uuid NOT NULL,
  start_date date NOT NULL,
  cadence cadence NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  month text NOT NULL,
  goals jsonb,
  status text NOT NULL DEFAULT 'planned',
  visibility_snapshot_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id uuid NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  assignee_membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  status task_status NOT NULL DEFAULT 'backlog',
  blockers text,
  links jsonb,
  priority text,
  sla_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  default_due_offset_days text,
  default_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  client_user_id uuid,
  status approval_status NOT NULL DEFAULT 'pending',
  comments text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
  category text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Billing & exports
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  max_queries integer,
  max_engines integer,
  max_seats integer,
  price_cents integer,
  billing_interval text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  stripe_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL,
  seats_purchased integer,
  seats_used integer,
  started_at timestamptz,
  renews_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  label text NOT NULL,
  scopes text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

