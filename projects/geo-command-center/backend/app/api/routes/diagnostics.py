"""
Diagnostics API endpoints for real-time pipeline monitoring.
Provides status, progress, and log streaming for pipeline runs.
"""
from datetime import datetime, timedelta
from typing import Optional

from celery.result import AsyncResult
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_scoped_db
from app.models.models import PipelineLog, PipelineRun, Project
from worker.celery_app import celery as celery_app

router = APIRouter()


@router.get("/status")
def get_diagnostics_status(
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    limit: int = Query(50, ge=1, le=200, description="Max log entries to return"),
    scope=Depends(get_scoped_db),
):
    """
    Get current pipeline status, active runs, and recent logs.
    Returns comprehensive diagnostics for the diagnostic console.
    """
    db: Session = scope[0]
    org_id: str = scope[1]
    
    # Get active pipelines (running or queued)
    active_query = (
        db.query(PipelineRun)
        .filter(PipelineRun.organization_id == org_id)
        .filter(PipelineRun.status.in_(["queued", "running", "crawling", "analyzing", "generating", "executing"]))
        .order_by(desc(PipelineRun.started_at))
    )
    
    if project_id:
        active_query = active_query.filter(PipelineRun.project_id == project_id)
    
    active_runs = active_query.limit(10).all()
    
    # Get recent completed runs
    recent_query = (
        db.query(PipelineRun)
        .filter(PipelineRun.organization_id == org_id)
        .filter(PipelineRun.status.in_(["completed", "failed"]))
        .order_by(desc(PipelineRun.completed_at))
    )
    
    if project_id:
        recent_query = recent_query.filter(PipelineRun.project_id == project_id)
    
    recent_runs = recent_query.limit(5).all()
    
    # Get logs for active runs
    active_run_ids = [r.id for r in active_runs]
    logs = []
    
    if active_run_ids:
        logs_query = (
            db.query(PipelineLog)
            .filter(PipelineLog.pipeline_run_id.in_(active_run_ids))
            .order_by(desc(PipelineLog.timestamp))
            .limit(limit)
        )
        logs = logs_query.all()
    
    # If no active runs, get logs from recent runs
    if not logs and recent_runs:
        recent_run_ids = [r.id for r in recent_runs[:2]]
        logs_query = (
            db.query(PipelineLog)
            .filter(PipelineLog.pipeline_run_id.in_(recent_run_ids))
            .order_by(desc(PipelineLog.timestamp))
            .limit(limit)
        )
        logs = logs_query.all()
    
    # Check Celery task status for active runs
    for run in active_runs:
        if run.celery_task_id:
            try:
                result = AsyncResult(run.celery_task_id, app=celery_app)
                if result.state == "FAILURE":
                    run.status = "failed"
                elif result.state == "SUCCESS" and run.status not in ["completed", "failed"]:
                    run.status = "completed"
            except Exception:
                pass
    
    # Get project names for context
    project_ids = set([r.project_id for r in active_runs + recent_runs])
    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
    project_map = {p.id: p.name for p in projects}
    
    # Check system health
    system_health = _check_system_health(db)
    
    return {
        "activePipelines": [
            {
                "id": r.id,
                "projectId": r.project_id,
                "projectName": project_map.get(r.project_id, "Unknown"),
                "domain": r.domain,
                "status": r.status,
                "progress": r.progress or 0.0,
                "targetTier": r.target_tier,
                "startedAt": r.started_at.isoformat() if r.started_at else None,
                "celeryTaskId": r.celery_task_id,
            }
            for r in active_runs
        ],
        "recentRuns": [
            {
                "id": r.id,
                "projectId": r.project_id,
                "projectName": project_map.get(r.project_id, "Unknown"),
                "domain": r.domain,
                "status": r.status,
                "progress": r.progress or 0.0,
                "startedAt": r.started_at.isoformat() if r.started_at else None,
                "completedAt": r.completed_at.isoformat() if r.completed_at else None,
                "failureSummary": r.failure_summary,
            }
            for r in recent_runs
        ],
        "logs": [
            {
                "id": log.id,
                "pipelineRunId": log.pipeline_run_id,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "level": log.level,
                "stage": log.stage,
                "message": log.message,
                "progress": log.progress,
                "details": log.details_json,
            }
            for log in reversed(logs)  # Oldest first for display
        ],
        "systemHealth": system_health,
    }


@router.get("/logs/{pipeline_run_id}")
def get_pipeline_logs(
    pipeline_run_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    scope=Depends(get_scoped_db),
):
    """Get logs for a specific pipeline run."""
    db: Session = scope[0]
    org_id: str = scope[1]
    
    # Verify run belongs to org
    run = (
        db.query(PipelineRun)
        .filter(PipelineRun.id == pipeline_run_id)
        .filter(PipelineRun.organization_id == org_id)
        .first()
    )
    
    if not run:
        return {"logs": [], "total": 0, "run": None}
    
    # Get logs
    total = (
        db.query(PipelineLog)
        .filter(PipelineLog.pipeline_run_id == pipeline_run_id)
        .count()
    )
    
    logs = (
        db.query(PipelineLog)
        .filter(PipelineLog.pipeline_run_id == pipeline_run_id)
        .order_by(PipelineLog.timestamp)
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    return {
        "run": {
            "id": run.id,
            "domain": run.domain,
            "status": run.status,
            "progress": run.progress,
            "startedAt": run.started_at.isoformat() if run.started_at else None,
            "completedAt": run.completed_at.isoformat() if run.completed_at else None,
        },
        "logs": [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "level": log.level,
                "stage": log.stage,
                "message": log.message,
                "progress": log.progress,
                "details": log.details_json,
            }
            for log in logs
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def _check_system_health(db: Session) -> dict:
    """Check health of database, Redis, and Celery."""
    from sqlalchemy import text
    
    health = {
        "database": "healthy",
        "redis": "unknown",
        "celery": "unknown",
    }
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        health["database"] = "healthy"
    except Exception as e:
        health["database"] = f"unhealthy: {str(e)[:50]}"
    
    # Check Celery/Redis
    try:
        inspector = celery_app.control.inspect()
        active = inspector.active()
        if active is not None:
            health["celery"] = "healthy"
            health["redis"] = "healthy"
            health["activeWorkers"] = len(active)
        else:
            health["celery"] = "no workers"
            health["redis"] = "healthy"
    except Exception as e:
        error_msg = str(e)[:50]
        if "redis" in error_msg.lower() or "connection" in error_msg.lower():
            health["redis"] = f"unhealthy: {error_msg}"
            health["celery"] = "unavailable"
        else:
            health["celery"] = f"unhealthy: {error_msg}"
    
    return health
