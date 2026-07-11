from datetime import datetime
from pydantic import BaseModel, Field


class ApiError(BaseModel):
    detail: str


class AuthLoginIn(BaseModel):
    email: str
    password: str
    org_id: str | None = None


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    org_id: str
    role: str


class OrganizationIn(BaseModel):
    name: str
    slug: str
    plan: str = "starter"


class OrganizationOut(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserIn(BaseModel):
    email: str
    name: str | None = None
    role: str = "viewer"
    password: str


class UserOut(BaseModel):
    id: str
    organization_id: str
    email: str
    name: str | None
    role: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectIn(BaseModel):
    name: str
    slug: str
    brand_name: str
    primary_domain: str | None = None
    locale: str = "en-US"


class ProjectOut(BaseModel):
    id: str
    organization_id: str
    name: str
    slug: str
    brand_name: str
    primary_domain: str | None
    locale: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DomainIn(BaseModel):
    project_id: str
    domain: str
    is_primary: bool = False


class DomainOut(BaseModel):
    id: str
    project_id: str
    domain: str
    is_primary: bool
    robots_status: str | None
    sitemap_url: str | None
    last_crawled_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompetitorIn(BaseModel):
    project_id: str
    name: str
    domain: str


class CompetitorOut(BaseModel):
    id: str
    project_id: str
    name: str
    domain: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PageOut(BaseModel):
    id: str
    domain_id: str
    url: str
    canonical_url: str | None
    title: str | None
    h1: str | None
    meta_description: str | None
    word_count: int | None
    status_code: int | None
    last_seen_at: datetime | None

    model_config = {"from_attributes": True}


class PageFeatureOut(BaseModel):
    id: str
    page_id: str
    schema_types: list | None
    internal_link_count: int | None
    external_link_count: int | None
    faq_count: int | None
    table_count: int | None
    list_count: int | None
    image_count: int | None
    heading_depth_score: float | None
    readability_score: float | None
    factual_density_score: float | None
    extractability_score: float | None
    quoteability_score: float | None
    information_gain_score: float | None
    entity_salience_score: float | None
    trust_signal_score: float | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecommendationIn(BaseModel):
    project_id: str
    page_id: str | None = None
    prompt_cluster_id: str | None = None
    category: str
    priority: str
    title: str
    description: str
    rationale: str
    estimated_impact: float = 0.5


class RecommendationPatch(BaseModel):
    status: str


class RecommendationOut(BaseModel):
    id: str
    project_id: str
    page_id: str | None
    prompt_cluster_id: str | None
    category: str
    priority: str
    title: str
    description: str
    rationale: str
    estimated_impact: float | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CitationOut(BaseModel):
    id: str
    engine_run_id: str
    cited_domain: str | None
    cited_url: str | None
    citation_order: int | None
    mention_type: str | None
    snippet: str | None
    title: str | None
    confidence: float | None
    is_brand: bool
    is_competitor: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MentionOut(BaseModel):
    id: str
    engine_run_id: str
    entity_name: str
    entity_type: str | None
    sentiment: str | None
    position_score: float | None
    context_snippet: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CrawlStartIn(BaseModel):
    project_id: str
    domain: str


class CrawlStatusOut(BaseModel):
    project_id: str
    status: str
    progress: float
    run_id: str | None = None


class ReportGenerateOut(BaseModel):
    report_export_id: str
    storage_path: str


class ProviderStatusOut(BaseModel):
    configured: bool


class ListResponse(BaseModel):
    items: list


class PromptClusterGenerateIn(BaseModel):
    project_id: str
    brand_name: str
    primary_domain: str
    competitors: list[str] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    target_tier: str = "core"


class PromptClusterOut(BaseModel):
    name: str
    intent_type: str
    topic: str
    prompts: list[str]
    priority_score: float


class PromptOut(BaseModel):
    id: str
    prompt_text: str
    topic: str | None = None
    subtopic: str | None = None
    intent: str | None = None
    funnel_stage: str | None = None
    audience: str | None = None
    use_case: str | None = None
    pain_point: str | None = None
    feature: str | None = None
    competitor: str | None = None
    source_layer: str | None = None
    source_reason: str | None = None
    quality_score: float | None = None
    priority_tier: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PromptGenerationRunOut(BaseModel):
    id: str
    project_id: str
    target_tier: str
    status: str
    seeds_generated: int | None = None
    prompts_expanded: int | None = None
    prompts_after_dedupe: int | None = None
    prompts_after_quality: int | None = None
    tier1_count: int | None = None
    tier2_count: int | None = None
    tier3_count: int | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class PromptUniverseStatsOut(BaseModel):
    total_prompts: int
    core_count: int
    expanded_count: int
    deep_count: int
    intent_distribution: dict[str, int] = Field(default_factory=dict)
    topic_distribution: dict[str, int] = Field(default_factory=dict)
    audience_distribution: dict[str, int] = Field(default_factory=dict)
    competitor_distribution: dict[str, int] = Field(default_factory=dict)
    avg_quality_score: float | None = None


class SiteProfileOut(BaseModel):
    id: str
    project_id: str
    brand_name: str
    domain: str
    industries: list[str] = Field(default_factory=list)
    products: list[str] = Field(default_factory=list)
    services: list[str] = Field(default_factory=list)
    features: list[str] = Field(default_factory=list)
    pain_points: list[str] = Field(default_factory=list)
    customer_types: list[str] = Field(default_factory=list)
    use_cases: list[str] = Field(default_factory=list)
    locations: list[str] = Field(default_factory=list)
    competitors: list[str] = Field(default_factory=list)
    core_topics: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PageGeoScoreIn(BaseModel):
    technical_score: float
    extractability_score: float
    entity_score: float
    trust_score: float
    content_score: float
    citation_readiness_score: float


class ClusterGeoScoreIn(BaseModel):
    brand_mention_rate: float
    citation_rate: float
    citation_prominence: float
    competitor_gap_inverse: float
    landing_page_match: float
    answer_sentiment: float


class ProjectGeoScoreIn(BaseModel):
    avg_page_geo: float
    avg_cluster_visibility: float
    authority_signal: float
    competitor_outperformance: float
    freshness: float
