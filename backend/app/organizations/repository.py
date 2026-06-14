from sqlalchemy import select

from app.organizations.models import Organization
from app.shared.repository import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):
    model = Organization

    async def get_by_slug(self, slug: str) -> Organization | None:
        result = await self.session.execute(select(self.model).where(self.model.slug == slug))
        return result.scalar_one_or_none()
