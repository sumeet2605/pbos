import uuid
from collections.abc import Callable

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.identity.models import User
from app.identity.repository import UserRepository
from app.rbac.models import Permission, RolePermission, UserRole
from app.shared.exceptions import ForbiddenError, UnauthorizedError

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),  # noqa: B008
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated.")

    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type.")

    user_id = uuid.UUID(payload["sub"])
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive.")
    return user


async def get_current_org_id(current_user: User = Depends(get_current_user)) -> uuid.UUID:  # noqa: B008
    return current_user.organization_id


def require_permission(resource: str, action: str) -> Callable[..., User]:
    """Return a FastAPI dependency that ensures the current user holds a specific permission.

    Permission is granted when the user is a superuser OR when they have a role that
    carries a matching (resource, action) permission record within their organization.

    The join path is: UserRole -> RolePermission -> Permission.
    """

    async def _check(
        current_user: User = Depends(get_current_user),  # noqa: B008
        db: AsyncSession = Depends(get_db),  # noqa: B008
    ) -> User:
        if current_user.is_superuser:
            return current_user

        result = await db.execute(
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .join(UserRole, UserRole.role_id == RolePermission.role_id)
            .where(
                UserRole.user_id == current_user.id,
                or_(UserRole.organization_id == current_user.organization_id, UserRole.organization_id.is_(None)),
                or_(RolePermission.organization_id == current_user.organization_id, RolePermission.organization_id.is_(None)),
                Permission.resource == resource,
                Permission.action == action,
                or_(Permission.organization_id == current_user.organization_id, Permission.organization_id.is_(None)),
            )
        )
        if result.scalar_one_or_none() is None:
            raise ForbiddenError(f"Permission denied: {action} on {resource}.")
        return current_user

    return _check
