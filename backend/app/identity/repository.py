import uuid

from sqlalchemy import select

from app.identity.models import User
from app.shared.repository import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email_and_org(self, email: str, organization_id: uuid.UUID) -> User | None:
        result = await self.session.execute(
            select(self.model).where(
                self.model.email == email,
                self.model.organization_id == organization_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_org(
        self,
        organization_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[User]:
        result = await self.session.execute(
            select(self.model)
            .where(self.model.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
