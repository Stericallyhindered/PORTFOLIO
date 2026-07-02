from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

from app.db.session import SessionLocal
from app.models.models import (
    Citation,
    Competitor,
    Domain,
    Entity,
    EngineRun,
    GeoScore,
    Mention,
    Page,
    PageEntity,
    PageFeature,
    PageSnapshot,
    PipelineLog,
    PipelineRun,
    Prompt,
    PromptCluster,
    PromptGenerationRun,
    Project,
    Recommendation,
    ReportExport,
    SiteProfile,
)
from app.schemas.geo import PromptClusterGenerateIn
from app.services.provider_adapters import ProviderIntegrationError, resolve_engine_adapter
from app.services.crawler import (
    CrawledDocument,
    compute_feature_scores,
    discover_urls,
    extract_entities,
    fetch_and_extract,
)
from app.services.prompt_engine import generate_benchmark_prompt_clusters
from app.services.prompt_graph import (
    generate_prompt_universe,
    generate_prompts_with_claude,
    generate_page_recommendations_with_claude,
    PromptGenerationResult,
    ExpandedPrompt,
    PromptTier,
)
from worker.celery_app import celery

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)
SUPPORTED_ENGINES = ["chatgpt", "google-ai-overviews", "perplexity", "gemini", "claude"]

TIER_CONFIGS = {
    "core": {"min_prompts": 500, "target_prompts": 800, "max_prompts": 1000, "chunk_size": 50},
    "expanded": {"min_prompts": 2000, "target_prompts": 2500, "max_prompts": 3000, "chunk_size": 100},
    "deep": {"min_prompts": 8000, "target_prompts": 10000, "max_prompts": 15000, "chunk_size": 200},
}


def _log_pipeline_event(
    db: "Session",
    run_id: str,
    stage: str,
    message: str,
    level: str = "info",
    progress: float = 0.0,
    details: dict | None = None,
) -> None:
    """Log a pipeline event to the database for real-time monitoring."""
    try:
        log = PipelineLog(
            pipeline_run_id=run_id,
            stage=stage,
            message=message,
            level=level,
            progress=progress,
            details_json=details,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to log pipeline event: {e}")


@celery.task(name="worker.tasks.run_crawl_pipeline")
def run_crawl_pipeline(project_id: str, domain: str, org_id: str):
    db = SessionLocal()
    try:
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.organization_id == org_id)
            .first()
        )
        if not project:
            return {"project_id": project_id, "status": "failed", "error": "project_not_found"}
        run = (
            db.query(PipelineRun)
            .filter(
                PipelineRun.project_id == project_id,
                PipelineRun.organization_id == org_id,
                PipelineRun.domain == domain,
                PipelineRun.status.in_(["queued", "running"]),
            )
            .order_by(PipelineRun.started_at.desc())
            .first()
        )
        if run:
            run.status = "running"
            run.progress = 0.2
        domain_row = (
            db.query(Domain)
            .filter(Domain.project_id == project_id, Domain.domain == domain)
            .first()
        )
        if not domain_row:
            domain_row = Domain(project_id=project_id, domain=domain, is_primary=True)
            db.add(domain_row)
            db.flush()
        competitors = [
            row.name
            for row in db.query(Competitor).filter(Competitor.project_id == project_id).all()
        ]
        urls = asyncio.run(discover_urls(domain))
        for url in urls:
            document = asyncio.run(fetch_and_extract(url))
            if document is None:
                continue
            page = (
                db.query(Page)
                .filter(Page.domain_id == domain_row.id, Page.url == document.url)
                .first()
            )
            if page is None:
                page = Page(domain_id=domain_row.id, url=document.url)
                db.add(page)
                db.flush()
            page.canonical_url = document.canonical_url
            page.status_code = document.status_code
            page.title = document.title
            page.h1 = document.h1
            page.meta_description = document.meta_description
            page.word_count = len(document.text.split())
            page.is_indexable = document.status_code == 200
            page.is_crawlable = True
            page.is_rendered = False
            page.has_structured_data = len(document.schema_types) > 0
            page.content_hash = document.content_hash
            page.last_seen_at = datetime.utcnow()
            if page.first_seen_at is None:
                page.first_seen_at = datetime.utcnow()
            
            # Store full content for Claude analysis
            page.headings_json = document.headings
            page.full_text = document.text  # Full text, not truncated
            page.links_json = document.links
            page.schema_json = document.schema_types

            feature_scores = compute_feature_scores(
                text=document.text,
                headings=document.headings,
                tables=document.tables,
                lists=document.lists,
                meta_description=document.meta_description,
                brand_name=project.brand_name,
                competitors=competitors,
            )
            feature = db.query(PageFeature).filter(PageFeature.page_id == page.id).first()
            if feature is None:
                feature = PageFeature(page_id=page.id)
                db.add(feature)
            feature.schema_types = document.schema_types
            feature.internal_link_count = len([l for l in document.links if l.startswith("/") or domain in l])
            feature.external_link_count = len([l for l in document.links if l.startswith("http") and domain not in l])
            feature.faq_count = document.faq_count
            feature.table_count = document.tables
            feature.list_count = document.lists
            feature.image_count = document.images
            feature.readability_score = feature_scores["readability_score"]
            feature.factual_density_score = feature_scores["factual_density_score"]
            feature.extractability_score = feature_scores["extractability_score"]
            feature.quoteability_score = feature_scores["quoteability_score"]
            feature.information_gain_score = feature_scores["information_gain_score"]
            feature.entity_salience_score = feature_scores["entity_salience_score"]
            feature.trust_signal_score = feature_scores["trust_signal_score"]
            feature.heading_depth_score = feature_scores["heading_depth_score"]
            feature.updated_at = datetime.utcnow()

            snapshot = PageSnapshot(
                page_id=page.id,
                text_path=document.text[:4000],
                captured_at=datetime.utcnow(),
            )
            db.add(snapshot)

            entities = extract_entities(
                document.text,
                document.headings,
                project.brand_name,
                competitors,
            )
            for entity_name, entity_type in entities[:40]:
                entity = (
                    db.query(Entity)
                    .filter(
                        Entity.project_id == project_id,
                        Entity.normalized_name == entity_name,
                        Entity.entity_type == entity_type,
                    )
                    .first()
                )
                if entity is None:
                    entity = Entity(
                        project_id=project_id,
                        normalized_name=entity_name,
                        entity_type=entity_type,
                        aliases=[],
                        external_refs={},
                    )
                    db.add(entity)
                    db.flush()
                page_entity = (
                    db.query(PageEntity)
                    .filter(PageEntity.page_id == page.id, PageEntity.entity_id == entity.id)
                    .first()
                )
                if page_entity is None:
                    page_entity = PageEntity(
                        page_id=page.id,
                        entity_id=entity.id,
                        prominence_score=0.5,
                        occurrences=1,
                        contexts=[],
                    )
                    db.add(page_entity)
                else:
                    page_entity.occurrences = int(page_entity.occurrences or 0) + 1

        domain_row.last_crawled_at = datetime.utcnow()
        project.updated_at = datetime.utcnow()
        if run:
            run.status = "completed"
            run.progress = 1.0
            run.completed_at = datetime.utcnow()
        db.commit()
        return {"project_id": project_id, "status": "completed", "domain": domain}
    except Exception as exc:  # noqa: BLE001
        logger.exception("crawl pipeline failed")
        return {"project_id": project_id, "status": "failed", "error": str(exc)}
    finally:
        db.close()


