from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.models import Organization, User

bearer_scheme = HTTPBearer(auto_error=False)


def _role_rank(role: str) -> int:
    hierarchy = {"viewer": 0, "analyst": 1, "admin": 2, "owner": 3}
    return hierarchy.get(role, -1)


def get_auth_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    x_org_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if credentials is not None:
        payload = decode_token(credentials.credentials)
        user_id = str(payload.get("sub") or "")
        org_id = str(payload.get("org_id") or "")
        role = str(payload.get("role") or "viewer")
        if not user_id or not org_id:
            raise HTTPException(status_code=401, detail="Token missing claims")
        user = (
            db.query(User)
            .filter(User.id == user_id, User.organization_id == org_id)
            .first()
        )
        if not user:
            raise HTTPException(status_code=403, detail="User organization mismatch")
        return {"user_id": user_id, "org_id": org_id, "role": role}

    # Local/dev compatibility mode for open access workflows.
    if settings.AUTH_ALLOW_HEADER_FALLBACK and x_org_id:
        org = db.query(Organization).filter(Organization.id == x_org_id).first()
        if not org:
            raise HTTPException(status_code=403, detail="Organization not found")
        return {"user_id": "header-fallback", "org_id": x_org_id, "role": "owner"}
    if settings.AUTH_ALLOW_HEADER_FALLBACK and settings.DEFAULT_ORG_ID:
        org = db.query(Organization).filter(Organization.id == settings.DEFAULT_ORG_ID).first()
        if org:
            return {
                "user_id": "default-org-fallback",
                "org_id": settings.DEFAULT_ORG_ID,
                "role": "owner",
            }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
    )


def get_current_org_id(x_org_id: str | None = Header(default=None)) -> str:
    if not x_org_id:
        raise HTTPException(status_code=401, detail="Missing x-org-id header")
    return x_org_id


def get_scoped_db(
    auth: dict[str, str] = Depends(get_auth_context), db: Session = Depends(get_db)
) -> tuple[Session, str]:
    org_id = auth["org_id"]
    exists = db.query(Organization).filter(Organization.id == org_id).first()
    if not exists:
        raise HTTPException(status_code=403, detail="Organization not found")
    return db, org_id


def require_role(min_role: str):
    def _dependency(auth: dict[str, str] = Depends(get_auth_context)) -> dict[str, str]:
        if _role_rank(auth["role"]) < _role_rank(min_role):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return auth

    return _dependency
