import uuid

from sqlalchemy import func, select

from app.configuration.models import Client, Project
from app.shared.repository import BaseRepository


class ClientRepository(BaseRepository[Client]):
    model = Client

    async def get_by_code_and_org(self, code: str, organization_id: uuid.UUID) -> Client | None:
        result = await self.session.execute(
            select(self.model).where(
                self.model.code == code,
                self.model.organization_id == organization_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_org(
        self,
        organization_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Client], int]:
        result = await self.session.execute(
            select(self.model)
            .where(self.model.organization_id == organization_id)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        count_result = await self.session.execute(
            select(func.count()).select_from(self.model).where(self.model.organization_id == organization_id)
        )
        return list(result.scalars().all()), count_result.scalar_one()


class ProjectRepository(BaseRepository[Project]):
    model = Project

    async def list_by_org(
        self,
        organization_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Project], int]:
        result = await self.session.execute(
            select(self.model)
            .where(self.model.organization_id == organization_id)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        count_result = await self.session.execute(
            select(func.count()).select_from(self.model).where(self.model.organization_id == organization_id)
        )
        return list(result.scalars().all()), count_result.scalar_one()
