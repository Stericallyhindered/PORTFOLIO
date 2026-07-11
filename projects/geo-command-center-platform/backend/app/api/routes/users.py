from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_scoped_db, require_role
from app.core.security import hash_password
from app.models.models import User
from app.schemas.geo import UserIn, UserOut

router = APIRouter()


@router.get("/", response_model=dict)
def list_users(scope=Depends(get_scoped_db)):
    db, org_id = scope
    rows = db.query(User).filter(User.organization_id == org_id).all()
    return {"items": [UserOut.model_validate(r).model_dump() for r in rows]}


@router.post("/", response_model=dict, dependencies=[Depends(require_role("admin"))])
def create_user(payload: UserIn, scope=Depends(get_scoped_db)):
    db, org_id = scope
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")
    row = User(
        organization_id=org_id,
        email=payload.email,
        name=payload.name,
        role=payload.role,
        hashed_password=hash_password(payload.password),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"item": UserOut.model_validate(row).model_dump()}
