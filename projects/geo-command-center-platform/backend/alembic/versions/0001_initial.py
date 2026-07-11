"""initial

Revision ID: 0001_initial
Revises:
Create Date: 2026-03-10
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False, unique=True),
        sa.Column("plan", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("organization_id", sa.String(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True),
        sa.Column("name", sa.String(length=200), nullable=True),
        sa.Column("role", sa.String(length=40), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "projects",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("organization_id", sa.String(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("brand_name", sa.String(length=200), nullable=False),
        sa.Column("primary_domain", sa.String(length=255), nullable=True),
        sa.Column("locale", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "competitors",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("domain", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "domains",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("domain", sa.String(length=255), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False),
        sa.Column("robots_status", sa.String(length=100), nullable=True),
        sa.Column("sitemap_url", sa.Text(), nullable=True),
        sa.Column("last_crawled_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "pages",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("domain_id", sa.String(), sa.ForeignKey("domains.id"), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("canonical_url", sa.Text(), nullable=True),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("content_type", sa.String(length=120), nullable=True),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("h1", sa.Text(), nullable=True),
        sa.Column("meta_description", sa.Text(), nullable=True),
        sa.Column("lang", sa.String(length=40), nullable=True),
        sa.Column("word_count", sa.Integer(), nullable=True),
        sa.Column("is_indexable", sa.Boolean(), nullable=True),
        sa.Column("is_crawlable", sa.Boolean(), nullable=True),
        sa.Column("is_rendered", sa.Boolean(), nullable=True),
        sa.Column("has_structured_data", sa.Boolean(), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("modified_at", sa.DateTime(), nullable=True),
        sa.Column("first_seen_at", sa.DateTime(), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(), nullable=True),
        sa.Column("content_hash", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "page_snapshots",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("page_id", sa.String(), sa.ForeignKey("pages.id"), nullable=False),
        sa.Column("raw_html_path", sa.Text(), nullable=True),
        sa.Column("rendered_html_path", sa.Text(), nullable=True),
        sa.Column("screenshot_path", sa.Text(), nullable=True),
        sa.Column("markdown_path", sa.Text(), nullable=True),
        sa.Column("text_path", sa.Text(), nullable=True),
        sa.Column("captured_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "page_features",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("page_id", sa.String(), sa.ForeignKey("pages.id"), nullable=False),
        sa.Column("schema_types", sa.JSON(), nullable=True),
        sa.Column("internal_link_count", sa.Integer(), nullable=True),
        sa.Column("external_link_count", sa.Integer(), nullable=True),
        sa.Column("faq_count", sa.Integer(), nullable=True),
        sa.Column("table_count", sa.Integer(), nullable=True),
        sa.Column("list_count", sa.Integer(), nullable=True),
        sa.Column("image_count", sa.Integer(), nullable=True),
        sa.Column("heading_depth_score", sa.Float(), nullable=True),
        sa.Column("readability_score", sa.Float(), nullable=True),
        sa.Column("factual_density_score", sa.Float(), nullable=True),
        sa.Column("extractability_score", sa.Float(), nullable=True),
        sa.Column("quoteability_score", sa.Float(), nullable=True),
        sa.Column("information_gain_score", sa.Float(), nullable=True),
        sa.Column("entity_salience_score", sa.Float(), nullable=True),
        sa.Column("trust_signal_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "entities",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("normalized_name", sa.String(length=255), nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=False),
        sa.Column("aliases", sa.JSON(), nullable=True),
        sa.Column("external_refs", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "page_entities",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("page_id", sa.String(), sa.ForeignKey("pages.id"), nullable=False),
        sa.Column("entity_id", sa.String(), sa.ForeignKey("entities.id"), nullable=False),
        sa.Column("prominence_score", sa.Float(), nullable=True),
        sa.Column("occurrences", sa.Integer(), nullable=True),
        sa.Column("contexts", sa.JSON(), nullable=True),
    )
    op.create_table(
        "prompt_clusters",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("intent_type", sa.String(length=60), nullable=False),
        sa.Column("topic", sa.String(length=255), nullable=False),
        sa.Column("priority_score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "prompts",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("prompt_cluster_id", sa.String(), sa.ForeignKey("prompt_clusters.id"), nullable=False),
        sa.Column("prompt_text", sa.Text(), nullable=False),
        sa.Column("prompt_variant_type", sa.String(length=80), nullable=True),
        sa.Column("locale", sa.String(length=20), nullable=False),
        sa.Column("business_value_score", sa.Float(), nullable=False),
        sa.Column("difficulty_score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "engine_runs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("engine_name", sa.String(length=80), nullable=False),
        sa.Column("engine_variant", sa.String(length=120), nullable=True),
        sa.Column("prompt_id", sa.String(), sa.ForeignKey("prompts.id"), nullable=False),
        sa.Column("run_status", sa.String(length=40), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("request_payload", sa.JSON(), nullable=True),
        sa.Column("response_text", sa.Text(), nullable=True),
        sa.Column("response_json", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
    )
    op.create_table(
        "citations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("engine_run_id", sa.String(), sa.ForeignKey("engine_runs.id"), nullable=False),
        sa.Column("cited_domain", sa.String(length=255), nullable=True),
        sa.Column("cited_url", sa.Text(), nullable=True),
        sa.Column("citation_order", sa.Integer(), nullable=True),
        sa.Column("mention_type", sa.String(length=40), nullable=True),
        sa.Column("snippet", sa.Text(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("is_brand", sa.Boolean(), nullable=False),
        sa.Column("is_competitor", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "mentions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("engine_run_id", sa.String(), sa.ForeignKey("engine_runs.id"), nullable=False),
        sa.Column("entity_name", sa.String(length=255), nullable=False),
        sa.Column("entity_type", sa.String(length=100), nullable=True),
        sa.Column("sentiment", sa.String(length=40), nullable=True),
        sa.Column("position_score", sa.Float(), nullable=True),
        sa.Column("context_snippet", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "geo_scores",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("page_id", sa.String(), sa.ForeignKey("pages.id"), nullable=True),
        sa.Column("domain_id", sa.String(), sa.ForeignKey("domains.id"), nullable=True),
        sa.Column("prompt_cluster_id", sa.String(), sa.ForeignKey("prompt_clusters.id"), nullable=True),
        sa.Column("score_scope", sa.String(length=40), nullable=False),
        sa.Column("technical_score", sa.Float(), nullable=True),
        sa.Column("extractability_score", sa.Float(), nullable=True),
        sa.Column("entity_score", sa.Float(), nullable=True),
        sa.Column("trust_score", sa.Float(), nullable=True),
        sa.Column("content_score", sa.Float(), nullable=True),
        sa.Column("citation_score", sa.Float(), nullable=True),
        sa.Column("visibility_score", sa.Float(), nullable=True),
        sa.Column("freshness_score", sa.Float(), nullable=True),
        sa.Column("composite_score", sa.Float(), nullable=True),
        sa.Column("computed_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "recommendations",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("page_id", sa.String(), sa.ForeignKey("pages.id"), nullable=True),
        sa.Column("prompt_cluster_id", sa.String(), sa.ForeignKey("prompt_clusters.id"), nullable=True),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("priority", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column("estimated_impact", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "report_exports",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("report_type", sa.String(length=80), nullable=False),
        sa.Column("storage_path", sa.Text(), nullable=False),
        sa.Column("generated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "pipeline_runs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("organization_id", sa.String(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("domain", sa.String(length=255), nullable=False),
        sa.Column("run_folder", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("progress", sa.Float(), nullable=False),
        sa.Column("celery_task_id", sa.String(length=80), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("pipeline_runs")
    op.drop_table("report_exports")
    op.drop_table("recommendations")
    op.drop_table("geo_scores")
    op.drop_table("mentions")
    op.drop_table("citations")
    op.drop_table("engine_runs")
    op.drop_table("prompts")
    op.drop_table("prompt_clusters")
    op.drop_table("page_entities")
    op.drop_table("entities")
    op.drop_table("page_features")
    op.drop_table("page_snapshots")
    op.drop_table("pages")
    op.drop_table("domains")
    op.drop_table("competitors")
    op.drop_table("projects")
    op.drop_table("users")
    op.drop_table("organizations")