@celery.task(name="worker.tasks.run_prompt_batch")
def run_prompt_batch(project_id: str, org_id: str, prompt_id: str, domain: str, run_id: str):
    db = SessionLocal()
    try:
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.organization_id == org_id)
            .first()
        )
        if project is None:
            return {"project_id": project_id, "status": "failed", "error": "project_not_found"}
        prompt = db.query(Prompt).filter(Prompt.id == prompt_id).first()
        if prompt is None:
            return {"project_id": project_id, "status": "failed", "error": "prompt_not_found"}

        competitors = [
            row.name
            for row in db.query(Competitor).filter(Competitor.project_id == project_id).all()
        ]
        site_profile = db.query(SiteProfile).filter(SiteProfile.project_id == project_id).first()
        canonical_brand, _discovered_brand, brand_aliases = _resolve_brand_identity(
            project_brand_name=project.brand_name,
            primary_domain=project.primary_domain or domain,
            discovered_brand_name=site_profile.brand_name if site_profile else None,
        )
        context = {
            "brand_name": canonical_brand,
            "primary_domain": project.primary_domain or domain,
            "brand_aliases": brand_aliases,
            "competitors": competitors,
            "services": [],
            "locations": [],
            "core_topics": [],
            "claims": [],
        }
        if site_profile:
            if site_profile.services_json:
                context["services"] = [s for s in site_profile.services_json if isinstance(s, str) and s.strip()][:10]
            if site_profile.locations_json:
                context["locations"] = [l for l in site_profile.locations_json if isinstance(l, str) and l.strip()][:10]
            if site_profile.core_topics_json:
                context["core_topics"] = [t for t in site_profile.core_topics_json if isinstance(t, str) and t.strip()][:10]
            if site_profile.claims_json:
                context["claims"] = [c for c in site_profile.claims_json if isinstance(c, str) and c.strip()][:10]

        completed_run_ids: list[str] = []
        failed_engines: list[dict[str, str | int | None]] = []

        for engine_name in SUPPORTED_ENGINES:
            started_at = datetime.utcnow()
            engine_row = EngineRun(
                project_id=project_id,
                engine_name=engine_name,
                engine_variant="default",
                prompt_id=prompt.id,
                run_status="running",
                started_at=started_at,
                request_payload={"domain": domain, "project_id": project_id, "run_id": run_id},
            )
            db.add(engine_row)
            db.flush()

            adapter = resolve_engine_adapter(engine_name)
            result = None
            failure_message = None
            failure_code = None
            attempt_errors: list[dict[str, str | int | None]] = []
            for attempt in range(3):
                try:
                    result = asyncio.run(
                        adapter.run_prompt(prompt=str(prompt.prompt_text), context=context)
                    )
                    break
                except ProviderIntegrationError as exc:
                    failure_code = exc.code
                    failure_message = exc.message
                    attempt_errors.append(
                        {
                            "attempt": attempt + 1,
                            "code": exc.code,
                            "message": exc.message,
                            "statusCode": exc.status_code,
                            "provider": exc.provider,
                            "model": exc.model,
                        }
                    )
                    if attempt < 2:
                        continue
                except Exception as exc:  # noqa: BLE001
                    failure_message = str(exc)
                    attempt_errors.append(
                        {"attempt": attempt + 1, "code": "unknown_error", "message": str(exc)}
                    )
                    if attempt < 2:
                        continue

            if result is None:
                engine_row.run_status = "failed"
                engine_row.error_message = failure_message or "engine_run_failed"
                engine_row.completed_at = datetime.utcnow()
                engine_row.response_json = {
                    "status": "failed",
                    "errorCode": failure_code or "provider_request_failed",
                    "attemptErrors": attempt_errors,
                    "run_id": run_id,
                }
                failed_engines.append(
                    {
                        "engine": engine_name,
                        "error": engine_row.error_message,
                        "errorCode": failure_code or "provider_request_failed",
                    }
                )
                db.commit()
                continue

            engine_row.run_status = "completed"
            engine_row.response_text = result.raw_text
            engine_row.response_json = {
                "citations": result.citations,
                "mentions": result.mentions,
                "metadata": result.metadata,
                "run_id": run_id,
            }
            engine_row.completed_at = datetime.utcnow()
            for idx, citation in enumerate(result.citations):
                mention_type = str(citation.get("mention_type", "neutral"))
                db.add(
                    Citation(
                        engine_run_id=engine_row.id,
                        cited_domain=citation.get("cited_domain"),
                        cited_url=citation.get("cited_url"),
                        citation_order=int(citation.get("citation_order", idx + 1)),
                        mention_type=mention_type,
                        snippet=citation.get("snippet"),
                        title=citation.get("title"),
                        confidence=float(citation.get("confidence", 0.75)),
                        is_brand=mention_type == "brand",
                        is_competitor=mention_type == "competitor",
                    )
                )
            for mention in result.mentions:
                db.add(
                    Mention(
                        engine_run_id=engine_row.id,
                        entity_name=mention.get("entity_name", "unknown"),
                        entity_type=mention.get("entity_type"),
                        sentiment=mention.get("sentiment"),
                        position_score=float(mention.get("position_score", 0.5)),
                        context_snippet=mention.get("context_snippet"),
                    )
                )
            completed_run_ids.append(engine_row.id)
            db.commit()

        status = "completed" if len(completed_run_ids) == len(SUPPORTED_ENGINES) else "failed"
        return {
            "project_id": project_id,
            "status": status,
            "prompt_id": prompt.id,
            "completed_run_ids": completed_run_ids,
            "failed_engines": failed_engines,
            "required_engines": SUPPORTED_ENGINES,
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("prompt batch failed")
        return {"project_id": project_id, "status": "failed", "error": str(exc)}
    finally:
        db.close()


def _clamp_score(value: float | None, fallback: float) -> float:
    val = fallback if value is None else value
    return max(0.0, min(100.0, float(val)))


def _normalize_prompt_text(text: str) -> str:
    """Normalize prompt text for deduplication."""
    return " ".join(text.lower().strip().split())


def _hash_prompt_text(text: str) -> str:
    """Generate hash for normalized prompt text."""
    normalized = _normalize_prompt_text(text)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:64]


def _normalize_domain(domain: str) -> str:
    value = domain.strip().lower()
    value = re.sub(r"^https?://", "", value)
    value = value.split("/")[0].strip(".")
    value = re.sub(r"^www\.", "", value)
    return value


def _domain_label(domain: str) -> str:
    host = _normalize_domain(domain)
    return host.split(".")[0] if host else ""


def _is_noisy_discovered_brand(candidate: str, canonical_brand: str, domain: str) -> bool:
    normalized = " ".join(candidate.lower().split())
    if not normalized:
        return True
    if normalized == " ".join(canonical_brand.lower().split()):
        return False
    if len(normalized) < 3 or len(normalized) > 50:
        return True
    noisy_terms = {"reviews", "review", "best", "top", "near me", "guide", "trip", "trips", "video", "videos"}
    if any(term in normalized for term in noisy_terms):
        return True
    domain_token = _domain_label(domain)
    if domain_token and domain_token in normalized and len(normalized.split()) >= 3:
        return True
    return False


