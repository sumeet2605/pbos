from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.identity.models import User
from app.identity.schemas import LoginRequest, RefreshRequest, UserResponse
from app.identity.service import AuthService
from app.shared.responses import APIResponse, ok

router = APIRouter()


@router.post("/login", response_model=APIResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)) -> APIResponse:
    tokens = await AuthService.login(db, data.email, data.password, data.organization_slug)
    return ok(tokens.model_dump(mode="json"))


@router.post("/refresh", response_model=APIResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)) -> APIResponse:
    tokens = await AuthService.refresh(db, data.refresh_token)
    return ok(tokens.model_dump(mode="json"))


@router.get("/me", response_model=APIResponse)
async def me(current_user: User = Depends(get_current_user)) -> APIResponse:
    return ok(UserResponse.model_validate(current_user).model_dump(mode="json"))
