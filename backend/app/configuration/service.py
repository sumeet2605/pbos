import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.repository import AuditEventRepository
from app.configuration.repository import ClientRepository, ProjectRepository
from app.configuration.schemas import (
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.shared.exceptions import ConflictError, NotFoundError


class ClientService:
    @staticmethod
    async def create(
        db: AsyncSession,
        org_id: uuid.UUID,
        actor_id: uuid.UUID,
        data: ClientCreate,
    ) -> ClientResponse:
        repo = ClientRepository(db)
        existing = await repo.get_by_code_and_org(data.code, org_id)
        if existing is not None:
            raise ConflictError("Client with this code already exists.")

        client = await repo.create(organization_id=org_id, **data.model_dump())
        await AuditEventRepository(db).create_event(
            organization_id=org_id,
            entity_type="client",
            entity_id=client.id,
            action="CLIENT_CREATE",
            actor_id=actor_id,
            details={"code": client.code, "name": client.name},
        )
        return ClientResponse.model_validate(client)

    @staticmethod
    async def list(
        db: AsyncSession,
        org_id: uuid.UUID,
        skip: int,
        limit: int,
    ) -> tuple[list[ClientResponse], int]:
        clients, total = await ClientRepository(db).list_by_org(org_id, skip=skip, limit=limit)
        return [ClientResponse.model_validate(client) for client in clients], total

    @staticmethod
    async def get(db: AsyncSession, org_id: uuid.UUID, id: uuid.UUID) -> ClientResponse:
        client = await ClientRepository(db).get_by_id(id)
        if client is None or client.organization_id != org_id:
            raise NotFoundError("Client", str(id))
        return ClientResponse.model_validate(client)

    @staticmethod
    async def update(
        db: AsyncSession,
        org_id: uuid.UUID,
        actor_id: uuid.UUID,
        id: uuid.UUID,
        data: ClientUpdate,
    ) -> ClientResponse:
        repo = ClientRepository(db)
        client = await repo.get_by_id(id)
        if client is None or client.organization_id != org_id:
            raise NotFoundError("Client", str(id))

        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in changes.items():
            setattr(client, field, value)
        await db.flush()
        await db.refresh(client)

        await AuditEventRepository(db).create_event(
            organization_id=org_id,
            entity_type="client",
            entity_id=client.id,
            action="CLIENT_UPDATE",
            actor_id=actor_id,
            details=changes or None,
        )
        return ClientResponse.model_validate(client)


class ProjectService:
    @staticmethod
    async def create(
        db: AsyncSession,
        org_id: uuid.UUID,
        actor_id: uuid.UUID,
        data: ProjectCreate,
    ) -> ProjectResponse:
        client = await ClientRepository(db).get_by_id(data.client_id)
        if client is None or client.organization_id != org_id:
            raise NotFoundError("Client", str(data.client_id))

        project = await ProjectRepository(db).create(organization_id=org_id, **data.model_dump())
        await AuditEventRepository(db).create_event(
            organization_id=org_id,
            entity_type="project",
            entity_id=project.id,
            action="PROJECT_CREATE",
            actor_id=actor_id,
            details={"code": project.code, "name": project.name},
        )
        return ProjectResponse.model_validate(project)

    @staticmethod
    async def list(
        db: AsyncSession,
        org_id: uuid.UUID,
        skip: int,
        limit: int,
    ) -> tuple[list[ProjectResponse], int]:
        projects, total = await ProjectRepository(db).list_by_org(org_id, skip=skip, limit=limit)
        return [ProjectResponse.model_validate(project) for project in projects], total

    @staticmethod
    async def get(db: AsyncSession, org_id: uuid.UUID, id: uuid.UUID) -> ProjectResponse:
        project = await ProjectRepository(db).get_by_id(id)
        if project is None or project.organization_id != org_id:
            raise NotFoundError("Project", str(id))
        return ProjectResponse.model_validate(project)

    @staticmethod
    async def update(
        db: AsyncSession,
        org_id: uuid.UUID,
        actor_id: uuid.UUID,
        id: uuid.UUID,
        data: ProjectUpdate,
    ) -> ProjectResponse:
        repo = ProjectRepository(db)
        project = await repo.get_by_id(id)
        if project is None or project.organization_id != org_id:
            raise NotFoundError("Project", str(id))

        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in changes.items():
            setattr(project, field, value)
        await db.flush()
        await db.refresh(project)

        await AuditEventRepository(db).create_event(
            organization_id=org_id,
            entity_type="project",
            entity_id=project.id,
            action="PROJECT_UPDATE",
            actor_id=actor_id,
            details=changes or None,
        )
        return ProjectResponse.model_validate(project)
