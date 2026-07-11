from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import Domain, PipelineRun, Project
from app.schemas.geo import CrawlStartIn, CrawlStatusOut
from app.services.provider_preflight import evaluate_required_engine_preflight
from worker.tasks import run_crawl_pipeline, run_full_geo_pipeline

router = APIRouter()


@router.post("/start", response_model=CrawlStatusOut)
def start_crawl(payload: CrawlStartIn, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    domain = (
        db.query(Domain)
        .filter(Domain.project_id == payload.project_id, Domain.domain == payload.domain)
        .first()
    )
    if not domain:
        domain = Domain(project_id=payload.project_id, domain=payload.domain, is_primary=True)
        db.add(domain)
        db.flush()
    existing_run = (
        db.query(PipelineRun)
        .filter(
            PipelineRun.organization_id == org_id,
            PipelineRun.project_id == payload.project_id,
            PipelineRun.domain == payload.domain,
            PipelineRun.status.in_(["queued", "running"]),
        )
        .first()
    )
    if existing_run:
        return CrawlStatusOut(
            project_id=payload.project_id,
            status=existing_run.status,
            progress=existing_run.progress,
            run_id=existing_run.id,
        )
    run_folder = f"{payload.domain}-{project.id}-{int(project.updated_at.timestamp())}"
    run = PipelineRun(
        organization_id=org_id,
        project_id=payload.project_id,
        domain=payload.domain,
        run_folder=run_folder,
        status="queued",
        progress=0.0,
    )
    db.add(run)
    db.flush()
    async_result = run_crawl_pipeline.delay(payload.project_id, payload.domain, org_id)
    run.celery_task_id = async_result.id
    db.commit()
    return CrawlStatusOut(
        project_id=payload.project_id,
        status="queued",
        progress=0.0,
        run_id=run.id,
    )


@router.get("/status/{project_id}")
def crawl_status(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    run = (
        db.query(PipelineRun)
        .filter(PipelineRun.project_id == project_id, PipelineRun.organization_id == org_id)
        .order_by(PipelineRun.started_at.desc())
        .first()
    )
    if not run:
        return CrawlStatusOut(project_id=project_id, status="idle", progress=0.0)
    return CrawlStatusOut(
        project_id=project_id, status=run.status, progress=run.progress, run_id=run.id
    )


SUPPORTED_ENGINES = ["chatgpt", "perplexity", "gemini", "google-ai-overviews", "claude"]


@router.post("/full-pipeline", response_model=CrawlStatusOut)
def run_full_pipeline(payload: dict, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project_id = str(payload.get("project_id") or "")
    domain = str(payload.get("domain") or "")
    target_tier = str(payload.get("target_tier") or "core").lower()
    max_prompts = payload.get("max_prompts")
    selected_engines = payload.get("selected_engines")
    
    if target_tier not in ("core", "expanded", "deep"):
        target_tier = "core"
    
    if max_prompts is not None:
        try:
            max_prompts = int(max_prompts)
            if max_prompts < 1:
                max_prompts = None
            elif max_prompts > 15000:
                max_prompts = 15000
        except (ValueError, TypeError):
            max_prompts = None
    
    if selected_engines is not None:
        if isinstance(selected_engines, list):
            selected_engines = [e for e in selected_engines if e in SUPPORTED_ENGINES]
            if len(selected_engines) == 0:
                selected_engines = None
        else:
            selected_engines = None
    
    if not project_id or not domain:
        raise HTTPException(status_code=422, detail="project_id and domain are required")
    
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    engines_to_check = selected_engines if selected_engines else SUPPORTED_ENGINES
    skip_preflight = payload.get("skip_preflight", False)
    
    if not skip_preflight:
        preflight = evaluate_required_engine_preflight(engines_to_check)
        if not preflight["ok"]:
            # Log the preflight failure for debugging
            import logging
            logging.warning(f"Preflight failed for engines {engines_to_check}: {preflight}")
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Provider preflight failed. Fix required engines before running pipeline.",
                    **preflight,
                },
            )
    
    run_folder = f"{domain}-{project.id}-{int(project.updated_at.timestamp())}"
    run = PipelineRun(
        organization_id=org_id,
        project_id=project_id,
        domain=domain,
        run_folder=run_folder,
        status="queued",
        progress=0.0,
        target_tier=target_tier,
    )
    db.add(run)
    db.flush()
    
    async_result = run_full_geo_pipeline.delay(
        project_id, 
        domain, 
        org_id, 
        run.id, 
        target_tier,
        max_prompts,
        selected_engines,
    )
    run.celery_task_id = async_result.id
    db.commit()
    return CrawlStatusOut(
        project_id=project_id,
        status="queued",
        progress=0.0,
        run_id=run.id,
    )
