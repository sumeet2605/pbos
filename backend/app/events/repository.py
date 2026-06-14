from app.events.models import DomainEvent
from app.shared.repository import BaseRepository


class DomainEventRepository(BaseRepository[DomainEvent]):
    model = DomainEvent
