from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import EngineRun, PipelineRun, Project, Recommendation
from worker.celery_app import celery

router = APIRouter()


@router.get("/")
def list_tasks(project_id: str | None = None, scope=Depends(get_scoped_db)):
    db, org_id = scope
    query = (
        db.query(Recommendation)
        .join(Project, Project.id == Recommendation.project_id)
        .filter(Project.organization_id == org_id)
    )
    if project_id:
        query = query.filter(Recommendation.project_id == project_id)
    rows = query.all()
    items = [
        {
            "id": row.id,
            "title": row.title,
            "type": row.category,
            "status": row.status,
            "priority": row.priority,
            "kind": "recommendation",
        }
        for row in rows
    ]

    runs_query = (
        db.query(PipelineRun)
        .join(Project, Project.id == PipelineRun.project_id)
        .filter(Project.organization_id == org_id)
    )
    if project_id:
        runs_query = runs_query.filter(PipelineRun.project_id == project_id)
    runs = runs_query.order_by(PipelineRun.started_at.desc()).limit(50).all()

    for run in runs:
        stale_cutoff = datetime.utcnow() - timedelta(minutes=30)
        if (
            run.status in {"queued", "running"}
            and run.started_at is not None
            and run.started_at < stale_cutoff
        ):
            run.status = "failed"
            run.completed_at = run.completed_at or datetime.utcnow()
            run.progress = min(float(run.progress or 0.0), 0.99)

        if run.status in {"queued", "running"} and run.celery_task_id:
            task_state = celery.AsyncResult(run.celery_task_id).state
            if task_state == "SUCCESS":
                run.status = "completed"
                run.progress = 1.0
                run.completed_at = run.completed_at or datetime.utcnow()
            elif task_state in {"FAILURE", "REVOKED"}:
                run.status = "failed"
                run.completed_at = run.completed_at or datetime.utcnow()
            elif task_state == "STARTED":
                run.status = "running"
        mapped_status = {
            "queued": "backlog",
            "running": "in_progress",
            "completed": "done",
            "failed": "blocked",
        }.get(run.status, "backlog")
        started_text = run.started_at.isoformat() if run.started_at else "n/a"
        failure_summary = None
        if run.status == "failed":
            related_failures = (
                db.query(EngineRun)
                .filter(
                    EngineRun.project_id == run.project_id,
                    EngineRun.run_status == "failed",
                )
                .order_by(EngineRun.completed_at.desc(), EngineRun.started_at.desc())
                .all()
            )
            matched = []
            for engine_run in related_failures:
                payload = engine_run.request_payload or {}
                payload_run_id = payload.get("run_id") if isinstance(payload, dict) else None
                if payload_run_id == run.id:
                    matched.append(engine_run)
            if matched:
                failure_summary = "; ".join(
                    [
                        f"{engine_run.engine_name}: {engine_run.error_message or 'failed'}"
                        for engine_run in matched[:5]
                    ]
                )
        items.append(
            {
                "id": f"pipeline:{run.id}",
                "title": f"Pipeline run for {run.domain} ({started_text})",
                "type": "pipeline",
                "status": mapped_status,
                "priority": None,
                "kind": "pipeline",
                "runStatus": run.status,
                "runId": run.id,
                "progress": run.progress,
                "startedAt": run.started_at.isoformat() if run.started_at else None,
                "completedAt": run.completed_at.isoformat() if run.completed_at else None,
                "failureSummary": failure_summary,
            }
        )

    db.commit()
    return items


@router.patch("/{task_id}")
def update_task(task_id: str, payload: dict, scope=Depends(get_scoped_db)):
    db, org_id = scope
    if task_id.startswith("pipeline:"):
        raise HTTPException(
            status_code=409,
            detail="Pipeline run status is system-managed and cannot be moved manually",
        )
    row = (
        db.query(Recommendation)
        .join(Project, Project.id == Recommendation.project_id)
        .filter(Recommendation.id == task_id, Project.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    status = str(payload.get("status", "")).strip()
    if not status:
        raise HTTPException(status_code=422, detail="status is required")
    row.status = status
    db.commit()
    return {"ok": True}


@router.delete("/{task_id}")
def delete_task(task_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    if task_id.startswith("pipeline:"):
        run_id = task_id.split("pipeline:", 1)[1]
        run = (
            db.query(PipelineRun)
            .join(Project, Project.id == PipelineRun.project_id)
            .filter(PipelineRun.id == run_id, Project.organization_id == org_id)
            .first()
        )
        if not run:
            raise HTTPException(status_code=404, detail="Pipeline run not found")
        if run.status in {"queued", "running"} and run.celery_task_id:
            celery.control.revoke(run.celery_task_id, terminate=True)
            run.status = "failed"
            run.completed_at = datetime.utcnow()
            db.commit()
        db.delete(run)
        db.commit()
        return {"ok": True}
    row = (
        db.query(Recommendation)
        .join(Project, Project.id == Recommendation.project_id)
        .filter(Recommendation.id == task_id, Project.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(row)
    db.commit()
    return {"ok": True}
