import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.repository import AuditEventRepository
from app.audit.schemas import AuditEventResponse


class AuditEventService:
    @staticmethod
    async def list(
        db: AsyncSession,
        org_id: uuid.UUID,
        skip: int,
        limit: int,
        entity_type: str | None = None,
        action: str | None = None,
    ) -> tuple[list[AuditEventResponse], int]:
        events, total = await AuditEventRepository(db).list_by_org(
            org_id,
            skip=skip,
            limit=limit,
            entity_type=entity_type,
            action=action,
        )
        return [AuditEventResponse.model_validate(event) for event in events], total
