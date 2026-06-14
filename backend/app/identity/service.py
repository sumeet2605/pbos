import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.repository import AuditEventRepository
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.identity.repository import UserRepository
from app.identity.schemas import TokenResponse
from app.organizations.repository import OrganizationRepository
from app.shared.exceptions import UnauthorizedError


class AuthService:
    @staticmethod
    async def login(
        db: AsyncSession,
        email: str,
        password: str,
        organization_slug: str,
    ) -> TokenResponse:
        organization_repo = OrganizationRepository(db)
        organization = await organization_repo.get_by_slug(organization_slug)
        if not organization or not organization.is_active:
            raise UnauthorizedError("Invalid credentials.")

        user_repo = UserRepository(db)
        user = await user_repo.get_by_email_and_org(email, organization.id)
        if not user or not user.is_active or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid credentials.")

        access_token = create_access_token(user.id, organization.id)
        refresh_token = create_refresh_token(user.id, organization.id)
        await AuditEventRepository(db).create_event(
            organization_id=organization.id,
            entity_type="user",
            entity_id=user.id,
            action="LOGIN",
            actor_id=user.id,
        )
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)

    @staticmethod
    async def refresh(db: AsyncSession, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type.")

        user_id = uuid.UUID(payload["sub"])
        organization_id = uuid.UUID(payload["org"])

        user = await UserRepository(db).get_by_id(user_id)
        if not user or not user.is_active or user.organization_id != organization_id:
            raise UnauthorizedError("User not found or inactive.")

        return TokenResponse(
            access_token=create_access_token(user.id, user.organization_id),
            refresh_token=create_refresh_token(user.id, user.organization_id),
        )
