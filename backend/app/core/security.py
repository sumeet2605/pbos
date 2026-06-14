import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings
from app.shared.exceptions import UnauthorizedError


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(
    subject: uuid.UUID,
    organization_id: uuid.UUID,
    extra: dict[str, Any] | None = None,
) -> str:
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "org": str(organization_id),
        "type": "access",
        "exp": expires_at,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(subject: uuid.UUID, organization_id: uuid.UUID) -> tuple[str, str]:
    """Return (encoded_token, jti) so callers can persist the JTI."""
    jti = str(uuid.uuid4())
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "org": str(organization_id),
        "type": "refresh",
        "jti": jti,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm), jti


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise UnauthorizedError("Could not validate credentials.") from exc

    if not payload.get("sub") or not payload.get("org"):
        raise UnauthorizedError("Could not validate credentials.")
    return payload
