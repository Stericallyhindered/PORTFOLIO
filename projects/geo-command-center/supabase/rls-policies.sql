-- Enable RLS on core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_entities ENABLE ROW LEVEL SECURITY;

ALTER TABLE ai_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE engine_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- Helper: join memberships via app users -> auth.uid()
CREATE OR REPLACE VIEW current_user_memberships AS
SELECT
  m.*,
  o.name AS org_name
FROM memberships m
JOIN users u ON u.id = m.user_id
JOIN organizations o ON o.id = m.org_id
WHERE u.auth_user_id = auth.uid();

-- Organizations: visible to users who have a membership in them
CREATE POLICY organizations_select ON organizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM current_user_memberships m
    WHERE m.org_id = organizations.id
  )
);

-- Users: visible only as self (by auth_user_id)
CREATE POLICY users_select_self ON users
FOR SELECT
USING (auth_user_id = auth.uid());

-- Memberships: visible to members of the same org
CREATE POLICY memberships_select ON memberships
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM current_user_memberships m
    WHERE m.org_id = memberships.org_id
  )
);

-- Clients: restricted by owning agency org
CREATE POLICY clients_select ON clients
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM current_user_memberships m
    WHERE m.org_id = clients.org_id
  )
);

-- Brand & competitor entities: by client/org link
CREATE POLICY brand_entities_select ON brand_entities
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE c.id = brand_entities.client_id
  )
);

CREATE POLICY competitor_entities_select ON competitor_entities
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE c.id = competitor_entities.client_id
  )
);

-- GEO monitoring tables
CREATE POLICY tracked_queries_select ON tracked_queries
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE c.id = tracked_queries.client_id
  )
);

CREATE POLICY engine_runs_select ON engine_runs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM tracked_queries tq
    JOIN clients c ON c.id = tq.client_id
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE tq.id = engine_runs.tracked_query_id
  )
);

CREATE POLICY citations_select ON citations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM engine_runs er
    JOIN tracked_queries tq ON tq.id = er.tracked_query_id
    JOIN clients c ON c.id = tq.client_id
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE er.id = citations.engine_run_id
  )
);

CREATE POLICY visibility_metrics_daily_select ON visibility_metrics_daily
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE c.id = visibility_metrics_daily.client_id
  )
);

-- Content, audits, deliverables
CREATE POLICY pages_select ON pages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE c.id = pages.client_id
  )
);

CREATE POLICY content_audits_select ON content_audits
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM pages p
    JOIN clients c ON c.id = p.client_id
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE p.id = content_audits.page_id
  )
);

CREATE POLICY deliverables_select ON deliverables
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE c.id = deliverables.client_id
  )
);

-- Programs, sprints, tasks, approvals, notes
CREATE POLICY programs_select ON programs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE c.id = programs.client_id
  )
);

CREATE POLICY sprints_select ON sprints
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM programs p
    JOIN clients c ON c.id = p.client_id
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE p.id = sprints.program_id
  )
);

CREATE POLICY tasks_select ON tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM sprints s
    JOIN programs p ON p.id = s.program_id
    JOIN clients c ON c.id = p.client_id
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE s.id = tasks.sprint_id
  )
);

CREATE POLICY approvals_select ON approvals
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM deliverables d
    JOIN clients c ON c.id = d.client_id
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE d.id = approvals.deliverable_id
  )
);

CREATE POLICY notes_select ON notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    JOIN current_user_memberships m ON m.org_id = c.org_id
    WHERE c.id = notes.client_id
  )
);

-- Billing & API tokens
CREATE POLICY plans_select ON plans
FOR SELECT
USING (true);

CREATE POLICY subscriptions_select ON subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM current_user_memberships m
    WHERE m.org_id = subscriptions.org_id
  )
);

CREATE POLICY api_tokens_select ON api_tokens
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM current_user_memberships m
    WHERE m.org_id = api_tokens.org_id
  )
);

