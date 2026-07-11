from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def _uuid() -> str:
    return str(uuid4())


class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    plan: Mapped[str] = mapped_column(String(40), default="starter")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(40), default="viewer")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    brand_name: Mapped[str] = mapped_column(String(200), nullable=False)
    primary_domain: Mapped[str | None] = mapped_column(String(255))
    locale: Mapped[str] = mapped_column(String(20), default="en-US")
    status: Mapped[str] = mapped_column(String(40), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Competitor(Base):
    __tablename__ = "competitors"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Domain(Base):
    __tablename__ = "domains"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    robots_status: Mapped[str | None] = mapped_column(String(100))
    sitemap_url: Mapped[str | None] = mapped_column(Text)
    last_crawled_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Page(Base):
    __tablename__ = "pages"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    domain_id: Mapped[str] = mapped_column(ForeignKey("domains.id"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    canonical_url: Mapped[str | None] = mapped_column(Text)
    status_code: Mapped[int | None] = mapped_column(Integer)
    content_type: Mapped[str | None] = mapped_column(String(120))
    title: Mapped[str | None] = mapped_column(Text)
    h1: Mapped[str | None] = mapped_column(Text)
    meta_description: Mapped[str | None] = mapped_column(Text)
    lang: Mapped[str | None] = mapped_column(String(40))
    word_count: Mapped[int | None] = mapped_column(Integer)
    is_indexable: Mapped[bool | None] = mapped_column(Boolean)
    is_crawlable: Mapped[bool | None] = mapped_column(Boolean)
    is_rendered: Mapped[bool | None] = mapped_column(Boolean)
    has_structured_data: Mapped[bool | None] = mapped_column(Boolean)
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    modified_at: Mapped[datetime | None] = mapped_column(DateTime)
    first_seen_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime)
    content_hash: Mapped[str | None] = mapped_column(String(120))
    
    # Full content storage for Claude analysis
    headings_json: Mapped[list | None] = mapped_column(JSON)
    full_text: Mapped[str | None] = mapped_column(Text)
    links_json: Mapped[list | None] = mapped_column(JSON)
    schema_json: Mapped[list | None] = mapped_column(JSON)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PageSnapshot(Base):
    __tablename__ = "page_snapshots"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    page_id: Mapped[str] = mapped_column(ForeignKey("pages.id"), nullable=False)
    raw_html_path: Mapped[str | None] = mapped_column(Text)
    rendered_html_path: Mapped[str | None] = mapped_column(Text)
    screenshot_path: Mapped[str | None] = mapped_column(Text)
    markdown_path: Mapped[str | None] = mapped_column(Text)
    text_path: Mapped[str | None] = mapped_column(Text)
    captured_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PageFeature(Base):
    __tablename__ = "page_features"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    page_id: Mapped[str] = mapped_column(ForeignKey("pages.id"), nullable=False)
    schema_types: Mapped[list | None] = mapped_column(JSON)
    internal_link_count: Mapped[int | None] = mapped_column(Integer)
    external_link_count: Mapped[int | None] = mapped_column(Integer)
    faq_count: Mapped[int | None] = mapped_column(Integer)
    table_count: Mapped[int | None] = mapped_column(Integer)
    list_count: Mapped[int | None] = mapped_column(Integer)
    image_count: Mapped[int | None] = mapped_column(Integer)
    heading_depth_score: Mapped[float | None] = mapped_column(Float)
    readability_score: Mapped[float | None] = mapped_column(Float)
    factual_density_score: Mapped[float | None] = mapped_column(Float)
    extractability_score: Mapped[float | None] = mapped_column(Float)
    quoteability_score: Mapped[float | None] = mapped_column(Float)
    information_gain_score: Mapped[float | None] = mapped_column(Float)
    entity_salience_score: Mapped[float | None] = mapped_column(Float)
    trust_signal_score: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Entity(Base):
    __tablename__ = "entities"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    aliases: Mapped[list | None] = mapped_column(JSON)
    external_refs: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PageEntity(Base):
    __tablename__ = "page_entities"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    page_id: Mapped[str] = mapped_column(ForeignKey("pages.id"), nullable=False)
    entity_id: Mapped[str] = mapped_column(ForeignKey("entities.id"), nullable=False)
    prominence_score: Mapped[float | None] = mapped_column(Float)
    occurrences: Mapped[int | None] = mapped_column(Integer)
    contexts: Mapped[list | None] = mapped_column(JSON)


class PromptCluster(Base):
    __tablename__ = "prompt_clusters"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    intent_type: Mapped[str] = mapped_column(String(60), nullable=False)
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    priority_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Prompt(Base):
    __tablename__ = "prompts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    prompt_cluster_id: Mapped[str] = mapped_column(
        ForeignKey("prompt_clusters.id"), nullable=False
    )
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    prompt_variant_type: Mapped[str | None] = mapped_column(String(80))
    locale: Mapped[str] = mapped_column(String(20), default="en-US")
    business_value_score: Mapped[float] = mapped_column(Float, default=0.0)
    difficulty_score: Mapped[float] = mapped_column(Float, default=0.0)
    
    topic: Mapped[str | None] = mapped_column(String(255))
    subtopic: Mapped[str | None] = mapped_column(String(255))
    intent: Mapped[str | None] = mapped_column(String(60))
    funnel_stage: Mapped[str | None] = mapped_column(String(40))
    audience: Mapped[str | None] = mapped_column(String(200))
    use_case: Mapped[str | None] = mapped_column(String(200))
    pain_point: Mapped[str | None] = mapped_column(String(200))
    feature: Mapped[str | None] = mapped_column(String(200))
    competitor: Mapped[str | None] = mapped_column(String(200))
    
    source_layer: Mapped[str | None] = mapped_column(String(60))
    source_reason: Mapped[str | None] = mapped_column(Text)
    parent_prompt_id: Mapped[str | None] = mapped_column(String)
    generation_run_id: Mapped[str | None] = mapped_column(String)
    
    semantic_cluster_id: Mapped[str | None] = mapped_column(String(80))
    normalized_text_hash: Mapped[str | None] = mapped_column(String(64))
    
    quality_score: Mapped[float | None] = mapped_column(Float)
    priority_tier: Mapped[int | None] = mapped_column(Integer, default=2)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class EngineRun(Base):
    __tablename__ = "engine_runs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    engine_name: Mapped[str] = mapped_column(String(80), nullable=False)
    engine_variant: Mapped[str | None] = mapped_column(String(120))
    prompt_id: Mapped[str] = mapped_column(ForeignKey("prompts.id"), nullable=False)
    run_status: Mapped[str] = mapped_column(String(40), default="pending")
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    request_payload: Mapped[dict | None] = mapped_column(JSON)
    response_text: Mapped[str | None] = mapped_column(Text)
    response_json: Mapped[dict | None] = mapped_column(JSON)
    error_message: Mapped[str | None] = mapped_column(Text)


class Citation(Base):
    __tablename__ = "citations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    engine_run_id: Mapped[str] = mapped_column(ForeignKey("engine_runs.id"), nullable=False)
    cited_domain: Mapped[str | None] = mapped_column(String(255))
    cited_url: Mapped[str | None] = mapped_column(Text)
    citation_order: Mapped[int | None] = mapped_column(Integer)
    mention_type: Mapped[str | None] = mapped_column(String(40))
    snippet: Mapped[str | None] = mapped_column(Text)
    title: Mapped[str | None] = mapped_column(String(255))
    confidence: Mapped[float | None] = mapped_column(Float)
    is_brand: Mapped[bool] = mapped_column(Boolean, default=False)
    is_competitor: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Mention(Base):
    __tablename__ = "mentions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    engine_run_id: Mapped[str] = mapped_column(ForeignKey("engine_runs.id"), nullable=False)
    entity_name: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(100))
    sentiment: Mapped[str | None] = mapped_column(String(40))
    position_score: Mapped[float | None] = mapped_column(Float)
    context_snippet: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GeoScore(Base):
    __tablename__ = "geo_scores"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    page_id: Mapped[str | None] = mapped_column(ForeignKey("pages.id"))
    domain_id: Mapped[str | None] = mapped_column(ForeignKey("domains.id"))
    prompt_cluster_id: Mapped[str | None] = mapped_column(ForeignKey("prompt_clusters.id"))
    score_scope: Mapped[str] = mapped_column(String(40), nullable=False)
    technical_score: Mapped[float | None] = mapped_column(Float)
    extractability_score: Mapped[float | None] = mapped_column(Float)
    entity_score: Mapped[float | None] = mapped_column(Float)
    trust_score: Mapped[float | None] = mapped_column(Float)
    content_score: Mapped[float | None] = mapped_column(Float)
    citation_score: Mapped[float | None] = mapped_column(Float)
    visibility_score: Mapped[float | None] = mapped_column(Float)
    freshness_score: Mapped[float | None] = mapped_column(Float)
    composite_score: Mapped[float | None] = mapped_column(Float)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    page_id: Mapped[str | None] = mapped_column(ForeignKey("pages.id"))
    prompt_cluster_id: Mapped[str | None] = mapped_column(ForeignKey("prompt_clusters.id"))
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    priority: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_impact: Mapped[float | None] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(40), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ReportExport(Base):
    __tablename__ = "report_exports"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    report_type: Mapped[str] = mapped_column(String(80), nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    run_folder: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(40), default="queued")
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    celery_task_id: Mapped[str | None] = mapped_column(String(80))
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    
    target_tier: Mapped[str | None] = mapped_column(String(20), default="core")
    prompt_generation_id: Mapped[str | None] = mapped_column(String)
    failure_summary: Mapped[str | None] = mapped_column(Text)


