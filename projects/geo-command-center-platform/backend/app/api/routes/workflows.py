from fastapi import APIRouter, Depends, HTTPException
import json
from pathlib import Path

from app.api.deps import get_scoped_db
from app.models.models import PipelineRun, Project, ReportExport
from app.services.provider_preflight import evaluate_required_engine_preflight
from app.services.prompt_engine import generate_prompt_clusters
from app.schemas.geo import PromptClusterGenerateIn
from worker.tasks import run_full_geo_pipeline

router = APIRouter()


@router.post("/website-audit")
def website_audit(payload: dict, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project_id = str(payload.get("project_id") or "")
    website_url = str(payload.get("website_url") or payload.get("domain") or "").strip()
    if not project_id or not website_url:
        raise HTTPException(status_code=422, detail="project_id and website_url are required")
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    preflight = evaluate_required_engine_preflight()
    if not preflight["ok"]:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Provider preflight failed. Fix required engines before running website audit.",
                **preflight,
            },
        )
    run = PipelineRun(
        organization_id=org_id,
        project_id=project_id,
        domain=website_url,
        run_folder=f"{website_url}-{project_id}",
        status="queued",
        progress=0.0,
    )
    db.add(run)
    db.flush()
    task = run_full_geo_pipeline.delay(project_id, website_url, org_id, run.id)
    run.celery_task_id = task.id
    db.commit()
    return {
        "clientName": project.name,
        "websiteUrl": website_url,
        "auditedPages": 0,
        "jobId": task.id,
        "run_id": run.id,
    }


@router.post("/full-geo-pipeline")
def full_geo_pipeline(payload: dict, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project_id = str(payload.get("project_id") or "")
    website_url = str(payload.get("website_url") or payload.get("domain") or "").strip()
    target_tier = str(payload.get("target_tier") or "core").lower()
    
    if target_tier not in ("core", "expanded", "deep"):
        target_tier = "core"
    
    if not project_id or not website_url:
        raise HTTPException(status_code=422, detail="project_id and website_url are required")
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    preflight = evaluate_required_engine_preflight()
    if not preflight["ok"]:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Provider preflight failed. Fix required engines before running full pipeline.",
                **preflight,
            },
        )
    run = PipelineRun(
        organization_id=org_id,
        project_id=project_id,
        domain=website_url,
        run_folder=f"{website_url}-{project_id}",
        status="queued",
        progress=0.0,
        target_tier=target_tier,
    )
    db.add(run)
    db.flush()
    task = run_full_geo_pipeline.delay(project_id, website_url, org_id, run.id, target_tier)
    run.celery_task_id = task.id
    db.commit()
    return {
        "auditedPages": 0,
        "trackedQueries": 0,
        "visibilityMetricRows": 0,
        "jobId": task.id,
        "run_id": run.id,
        "target_tier": target_tier,
    }


@router.post("/geo-package")
def geo_package(payload: dict, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project_id = str(payload.get("project_id") or "")
    if not project_id:
        raise HTTPException(status_code=422, detail="project_id is required")
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    storage_path = Path(f"artifacts/packages/{org_id}/{project_id}/geo-package.json")
    storage_path.parent.mkdir(parents=True, exist_ok=True)
    package_payload = {
        "kind": "geo_package",
        "projectId": project_id,
        "brandName": project.brand_name,
        "primaryDomain": project.primary_domain,
        "generatedAt": str(payload.get("generated_at") or ""),
        "schemaRecommendations": [
            {"type": "Organization"},
            {"type": "Service"},
            {"type": "FAQPage"},
        ],
    }
    storage_path.write_text(json.dumps(package_payload, indent=2), encoding="utf-8")
    export = ReportExport(
        project_id=project_id,
        report_type="geo_package_json",
        storage_path=str(storage_path),
    )
    db.add(export)
    db.commit()
    db.refresh(export)
    return {"deliverableId": export.id}


@router.post("/prompt-pack")
def prompt_pack(payload: dict, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project_id = str(payload.get("project_id") or "")
    if not project_id:
        raise HTTPException(status_code=422, detail="project_id is required")
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    generated = generate_prompt_clusters(
        PromptClusterGenerateIn(
            project_id=project_id,
            brand_name=project.brand_name,
            primary_domain=project.primary_domain or "",
            competitors=[],
            topics=[project.brand_name, "generative engine optimization"],
        )
    )
    storage_path = Path(f"artifacts/packages/{org_id}/{project_id}/prompt-pack.json")
    storage_path.parent.mkdir(parents=True, exist_ok=True)
    storage_path.write_text(
        json.dumps(
            {
                "kind": "prompt_pack",
                "projectId": project_id,
                "clusterCount": len(generated),
                "clusters": [cluster.model_dump() for cluster in generated],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    export = ReportExport(
        project_id=project_id,
        report_type="prompt_pack_json",
        storage_path=str(storage_path),
    )
    db.add(export)
    db.commit()
    db.refresh(export)
    return {"promptPackId": export.id, "clusters": len(generated)}
