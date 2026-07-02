from fastapi import APIRouter, Depends, Query
import asyncio

from app.core.config import settings
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
    PageEntity,
    PageFeature,
    PageSnapshot,
    PipelineRun,
    Project,
    Prompt,
    PromptCluster,
    Recommendation,
    ReportExport,
)
from app.services.provider_adapters import (
    SUPPORTED_ENGINES,
    provider_configuration_status,
    run_healthchecks,
)

router = APIRouter()


@router.get("/providers")
def provider_status():
    return provider_configuration_status()


@router.get("/platform")
def platform_settings():
    return {
        "apiVersion": "v1",
        "environment": settings.ENVIRONMENT,
        "authHeaderFallbackEnabled": settings.AUTH_ALLOW_HEADER_FALLBACK,
        "engineDefaults": {
            "required": ["chatgpt", "google-ai-overviews", "perplexity", "gemini", "claude"],
            "retryPolicy": {"networkRetries": 3, "providerRetries": 2},
        },
    }


@router.get("/providers/diagnostics")
def provider_diagnostics(run_live: bool = Query(default=False), scope=Depends(get_scoped_db)):
    _db, _org_id = scope
    engines = SUPPORTED_ENGINES
    status = provider_status()
    diagnostics = []

    for engine in engines:
        configured = bool(status.get(engine, {}).get("configured"))
        item = {
            "engine": engine,
            "configured": configured,
            "provider": status.get(engine, {}).get("provider"),
            "liveStatus": "not-checked",
            "liveVerified": False,
            "lastErrorCode": None,
            "lastErrorMessage": None,
            "lastCheckedAt": None,
        }
        diagnostics.append(item)
        if not run_live or not configured:
            if not configured:
                item["liveStatus"] = "missing-key"
                item["lastErrorCode"] = "missing_key"
                item["lastErrorMessage"] = "Provider key is not configured."
            continue

    if run_live:
        health_results = {result.engine_name: result for result in asyncio.run(run_healthchecks(engines))}
        for item in diagnostics:
            if not item["configured"]:
                continue
            health = health_results.get(item["engine"])
            if health is None:
                item["liveStatus"] = "failed"
                item["lastErrorCode"] = "healthcheck_missing"
                item["lastErrorMessage"] = "No healthcheck result returned."
                continue
            item["liveVerified"] = bool(health.live_verified)
            item["lastCheckedAt"] = health.checked_at
            if health.live_verified:
                item["liveStatus"] = "ok"
            else:
                item["liveStatus"] = "failed"
                item["lastErrorCode"] = health.error_code
                item["lastErrorMessage"] = health.error_message

    return {"runLive": run_live, "engines": diagnostics}


@router.get("/engine-conversations")
def engine_conversations_log(
    project_id: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    scope=Depends(get_scoped_db),
):
    db, org_id = scope
    projects_query = db.query(Project.id).filter(Project.organization_id == org_id)
    if project_id:
        projects_query = projects_query.filter(Project.id == project_id)
    scoped_project_ids = [row.id for row in projects_query.all()]
    if not scoped_project_ids:
        return {"items": [], "total": 0}

    rows = (
        db.query(EngineRun, Project, Prompt)
        .join(Project, Project.id == EngineRun.project_id)
        .join(Prompt, Prompt.id == EngineRun.prompt_id)
        .filter(EngineRun.project_id.in_(scoped_project_ids))
        .order_by(EngineRun.started_at.desc())
        .limit(limit)
        .all()
    )

    run_ids = [engine_run.id for engine_run, _, _ in rows]
    citation_counts_by_run: dict[str, int] = {}
    if run_ids:
        citation_counts = (
            db.query(Citation.engine_run_id, Citation.id)
            .filter(Citation.engine_run_id.in_(run_ids))
            .all()
        )
        for run_id, _ in citation_counts:
            citation_counts_by_run[run_id] = citation_counts_by_run.get(run_id, 0) + 1

    items = []
    for engine_run, project, prompt in rows:
        response_json = engine_run.response_json or {}
        run_id = (
            (engine_run.request_payload or {}).get("run_id")
            if isinstance(engine_run.request_payload, dict)
            else None
        )
        items.append(
            {
                "id": engine_run.id,
                "projectId": project.id,
                "projectName": project.name,
                "website": project.primary_domain or "unknown-domain",
                "engine": engine_run.engine_name,
                "status": engine_run.run_status,
                "startedAt": engine_run.started_at.isoformat() if engine_run.started_at else None,
                "completedAt": engine_run.completed_at.isoformat() if engine_run.completed_at else None,
                "promptId": prompt.id,
                "promptText": prompt.prompt_text,
                "responseText": engine_run.response_text or "",
                "errorMessage": engine_run.error_message,
                "errorCode": response_json.get("errorCode") if isinstance(response_json, dict) else None,
                "runId": run_id,
                "citationCount": citation_counts_by_run.get(engine_run.id, 0),
            }
        )

    return {"items": items, "total": len(items)}


