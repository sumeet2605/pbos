import uuid

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
