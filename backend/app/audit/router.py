import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.service import AuditEventService
from app.core.database import get_db
from app.core.deps import get_current_org_id, get_current_user
from app.identity.models import User
from app.shared.responses import APIResponse, paginated

router = APIRouter()


@router.get('/audit-events', response_model=APIResponse)
async def list_audit_events(
    skip: int = 0,
    limit: int = 20,
    entity_type: str | None = None,
    action: str | None = None,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _current_user: User = Depends(get_current_user),  # noqa: B008
    organization_id: uuid.UUID = Depends(get_current_org_id),  # noqa: B008
) -> APIResponse:
    events, total = await AuditEventService.list(
        db,
        organization_id,
        skip,
        limit,
        entity_type,
        action,
    )
    return paginated(
        [event.model_dump(mode='json') for event in events],
        total=total,
        page=(skip // limit) + 1 if limit else 1,
        page_size=limit,
    )
