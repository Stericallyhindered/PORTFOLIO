from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_auth_context
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.models import User
from app.schemas.geo import AuthLoginIn, AuthTokens, UserIn

router = APIRouter()


@router.post("/login", response_model=AuthTokens)
def login(payload: AuthLoginIn, db: Session = Depends(get_db)):
    query = db.query(User).filter(User.email == payload.email)
    if payload.org_id:
        query = query.filter(User.organization_id == payload.org_id)
    user = query.first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return AuthTokens(
        access_token=create_access_token(user.id, user.organization_id, user.role),
        refresh_token=create_refresh_token(user.id, user.organization_id, user.role),
        user_id=user.id,
        org_id=user.organization_id,
        role=user.role,
    )


@router.post("/logout")
def logout():
    return {"ok": True}


@router.post("/register", response_model=dict)
def register(payload: UserIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")
    raise HTTPException(
        status_code=422,
        detail="Use /api/v1/users with org-scoped auth for user creation",
    )


@router.get("/me")
def me(auth=Depends(get_auth_context)):
    return auth