def _resolve_brand_identity(
    project_brand_name: str,
    primary_domain: str,
    discovered_brand_name: str | None = None,
) -> tuple[str, str | None, list[str]]:
    canonical = project_brand_name.strip()
    discovered = (discovered_brand_name or "").strip()
    if _is_noisy_discovered_brand(discovered, canonical, primary_domain):
        discovered = ""

    aliases = [canonical]
    normalized_domain = _normalize_domain(primary_domain)
    domain_token = _domain_label(primary_domain)
    if normalized_domain:
        aliases.append(normalized_domain)
    if domain_token:
        aliases.append(domain_token)
    if discovered and discovered.lower() != canonical.lower():
        aliases.append(discovered)

    deduped_aliases: list[str] = []
    seen: set[str] = set()
    for alias in aliases:
        key = " ".join(alias.lower().split())
        if key and key not in seen:
            seen.add(key)
            deduped_aliases.append(alias)
    return canonical, (discovered or None), deduped_aliases


def _persist_site_profile(
    db: "Session",
    project_id: str,
    result: PromptGenerationResult,
) -> SiteProfile:
    """Persist site profile from generation result."""
    existing = db.query(SiteProfile).filter(SiteProfile.project_id == project_id).first()
    
    if existing:
        existing.brand_name = result.site_context.brand_name
        existing.domain = result.site_context.domain
        existing.industries_json = result.site_context.industries
        existing.products_json = result.site_context.products
        existing.services_json = result.site_context.services
        existing.features_json = result.site_context.features
        existing.pain_points_json = result.site_context.pain_points
        existing.customer_types_json = result.site_context.customer_types
        existing.use_cases_json = result.site_context.use_cases
        existing.locations_json = result.site_context.locations
        existing.competitors_json = result.site_context.competitors
        existing.core_topics_json = result.site_context.core_topics
        existing.supporting_topics_json = result.site_context.supporting_topics
        existing.keywords_json = result.site_context.keywords
        existing.faq_questions_json = result.site_context.faq_questions
        existing.claims_json = result.site_context.claims
        existing.updated_at = datetime.utcnow()
        return existing
    
    profile = SiteProfile(
        project_id=project_id,
        brand_name=result.site_context.brand_name,
        domain=result.site_context.domain,
        industries_json=result.site_context.industries,
        products_json=result.site_context.products,
        services_json=result.site_context.services,
        features_json=result.site_context.features,
        pain_points_json=result.site_context.pain_points,
        customer_types_json=result.site_context.customer_types,
        use_cases_json=result.site_context.use_cases,
        locations_json=result.site_context.locations,
        competitors_json=result.site_context.competitors,
        core_topics_json=result.site_context.core_topics,
        supporting_topics_json=result.site_context.supporting_topics,
        keywords_json=result.site_context.keywords,
        faq_questions_json=result.site_context.faq_questions,
        claims_json=result.site_context.claims,
    )
    db.add(profile)
    return profile


def _persist_generation_run(
    db: "Session",
    project_id: str,
    result: PromptGenerationResult,
) -> PromptGenerationRun:
    """Persist prompt generation run metadata."""
    gen_run = PromptGenerationRun(
        id=result.metadata.generation_id,
        project_id=project_id,
        target_tier=result.metadata.target_tier,
        status="completed",
        site_context_json=result.site_context.to_dict() if result.site_context else None,
        topic_graph_json=result.topic_graph.to_dict() if result.topic_graph else None,
        seeds_generated=result.metadata.seeds_generated,
        prompts_expanded=result.metadata.prompts_expanded,
        prompts_after_dedupe=result.metadata.prompts_after_dedupe,
        prompts_after_quality=result.metadata.prompts_after_quality,
        tier1_count=result.metadata.tier1_count,
        tier2_count=result.metadata.tier2_count,
        tier3_count=result.metadata.tier3_count,
        dedupe_stats_json=result.metadata.dedupe_stats,
        quality_stats_json=result.metadata.quality_stats,
        tier_stats_json=result.metadata.tier_stats,
        started_at=result.metadata.started_at,
        completed_at=result.metadata.completed_at,
    )
    db.add(gen_run)
    return gen_run


def _persist_prompts_to_cluster(
    db: "Session",
    cluster_id: str,
    prompts: list[ExpandedPrompt],
    generation_run_id: str,
) -> list[Prompt]:
    """Persist expanded prompts to database with full metadata."""
    persisted: list[Prompt] = []
    
    existing_hashes = {
        row.normalized_text_hash
        for row in db.query(Prompt.normalized_text_hash)
        .filter(Prompt.prompt_cluster_id == cluster_id)
        .all()
        if row.normalized_text_hash
    }
    
    for expanded in prompts:
        text_hash = _hash_prompt_text(expanded.text)
        if text_hash in existing_hashes:
            continue
        
        prompt = Prompt(
            id=expanded.id,
            prompt_cluster_id=cluster_id,
            prompt_text=expanded.text,
            prompt_variant_type=expanded.intent or "general",
            locale="en-US",
            business_value_score=expanded.quality_score or 0.5,
            difficulty_score=0.5,
            topic=expanded.topic,
            subtopic=expanded.subtopic,
            intent=expanded.intent,
            funnel_stage=expanded.funnel_stage,
            audience=expanded.audience,
            use_case=expanded.use_case,
            pain_point=expanded.pain_point,
            feature=expanded.feature,
            competitor=expanded.competitor,
            source_layer=expanded.source_layer,
            source_reason=expanded.source_reason,
            parent_prompt_id=expanded.parent_seed_id,
            generation_run_id=generation_run_id,
            semantic_cluster_id=expanded.semantic_cluster_id,
            normalized_text_hash=text_hash,
            quality_score=expanded.quality_score,
            priority_tier=expanded.priority_tier,
        )
        db.add(prompt)
        persisted.append(prompt)
        existing_hashes.add(text_hash)
    
    return persisted