@router.post("/reset-workspace-data")
def reset_workspace_data(scope=Depends(get_scoped_db)):
    db, org_id = scope
    project_ids = [
        row.id for row in db.query(Project.id).filter(Project.organization_id == org_id).all()
    ]
    if not project_ids:
        return {"ok": True, "clearedProjects": 0}

    domain_ids = [row.id for row in db.query(Domain.id).filter(Domain.project_id.in_(project_ids)).all()]
    page_ids = [row.id for row in db.query(Page.id).filter(Page.domain_id.in_(domain_ids)).all()] if domain_ids else []
    cluster_ids = [
        row.id
        for row in db.query(PromptCluster.id).filter(PromptCluster.project_id.in_(project_ids)).all()
    ]
    prompt_ids = [row.id for row in db.query(Prompt.id).filter(Prompt.prompt_cluster_id.in_(cluster_ids)).all()] if cluster_ids else []
    run_ids = [row.id for row in db.query(EngineRun.id).filter(EngineRun.project_id.in_(project_ids)).all()]
    entity_ids = [row.id for row in db.query(Entity.id).filter(Entity.project_id.in_(project_ids)).all()]

    if run_ids:
        db.query(Citation).filter(Citation.engine_run_id.in_(run_ids)).delete(synchronize_session=False)
        db.query(Mention).filter(Mention.engine_run_id.in_(run_ids)).delete(synchronize_session=False)
    db.query(EngineRun).filter(EngineRun.project_id.in_(project_ids)).delete(synchronize_session=False)

    db.query(Recommendation).filter(Recommendation.project_id.in_(project_ids)).delete(synchronize_session=False)
    db.query(GeoScore).filter(GeoScore.project_id.in_(project_ids)).delete(synchronize_session=False)
    db.query(ReportExport).filter(ReportExport.project_id.in_(project_ids)).delete(synchronize_session=False)
    db.query(PipelineRun).filter(PipelineRun.project_id.in_(project_ids)).delete(synchronize_session=False)
    db.query(Competitor).filter(Competitor.project_id.in_(project_ids)).delete(synchronize_session=False)

    if page_ids:
        db.query(PageEntity).filter(PageEntity.page_id.in_(page_ids)).delete(synchronize_session=False)
        db.query(PageFeature).filter(PageFeature.page_id.in_(page_ids)).delete(synchronize_session=False)
        db.query(PageSnapshot).filter(PageSnapshot.page_id.in_(page_ids)).delete(synchronize_session=False)
        db.query(Page).filter(Page.id.in_(page_ids)).delete(synchronize_session=False)

    if entity_ids:
        db.query(PageEntity).filter(PageEntity.entity_id.in_(entity_ids)).delete(synchronize_session=False)
        db.query(Entity).filter(Entity.id.in_(entity_ids)).delete(synchronize_session=False)

    if prompt_ids:
        db.query(EngineRun).filter(EngineRun.prompt_id.in_(prompt_ids)).delete(synchronize_session=False)
        db.query(Prompt).filter(Prompt.id.in_(prompt_ids)).delete(synchronize_session=False)

    if cluster_ids:
        db.query(PromptCluster).filter(PromptCluster.id.in_(cluster_ids)).delete(synchronize_session=False)

    if domain_ids:
        db.query(Domain).filter(Domain.id.in_(domain_ids)).delete(synchronize_session=False)

    db.query(Project).filter(Project.id.in_(project_ids)).delete(synchronize_session=False)
    db.commit()
    return {"ok": True, "clearedProjects": len(project_ids)}
