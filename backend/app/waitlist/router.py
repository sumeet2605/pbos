from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_permission
from app.identity.models import User
from app.shared.exceptions import ConflictError
from app.shared.responses import APIResponse, PaginatedAPIResponse, ok, paginated
from app.waitlist.repository import WaitlistRepository
from app.waitlist.schemas import WaitlistCreate, WaitlistResponse

router = APIRouter()


@router.post(
    "/waitlist",
    response_model=APIResponse[WaitlistResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit a waitlist signup",
    description="Register interest in ALRSCRM. Email must be unique.",
)
async def create_waitlist_signup(
    data: WaitlistCreate,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> APIResponse[WaitlistResponse]:
    repo = WaitlistRepository(db)
    existing = await repo.get_by_email(str(data.email))
    if existing is not None:
        raise ConflictError(f"Email '{data.email}' is already on the waitlist.")

    signup = await repo.create(**data.model_dump())
    return ok(WaitlistResponse.model_validate(signup))


@router.get(
    "/waitlist",
    response_model=PaginatedAPIResponse[WaitlistResponse],
    summary="List waitlist signups (admin only)",
    description="Returns paginated waitlist signups. Supports optional status filtering.",
)
async def list_waitlist_signups(
    skip: int = 0,
    limit: int = 20,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _current_user: User = Depends(require_permission("waitlist", "read")),  # noqa: B008
) -> PaginatedAPIResponse[WaitlistResponse]:
    repo = WaitlistRepository(db)
    signups, total = await repo.list_signups(skip=skip, limit=limit, status=status)
    items = [WaitlistResponse.model_validate(s) for s in signups]
    return paginated(
        items,
        total=total,
        page=(skip // limit) + 1 if limit else 1,
        page_size=limit,
    )
