"""Add prompt metadata expansion for 10k prompt engine.

Revision ID: 0002_prompt_metadata
Revises: 0001_initial
Create Date: 2026-03-12

This migration adds:
1. Extended prompt metadata fields (topic, intent, audience, etc.)
2. Prompt provenance tracking (source_layer, source_reason, parent_prompt_id)
3. Quality and tier fields (quality_score, priority_tier)
4. Dedupe support fields (semantic_cluster_id, normalized_text_hash)
5. New tables: prompt_generation_runs, site_profiles
6. Pipeline run enhancements (target_tier, prompt_generation_id, failure_summary)
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_prompt_metadata"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("prompts", sa.Column("topic", sa.String(255), nullable=True))
    op.add_column("prompts", sa.Column("subtopic", sa.String(255), nullable=True))
    op.add_column("prompts", sa.Column("intent", sa.String(60), nullable=True))
    op.add_column("prompts", sa.Column("funnel_stage", sa.String(40), nullable=True))
    op.add_column("prompts", sa.Column("audience", sa.String(200), nullable=True))
    op.add_column("prompts", sa.Column("use_case", sa.String(200), nullable=True))
    op.add_column("prompts", sa.Column("pain_point", sa.String(200), nullable=True))
    op.add_column("prompts", sa.Column("feature", sa.String(200), nullable=True))
    op.add_column("prompts", sa.Column("competitor", sa.String(200), nullable=True))
    
    op.add_column("prompts", sa.Column("source_layer", sa.String(60), nullable=True))
    op.add_column("prompts", sa.Column("source_reason", sa.Text(), nullable=True))
    op.add_column("prompts", sa.Column("parent_prompt_id", sa.String(), nullable=True))
    op.add_column("prompts", sa.Column("generation_run_id", sa.String(), nullable=True))
    
    op.add_column("prompts", sa.Column("semantic_cluster_id", sa.String(80), nullable=True))
    op.add_column("prompts", sa.Column("normalized_text_hash", sa.String(64), nullable=True))
    
    op.add_column("prompts", sa.Column("quality_score", sa.Float(), nullable=True))
    op.add_column("prompts", sa.Column("priority_tier", sa.Integer(), nullable=True, default=2))
    
    op.create_index("ix_prompts_project_tier_intent", "prompts", ["prompt_cluster_id", "priority_tier", "intent"])
    op.create_index("ix_prompts_generation_run", "prompts", ["generation_run_id"])
    op.create_index("ix_prompts_normalized_hash", "prompts", ["normalized_text_hash"])
    op.create_index("ix_prompts_semantic_cluster", "prompts", ["semantic_cluster_id"])
    
    op.add_column("pipeline_runs", sa.Column("target_tier", sa.String(20), nullable=True, default="core"))
    op.add_column("pipeline_runs", sa.Column("prompt_generation_id", sa.String(), nullable=True))
    op.add_column("pipeline_runs", sa.Column("failure_summary", sa.Text(), nullable=True))
    
    op.create_table(
        "prompt_generation_runs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("target_tier", sa.String(20), default="core"),
        sa.Column("status", sa.String(40), default="pending"),
        sa.Column("site_context_json", sa.JSON(), nullable=True),
        sa.Column("topic_graph_json", sa.JSON(), nullable=True),
        sa.Column("seeds_generated", sa.Integer(), nullable=True),
        sa.Column("prompts_expanded", sa.Integer(), nullable=True),
        sa.Column("prompts_after_dedupe", sa.Integer(), nullable=True),
        sa.Column("prompts_after_quality", sa.Integer(), nullable=True),
        sa.Column("tier1_count", sa.Integer(), nullable=True),
        sa.Column("tier2_count", sa.Integer(), nullable=True),
        sa.Column("tier3_count", sa.Integer(), nullable=True),
        sa.Column("dedupe_stats_json", sa.JSON(), nullable=True),
        sa.Column("quality_stats_json", sa.JSON(), nullable=True),
        sa.Column("tier_stats_json", sa.JSON(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_prompt_gen_runs_project", "prompt_generation_runs", ["project_id"])
    op.create_index("ix_prompt_gen_runs_status", "prompt_generation_runs", ["status"])
    
    op.create_table(
        "site_profiles",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("project_id", sa.String(), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("brand_name", sa.String(200), nullable=False),
        sa.Column("domain", sa.String(255), nullable=False),
        sa.Column("industries_json", sa.JSON(), nullable=True),
        sa.Column("products_json", sa.JSON(), nullable=True),
        sa.Column("services_json", sa.JSON(), nullable=True),
        sa.Column("features_json", sa.JSON(), nullable=True),
        sa.Column("pain_points_json", sa.JSON(), nullable=True),
        sa.Column("customer_types_json", sa.JSON(), nullable=True),
        sa.Column("use_cases_json", sa.JSON(), nullable=True),
        sa.Column("locations_json", sa.JSON(), nullable=True),
        sa.Column("competitors_json", sa.JSON(), nullable=True),
        sa.Column("core_topics_json", sa.JSON(), nullable=True),
        sa.Column("supporting_topics_json", sa.JSON(), nullable=True),
        sa.Column("keywords_json", sa.JSON(), nullable=True),
        sa.Column("faq_questions_json", sa.JSON(), nullable=True),
        sa.Column("claims_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_site_profiles_project", "site_profiles", ["project_id"])


def downgrade() -> None:
    op.drop_table("site_profiles")
    op.drop_table("prompt_generation_runs")
    
    op.drop_column("pipeline_runs", "failure_summary")
    op.drop_column("pipeline_runs", "prompt_generation_id")
    op.drop_column("pipeline_runs", "target_tier")
    
    op.drop_index("ix_prompts_semantic_cluster", table_name="prompts")
    op.drop_index("ix_prompts_normalized_hash", table_name="prompts")
    op.drop_index("ix_prompts_generation_run", table_name="prompts")
    op.drop_index("ix_prompts_project_tier_intent", table_name="prompts")
    
    op.drop_column("prompts", "priority_tier")
    op.drop_column("prompts", "quality_score")
    op.drop_column("prompts", "normalized_text_hash")
    op.drop_column("prompts", "semantic_cluster_id")
    op.drop_column("prompts", "generation_run_id")
    op.drop_column("prompts", "parent_prompt_id")
    op.drop_column("prompts", "source_reason")
    op.drop_column("prompts", "source_layer")
    op.drop_column("prompts", "competitor")
    op.drop_column("prompts", "feature")
    op.drop_column("prompts", "pain_point")
    op.drop_column("prompts", "use_case")
    op.drop_column("prompts", "audience")
    op.drop_column("prompts", "funnel_stage")
    op.drop_column("prompts", "intent")
    op.drop_column("prompts", "subtopic")
    op.drop_column("prompts", "topic")