@celery.task(name="worker.tasks.run_prompt_generation")
def run_prompt_generation(
    project_id: str,
    org_id: str,
    domain: str,
    target_tier: str = "core",
) -> dict:
    """
    Generate prompts for a project using the layered prompt graph engine.
    
    This task:
    1. Gathers crawled documents from the database
    2. Runs the 8-layer prompt generation pipeline
    3. Persists site profile, generation run, and prompts
    """
    db = SessionLocal()
    try:
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.organization_id == org_id)
            .first()
        )
        if not project:
            return {"project_id": project_id, "status": "failed", "error": "project_not_found"}
        
        domain_row = (
            db.query(Domain)
            .filter(Domain.project_id == project_id, Domain.domain == domain)
            .first()
        )
        if not domain_row:
            return {"project_id": project_id, "status": "failed", "error": "domain_not_found"}
        
        pages = db.query(Page).filter(Page.domain_id == domain_row.id).all()
        if not pages:
            return {"project_id": project_id, "status": "failed", "error": "no_pages_crawled"}
        
        documents: list[CrawledDocument] = []
        for page in pages:
            snapshot = (
                db.query(PageSnapshot)
                .filter(PageSnapshot.page_id == page.id)
                .order_by(PageSnapshot.captured_at.desc())
                .first()
            )
            feature = db.query(PageFeature).filter(PageFeature.page_id == page.id).first()
            
            # Load full content from page columns (populated during crawl)
            # Fall back to snapshot.text_path for backward compatibility
            full_text = page.full_text or (snapshot.text_path if snapshot else "") or ""
            headings = page.headings_json or []
            links = page.links_json or []
            schema_types = page.schema_json or (feature.schema_types if feature else []) or []
            
            doc = CrawledDocument(
                url=page.url,
                canonical_url=page.canonical_url,
                status_code=page.status_code or 200,
                title=page.title,
                h1=page.h1,
                meta_description=page.meta_description,
                headings=headings,
                text=full_text,
                links=links,
                images=feature.image_count if feature else 0,
                tables=feature.table_count if feature else 0,
                lists=feature.list_count if feature else 0,
                faq_count=feature.faq_count if feature else 0,
                schema_types=schema_types,
                content_hash=page.content_hash or "",
            )
            documents.append(doc)
        
        competitors = [
            row.name
            for row in db.query(Competitor).filter(Competitor.project_id == project_id).all()
        ]
        
        logger.info(f"Starting prompt generation for {domain} (tier: {target_tier})")
        result = generate_prompt_universe(
            brand_name=project.brand_name,
            domain=domain,
            documents=documents,
            known_competitors=competitors,
            target_tier=target_tier,
        )
        if result.site_context:
            canonical_brand, discovered_brand, aliases = _resolve_brand_identity(
                project_brand_name=project.brand_name,
                primary_domain=project.primary_domain or domain,
                discovered_brand_name=result.site_context.discovered_brand_name or result.site_context.brand_name,
            )
            result.site_context.brand_name = canonical_brand
            result.site_context.canonical_brand_name = canonical_brand
            result.site_context.discovered_brand_name = discovered_brand
            result.site_context.brand_aliases = aliases
            if discovered_brand:
                result.site_context.entities = sorted(
                    {
                        *(result.site_context.entities or []),
                        discovered_brand,
                    }
                )
            logger.info(
                "brand identity resolved for prompt generation: canonical=%s discovered=%s aliases=%s",
                canonical_brand,
                discovered_brand,
                aliases,
            )
        
        _persist_site_profile(db, project_id, result)
        gen_run = _persist_generation_run(db, project_id, result)
        
        cluster = (
            db.query(PromptCluster)
            .filter(
                PromptCluster.project_id == project_id,
                PromptCluster.name == f"Generated - {target_tier}",
            )
            .first()
        )
        if not cluster:
            cluster = PromptCluster(
                project_id=project_id,
                name=f"Generated - {target_tier}",
                intent_type="generated",
                topic=f"{domain} site-derived prompts",
                priority_score=90.0,
            )
            db.add(cluster)
            db.flush()
        
        prompts_to_persist = result.get_prompts_for_tier(target_tier)
        persisted = _persist_prompts_to_cluster(
            db, cluster.id, prompts_to_persist, gen_run.id
        )
        
        db.commit()
        
        logger.info(f"Prompt generation complete: {len(persisted)} prompts persisted")
        
        return {
            "project_id": project_id,
            "status": "completed",
            "generation_run_id": gen_run.id,
            "target_tier": target_tier,
            "prompts_generated": len(prompts_to_persist),
            "prompts_persisted": len(persisted),
            "tier_stats": result.metadata.tier_stats,
        }
    except Exception as exc:
        logger.exception("prompt generation failed")
        return {"project_id": project_id, "status": "failed", "error": str(exc)}
    finally:
        db.close()


@celery.task(name="worker.tasks.run_tiered_prompt_batch")
def run_tiered_prompt_batch(
    project_id: str,
    org_id: str,
    prompt_ids: list[str],
    domain: str,
    run_id: str,
    chunk_index: int = 0,
    selected_engines: list[str] | None = None,
) -> dict:
    """
    Execute a chunk of prompts against selected engines.
    
    This is the tiered execution variant that processes prompts in chunks
    to support large-scale prompt universes.
    
    Args:
        selected_engines: Optional list of engine names to use (defaults to all)
    """
    engines_to_use = selected_engines if selected_engines else SUPPORTED_ENGINES
    engines_to_use = [e for e in engines_to_use if e in SUPPORTED_ENGINES]
    if not engines_to_use:
        engines_to_use = SUPPORTED_ENGINES
    
    db = SessionLocal()
    try:
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.organization_id == org_id)
            .first()
        )
        if not project:
            return {"project_id": project_id, "status": "failed", "error": "project_not_found"}
        
        prompts = db.query(Prompt).filter(Prompt.id.in_(prompt_ids)).all()
        if not prompts:
            return {"project_id": project_id, "status": "failed", "error": "no_prompts_found"}
        
        competitors = [
            row.name
            for row in db.query(Competitor).filter(Competitor.project_id == project_id).all()
        ]
        
        # Get site profile for richer context (brand name, services, locations from Claude analysis)
        site_profile = db.query(SiteProfile).filter(SiteProfile.project_id == project_id).first()
        
        # Build comprehensive context for mention extraction
        canonical_brand, discovered_brand, brand_aliases = _resolve_brand_identity(
            project_brand_name=project.brand_name,
            primary_domain=project.primary_domain or domain,
            discovered_brand_name=site_profile.brand_name if site_profile else None,
        )
        context = {
            "brand_name": canonical_brand,
            "primary_domain": project.primary_domain or domain,
            "brand_aliases": brand_aliases,
            "competitors": competitors,
            "services": [],
            "locations": [],
            "core_topics": [],
            "claims": [],
        }
        
        # Enrich context with SiteProfile data if available
        if site_profile:
            # Add services/products to look for in responses
            services = []
            if site_profile.services_json:
                services.extend([s.get("name", "") for s in site_profile.services_json if isinstance(s, dict)])
            if site_profile.products_json:
                services.extend([p.get("name", "") for p in site_profile.products_json if isinstance(p, dict)])
            context["services"] = [s for s in services if s and len(s) > 3]
            
            # Add locations
            if site_profile.locations_json:
                context["locations"] = [loc for loc in site_profile.locations_json if loc and len(loc) > 2]
            
            # Add industry for context
            if site_profile.primary_industry:
                context["industry"] = site_profile.primary_industry
            if site_profile.core_topics_json:
                context["core_topics"] = [t for t in site_profile.core_topics_json if isinstance(t, str) and t.strip()][:10]
            if site_profile.claims_json:
                context["claims"] = [c for c in site_profile.claims_json if isinstance(c, str) and c.strip()][:10]

        logger.info(
            "tiered context brand identity: canonical=%s discovered=%s aliases=%s",
            canonical_brand,
            discovered_brand,
            context["brand_aliases"],
        )
        
        total_completed = 0
        total_failed = 0
        chunk_results: list[dict] = []
        
        logger.info(f"Running chunk {chunk_index} with {len(prompts)} prompts on engines: {engines_to_use}")
        
        for prompt in prompts:
            prompt_completed = 0
            prompt_failed = 0
            
            for engine_name in engines_to_use:
                started_at = datetime.utcnow()
                engine_row = EngineRun(
                    project_id=project_id,
                    engine_name=engine_name,
                    engine_variant="default",
                    prompt_id=prompt.id,
                    run_status="running",
                    started_at=started_at,
                    request_payload={
                        "domain": domain,
                        "project_id": project_id,
                        "run_id": run_id,
                        "chunk_index": chunk_index,
                        "prompt_tier": prompt.priority_tier,
                        "prompt_intent": prompt.intent,
                    },
                )
                db.add(engine_row)
                db.flush()
                
                adapter = resolve_engine_adapter(engine_name)
                result = None
                failure_message = None
                failure_code = None
                
                for attempt in range(3):
                    try:
                        result = asyncio.run(
                            adapter.run_prompt(prompt=str(prompt.prompt_text), context=context)
                        )
                        break
                    except ProviderIntegrationError as exc:
                        failure_code = exc.code
                        failure_message = exc.message
                        if attempt < 2:
                            continue
                    except Exception as exc:
                        failure_message = str(exc)
                        if attempt < 2:
                            continue
                
                if result is None:
                    engine_row.run_status = "failed"
                    engine_row.error_message = failure_message or "engine_run_failed"
                    engine_row.completed_at = datetime.utcnow()
                    engine_row.response_json = {
                        "status": "failed",
                        "errorCode": failure_code or "provider_request_failed",
                        "run_id": run_id,
                    }
                    prompt_failed += 1
                else:
                    engine_row.run_status = "completed"
                    engine_row.response_text = result.raw_text
                    engine_row.response_json = {
                        "citations": result.citations,
                        "mentions": result.mentions,
                        "metadata": result.metadata,
                        "run_id": run_id,
                    }
                    engine_row.completed_at = datetime.utcnow()
                    
                    for idx, citation in enumerate(result.citations):
                        mention_type = str(citation.get("mention_type", "neutral"))
                        db.add(
                            Citation(
                                engine_run_id=engine_row.id,
                                cited_domain=citation.get("cited_domain"),
                                cited_url=citation.get("cited_url"),
                                citation_order=int(citation.get("citation_order", idx + 1)),
                                mention_type=mention_type,
                                snippet=citation.get("snippet"),
                                title=citation.get("title"),
                                confidence=float(citation.get("confidence", 0.75)),
                                is_brand=mention_type == "brand",
                                is_competitor=mention_type == "competitor",
                            )
                        )
                    
                    for mention in result.mentions:
                        db.add(
                            Mention(
                                engine_run_id=engine_row.id,
                                entity_name=mention.get("entity_name", "unknown"),
                                entity_type=mention.get("entity_type"),
                                sentiment=mention.get("sentiment"),
                                position_score=float(mention.get("position_score", 0.5)),
                                context_snippet=mention.get("context_snippet"),
                            )
                        )
                    prompt_completed += 1
                
                db.commit()
            
            total_completed += prompt_completed
            total_failed += prompt_failed
            chunk_results.append({
                "prompt_id": prompt.id,
                "completed": prompt_completed,
                "failed": prompt_failed,
            })
        
        return {
            "project_id": project_id,
            "status": "completed" if total_failed == 0 else "partial",
            "chunk_index": chunk_index,
            "prompts_processed": len(prompts),
            "engine_runs_completed": total_completed,
            "engine_runs_failed": total_failed,
            "chunk_results": chunk_results,
        }
    except Exception as exc:
        logger.exception("tiered prompt batch failed")
        return {"project_id": project_id, "status": "failed", "error": str(exc)}
    finally:
        db.close()


