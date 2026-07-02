from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import Competitor, Project
from app.schemas.geo import CompetitorIn, CompetitorOut

router = APIRouter()

@router.get("/", response_model=dict)
def list_competitors(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    rows = db.query(Competitor).filter(Competitor.project_id == project_id).all()
    return {"items": [CompetitorOut.model_validate(r).model_dump() for r in rows]}


@router.post("/", response_model=dict)
def create_competitor(payload: CompetitorIn, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    row = Competitor(project_id=payload.project_id, name=payload.name, domain=payload.domain)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"item": CompetitorOut.model_validate(row).model_dump()}
