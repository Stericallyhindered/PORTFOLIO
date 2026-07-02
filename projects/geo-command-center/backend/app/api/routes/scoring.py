from datetime import datetime
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import Citation, EngineRun, GeoScore, Mention, Project, Prompt, PromptCluster
from app.schemas.geo import ClusterGeoScoreIn, PageGeoScoreIn, ProjectGeoScoreIn
from app.services.scoring import (
    citation_prominence_score,
    cluster_geo_score,
    competitor_gap_inverse,
    page_geo_score,
    project_geo_score,
)

router = APIRouter()

SUPPORTED_ENGINES = ["chatgpt", "google-ai-overviews", "perplexity", "gemini", "claude"]


def _avg(values: list[float | None]) -> float | None:
    normalized = [float(v) for v in values if v is not None]
    if not normalized:
        return None
    return round(sum(normalized) / len(normalized), 3)


@router.post("/page")
def score_page(payload: PageGeoScoreIn):
    return {"page_geo_score": page_geo_score(payload)}


@router.post("/cluster")
def score_cluster(payload: ClusterGeoScoreIn):
    return {"cluster_score": cluster_geo_score(payload)}


@router.post("/project")
def score_project(payload: ProjectGeoScoreIn):
    return {"project_geo_score": project_geo_score(payload)}


