from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db
from app.models.models import Domain, Page, PageFeature, Project
from app.schemas.geo import PageFeatureOut, PageOut

router = APIRouter()


@router.get("/", response_model=dict)
def list_pages(project_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.organization_id == org_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    rows = (
        db.query(Page)
        .join(Domain, Domain.id == Page.domain_id)
        .filter(Domain.project_id == project_id)
        .all()
    )
    return {"items": [PageOut.model_validate(r).model_dump() for r in rows]}


@router.get("/{page_id}", response_model=dict)
def get_page(page_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    row = (
        db.query(Page)
        .join(Domain, Domain.id == Page.domain_id)
        .join(Project, Project.id == Domain.project_id)
        .filter(Page.id == page_id, Project.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"item": PageOut.model_validate(row).model_dump()}


@router.get("/{page_id}/features", response_model=dict)
def get_page_features(page_id: str, scope=Depends(get_scoped_db)):
    db, org_id = scope
    row = (
        db.query(PageFeature)
        .join(Page, Page.id == PageFeature.page_id)
        .join(Domain, Domain.id == Page.domain_id)
        .join(Project, Project.id == Domain.project_id)
        .filter(Page.id == page_id, Project.organization_id == org_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Page features not found")
    return {"item": PageFeatureOut.model_validate(row).model_dump()}
