import uuid

from sqlalchemy import func, select

from app.audit.models import AuditEvent
from app.shared.repository import BaseRepository


class AuditEventRepository(BaseRepository[AuditEvent]):
    model = AuditEvent

    async def create_event(
        self,
        organization_id: uuid.UUID,
        entity_type: str,
        entity_id: uuid.UUID,
        action: str,
        actor_id: uuid.UUID | None = None,
        details: dict | None = None,
    ) -> AuditEvent:
        return await self.create(
            organization_id=organization_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor_id=actor_id,
            details=details,
        )

    async def list_by_org(
        self,
        organization_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
        entity_type: str | None = None,
        action: str | None = None,
    ) -> tuple[list[AuditEvent], int]:
        filters = [self.model.organization_id == organization_id]
        if entity_type:
            filters.append(self.model.entity_type == entity_type)
        if action:
            filters.append(self.model.action == action)

        result = await self.session.execute(
            select(self.model)
            .where(*filters)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        count_result = await self.session.execute(
            select(func.count()).select_from(self.model).where(*filters)
        )
        return list(result.scalars().all()), count_result.scalar_one()
