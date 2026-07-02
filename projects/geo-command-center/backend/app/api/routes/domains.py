from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import Domain, Project
from app.schemas.geo import DomainIn, DomainOut

router = APIRouter()

@router.get("/", response_model=dict)
def list_domains(scope=Depends(get_scoped_db)):
    db, org_id = scope
    rows = (
        db.query(Domain)
        .join(Project, Project.id == Domain.project_id)
        .filter(Project.organization_id == org_id)
        .all()
    )
    return {"items": [DomainOut.model_validate(r).model_dump() for r in rows]}


@router.post("/", response_model=dict)
def create_domain(payload: DomainIn, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    existing = (
        db.query(Domain)
        .filter(Domain.project_id == payload.project_id, Domain.domain == payload.domain)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Domain already exists")
    item = Domain(
        project_id=payload.project_id,
        domain=payload.domain,
        is_primary=payload.is_primary,
        robots_status="unknown",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"item": DomainOut.model_validate(item).model_dump(), "status": "created"}
