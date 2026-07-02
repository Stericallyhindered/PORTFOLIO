from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import Citation, EngineRun, Project
from app.schemas.geo import CitationOut

router = APIRouter()


@router.get("/", response_model=dict)
def list_citations(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    rows = (
        db.query(Citation)
        .join(EngineRun, EngineRun.id == Citation.engine_run_id)
        .filter(EngineRun.project_id == project_id)
        .all()
    )
    return {"items": [CitationOut.model_validate(r).model_dump() for r in rows]}
