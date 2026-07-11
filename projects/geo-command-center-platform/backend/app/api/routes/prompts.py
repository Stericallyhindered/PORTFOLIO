from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import (
    Citation,
    Competitor,
    Domain,
    EngineRun,
    Entity,
    GeoScore,
    Mention,
    Page,
    Prompt,
    PromptCluster,
    PromptGenerationRun,
    Project,
    Recommendation,
    SiteProfile,
)
from app.schemas.geo import PromptClusterGenerateIn
from app.services.prompt_engine import (
    generate_benchmark_prompt_clusters,
    generate_prompt_clusters,
)

router = APIRouter()

TIER_CONFIGS = {
    "core": {"min": 500, "target": 800, "max": 1000},
    "expanded": {"min": 2000, "target": 2500, "max": 3000},
    "deep": {"min": 8000, "target": 10000, "max": 15000},
}


@router.post("/generate")
def generate(payload: PromptClusterGenerateIn):
    """
    GEO_PROMPT aligned prompt-cluster generation engine.
    """
    return {"clusters": [c.model_dump() for c in generate_prompt_clusters(payload)]}


@router.post("/persist")
def persist_generated(payload: PromptClusterGenerateIn, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    generated = generate_prompt_clusters(payload)
    created = 0
    for cluster in generated:
        cluster_row = PromptCluster(
            project_id=payload.project_id,
            name=cluster.name,
            intent_type=cluster.intent_type,
            topic=cluster.topic,
            priority_score=cluster.priority_score,
        )
        db.add(cluster_row)
        db.flush()
        for prompt_text in cluster.prompts:
            db.add(
                Prompt(
                    prompt_cluster_id=cluster_row.id,
                    prompt_text=prompt_text,
                    prompt_variant_type=cluster.intent_type,
                    locale="en-US",
                    business_value_score=cluster.priority_score,
                    difficulty_score=0.5,
                )
            )
        created += 1
    db.commit()
    return {"clusters_created": created, "project_id": payload.project_id}


@router.post("/benchmark-pack")
def benchmark_pack(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    payload = PromptClusterGenerateIn(
        project_id=project_id,
        brand_name=project.brand_name,
        primary_domain=project.primary_domain or "",
        competitors=[],
        topics=[project.brand_name],
    )
    clusters = generate_benchmark_prompt_clusters(payload)
    persisted = 0
    for cluster in clusters:
        existing = (
            db.query(PromptCluster)
            .filter(
                PromptCluster.project_id == project_id,
                PromptCluster.name == cluster.name,
                PromptCluster.topic == cluster.topic,
            )
            .first()
        )
        if existing is None:
            existing = PromptCluster(
                project_id=project_id,
                name=cluster.name,
                intent_type=cluster.intent_type,
                topic=cluster.topic,
                priority_score=cluster.priority_score,
            )
            db.add(existing)
            db.flush()
        existing_prompts = {
            prompt.prompt_text
            for prompt in db.query(Prompt).filter(Prompt.prompt_cluster_id == existing.id).all()
        }
        for prompt_text in cluster.prompts:
            if prompt_text in existing_prompts:
                continue
            db.add(
                Prompt(
                    prompt_cluster_id=existing.id,
                    prompt_text=prompt_text,
                    prompt_variant_type=cluster.intent_type,
                    locale="en-US",
                    business_value_score=cluster.priority_score,
                    difficulty_score=0.4,
                )
            )
        persisted += 1
    db.commit()
    return {"project_id": project_id, "clusters_created": persisted, "pack": "benchmark-v1"}


@router.post("/generate-from-project/{project_id}")
def generate_from_project(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    competitors = [
        c.name for c in db.query(Competitor).filter(Competitor.project_id == project_id).all()
    ]
    entity_topics = [
        e.normalized_name
        for e in db.query(Entity).filter(Entity.project_id == project_id).limit(40).all()
    ]
    domain_ids = [d.id for d in db.query(Domain).filter(Domain.project_id == project_id).all()]
    page_topics = (
        [
            p.title
            for p in db.query(Page)
            .filter(Page.domain_id.in_(domain_ids))
            .limit(30)
            .all()
            if p.title
        ]
        if domain_ids
        else []
    )
    payload = PromptClusterGenerateIn(
        project_id=project_id,
        brand_name=project.brand_name,
        primary_domain=project.primary_domain or "",
        competitors=competitors,
        topics=list(dict.fromkeys([*entity_topics, *page_topics]))[:80],
    )
    return {"clusters": [c.model_dump() for c in generate_prompt_clusters(payload)]}


@router.get("/clusters")
def list_clusters(
    project_id: str,
    include_stats: bool = True,
    include_prompt_preview: bool = False,
    scope=Depends(get_scoped_db),
):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    rows = (
        db.query(PromptCluster)
        .filter(PromptCluster.project_id == project_id)
        .order_by(PromptCluster.priority_score.desc())
        .all()
    )

    if not include_stats:
        return {
            "items": [
                {
                    "id": r.id,
                    "name": r.name,
                    "intentType": r.intent_type,
                    "topic": r.topic,
                    "priorityScore": r.priority_score,
                    "createdAt": r.created_at.isoformat() if r.created_at else None,
                }
                for r in rows
            ]
        }

    cluster_ids = [r.id for r in rows]
    prompts = (
        db.query(Prompt).filter(Prompt.prompt_cluster_id.in_(cluster_ids)).all()
        if cluster_ids
        else []
    )
    prompt_ids = [p.id for p in prompts]
    runs = (
        db.query(EngineRun).filter(EngineRun.prompt_id.in_(prompt_ids)).all()
        if prompt_ids
        else []
    )
    recs = (
        db.query(Recommendation)
        .filter(
            Recommendation.project_id == project_id,
            Recommendation.prompt_cluster_id.in_(cluster_ids),
        )
        .all()
        if cluster_ids
        else []
    )
    score_rows = (
        db.query(GeoScore)
        .filter(
            GeoScore.project_id == project_id,
            GeoScore.prompt_cluster_id.in_(cluster_ids),
        )
        .all()
        if cluster_ids
        else []
    )

    prompts_by_cluster: dict[str, list[Prompt]] = {}
    for prompt in prompts:
        prompts_by_cluster.setdefault(prompt.prompt_cluster_id, []).append(prompt)

    runs_by_prompt: dict[str, list[EngineRun]] = {}
    for run in runs:
        runs_by_prompt.setdefault(run.prompt_id, []).append(run)

    recs_by_cluster: dict[str, list[Recommendation]] = {}
    for rec in recs:
        if rec.prompt_cluster_id:
            recs_by_cluster.setdefault(rec.prompt_cluster_id, []).append(rec)

    scores_by_cluster: dict[str, list[GeoScore]] = {}
    for score in score_rows:
        if score.prompt_cluster_id:
            scores_by_cluster.setdefault(score.prompt_cluster_id, []).append(score)

    def cluster_status(
        prompt_count: int,
        run_count: int,
        completed_count: int,
        failed_count: int,
    ) -> str:
        if prompt_count == 0:
            return "not-generated"
        if run_count == 0:
            return "not-tested"
        if failed_count > 0 and completed_count == 0:
            return "failed"
        if completed_count > 0:
            return "tested"
        return "running"

    def generation_source(cluster: PromptCluster) -> str:
        name = (cluster.name or "").lower()
        topic = (cluster.topic or "").lower()
        if "benchmark" in name or topic.startswith("benchmark::"):
            return "benchmark-pack"
        if "auto geo pipeline" in name or "geo audit cluster" in topic:
            return "pipeline"
        return "model-generated"

    return {
        "items": [
            (
                lambda r: (
                    lambda cluster_prompts, cluster_runs, cluster_recs, cluster_scores: {
                        "id": r.id,
                        "name": r.name,
                        "intentType": r.intent_type,
                        "topic": r.topic,
                        "priorityScore": r.priority_score,
                        "createdAt": r.created_at.isoformat() if r.created_at else None,
                        "updatedAt": r.updated_at.isoformat() if r.updated_at else None,
                        "generationSource": generation_source(r),
                        "promptCount": len(cluster_prompts),
                        "runCount": len(cluster_runs),
                        "completedRunCount": len(
                            [run for run in cluster_runs if run.run_status == "completed"]
                        ),
                        "failedRunCount": len(
                            [run for run in cluster_runs if run.run_status == "failed"]
                        ),
                        "lastRunAt": (
                            max(
                                [
                                    run.completed_at or run.started_at
                                    for run in cluster_runs
                                    if (run.completed_at or run.started_at) is not None
                                ],
                                default=None,
                            ).isoformat()
                            if cluster_runs
                            else None
                        ),
                        "lastError": (
                            next(
                                (
                                    run.error_message
                                    for run in sorted(
                                        cluster_runs,
                                        key=lambda item: item.started_at or item.completed_at,
                                        reverse=True,
                                    )
                                    if run.error_message
                                ),
                                None,
                            )
                        ),
                        "status": cluster_status(
                            prompt_count=len(cluster_prompts),
                            run_count=len(cluster_runs),
                            completed_count=len(
                                [run for run in cluster_runs if run.run_status == "completed"]
                            ),
                            failed_count=len(
                                [run for run in cluster_runs if run.run_status == "failed"]
                            ),
                        ),
                        "hasFindings": len(cluster_recs) > 0 or len(cluster_scores) > 0,
                        "openRecommendations": len(
                            [rec for rec in cluster_recs if rec.status == "open"]
                        ),
                        "scoreCount": len(cluster_scores),
                        "avgScore": (
                            round(
                                sum(
                                    float(score.composite_score or 0.0)
                                    for score in cluster_scores
                                )
                                / max(1, len(cluster_scores)),
                                3,
                            )
                            if cluster_scores
                            else None
                        ),
                        "avgCustomScore": (
                            round(
                                sum(
                                    float(score.composite_score or 0.0)
                                    for score in cluster_scores
                                    if score.score_scope
                                    in {"prompt_cluster_custom", "cluster_custom", "page_custom"}
                                )
                                / max(
                                    1,
                                    len(
                                        [
                                            score
                                            for score in cluster_scores
                                            if score.score_scope
                                            in {"prompt_cluster_custom", "cluster_custom", "page_custom"}
                                        ]
                                    ),
                                ),
                                3,
                            )
                            if any(
                                score.score_scope
                                in {"prompt_cluster_custom", "cluster_custom", "page_custom"}
                                for score in cluster_scores
                            )
                            else None
                        ),
                        "avgBenchmarkScore": (
                            round(
                                sum(
                                    float(score.composite_score or 0.0)
                                    for score in cluster_scores
                                    if score.score_scope
                                    in {"prompt_cluster_benchmark", "cluster_benchmark", "page_benchmark"}
                                )
                                / max(
                                    1,
                                    len(
                                        [
                                            score
                                            for score in cluster_scores
                                            if score.score_scope
                                            in {"prompt_cluster_benchmark", "cluster_benchmark", "page_benchmark"}
                                        ]
                                    ),
                                ),
                                3,
                            )
                            if any(
                                score.score_scope
                                in {"prompt_cluster_benchmark", "cluster_benchmark", "page_benchmark"}
                                for score in cluster_scores
                            )
                            else None
                        ),
                        "benchmarkVsCustomDelta": (
                            None
                            if (
                                not any(
                                    score.score_scope
                                    in {"prompt_cluster_custom", "cluster_custom", "page_custom"}
                                    for score in cluster_scores
                                )
                                or not any(
                                    score.score_scope
                                    in {"prompt_cluster_benchmark", "cluster_benchmark", "page_benchmark"}
                                    for score in cluster_scores
                                )
                            )
                            else round(
                                (
                                    sum(
                                        float(score.composite_score or 0.0)
                                        for score in cluster_scores
                                        if score.score_scope
                                        in {"prompt_cluster_benchmark", "cluster_benchmark", "page_benchmark"}
                                    )
                                    / max(
                                        1,
                                        len(
                                            [
                                                score
                                                for score in cluster_scores
                                                if score.score_scope
                                                in {"prompt_cluster_benchmark", "cluster_benchmark", "page_benchmark"}
                                            ]
                                        ),
                                    )
                                )
                                - (
                                    sum(
                                        float(score.composite_score or 0.0)
                                        for score in cluster_scores
                                        if score.score_scope
                                        in {"prompt_cluster_custom", "cluster_custom", "page_custom"}
                                    )
                                    / max(
                                        1,
                                        len(
                                            [
                                                score
                                                for score in cluster_scores
                                                if score.score_scope
                                                in {"prompt_cluster_custom", "cluster_custom", "page_custom"}
                                            ]
                                        ),
                                    )
                                ),
                                3,
                            )
                        ),
                        "promptPreview": (
                            [prompt.prompt_text for prompt in cluster_prompts[:3]]
                            if include_prompt_preview
                            else []
                        ),
                    }
                )(
                    prompts_by_cluster.get(r.id, []),
                    [
                        run
                        for prompt in prompts_by_cluster.get(r.id, [])
                        for run in runs_by_prompt.get(prompt.id, [])
                    ],
                    recs_by_cluster.get(r.id, []),
                    scores_by_cluster.get(r.id, []),
                )
            )(r)
            for r in rows
        ]
    }


@router.get("/clusters/{cluster_id}")
def get_cluster(cluster_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    row = (
        db.query(PromptCluster)
        .join(Project, Project.id == PromptCluster.project_id)
        .filter(PromptCluster.id == cluster_id, Project.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Prompt cluster not found")
    return {
        "item": {
            "id": row.id,
            "projectId": row.project_id,
            "name": row.name,
            "intentType": row.intent_type,
            "topic": row.topic,
            "priorityScore": row.priority_score,
            "createdAt": row.created_at.isoformat() if row.created_at else None,
        }
    }


@router.get("/clusters/{cluster_id}/prompts")
def list_cluster_prompts(cluster_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    cluster = (
        db.query(PromptCluster)
        .join(Project, Project.id == PromptCluster.project_id)
        .filter(PromptCluster.id == cluster_id, Project.organization_id == org_id)
        .first()
    )
    if not cluster:
        raise HTTPException(status_code=404, detail="Prompt cluster not found")
    rows = db.query(Prompt).filter(Prompt.prompt_cluster_id == cluster_id).all()
    return {
        "items": [
            {
                "id": p.id,
                "promptText": p.prompt_text,
                "promptVariantType": p.prompt_variant_type,
                "locale": p.locale,
                "businessValueScore": p.business_value_score,
                "difficultyScore": p.difficulty_score,
                "topic": p.topic,
                "intent": p.intent,
                "funnelStage": p.funnel_stage,
                "audience": p.audience,
                "useCase": p.use_case,
                "competitor": p.competitor,
                "sourceLayer": p.source_layer,
                "sourceReason": p.source_reason,
                "qualityScore": p.quality_score,
                "priorityTier": p.priority_tier,
            }
            for p in rows
        ]
    }


@router.get("/universe/stats/{project_id}")
def get_prompt_universe_stats(project_id: str, scope=Depends(get_scoped_db)):
    """
    Get comprehensive statistics about the prompt universe for a project.
    """
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    cluster_ids = [
        c.id for c in db.query(PromptCluster).filter(PromptCluster.project_id == project_id).all()
    ]
    
    prompts = (
        db.query(Prompt).filter(Prompt.prompt_cluster_id.in_(cluster_ids)).all()
        if cluster_ids else []
    )
    
    by_intent: dict[str, int] = defaultdict(int)
    by_funnel: dict[str, int] = defaultdict(int)
    by_audience: dict[str, int] = defaultdict(int)
    by_use_case: dict[str, int] = defaultdict(int)
    by_tier: dict[int, int] = defaultdict(int)
    by_source_layer: dict[str, int] = defaultdict(int)
    by_competitor: dict[str, int] = defaultdict(int)
    
    quality_scores: list[float] = []
    
    for prompt in prompts:
        by_intent[prompt.intent or "unknown"] += 1
        by_funnel[prompt.funnel_stage or "unknown"] += 1
        if prompt.audience:
            by_audience[prompt.audience] += 1
        if prompt.use_case:
            by_use_case[prompt.use_case] += 1
        by_tier[prompt.priority_tier or 2] += 1
        by_source_layer[prompt.source_layer or "unknown"] += 1
        if prompt.competitor:
            by_competitor[prompt.competitor] += 1
        if prompt.quality_score is not None:
            quality_scores.append(prompt.quality_score)
    
    tier1_count = by_tier.get(1, 0)
    tier2_count = by_tier.get(2, 0)
    tier3_count = by_tier.get(3, 0)
    
    core_count = tier1_count
    expanded_count = tier1_count + tier2_count
    deep_count = tier1_count + tier2_count + tier3_count
    
    avg_quality = round(sum(quality_scores) / len(quality_scores), 3) if quality_scores else None
    
    return {
        "projectId": project_id,
        "totalPrompts": len(prompts),
        "coreCount": core_count,
        "expandedCount": expanded_count,
        "deepCount": deep_count,
        "tierTargets": TIER_CONFIGS,
        "byIntent": dict(by_intent),
        "byFunnelStage": dict(by_funnel),
        "byAudience": dict(by_audience),
        "byUseCase": dict(by_use_case),
        "byTier": {str(k): v for k, v in by_tier.items()},
        "bySourceLayer": dict(by_source_layer),
        "byCompetitor": dict(by_competitor),
        "avgQualityScore": avg_quality,
    }


@router.get("/universe/prompts/{project_id}")
def list_prompt_universe(
    project_id: str,
    tier: str | None = None,
    intent: str | None = None,
    funnel_stage: str | None = None,
    audience: str | None = None,
    competitor: str | None = None,
    limit: int = 100,
    offset: int = 0,
    scope=Depends(get_scoped_db),
):
    """
    List prompts from the prompt universe with filtering options.
    """
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    cluster_ids = [
        c.id for c in db.query(PromptCluster).filter(PromptCluster.project_id == project_id).all()
    ]
    
    if not cluster_ids:
        return {"items": [], "total": 0}
    
    query = db.query(Prompt).filter(Prompt.prompt_cluster_id.in_(cluster_ids))
    
    if tier:
        tier_map = {"core": [1], "expanded": [1, 2], "deep": [1, 2, 3]}
        tiers = tier_map.get(tier, [1, 2, 3])
        query = query.filter(Prompt.priority_tier.in_(tiers))
    
    if intent:
        query = query.filter(Prompt.intent == intent)
    
    if funnel_stage:
        query = query.filter(Prompt.funnel_stage == funnel_stage)
    
    if audience:
        query = query.filter(Prompt.audience == audience)
    
    if competitor:
        query = query.filter(Prompt.competitor == competitor)
    
    total = query.count()
    
    prompts = (
        query
        .order_by(Prompt.priority_tier.asc(), Prompt.quality_score.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    return {
        "items": [
            {
                "id": p.id,
                "promptText": p.prompt_text,
                "topic": p.topic,
                "intent": p.intent,
                "funnelStage": p.funnel_stage,
                "audience": p.audience,
                "useCase": p.use_case,
                "competitor": p.competitor,
                "sourceLayer": p.source_layer,
                "sourceReason": p.source_reason,
                "qualityScore": p.quality_score,
                "priorityTier": p.priority_tier,
            }
            for p in prompts
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/universe/prompts-with-responses/{project_id}")
def list_prompts_with_responses(
    project_id: str,
    tier: str | None = None,
    limit: int = 50,
    offset: int = 0,
    scope=Depends(get_scoped_db),
):
    """
    List prompts with their AI engine responses.
    Used to verify prompt quality and see how each AI engine responds.
    """
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    cluster_ids = [
        c.id for c in db.query(PromptCluster).filter(PromptCluster.project_id == project_id).all()
    ]
    
    if not cluster_ids:
        return {"items": [], "total": 0, "limit": limit, "offset": offset}
    
    query = db.query(Prompt).filter(Prompt.prompt_cluster_id.in_(cluster_ids))
    
    if tier:
        tier_map = {"core": [1], "expanded": [1, 2], "deep": [1, 2, 3]}
        tiers = tier_map.get(tier, [1, 2, 3])
        query = query.filter(Prompt.priority_tier.in_(tiers))
    
    total = query.count()
    
    prompts = (
        query
        .order_by(Prompt.priority_tier.asc(), Prompt.quality_score.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    # Get engine runs for these prompts
    prompt_ids = [p.id for p in prompts]
    engine_runs = (
        db.query(EngineRun)
        .filter(EngineRun.prompt_id.in_(prompt_ids))
        .all()
    )
    
    # Group engine runs by prompt_id
    runs_by_prompt: dict[str, list] = {}
    for run in engine_runs:
        if run.prompt_id not in runs_by_prompt:
            runs_by_prompt[run.prompt_id] = []
        metadata = (run.response_json or {}).get("metadata") if isinstance(run.response_json, dict) else {}
        request_meta = metadata.get("request") if isinstance(metadata, dict) else {}
        runs_by_prompt[run.prompt_id].append({
            "engineName": run.engine_name,
            "status": run.run_status,
            "responseText": run.response_text[:1000] if run.response_text else None,
            "completedAt": run.completed_at.isoformat() if run.completed_at else None,
            "debug": {
                "model": metadata.get("model") if isinstance(metadata, dict) else None,
                "promptHash": request_meta.get("promptHash") if isinstance(request_meta, dict) else None,
                "systemPrompt": request_meta.get("systemPrompt") if isinstance(request_meta, dict) else None,
                "userPrompt": request_meta.get("userPrompt") if isinstance(request_meta, dict) else None,
                "params": request_meta.get("params") if isinstance(request_meta, dict) else None,
            },
        })
    
    items = []
    for p in prompts:
        responses = runs_by_prompt.get(p.id, [])
        items.append({
            "id": p.id,
            "promptText": p.prompt_text,
            "topic": p.topic,
            "intent": p.intent,
            "funnelStage": p.funnel_stage,
            "audience": p.audience,
            "useCase": p.use_case,
            "competitor": p.competitor,
            "sourceLayer": p.source_layer,
            "qualityScore": p.quality_score,
            "priorityTier": p.priority_tier,
            "responses": responses,
        })
    
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/universe/download/{project_id}")
def download_prompts_with_responses(
    project_id: str,
    tier: str | None = None,
    scope=Depends(get_scoped_db),
):
    """
    Download all prompts with their AI engine responses as JSON.
    """
    from datetime import datetime
    
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    cluster_ids = [
        c.id for c in db.query(PromptCluster).filter(PromptCluster.project_id == project_id).all()
    ]
    
    if not cluster_ids:
        return {
            "website": project.primary_domain,
            "brandName": project.brand_name,
            "generatedAt": datetime.utcnow().isoformat(),
            "totalPrompts": 0,
            "prompts": [],
        }
    
    query = db.query(Prompt).filter(Prompt.prompt_cluster_id.in_(cluster_ids))
    
    if tier:
        tier_map = {"core": [1], "expanded": [1, 2], "deep": [1, 2, 3]}
        tiers = tier_map.get(tier, [1, 2, 3])
        query = query.filter(Prompt.priority_tier.in_(tiers))
    
    prompts = query.order_by(Prompt.priority_tier.asc(), Prompt.quality_score.desc()).all()
    
    # Get all engine runs for these prompts
    prompt_ids = [p.id for p in prompts]
    engine_runs = db.query(EngineRun).filter(EngineRun.prompt_id.in_(prompt_ids)).all()
    
    # Get citations and mentions for these runs
    run_ids = [r.id for r in engine_runs]
    citations = db.query(Citation).filter(Citation.engine_run_id.in_(run_ids)).all()
    mentions = db.query(Mention).filter(Mention.engine_run_id.in_(run_ids)).all()
    
    # Group by prompt
    runs_by_prompt: dict[str, list] = {}
    citations_by_run: dict[str, list] = {}
    mentions_by_run: dict[str, list] = {}
    
    for c in citations:
        if c.engine_run_id not in citations_by_run:
            citations_by_run[c.engine_run_id] = []
        citations_by_run[c.engine_run_id].append({
            "citedDomain": c.cited_domain,
            "citedUrl": c.cited_url,
            "mentionType": c.mention_type,
            "isBrand": c.is_brand,
        })
    
    for m in mentions:
        if m.engine_run_id not in mentions_by_run:
            mentions_by_run[m.engine_run_id] = []
        mentions_by_run[m.engine_run_id].append({
            "entityName": m.entity_name,
            "entityType": m.entity_type,
            "sentiment": m.sentiment,
        })
    
    for run in engine_runs:
        if run.prompt_id not in runs_by_prompt:
            runs_by_prompt[run.prompt_id] = {}
        runs_by_prompt[run.prompt_id][run.engine_name] = {
            "response": run.response_text,
            "status": run.run_status,
            "citations": citations_by_run.get(run.id, []),
            "mentions": mentions_by_run.get(run.id, []),
            "mentionedBrand": any(m.get("isBrand") for m in mentions_by_run.get(run.id, [])),
            "citedDomain": any(c.get("isBrand") for c in citations_by_run.get(run.id, [])),
        }
    
    export_prompts = []
    for p in prompts:
        export_prompts.append({
            "text": p.prompt_text,
            "topic": p.topic,
            "intent": p.intent,
            "funnelStage": p.funnel_stage,
            "audience": p.audience,
            "useCase": p.use_case,
            "competitor": p.competitor,
            "qualityScore": p.quality_score,
            "priorityTier": p.priority_tier,
            "responses": runs_by_prompt.get(p.id, {}),
        })
    
    return {
        "website": project.primary_domain,
        "brandName": project.brand_name,
        "generatedAt": datetime.utcnow().isoformat(),
        "totalPrompts": len(export_prompts),
        "prompts": export_prompts,
    }


@router.get("/generation-runs/{project_id}")
def list_generation_runs(project_id: str, scope=Depends(get_scoped_db)):
    """
    List prompt generation runs for a project.
    """
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    runs = (
        db.query(PromptGenerationRun)
        .filter(PromptGenerationRun.project_id == project_id)
        .order_by(PromptGenerationRun.started_at.desc())
        .all()
    )
    
    return {
        "items": [
            {
                "id": r.id,
                "targetTier": r.target_tier,
                "status": r.status,
                "seedsGenerated": r.seeds_generated,
                "promptsExpanded": r.prompts_expanded,
                "promptsAfterDedupe": r.prompts_after_dedupe,
                "promptsAfterQuality": r.prompts_after_quality,
                "tier1Count": r.tier1_count,
                "tier2Count": r.tier2_count,
                "tier3Count": r.tier3_count,
                "startedAt": r.started_at.isoformat() if r.started_at else None,
                "completedAt": r.completed_at.isoformat() if r.completed_at else None,
            }
            for r in runs
        ]
    }


@router.get("/site-profile/{project_id}")
def get_site_profile(project_id: str, scope=Depends(get_scoped_db)):
    """
    Get the site intelligence profile for a project.
    """
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    profile = (
        db.query(SiteProfile)
        .filter(SiteProfile.project_id == project_id)
        .order_by(SiteProfile.updated_at.desc())
        .first()
    )
    
    if not profile:
        return {"profile": None}
    
    return {
        "profile": {
            "id": profile.id,
            "brandName": profile.brand_name,
            "domain": profile.domain,
            "industries": profile.industries_json or [],
            "products": profile.products_json or [],
            "services": profile.services_json or [],
            "features": profile.features_json or [],
            "painPoints": profile.pain_points_json or [],
            "customerTypes": profile.customer_types_json or [],
            "useCases": profile.use_cases_json or [],
            "locations": profile.locations_json or [],
            "competitors": profile.competitors_json or [],
            "coreTopics": profile.core_topics_json or [],
            "supportingTopics": profile.supporting_topics_json or [],
            "keywords": profile.keywords_json or [],
            "faqQuestions": profile.faq_questions_json or [],
            "claims": profile.claims_json or [],
            "createdAt": profile.created_at.isoformat() if profile.created_at else None,
            "updatedAt": profile.updated_at.isoformat() if profile.updated_at else None,
        }
    }


@router.get("/prompt/{prompt_id}/explainability")
def get_prompt_explainability(prompt_id: str, scope=Depends(get_scoped_db)):
    """
    Get detailed explainability information for a specific prompt.
    """
    db, org_id = scope
    prompt = (
        db.query(Prompt)
        .join(PromptCluster, PromptCluster.id == Prompt.prompt_cluster_id)
        .join(Project, Project.id == PromptCluster.project_id)
        .filter(Prompt.id == prompt_id, Project.organization_id == org_id)
        .first()
    )
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    parent_prompt = None
    if prompt.parent_prompt_id:
        parent_prompt = db.query(Prompt).filter(Prompt.id == prompt.parent_prompt_id).first()
    
    return {
        "prompt": {
            "id": prompt.id,
            "promptText": prompt.prompt_text,
            "topic": prompt.topic,
            "subtopic": prompt.subtopic,
            "intent": prompt.intent,
            "funnelStage": prompt.funnel_stage,
            "audience": prompt.audience,
            "useCase": prompt.use_case,
            "painPoint": prompt.pain_point,
            "feature": prompt.feature,
            "competitor": prompt.competitor,
        },
        "provenance": {
            "sourceLayer": prompt.source_layer,
            "sourceReason": prompt.source_reason,
            "parentPromptId": prompt.parent_prompt_id,
            "parentPromptText": parent_prompt.prompt_text if parent_prompt else None,
            "generationRunId": prompt.generation_run_id,
        },
        "quality": {
            "qualityScore": prompt.quality_score,
            "priorityTier": prompt.priority_tier,
            "businessValueScore": prompt.business_value_score,
        },
        "deduplication": {
            "semanticClusterId": prompt.semantic_cluster_id,
            "normalizedTextHash": prompt.normalized_text_hash,
        },
    }
