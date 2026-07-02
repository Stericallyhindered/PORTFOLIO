from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import EngineRun, GeoScore, Page, Project, Recommendation
from app.schemas.geo import RecommendationIn, RecommendationOut, RecommendationPatch

router = APIRouter()

@router.get("/", response_model=dict)
def list_recommendations(project_id: str | None = None, scope=Depends(get_scoped_db)):
    db, org_id = scope
    query = (
        db.query(Recommendation)
        .join(Project, Project.id == Recommendation.project_id)
        .filter(Project.organization_id == org_id)
    )
    if project_id:
        query = query.filter(Recommendation.project_id == project_id)
    rows = query.all()
    
    # Build page_id to URL mapping
    page_ids = [r.page_id for r in rows if r.page_id]
    page_url_map = {}
    if page_ids:
        pages = db.query(Page).filter(Page.id.in_(page_ids)).all()
        page_url_map = {p.id: p.url for p in pages}
    
    # Enrich recommendations with page URL
    items = []
    for r in rows:
        item = RecommendationOut.model_validate(r).model_dump()
        item["page_url"] = page_url_map.get(r.page_id) if r.page_id else None
        items.append(item)
    
    return {"items": items}


@router.post("/", response_model=dict)
def create_recommendation(payload: RecommendationIn, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    item = Recommendation(
        project_id=payload.project_id,
        page_id=payload.page_id,
        prompt_cluster_id=payload.prompt_cluster_id,
        category=payload.category,
        priority=payload.priority,
        title=payload.title,
        description=payload.description,
        rationale=payload.rationale,
        estimated_impact=payload.estimated_impact,
        status="open",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"item": RecommendationOut.model_validate(item).model_dump()}


@router.patch("/{recommendation_id}")
def update_recommendation(recommendation_id: str, payload: RecommendationPatch, scope=Depends(get_scoped_db)):
    db, org_id = scope
    row = (
        db.query(Recommendation)
        .join(Project, Project.id == Recommendation.project_id)
        .filter(Recommendation.id == recommendation_id, Project.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    row.status = payload.status
    row.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/generate-from-scores", response_model=dict)
def generate_from_scores(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    scores = db.query(GeoScore).filter(GeoScore.project_id == project_id).all()
    created = 0
    for score in scores:
        if (score.extractability_score or 0) < 60:
            db.add(
                Recommendation(
                    project_id=project_id,
                    page_id=score.page_id,
                    prompt_cluster_id=score.prompt_cluster_id,
                    category="content",
                    priority="high",
                    title="Improve direct-answer extractability",
                    description="Expose the primary answer and key facts in visible HTML near the top of the page.",
                    rationale="Low extractability reduces GEO citation likelihood across AI engines.",
                    estimated_impact=0.8,
                    status="open",
                )
            )
            created += 1
        if (score.citation_score or 0) < 50:
            db.add(
                Recommendation(
                    project_id=project_id,
                    page_id=score.page_id,
                    prompt_cluster_id=score.prompt_cluster_id,
                    category="authority",
                    priority="high",
                    title="Strengthen citation readiness",
                    description="Add explicit source-backed statements, FAQ entries, and schema alignment for quoted facts.",
                    rationale="Low citation scores indicate weak confidence signals for engine source selection.",
                    estimated_impact=0.75,
                    status="open",
                )
            )
            created += 1
    db.commit()
    return {"created": created}


@router.post("/clear", response_model=dict)
def clear_recommendations(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    count = db.query(Recommendation).filter(Recommendation.project_id == project_id).count()
    db.query(Recommendation).filter(Recommendation.project_id == project_id).delete()
    db.commit()
    return {"deletedCount": count}


@router.post("/bulk-delete", response_model=dict)
def bulk_delete_recommendations(payload: dict, scope=Depends(get_scoped_db)):
    db, org_id = scope
    ids = payload.get("ids") if isinstance(payload, dict) else None
    score_ids = payload.get("scoreIds") if isinstance(payload, dict) else None
    if not isinstance(ids, list) or len(ids) == 0:
        if not isinstance(score_ids, list) or len(score_ids) == 0:
            raise HTTPException(status_code=422, detail="ids or scoreIds are required")
    if isinstance(score_ids, list) and score_ids:
        score_rows = (
            db.query(GeoScore)
            .join(Project, Project.id == GeoScore.project_id)
            .filter(GeoScore.id.in_(score_ids), Project.organization_id == org_id)
            .all()
        )
        derived_rec_ids = {
            rec.id
            for score in score_rows
            for rec in db.query(Recommendation)
            .filter(Recommendation.project_id == score.project_id, Recommendation.page_id == score.page_id)
            .all()
        }
        if not isinstance(ids, list):
            ids = []
        ids = list(set([*ids, *list(derived_rec_ids)]))
    if not ids:
        return {"deletedCount": 0}
    rows = (
        db.query(Recommendation)
        .join(Project, Project.id == Recommendation.project_id)
        .filter(Recommendation.id.in_(ids), Project.organization_id == org_id)
        .all()
    )
    deleted = len(rows)
    for row in rows:
        db.delete(row)
    db.commit()
    return {"deletedCount": deleted}


@router.post("/purge-blended-history", response_model=dict)
def purge_blended_history(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    score_count = db.query(GeoScore).filter(GeoScore.project_id == project_id).count()
    rec_count = db.query(Recommendation).filter(Recommendation.project_id == project_id).count()
    run_count = db.query(EngineRun).filter(EngineRun.project_id == project_id).count()
    db.query(GeoScore).filter(GeoScore.project_id == project_id).delete()
    db.query(Recommendation).filter(Recommendation.project_id == project_id).delete()
    db.query(EngineRun).filter(EngineRun.project_id == project_id).delete()
    db.commit()
    return {
        "deletedAuditCount": score_count,
        "deletedPageCount": 0,
        "deletedDeliverableCount": run_count + rec_count,
    }
