import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select

from app.configuration.models import Client, Project
from app.shared.repository import BaseRepository


class ClientRepository(BaseRepository[Client]):
    model = Client

    async def get_active_by_id(self, id: uuid.UUID) -> Client | None:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id, self.model.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def get_by_code_and_org(self, code: str, organization_id: uuid.UUID) -> Client | None:
        result = await self.session.execute(
            select(self.model).where(
                self.model.code == code,
                self.model.organization_id == organization_id,
                self.model.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_by_org(
        self,
        organization_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Client], int]:
        filters = [self.model.organization_id == organization_id, self.model.deleted_at.is_(None)]
        result = await self.session.execute(
            select(self.model)
            .where(*filters)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        count_result = await self.session.execute(select(func.count()).select_from(self.model).where(*filters))
        return list(result.scalars().all()), count_result.scalar_one()

    async def soft_delete(self, client: Client) -> None:
        client.deleted_at = datetime.now(UTC)
        await self.session.flush()


class ProjectRepository(BaseRepository[Project]):
    model = Project

    async def get_active_by_id(self, id: uuid.UUID) -> Project | None:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id, self.model.deleted_at.is_(None))
        )
        return result.scalar_one_or_none()

    async def list_by_org(
        self,
        organization_id: uuid.UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Project], int]:
        filters = [self.model.organization_id == organization_id, self.model.deleted_at.is_(None)]
        result = await self.session.execute(
            select(self.model)
            .where(*filters)
            .order_by(self.model.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        count_result = await self.session.execute(select(func.count()).select_from(self.model).where(*filters))
        return list(result.scalars().all()), count_result.scalar_one()

    async def count_active_by_client(self, organization_id: uuid.UUID, client_id: uuid.UUID) -> int:
        count_result = await self.session.execute(
            select(func.count()).select_from(self.model).where(
                self.model.organization_id == organization_id,
                self.model.client_id == client_id,
                self.model.deleted_at.is_(None),
            )
        )
        return count_result.scalar_one()

    async def soft_delete(self, project: Project) -> None:
        project.deleted_at = datetime.now(UTC)
        await self.session.flush()
