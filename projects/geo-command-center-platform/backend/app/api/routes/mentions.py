from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import EngineRun, Mention, Project
from app.schemas.geo import MentionOut

router = APIRouter()


@router.get("/", response_model=dict)
def list_mentions(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    rows = (
        db.query(Mention)
        .join(EngineRun, EngineRun.id == Mention.engine_run_id)
        .filter(EngineRun.project_id == project_id)
        .all()
    )
    return {"items": [MentionOut.model_validate(r).model_dump() for r in rows]}
