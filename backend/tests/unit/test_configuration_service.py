import uuid
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.configuration.schemas import ClientCreate, ProjectCreate
from app.configuration.service import ClientService, ProjectService
from app.shared.exceptions import ConflictError, NotFoundError


@pytest.mark.asyncio
async def test_create_client_success(monkeypatch: pytest.MonkeyPatch) -> None:
    db = object()
    org_id = uuid.uuid4()
    actor_id = uuid.uuid4()
    created_client = SimpleNamespace(
        id=uuid.uuid4(),
        organization_id=org_id,
        name="Acme Client",
        code="ACME",
        description="Important client",
        status="active",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    repo = AsyncMock()
    repo.get_by_code_and_org.return_value = None
    repo.create.return_value = created_client
    audit_repo = AsyncMock()
    audit_repo.create_event.return_value = None

    monkeypatch.setattr("app.configuration.service.ClientRepository", lambda session: repo)
    monkeypatch.setattr("app.configuration.service.AuditEventRepository", lambda session: audit_repo)

    result = await ClientService.create(
        db,
        org_id,
        actor_id,
        ClientCreate(name="Acme Client", code="ACME", description="Important client"),
    )

    assert result.code == "ACME"
    repo.get_by_code_and_org.assert_awaited_once_with("ACME", org_id)
    repo.create.assert_awaited_once()
    audit_repo.create_event.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_client_conflict(monkeypatch: pytest.MonkeyPatch) -> None:
    repo = AsyncMock()
    repo.get_by_code_and_org.return_value = SimpleNamespace(id=uuid.uuid4())
    monkeypatch.setattr("app.configuration.service.ClientRepository", lambda session: repo)

    with pytest.raises(ConflictError):
        await ClientService.create(
            object(),
            uuid.uuid4(),
            uuid.uuid4(),
            ClientCreate(name="Acme", code="DUPL"),
        )


@pytest.mark.asyncio
async def test_get_client_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    repo = AsyncMock()
    repo.get_by_id.return_value = None
    monkeypatch.setattr("app.configuration.service.ClientRepository", lambda session: repo)

    with pytest.raises(NotFoundError):
        await ClientService.get(object(), uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_create_project_success(monkeypatch: pytest.MonkeyPatch) -> None:
    db = AsyncMock()
    org_id = uuid.uuid4()
    actor_id = uuid.uuid4()
    client = SimpleNamespace(id=uuid.uuid4(), organization_id=org_id)
    created_project = SimpleNamespace(
        id=uuid.uuid4(),
        organization_id=org_id,
        client_id=client.id,
        name="Acme Project",
        code="PROJ",
        description="New project",
        status="active",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    client_repo = AsyncMock()
    client_repo.get_by_id.return_value = client
    project_repo = AsyncMock()
    project_repo.create.return_value = created_project
    audit_repo = AsyncMock()
    audit_repo.create_event.return_value = None

    monkeypatch.setattr("app.configuration.service.ClientRepository", lambda session: client_repo)
    monkeypatch.setattr("app.configuration.service.ProjectRepository", lambda session: project_repo)
    monkeypatch.setattr("app.configuration.service.AuditEventRepository", lambda session: audit_repo)

    result = await ProjectService.create(
        db,
        org_id,
        actor_id,
        ProjectCreate(client_id=client.id, name="Acme Project", code="PROJ", description="New project"),
    )

    assert result.client_id == client.id
    client_repo.get_by_id.assert_awaited_once_with(client.id)
    project_repo.create.assert_awaited_once()
    audit_repo.create_event.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_project_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    repo = AsyncMock()
    repo.get_by_id.return_value = None
    monkeypatch.setattr("app.configuration.service.ProjectRepository", lambda session: repo)

    with pytest.raises(NotFoundError):
        await ProjectService.get(object(), uuid.uuid4(), uuid.uuid4())