@celery.task(name="worker.tasks.run_full_geo_pipeline")
def run_full_geo_pipeline(
    project_id: str,
    domain: str,
    org_id: str,
    run_id: str,
    target_tier: str = "core",
    max_prompts: int | None = None,
    selected_engines: list[str] | None = None,
):
    """
    Run the full GEO pipeline with tiered prompt generation and execution.
    
    Stages:
    1. Crawl website
    2. Generate site-derived prompts (layered pipeline)
    3. Execute prompts against all engines (chunked by tier)
    4. Compute and persist GEO scores
    5. Generate recommendations
    
    Args:
        project_id: Project UUID
        domain: Website domain to audit
        org_id: Organization UUID
        run_id: Pipeline run UUID
        target_tier: Tier level (core, expanded, deep)
        max_prompts: Optional max number of prompts to generate/execute
        selected_engines: Optional list of engine names to use (defaults to all)
    """
    engines_to_use = selected_engines if selected_engines else SUPPORTED_ENGINES
    engines_to_use = [e for e in engines_to_use if e in SUPPORTED_ENGINES]
    if not engines_to_use:
        engines_to_use = SUPPORTED_ENGINES
    
    db = SessionLocal()
    try:
        run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
        if run:
            run.status = "running"
            run.progress = 0.05
            run.target_tier = target_tier
            db.commit()
        
        _log_pipeline_event(
            db, run_id, "init", 
            f"Pipeline started for {domain} (tier: {target_tier}, max_prompts: {max_prompts}, engines: {', '.join(engines_to_use)})",
            "info", 0.05, {"domain": domain, "tier": target_tier, "max_prompts": max_prompts, "engines": engines_to_use}
        )
        
        _log_pipeline_event(db, run_id, "crawl", f"Starting crawl of {domain}...", "info", 0.08)
        crawl_result = run_crawl_pipeline(project_id, domain, org_id)
        if crawl_result.get("status") != "completed":
            _log_pipeline_event(
                db, run_id, "crawl", 
                f"Crawl failed: {crawl_result.get('error', 'unknown error')}",
                "error", 0.1, crawl_result
            )
            if run:
                run.status = "failed"
                run.failure_summary = "Crawl stage failed"
                run.completed_at = datetime.utcnow()
                db.commit()
            return {"project_id": project_id, "status": "failed", "stage": "crawl"}
        
        if run:
            run.progress = 0.2
            db.commit()
        
        _log_pipeline_event(db, run_id, "crawl", "Crawl completed successfully", "success", 0.2)
        
        project = (
            db.query(Project)
            .filter(Project.id == project_id, Project.organization_id == org_id)
            .first()
        )
        if project is None:
            _log_pipeline_event(db, run_id, "validation", "Project not found", "error", 0.2)
            if run:
                run.status = "failed"
                run.failure_summary = "Project not found"
                run.completed_at = datetime.utcnow()
                db.commit()
            return {"project_id": project_id, "status": "failed", "stage": "project_lookup"}

        domain_row = (
            db.query(Domain)
            .filter(Domain.project_id == project_id, Domain.domain == domain)
            .first()
        )
        if domain_row is None:
            if run:
                run.status = "failed"
                run.failure_summary = "Domain not found"
                run.completed_at = datetime.utcnow()
                db.commit()
            return {"project_id": project_id, "status": "failed", "stage": "domain_lookup"}

        pages = db.query(Page).filter(Page.domain_id == domain_row.id).all()
        if not pages:
            _log_pipeline_event(db, run_id, "validation", "No pages crawled", "error", 0.2)
            if run:
                run.status = "failed"
                run.failure_summary = "No pages crawled"
                run.completed_at = datetime.utcnow()
                db.commit()
            return {"project_id": project_id, "status": "failed", "stage": "no_pages_crawled"}

        _log_pipeline_event(
            db, run_id, "crawl", 
            f"Crawled {len(pages)} pages from {domain}",
            "info", 0.22, {"page_count": len(pages)}
        )
        
        # Determine the actual prompt limit
        tier_config = TIER_CONFIGS.get(target_tier, TIER_CONFIGS["core"])
        actual_prompt_limit = max_prompts if max_prompts else tier_config["max_prompts"]
        actual_prompt_limit = min(actual_prompt_limit, 15000)
        
        # For prompt counts under 500, skip heavy generation and use lightweight mode
        # Full generation only makes sense when you need thousands of prompts
        use_lightweight_mode = actual_prompt_limit < 500
        
        if use_lightweight_mode:
            logger.info(f"Using lightweight prompt generation for {actual_prompt_limit} prompts")
            _log_pipeline_event(
                db, run_id, "prompt_generation", 
                f"Using lightweight mode for {actual_prompt_limit} prompts (skipping full 10k generation)",
                "info", 0.25
            )
            # Skip the heavy prompt generation - we'll create prompts directly later
            gen_result = {"status": "completed", "prompts_generated": 0, "prompts_persisted": 0, "lightweight": True}
        else:
            logger.info(f"Starting prompt generation (tier: {target_tier})")
            _log_pipeline_event(
                db, run_id, "claude_analysis", 
                f"Starting Claude AI site analysis (tier: {target_tier})...",
                "info", 0.25
            )
            gen_result = run_prompt_generation(project_id, org_id, domain, target_tier)
            
            if gen_result.get("status") != "completed":
                _log_pipeline_event(
                    db, run_id, "prompt_generation", 
                    f"Prompt generation failed: {gen_result.get('error', 'unknown')}",
                    "error", 0.35, gen_result
                )
                if run:
                    run.status = "failed"
                    run.failure_summary = f"Prompt generation failed: {gen_result.get('error', 'unknown')}"
                    run.completed_at = datetime.utcnow()
                    db.commit()
                return {"project_id": project_id, "status": "failed", "stage": "prompt_generation"}
            
            prompts_generated = gen_result.get("prompts_generated", 0)
            prompts_persisted = gen_result.get("prompts_persisted", 0)
            _log_pipeline_event(
                db, run_id, "prompt_generation", 
                f"Generated {prompts_generated} prompts, persisted {prompts_persisted}",
                "success", 0.4, gen_result
            )
        
        if run:
            run.progress = 0.4
            run.prompt_generation_id = gen_result.get("generation_run_id")
            db.commit()
        
        cluster = (
            db.query(PromptCluster)
            .filter(
                PromptCluster.project_id == project_id,
                PromptCluster.name == f"Generated - {target_tier}",
            )
            .first()
        )
        
        if not cluster:
            cluster = (
                db.query(PromptCluster)
                .filter(PromptCluster.project_id == project_id, PromptCluster.name == "Auto GEO Pipeline")
                .first()
            )
            if cluster is None:
                cluster = PromptCluster(
                    project_id=project_id,
                    name="Auto GEO Pipeline",
                    intent_type="audit",
                    topic=f"{domain} GEO audit cluster",
                    priority_score=95.0,
                )
                db.add(cluster)
                db.flush()

        # Skip benchmark clusters for lightweight mode - they clutter the UI
        # and aren't needed for quick audits. Only generate for full (500+) runs.
        if not use_lightweight_mode:
            benchmark_generated = generate_benchmark_prompt_clusters(
                PromptClusterGenerateIn(
                    project_id=project_id,
                    brand_name=project.brand_name,
                    primary_domain=project.primary_domain or domain,
                    competitors=[],
                    topics=[project.brand_name],
                )
            )
            for benchmark_cluster in benchmark_generated:
                benchmark_row = (
                    db.query(PromptCluster)
                    .filter(
                        PromptCluster.project_id == project_id,
                        PromptCluster.name == benchmark_cluster.name,
                        PromptCluster.topic == benchmark_cluster.topic,
                    )
                    .first()
                )
                if benchmark_row is None:
                    benchmark_row = PromptCluster(
                        project_id=project_id,
                        name=benchmark_cluster.name,
                        intent_type=benchmark_cluster.intent_type,
                        topic=benchmark_cluster.topic,
                        priority_score=benchmark_cluster.priority_score,
                    )
                    db.add(benchmark_row)
                    db.flush()
                existing_prompts = {
                    prompt_row.prompt_text
                    for prompt_row in db.query(Prompt)
                    .filter(Prompt.prompt_cluster_id == benchmark_row.id)
                    .all()
                }
                for prompt_text in benchmark_cluster.prompts:
                    if prompt_text in existing_prompts:
                        continue
                    db.add(
                        Prompt(
                            prompt_cluster_id=benchmark_row.id,
                            prompt_text=prompt_text,
                            prompt_variant_type=benchmark_cluster.intent_type,
                            locale="en-US",
                            business_value_score=benchmark_cluster.priority_score,
                            difficulty_score=0.4,
                        )
                    )
            db.commit()

        chunk_size = tier_config["chunk_size"]
        
        # For lightweight mode, use Claude to generate intelligent site-specific prompts
        if use_lightweight_mode:
            _log_pipeline_event(
                db, run_id, "claude_analysis", 
                f"Using Claude AI to generate {actual_prompt_limit} intelligent prompts for {domain}...",
                "info", 0.25
            )
            
            # Create a cluster for these prompts
            cluster = (
                db.query(PromptCluster)
                .filter(PromptCluster.project_id == project_id, PromptCluster.name == "Quick Audit")
                .first()
            )
            if cluster is None:
                cluster = PromptCluster(
                    project_id=project_id,
                    name="Quick Audit",
                    intent_type="audit",
                    topic=f"{domain} quick audit",
                    priority_score=95.0,
                )
                db.add(cluster)
                db.flush()
            
            # Build CrawledDocument objects from persisted page data for Claude
            crawled_docs: list[CrawledDocument] = []
            for page in pages:
                doc = CrawledDocument(
                    url=page.url,
                    canonical_url=page.canonical_url,
                    title=page.title,
                    h1=page.h1,
                    meta_description=page.meta_description,
                    text=page.full_text or "",
                    headings=page.headings_json or [],
                    links=page.links_json or [],
                    schema_types=page.schema_json or [],
                    status_code=page.status_code or 200,
                    images=0,
                    tables=0,
                    lists=0,
                    faq_count=0,
                    content_hash=page.content_hash or "",
                )
                crawled_docs.append(doc)
            
            # Use Claude to generate intelligent, business-specific prompts
            prompts_to_run = []
            brand_name = project.brand_name or domain.split(".")[0]
            
            try:
                _log_pipeline_event(
                    db, run_id, "claude_analysis", 
                    f"Claude analyzing {len(crawled_docs)} pages to understand business context...",
                    "info", 0.28
                )
                
                # Call Claude to generate prompts based on actual site content
                generated_prompt_texts = asyncio.run(
                    generate_prompts_with_claude(
                        documents=crawled_docs,
                        brand_name=brand_name,
                        domain=domain,
                        num_prompts=actual_prompt_limit,
                    )
                )
                
                _log_pipeline_event(
                    db, run_id, "prompt_generation", 
                    f"Claude generated {len(generated_prompt_texts)} business-specific prompts",
                    "success", 0.35, {"prompt_count": len(generated_prompt_texts)}
                )
                
                # Create Prompt records from Claude's output
                for i, prompt_text in enumerate(generated_prompt_texts):
                    prompt = Prompt(
                        prompt_cluster_id=cluster.id,
                        prompt_text=prompt_text,
                        prompt_variant_type="audit",
                        business_value_score=95.0 - (i * 0.5),
                        difficulty_score=40.0,
                        intent="informational",
                        funnel_stage="awareness",
                        source_layer="claude_lightweight",
                        source_reason=f"Claude-generated prompt {i+1}",
                        priority_tier=1,
                        quality_score=0.95 - (i * 0.005),
                    )
                    db.add(prompt)
                    db.flush()
                    prompts_to_run.append(prompt)
                    
            except Exception as claude_err:
                logger.warning(f"Claude prompt generation failed: {claude_err}, using fallback")
                _log_pipeline_event(
                    db, run_id, "prompt_generation", 
                    f"Claude unavailable, using fallback prompts: {str(claude_err)[:100]}",
                    "warning", 0.3
                )
                
                # Fallback: Generate basic prompts from page titles and H1s
                fallback_prompts = []
                
                # Extract meaningful content from pages
                for page in pages[:15]:
                    if page.h1 and len(page.h1) > 5:
                        fallback_prompts.append(f"Tell me about {page.h1}")
                    if page.title and len(page.title) > 5 and page.title != page.h1:
                        fallback_prompts.append(f"What is {page.title}?")
                
                # Add some brand queries
                fallback_prompts.extend([
                    f"What services does {brand_name} offer?",
                    f"Tell me about {brand_name}",
                    f"Is {brand_name} a good company?",
                    f"Where is {brand_name} located?",
                    f"What do customers say about {brand_name}?",
                ])
                
                # Dedupe and limit
                seen = set()
                unique_prompts = []
                for p in fallback_prompts:
                    if p.lower() not in seen:
                        seen.add(p.lower())
                        unique_prompts.append(p)
                
                for i, prompt_text in enumerate(unique_prompts[:actual_prompt_limit]):
                    prompt = Prompt(
                        prompt_cluster_id=cluster.id,
                        prompt_text=prompt_text,
                        prompt_variant_type="audit",
                        business_value_score=85.0 - i,
                        difficulty_score=40.0,
                        intent="informational",
                        funnel_stage="awareness",
                        source_layer="fallback",
                        source_reason=f"Fallback prompt {i+1}",
                        priority_tier=1,
                        quality_score=0.8 - (i * 0.01),
                    )
                    db.add(prompt)
                    db.flush()
                    prompts_to_run.append(prompt)
            
            _log_pipeline_event(
                db, run_id, "prompt_generation", 
                f"Created {len(prompts_to_run)} site-specific prompts",
                "success", 0.4, {"prompt_count": len(prompts_to_run)}
            )
        else:
            prompts_to_run = (
                db.query(Prompt)
                .filter(Prompt.prompt_cluster_id == cluster.id)
                .order_by(Prompt.priority_tier.asc(), Prompt.quality_score.desc())
                .limit(actual_prompt_limit)
                .all()
            )
        
        logger.info(f"Using engines: {engines_to_use} (limit: {actual_prompt_limit} prompts)")
        _log_pipeline_event(
            db, run_id, "execution", 
            f"Preparing to execute {len(prompts_to_run)} prompts on {len(engines_to_use)} engines",
            "info", 0.42, {"prompt_count": len(prompts_to_run), "engines": engines_to_use}
        )
        
        if not prompts_to_run:
            prompt = Prompt(
                prompt_cluster_id=cluster.id,
                prompt_text=f"Audit and optimize GEO performance for {domain}.",
                prompt_variant_type="audit",
                business_value_score=90.0,
                difficulty_score=40.0,
                intent="audit",
                funnel_stage="evaluation",
                source_layer="fallback",
                source_reason="No generated prompts available",
            )
            db.add(prompt)
            db.flush()
            prompts_to_run = [prompt]
        
        logger.info(f"Executing {len(prompts_to_run)} prompts in chunks of {chunk_size}")
        _log_pipeline_event(
            db, run_id, "execution", 
            f"Starting prompt execution ({len(prompts_to_run)} prompts in chunks of {chunk_size})",
            "info", 0.45
        )
        
        all_completed_run_ids: list[str] = []
        all_failed_engines: list[dict] = []
        total_chunks = (len(prompts_to_run) + chunk_size - 1) // chunk_size
        
        for chunk_idx in range(0, len(prompts_to_run), chunk_size):
            chunk = prompts_to_run[chunk_idx:chunk_idx + chunk_size]
            prompt_ids = [p.id for p in chunk]
            chunk_num = chunk_idx // chunk_size + 1
            
            _log_pipeline_event(
                db, run_id, "execution", 
                f"Processing chunk {chunk_num}/{total_chunks} ({len(chunk)} prompts)",
                "info", 0.45 + (0.35 * chunk_num / total_chunks)
            )
            
            chunk_result = run_tiered_prompt_batch(
                project_id, org_id, prompt_ids, domain, run_id, chunk_idx // chunk_size, engines_to_use
            )
            
            completed_count = chunk_result.get("engine_runs_completed", 0)
            failed_count = chunk_result.get("engine_runs_failed", 0)
            
            if completed_count > 0:
                completed_runs = (
                    db.query(EngineRun.id)
                    .filter(
                        EngineRun.project_id == project_id,
                        EngineRun.prompt_id.in_(prompt_ids),
                        EngineRun.run_status == "completed",
                    )
                    .all()
                )
                all_completed_run_ids.extend([r.id for r in completed_runs])
            
            _log_pipeline_event(
                db, run_id, "execution", 
                f"Chunk {chunk_num} complete: {completed_count} succeeded, {failed_count} failed",
                "success" if failed_count == 0 else "warning", 
                0.45 + (0.35 * chunk_num / total_chunks),
                {"chunk": chunk_num, "completed": completed_count, "failed": failed_count}
            )
            
            progress = 0.4 + (0.4 * (chunk_idx + chunk_size) / len(prompts_to_run))
            if run:
                run.progress = min(0.8, progress)
                db.commit()
        
        completed_engine_run_ids = all_completed_run_ids
        if not completed_engine_run_ids:
            _log_pipeline_event(
                db, run_id, "execution", 
                "No engine runs completed - all prompts failed",
                "error", 0.8
            )
            if run:
                run.status = "failed"
                run.failure_summary = "No engine runs completed"
                run.completed_at = datetime.utcnow()
                db.commit()
            return {
                "project_id": project_id,
                "status": "failed",
                "stage": "prompt_batch_no_completed_engines",
            }
        
        _log_pipeline_event(
            db, run_id, "execution", 
            f"Prompt execution complete: {len(completed_engine_run_ids)} engine runs succeeded",
            "success", 0.82, {"total_completed": len(completed_engine_run_ids)}
        )

        _log_pipeline_event(
            db, run_id, "scoring", 
            "Computing GEO scores for all pages...",
            "info", 0.85
        )
        
        engine_rows = (
            db.query(EngineRun)
            .filter(EngineRun.id.in_(completed_engine_run_ids))
            .all()
        )
        citation_count = (
            db.query(Citation)
            .filter(Citation.engine_run_id.in_(completed_engine_run_ids))
            .count()
        )
        covered_engines = {row.engine_name for row in engine_rows}
        engine_coverage_ratio = len(covered_engines) / max(1, len(engines_to_use))
        
        _log_pipeline_event(
            db, run_id, "scoring", 
            f"Found {citation_count} citations across {len(covered_engines)} engines",
            "info", 0.87, {"citations": citation_count, "engines_covered": list(covered_engines)}
        )

        page_scores: list[dict[str, float | str]] = []
        page_data_for_recs: list[dict] = []  # Collect page data for Claude recommendations
        
        for page in pages:
            feature = db.query(PageFeature).filter(PageFeature.page_id == page.id).first()
            technical = _clamp_score((feature.heading_depth_score if feature else None), 52.0)
            extractability = _clamp_score((feature.extractability_score if feature else None), 50.0)
            entity_score = _clamp_score((feature.entity_salience_score if feature else None), 48.0)
            trust = _clamp_score((feature.trust_signal_score if feature else None), 50.0)
            content = _clamp_score(
                (
                    (
                        (feature.readability_score if feature else 50.0)
                        + (feature.factual_density_score if feature else 50.0)
                        + (feature.information_gain_score if feature else 50.0)
                    )
                    / 3.0
                ),
                50.0,
            )
            base_citation = (extractability + trust) / 2.0
            citation_evidence_bonus = min(12.0, float(citation_count) * 0.25)
            citation = _clamp_score(base_citation + citation_evidence_bonus, 0.0)
            visibility = _clamp_score(
                ((extractability + entity_score + trust) / 3.0) * (0.55 + (0.45 * engine_coverage_ratio)),
                0.0,
            )
            freshness = _clamp_score(70.0, 70.0)
            composite = round(
                (
                    (technical * 0.18)
                    + (extractability * 0.2)
                    + (entity_score * 0.12)
                    + (trust * 0.18)
                    + (content * 0.16)
                    + (citation * 0.1)
                    + (visibility * 0.06)
                    + (freshness * 0.0)
                ),
                3,
            )

            db.add(
                GeoScore(
                    project_id=project_id,
                    page_id=page.id,
                    domain_id=domain_row.id,
                    prompt_cluster_id=cluster.id,
                    score_scope="page_custom",
                    technical_score=technical,
                    extractability_score=extractability,
                    entity_score=entity_score,
                    trust_score=trust,
                    content_score=content,
                    citation_score=citation,
                    visibility_score=visibility,
                    freshness_score=freshness,
                    composite_score=composite,
                    computed_at=datetime.utcnow(),
                )
            )
            page_scores.append({"url": page.url, "score": composite})

            # Store page data for Claude recommendation generation
            page_data_for_recs.append({
                "url": page.url,
                "page_id": page.id,
                "title": page.title,
                "h1": page.h1,
                "schema_types": page.schema_json or [],
                "content_preview": (page.full_text or page.text_content or "")[:800],
                "technical_score": round(technical, 1),
                "extractability_score": round(extractability, 1),
                "citation_score": round(citation, 1),
                "trust_score": round(trust, 1),
            })

        avg_score = round(
            sum(float(item["score"]) for item in page_scores) / max(1, len(page_scores)),
            3,
        )
        db.add(
            GeoScore(
                project_id=project_id,
                domain_id=domain_row.id,
                prompt_cluster_id=cluster.id,
                score_scope="project_custom",
                technical_score=avg_score,
                extractability_score=avg_score,
                entity_score=avg_score,
                trust_score=avg_score,
                content_score=avg_score,
                citation_score=avg_score,
                visibility_score=avg_score,
                freshness_score=70.0,
                composite_score=avg_score,
                computed_at=datetime.utcnow(),
            )
        )
        db.add(
            GeoScore(
                project_id=project_id,
                prompt_cluster_id=cluster.id,
                score_scope="prompt_cluster_custom",
                visibility_score=avg_score,
                composite_score=avg_score,
                computed_at=datetime.utcnow(),
            )
        )

        artifact_dir = Path("artifacts") / "reports" / org_id / project_id
        artifact_dir.mkdir(parents=True, exist_ok=True)
        geo_package_path = artifact_dir / f"geo-package-{run_id}.json"
        geo_package_payload = {
            "run_id": run_id,
            "run_folder": run.run_folder if run else None,
            "project_id": project_id,
            "domain": domain,
            "generated_at": datetime.utcnow().isoformat(),
            "pages": page_scores,
        }
        geo_package_path.write_text(json.dumps(geo_package_payload, indent=2), encoding="utf-8")
        db.add(
            ReportExport(
                project_id=project_id,
                report_type="geo_package_json",
                storage_path=str(geo_package_path),
            )
        )

        _log_pipeline_event(
            db, run_id, "scoring", 
            f"Scored {len(page_scores)} pages, average GEO score: {avg_score}",
            "success", 0.92, {"pages_scored": len(page_scores), "avg_score": avg_score}
        )
        
        # Generate intelligent page-specific recommendations using Claude
        _log_pipeline_event(
            db, run_id, "recommendations", 
            f"Generating page-specific GEO recommendations with Claude...",
            "info", 0.93
        )
        
        try:
            # Get site profile for industry context
            site_profile = db.query(SiteProfile).filter(SiteProfile.project_id == project_id).first()
            industry = site_profile.primary_industry if site_profile else ""
            
            # Build page URL to ID mapping
            page_url_to_id = {p["url"]: p["page_id"] for p in page_data_for_recs}
            
            # Call Claude to generate intelligent recommendations
            claude_recommendations = asyncio.run(
                generate_page_recommendations_with_claude(
                    pages_data=page_data_for_recs,
                    brand_name=project.brand_name or domain,
                    domain=domain,
                    industry=industry,
                )
            )
            
            # Persist recommendations
            for rec in claude_recommendations:
                page_id = page_url_to_id.get(rec.page_url)
                
                # Build description with code snippet if provided
                description = rec.description
                if rec.code_snippet:
                    description += f"\n\nSuggested code:\n```\n{rec.code_snippet}\n```"
                
                db.add(
                    Recommendation(
                        project_id=project_id,
                        page_id=page_id,
                        prompt_cluster_id=cluster.id,
                        category=rec.category,
                        priority=rec.priority,
                        title=rec.title[:255],
                        description=description,
                        rationale=rec.rationale,
                        estimated_impact=rec.estimated_impact,
                    )
                )
            
            db.commit()
            
            _log_pipeline_event(
                db, run_id, "recommendations", 
                f"Generated {len(claude_recommendations)} page-specific recommendations",
                "success", 0.97, {"recommendation_count": len(claude_recommendations)}
            )
            
        except Exception as rec_err:
            logger.warning(f"Claude recommendation generation failed: {rec_err}")
            _log_pipeline_event(
                db, run_id, "recommendations", 
                f"Recommendation generation skipped: {str(rec_err)[:100]}",
                "warning", 0.97
            )
        
        if run:
            run.progress = 1.0
            run.status = "completed"
            run.completed_at = datetime.utcnow()
        db.commit()
        
        _log_pipeline_event(
            db, run_id, "complete", 
            f"Pipeline completed successfully! {len(prompts_to_run)} prompts, {len(completed_engine_run_ids)} engine runs, avg score: {avg_score}",
            "success", 1.0, {
                "prompts_executed": len(prompts_to_run),
                "engine_runs": len(completed_engine_run_ids),
                "pages_scored": len(page_scores),
                "avg_score": avg_score,
            }
        )
        
        logger.info(f"Full GEO pipeline completed for {domain}")
        
        return {
            "project_id": project_id,
            "status": "completed",
            "target_tier": target_tier,
            "prompts_executed": len(prompts_to_run),
            "engine_runs_completed": len(completed_engine_run_ids),
            "pages_scored": len(page_scores),
            "avg_geo_score": avg_score,
            "stages": {
                "crawl": crawl_result,
                "prompt_generation": gen_result,
            },
        }
    except Exception as exc:
        logger.exception("full geo pipeline failed")
        _log_pipeline_event(
            db, run_id, "error", 
            f"Pipeline failed with error: {str(exc)[:200]}",
            "error", 0.0, {"error": str(exc)}
        )
        if "run" in locals() and run is not None:
            run.status = "failed"
            run.failure_summary = str(exc)
            run.completed_at = datetime.utcnow()
            db.commit()
        return {"project_id": project_id, "status": "failed", "error": str(exc)}
    finally:
        db.close()
