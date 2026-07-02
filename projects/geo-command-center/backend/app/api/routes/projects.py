from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import Project
from app.schemas.geo import ProjectIn, ProjectOut

router = APIRouter()


@router.get("/", response_model=dict)
def list_projects(scope=Depends(get_scoped_db)):
    db, org_id = scope
    rows = db.query(Project).filter(Project.organization_id == org_id).all()
    return {"items": [ProjectOut.model_validate(r).model_dump() for r in rows]}


@router.post("/", response_model=dict)
def create_project(payload: ProjectIn, scope=Depends(get_scoped_db)):
    db, org_id = scope
    existing = (
        db.query(Project)
        .filter(Project.organization_id == org_id, Project.slug == payload.slug)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Project slug already exists")
    item = Project(
        organization_id=org_id,
        name=payload.name,
        slug=payload.slug,
        brand_name=payload.brand_name,
        primary_domain=payload.primary_domain,
        locale=payload.locale,
        status="active",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"item": ProjectOut.model_validate(item).model_dump(), "status": "created"}


@router.get("/{project_id}", response_model=dict)
def get_project(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    row = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"item": ProjectOut.model_validate(row).model_dump()}
