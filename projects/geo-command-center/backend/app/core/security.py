from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _encode_token(payload: dict[str, Any], expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    to_encode = payload.copy()
    to_encode.update({"iat": int(now.timestamp()), "exp": int((now + expires_delta).timestamp())})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def create_access_token(subject: str, org_id: str, role: str) -> str:
    return _encode_token(
        {"sub": subject, "org_id": org_id, "role": role, "typ": "access"},
        timedelta(minutes=settings.ACCESS_TOKEN_MINUTES),
    )


def create_refresh_token(subject: str, org_id: str, role: str) -> str:
    return _encode_token(
        {"sub": subject, "org_id": org_id, "role": role, "typ": "refresh"},
        timedelta(minutes=settings.REFRESH_TOKEN_MINUTES),
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
    return payload