class PromptGenerationRun(Base):
    """Tracks a prompt generation run with full metadata."""
    __tablename__ = "prompt_generation_runs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    
    target_tier: Mapped[str] = mapped_column(String(20), default="core")
    status: Mapped[str] = mapped_column(String(40), default="pending")
    
    site_context_json: Mapped[dict | None] = mapped_column(JSON)
    topic_graph_json: Mapped[dict | None] = mapped_column(JSON)
    
    seeds_generated: Mapped[int | None] = mapped_column(Integer)
    prompts_expanded: Mapped[int | None] = mapped_column(Integer)
    prompts_after_dedupe: Mapped[int | None] = mapped_column(Integer)
    prompts_after_quality: Mapped[int | None] = mapped_column(Integer)
    
    tier1_count: Mapped[int | None] = mapped_column(Integer)
    tier2_count: Mapped[int | None] = mapped_column(Integer)
    tier3_count: Mapped[int | None] = mapped_column(Integer)
    
    dedupe_stats_json: Mapped[dict | None] = mapped_column(JSON)
    quality_stats_json: Mapped[dict | None] = mapped_column(JSON)
    tier_stats_json: Mapped[dict | None] = mapped_column(JSON)
    
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)


class SiteProfile(Base):
    """Persisted site intelligence profile for a project."""
    __tablename__ = "site_profiles"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id"), nullable=False)
    
    brand_name: Mapped[str] = mapped_column(String(200), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False)
    
    industries_json: Mapped[list | None] = mapped_column(JSON)
    subindustries_json: Mapped[list | None] = mapped_column(JSON)
    products_json: Mapped[list | None] = mapped_column(JSON)
    services_json: Mapped[list | None] = mapped_column(JSON)
    features_json: Mapped[list | None] = mapped_column(JSON)
    pain_points_json: Mapped[list | None] = mapped_column(JSON)
    customer_types_json: Mapped[list | None] = mapped_column(JSON)
    use_cases_json: Mapped[list | None] = mapped_column(JSON)
    locations_json: Mapped[list | None] = mapped_column(JSON)
    competitors_json: Mapped[list | None] = mapped_column(JSON)
    core_topics_json: Mapped[list | None] = mapped_column(JSON)
    supporting_topics_json: Mapped[list | None] = mapped_column(JSON)
    keywords_json: Mapped[list | None] = mapped_column(JSON)
    faq_questions_json: Mapped[list | None] = mapped_column(JSON)
    claims_json: Mapped[list | None] = mapped_column(JSON)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PipelineLog(Base):
    """Real-time log entries for pipeline execution tracking."""
    __tablename__ = "pipeline_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    pipeline_run_id: Mapped[str] = mapped_column(ForeignKey("pipeline_runs.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    level: Mapped[str] = mapped_column(String(20), nullable=False)  # info, warning, error, success
    stage: Mapped[str] = mapped_column(String(60), nullable=False)  # crawl, claude_analysis, prompt_generation, etc.
    message: Mapped[str] = mapped_column(Text, nullable=False)
    details_json: Mapped[dict | None] = mapped_column(JSON)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
