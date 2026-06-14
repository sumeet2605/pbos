import redis.asyncio as aioredis
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.redis import get_redis
from app.identity.models import User
from app.identity.schemas import LoginRequest, RefreshRequest, TokenResponse, UserResponse
from app.identity.service import AuthService
from app.shared.responses import APIResponse, ok

router = APIRouter()


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    redis: aioredis.Redis = Depends(get_redis),  # noqa: B008
) -> APIResponse[TokenResponse]:
    tokens = await AuthService.login(db, data.email, data.password, data.organization_slug, redis)
    return ok(tokens)


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    redis: aioredis.Redis = Depends(get_redis),  # noqa: B008
) -> APIResponse[TokenResponse]:
    tokens = await AuthService.refresh(db, data.refresh_token, redis)
    return ok(tokens)


@router.post("/logout", status_code=204)
async def logout(
    data: RefreshRequest,
    redis: aioredis.Redis = Depends(get_redis),  # noqa: B008
) -> None:
    await AuthService.logout(data.refresh_token, redis)


@router.get("/me", response_model=APIResponse[UserResponse])
async def me(
    current_user: User = Depends(get_current_user),  # noqa: B008
) -> APIResponse[UserResponse]:
    return ok(UserResponse.model_validate(current_user))
