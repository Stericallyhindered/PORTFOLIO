"""
Observability API - Metrics, caching, and pipeline health endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import Prompt, PromptCluster
from app.services.prompt_graph import (
    get_cache_stats,
    clear_cache,
    get_all_active_metrics,
    get_pipeline_metrics,
    complete_pipeline_metrics,
    estimate_execution_time,
)

router = APIRouter()


@router.get("/cache/stats")
def cache_stats():
    """Get current cache statistics."""
    return get_cache_stats()


@router.post("/cache/clear")
def cache_clear():
    """Clear all cached entries."""
    clear_cache()
    return {"status": "cleared"}


@router.get("/metrics/active")
def active_metrics():
    """Get all active pipeline metrics."""
    return get_all_active_metrics()


@router.get("/metrics/run/{run_id}")
def run_metrics(run_id: str):
    """Get metrics for a specific pipeline run."""
    metrics = get_pipeline_metrics(run_id)
    if not metrics:
        return {"error": "No metrics found for this run"}
    return metrics.to_dict()


@router.post("/metrics/complete/{run_id}")
def complete_run_metrics(run_id: str):
    """Complete and return metrics for a pipeline run."""
    metrics = complete_pipeline_metrics(run_id)
    if not metrics:
        return {"error": "No metrics found for this run"}
    return metrics.to_dict()


@router.get("/health/pipeline")
def pipeline_health():
    """Get overall pipeline health status."""
    cache = get_cache_stats()
    active = get_all_active_metrics()
    
    active_runs = len(active)
    total_prompts_in_flight = sum(
        m.get("prompts", {}).get("executed", 0)
        for m in active.values()
    )
    
    return {
        "status": "healthy" if active_runs < 10 else "busy",
        "active_runs": active_runs,
        "prompts_in_flight": total_prompts_in_flight,
        "cache": {
            "entries": cache.get("total_entries", 0),
            "hit_rate": cache.get("hit_rate", 0),
        },
    }


@router.get("/estimate/{project_id}")
def estimate_run(
    project_id: str,
    tier: str = "core",
    scope=Depends(get_scoped_db),
):
    """Estimate execution time for a pipeline run."""
    db, org_id = scope
    
    cluster = (
        db.query(PromptCluster)
        .filter(PromptCluster.project_id == project_id)
        .order_by(PromptCluster.created_at.desc())
        .first()
    )
    
    if not cluster:
        num_prompts = {
            "core": 750,
            "expanded": 2500,
            "deep": 9000,
        }.get(tier, 750)
    else:
        num_prompts = (
            db.query(Prompt)
            .filter(Prompt.cluster_id == cluster.id)
            .count()
        )
    
    num_engines = 5
    
    estimate = estimate_execution_time(
        num_prompts=num_prompts,
        num_engines=num_engines,
        tier=tier,
    )
    
    return {
        "project_id": project_id,
        "tier": tier,
        **estimate,
    }