@router.post("/recompute/{project_id}")
def recompute_project_scores(
    project_id: str,
    score_kind: str = "custom",
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
    runs = (
        db.query(EngineRun)
        .filter(EngineRun.project_id == project_id, EngineRun.run_status == "completed")
        .all()
    )
    if not runs:
        raise HTTPException(status_code=422, detail="No engine runs available")
    if score_kind not in {"custom", "benchmark"}:
        raise HTTPException(status_code=422, detail="score_kind must be custom or benchmark")

    source_scopes = (
        {"page_custom", "prompt_cluster_custom"}
        if score_kind == "custom"
        else {"page_benchmark", "prompt_cluster_benchmark"}
    )
    scoped_rows = (
        db.query(GeoScore)
        .filter(GeoScore.project_id == project_id, GeoScore.score_scope.in_(source_scopes))
        .all()
    )
    if not scoped_rows:
        raise HTTPException(
            status_code=422,
            detail=(
                f"No {score_kind} score evidence available. "
                f"Run {'benchmark prompt pack + benchmark scoring' if score_kind == 'benchmark' else 'full GEO pipeline'} first."
            ),
        )

    page_rows = [row for row in scoped_rows if row.page_id]
    cluster_rows = [row for row in scoped_rows if row.prompt_cluster_id]

    mention_count = sum(
        1
        for run in runs
        if run.response_text and project.brand_name.lower() in run.response_text.lower()
    )
    competitor_mentions = max(0, len(runs) - mention_count)
    citation_orders: list[int] = []
    for run in runs:
        response_json = run.response_json or {}
        citations = response_json.get("citations", []) if isinstance(response_json, dict) else []
        if not isinstance(citations, list):
            continue
        for idx, citation in enumerate(citations, start=1):
            if isinstance(citation, dict):
                citation_orders.append(int(citation.get("citation_order") or idx))

    avg_page_geo = _avg([row.composite_score for row in page_rows])
    avg_cluster_visibility = _avg(
        [row.visibility_score for row in cluster_rows if row.visibility_score is not None]
        + [row.composite_score for row in cluster_rows if row.visibility_score is None]
    )
    authority_signal = _avg([row.trust_score for row in page_rows])
    if authority_signal is None:
        authority_signal = _avg([row.citation_score for row in page_rows]) or 0.0

    cluster_payload = ClusterGeoScoreIn(
        brand_mention_rate=(mention_count / len(runs)) * 100,
        citation_rate=min(100.0, (len(citation_orders) / max(1, len(runs))) * 100),
        citation_prominence=citation_prominence_score(citation_orders),
        competitor_gap_inverse=competitor_gap_inverse(mention_count, competitor_mentions),
        landing_page_match=min(100.0, max(0.0, (avg_page_geo or 0.0))),
        answer_sentiment=70.0,
    )
    cluster_score_value = cluster_geo_score(cluster_payload)
    project_payload = ProjectGeoScoreIn(
        avg_page_geo=avg_page_geo or cluster_score_value,
        avg_cluster_visibility=avg_cluster_visibility or cluster_score_value,
        authority_signal=authority_signal,
        competitor_outperformance=competitor_gap_inverse(mention_count, competitor_mentions),
        freshness=72.0,
    )
    project_score_value = project_geo_score(project_payload)
    scope_name = "project_custom" if score_kind == "custom" else "project_benchmark"
    row = GeoScore(
        project_id=project_id,
        score_scope=scope_name,
        technical_score=_avg([row.technical_score for row in page_rows]),
        extractability_score=_avg([row.extractability_score for row in page_rows]),
        entity_score=_avg([row.entity_score for row in page_rows]),
        trust_score=_avg([row.trust_score for row in page_rows]),
        content_score=_avg([row.content_score for row in page_rows]),
        citation_score=_avg([row.citation_score for row in page_rows]),
        visibility_score=cluster_score_value,
        freshness_score=72.0,
        composite_score=project_score_value,
        computed_at=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    return {
        "project_id": project_id,
        "cluster_score": cluster_score_value,
        "project_geo_score": project_score_value,
    }


@router.get("/overview")
def score_overview(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    rows = (
        db.query(GeoScore)
        .filter(GeoScore.project_id == project_id)
        .order_by(GeoScore.computed_at.desc())
        .all()
    )
    benchmark_cluster_ids = {
        cluster.id
        for cluster in db.query(PromptCluster)
        .filter(PromptCluster.project_id == project_id)
        .all()
        if ("benchmark" in (cluster.name or "").lower())
        or ((cluster.topic or "").lower().startswith("benchmark::"))
    }
    latest_custom = next(
        (r for r in rows if r.score_scope in {"project_custom", "project"}),
        None,
    )
    valid_benchmark_evidence_rows = [
        r
        for r in rows
        if r.score_scope in {"page_benchmark", "prompt_cluster_benchmark", "cluster_benchmark"}
        and (
            r.page_id is not None
            or (r.prompt_cluster_id is not None and r.prompt_cluster_id in benchmark_cluster_ids)
        )
    ]
    latest_benchmark = next(
        (
            r
            for r in rows
            if r.score_scope == "project_benchmark"
            and (
                (r.prompt_cluster_id and r.prompt_cluster_id in benchmark_cluster_ids)
                or (r.prompt_cluster_id is None and len(valid_benchmark_evidence_rows) > 0)
            )
        ),
        None,
    )
    pages = [
        r
        for r in rows
        if r.score_scope in {"page", "page_custom", "page_benchmark"} and r.page_id
    ]
    clusters = [
        r
        for r in rows
        if r.score_scope in {"cluster", "prompt_cluster", "prompt_cluster_custom", "prompt_cluster_benchmark"}
    ]
    custom_score = latest_custom.composite_score if latest_custom else None
    benchmark_score = latest_benchmark.composite_score if latest_benchmark else None
    return {
        "projectId": project_id,
        "projectGeoScore": custom_score,
        "projectGeoScoreCustom": custom_score,
        "projectGeoScoreBenchmark": benchmark_score,
        "benchmarkVsCustomDelta": (
            None
            if custom_score is None or benchmark_score is None
            else round(float(benchmark_score) - float(custom_score), 3)
        ),
        "pageScoreCount": len(pages),
        "clusterScoreCount": len(clusters),
        "latestComputedAt": (
            latest_custom.computed_at.isoformat()
            if latest_custom and latest_custom.computed_at
            else None
        ),
        "items": [
            {
                "id": r.id,
                "scope": r.score_scope,
                "pageId": r.page_id,
                "promptClusterId": r.prompt_cluster_id,
                "technical": r.technical_score,
                "extractability": r.extractability_score,
                "entity": r.entity_score,
                "trust": r.trust_score,
                "content": r.content_score,
                "citation": r.citation_score,
                "visibility": r.visibility_score,
                "freshness": r.freshness_score,
                "composite": r.composite_score,
                "computedAt": r.computed_at.isoformat() if r.computed_at else None,
            }
            for r in rows[:200]
        ],
    }


@router.get("/segmented/{project_id}")
def get_segmented_scores(project_id: str, scope=Depends(get_scoped_db)):
    """
    Get GEO scores segmented by multiple dimensions:
    - By engine
    - By intent
    - By funnel stage
    - By audience
    - By use case
    - By tier
    - By competitor
    """
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    engine_runs = (
        db.query(EngineRun)
        .filter(EngineRun.project_id == project_id, EngineRun.run_status == "completed")
        .all()
    )
    
    prompt_ids = list({run.prompt_id for run in engine_runs})
    prompts = db.query(Prompt).filter(Prompt.id.in_(prompt_ids)).all() if prompt_ids else []
    prompt_map = {p.id: p for p in prompts}
    
    by_engine: dict[str, dict] = defaultdict(lambda: {"runs": 0, "mentions": 0, "citations": 0, "avg_score": 0.0})
    by_intent: dict[str, dict] = defaultdict(lambda: {"runs": 0, "mentions": 0, "citations": 0, "avg_score": 0.0})
    by_funnel: dict[str, dict] = defaultdict(lambda: {"runs": 0, "mentions": 0, "citations": 0, "avg_score": 0.0})
    by_audience: dict[str, dict] = defaultdict(lambda: {"runs": 0, "mentions": 0, "citations": 0, "avg_score": 0.0})
    by_use_case: dict[str, dict] = defaultdict(lambda: {"runs": 0, "mentions": 0, "citations": 0, "avg_score": 0.0})
    by_tier: dict[int, dict] = defaultdict(lambda: {"runs": 0, "mentions": 0, "citations": 0, "avg_score": 0.0})
    by_competitor: dict[str, dict] = defaultdict(lambda: {"runs": 0, "mentions": 0, "citations": 0, "avg_score": 0.0})
    
    brand_lower = project.brand_name.lower()
    
    for run in engine_runs:
        engine = run.engine_name or "unknown"
        prompt = prompt_map.get(run.prompt_id)
        
        response_text = run.response_text or ""
        response_json = run.response_json or {}
        
        has_mention = brand_lower in response_text.lower() if response_text else False
        citations = response_json.get("citations", []) if isinstance(response_json, dict) else []
        citation_count = len(citations) if isinstance(citations, list) else 0
        
        by_engine[engine]["runs"] += 1
        by_engine[engine]["mentions"] += 1 if has_mention else 0
        by_engine[engine]["citations"] += citation_count
        
        if prompt:
            intent = prompt.intent or "unknown"
            by_intent[intent]["runs"] += 1
            by_intent[intent]["mentions"] += 1 if has_mention else 0
            by_intent[intent]["citations"] += citation_count
            
            funnel = prompt.funnel_stage or "unknown"
            by_funnel[funnel]["runs"] += 1
            by_funnel[funnel]["mentions"] += 1 if has_mention else 0
            by_funnel[funnel]["citations"] += citation_count
            
            if prompt.audience:
                by_audience[prompt.audience]["runs"] += 1
                by_audience[prompt.audience]["mentions"] += 1 if has_mention else 0
                by_audience[prompt.audience]["citations"] += citation_count
            
            if prompt.use_case:
                by_use_case[prompt.use_case]["runs"] += 1
                by_use_case[prompt.use_case]["mentions"] += 1 if has_mention else 0
                by_use_case[prompt.use_case]["citations"] += citation_count
            
            tier = prompt.priority_tier or 2
            by_tier[tier]["runs"] += 1
            by_tier[tier]["mentions"] += 1 if has_mention else 0
            by_tier[tier]["citations"] += citation_count
            
            if prompt.competitor:
                by_competitor[prompt.competitor]["runs"] += 1
                by_competitor[prompt.competitor]["mentions"] += 1 if has_mention else 0
                by_competitor[prompt.competitor]["citations"] += citation_count
    
    def compute_avg_score(segment: dict) -> float:
        if segment["runs"] == 0:
            return 0.0
        mention_rate = (segment["mentions"] / segment["runs"]) * 100
        citation_rate = min(100, (segment["citations"] / segment["runs"]) * 50)
        return round((mention_rate * 0.6 + citation_rate * 0.4), 2)
    
    for engine, data in by_engine.items():
        data["avg_score"] = compute_avg_score(data)
    for intent, data in by_intent.items():
        data["avg_score"] = compute_avg_score(data)
    for funnel, data in by_funnel.items():
        data["avg_score"] = compute_avg_score(data)
    for audience, data in by_audience.items():
        data["avg_score"] = compute_avg_score(data)
    for use_case, data in by_use_case.items():
        data["avg_score"] = compute_avg_score(data)
    for tier, data in by_tier.items():
        data["avg_score"] = compute_avg_score(data)
    for competitor, data in by_competitor.items():
        data["avg_score"] = compute_avg_score(data)
    
    return {
        "projectId": project_id,
        "totalEngineRuns": len(engine_runs),
        "byEngine": dict(by_engine),
        "byIntent": dict(by_intent),
        "byFunnelStage": dict(by_funnel),
        "byAudience": dict(by_audience),
        "byUseCase": dict(by_use_case),
        "byTier": {str(k): v for k, v in by_tier.items()},
        "byCompetitor": dict(by_competitor),
    }


@router.get("/opportunity-gaps/{project_id}")
def get_opportunity_gaps(project_id: str, scope=Depends(get_scoped_db)):
    """
    Identify opportunity gaps based on segmented scoring.
    Returns areas where the brand is underperforming.
    """
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    engine_runs = (
        db.query(EngineRun)
        .filter(EngineRun.project_id == project_id, EngineRun.run_status == "completed")
        .all()
    )
    
    prompt_ids = list({run.prompt_id for run in engine_runs})
    prompts = db.query(Prompt).filter(Prompt.id.in_(prompt_ids)).all() if prompt_ids else []
    prompt_map = {p.id: p for p in prompts}
    
    brand_lower = project.brand_name.lower()
    
    intent_performance: dict[str, dict] = defaultdict(lambda: {"total": 0, "mentions": 0})
    engine_performance: dict[str, dict] = defaultdict(lambda: {"total": 0, "mentions": 0})
    competitor_performance: dict[str, dict] = defaultdict(lambda: {"total": 0, "brand_wins": 0})
    
    for run in engine_runs:
        engine = run.engine_name or "unknown"
        prompt = prompt_map.get(run.prompt_id)
        response_text = run.response_text or ""
        
        has_brand_mention = brand_lower in response_text.lower()
        
        engine_performance[engine]["total"] += 1
        engine_performance[engine]["mentions"] += 1 if has_brand_mention else 0
        
        if prompt:
            intent = prompt.intent or "unknown"
            intent_performance[intent]["total"] += 1
            intent_performance[intent]["mentions"] += 1 if has_brand_mention else 0
            
            if prompt.competitor:
                competitor_performance[prompt.competitor]["total"] += 1
                competitor_lower = prompt.competitor.lower()
                competitor_mentioned = competitor_lower in response_text.lower()
                if has_brand_mention and not competitor_mentioned:
                    competitor_performance[prompt.competitor]["brand_wins"] += 1
    
    opportunity_gaps: list[dict] = []
    
    for engine, perf in engine_performance.items():
        if perf["total"] > 0:
            rate = (perf["mentions"] / perf["total"]) * 100
            if rate < 50:
                opportunity_gaps.append({
                    "dimension": "engine",
                    "value": engine,
                    "mentionRate": round(rate, 2),
                    "gap": round(50 - rate, 2),
                    "priority": "high" if rate < 30 else "medium",
                    "recommendation": f"Improve visibility on {engine}. Current mention rate is {round(rate, 1)}%.",
                })
    
    for intent, perf in intent_performance.items():
        if perf["total"] > 0:
            rate = (perf["mentions"] / perf["total"]) * 100
            if rate < 50:
                opportunity_gaps.append({
                    "dimension": "intent",
                    "value": intent,
                    "mentionRate": round(rate, 2),
                    "gap": round(50 - rate, 2),
                    "priority": "high" if intent in ["commercial", "comparison", "alternatives"] else "medium",
                    "recommendation": f"Strengthen content for {intent} queries. Current mention rate is {round(rate, 1)}%.",
                })
    
    for competitor, perf in competitor_performance.items():
        if perf["total"] > 0:
            win_rate = (perf["brand_wins"] / perf["total"]) * 100
            if win_rate < 50:
                opportunity_gaps.append({
                    "dimension": "competitor",
                    "value": competitor,
                    "winRate": round(win_rate, 2),
                    "gap": round(50 - win_rate, 2),
                    "priority": "high",
                    "recommendation": f"Improve competitive positioning against {competitor}. Current win rate is {round(win_rate, 1)}%.",
                })
    
    opportunity_gaps.sort(key=lambda x: x.get("gap", 0), reverse=True)
    
    return {
        "projectId": project_id,
        "totalGaps": len(opportunity_gaps),
        "gaps": opportunity_gaps[:20],
    }
