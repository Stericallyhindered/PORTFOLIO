from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_scoped_db
from app.models.models import Organization
from app.schemas.geo import OrganizationIn, OrganizationOut
from app.db.session import get_db

router = APIRouter()


@router.get("/", response_model=dict)
def list_orgs(scope=Depends(get_scoped_db)):
    db, org_id = scope
    row = db.query(Organization).filter(Organization.id == org_id).first()
    return {"items": [OrganizationOut.model_validate(row).model_dump()] if row else []}


@router.post("/", response_model=dict)
def create_org(payload: OrganizationIn, db: Session = Depends(get_db)):
    # bootstrap route; intentionally not org-scoped
    existing = db.query(Organization).filter(Organization.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="Organization slug already exists")
    row = Organization(name=payload.name, slug=payload.slug, plan=payload.plan)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"item": OrganizationOut.model_validate(row).model_dump()}
