import uuid
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.configuration.schemas import ClientCreate, ClientUpdate, ProjectCreate, ProjectUpdate
from app.configuration.service import ClientService, ProjectService
from app.shared.exceptions import ConflictError, NotFoundError
from app.shared.responses import DeleteResponse


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
    monkeypatch.setattr(
        "app.configuration.service.AuditEventRepository", lambda session: audit_repo
    )

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
    repo.get_active_by_id.return_value = None
    monkeypatch.setattr("app.configuration.service.ClientRepository", lambda session: repo)

    with pytest.raises(NotFoundError):
        await ClientService.get(object(), uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_update_client_conflict(monkeypatch: pytest.MonkeyPatch) -> None:
    org_id = uuid.uuid4()
    client = SimpleNamespace(id=uuid.uuid4(), organization_id=org_id, code="ACME")
    repo = AsyncMock()
    repo.get_active_by_id.return_value = client
    repo.get_by_code_and_org.return_value = SimpleNamespace(id=uuid.uuid4())
    monkeypatch.setattr("app.configuration.service.ClientRepository", lambda session: repo)

    with pytest.raises(ConflictError):
        await ClientService.update(
            object(), org_id, uuid.uuid4(), client.id, ClientUpdate(code="NEW")
        )


@pytest.mark.asyncio
async def test_delete_client_returns_delete_response(monkeypatch: pytest.MonkeyPatch) -> None:
    org_id = uuid.uuid4()
    actor_id = uuid.uuid4()
    client = SimpleNamespace(id=uuid.uuid4(), organization_id=org_id, code="ACME", name="Acme")
    repo = AsyncMock()
    repo.get_active_by_id.return_value = client
    project_repo = AsyncMock()
    project_repo.count_active_by_client.return_value = 0
    audit_repo = AsyncMock()
    audit_repo.create_event.return_value = None

    monkeypatch.setattr("app.configuration.service.ClientRepository", lambda session: repo)
    monkeypatch.setattr("app.configuration.service.ProjectRepository", lambda session: project_repo)
    monkeypatch.setattr(
        "app.configuration.service.AuditEventRepository", lambda session: audit_repo
    )

    result = await ClientService.delete(object(), org_id, actor_id, client.id)

    assert result == DeleteResponse(id=client.id)
    repo.soft_delete.assert_awaited_once_with(client)
    audit_repo.create_event.assert_awaited_once()


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
    client_repo.get_active_by_id.return_value = client
    project_repo = AsyncMock()
    project_repo.create.return_value = created_project
    audit_repo = AsyncMock()
    audit_repo.create_event.return_value = None

    monkeypatch.setattr("app.configuration.service.ClientRepository", lambda session: client_repo)
    monkeypatch.setattr("app.configuration.service.ProjectRepository", lambda session: project_repo)
    monkeypatch.setattr(
        "app.configuration.service.AuditEventRepository", lambda session: audit_repo
    )

    result = await ProjectService.create(
        db,
        org_id,
        actor_id,
        ProjectCreate(
            client_id=client.id, name="Acme Project", code="PROJ", description="New project"
        ),
    )

    assert result.client_id == client.id
    client_repo.get_active_by_id.assert_awaited_once_with(client.id)
    project_repo.create.assert_awaited_once()
    audit_repo.create_event.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_project_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    repo = AsyncMock()
    repo.get_active_by_id.return_value = None
    monkeypatch.setattr("app.configuration.service.ProjectRepository", lambda session: repo)

    with pytest.raises(NotFoundError):
        await ProjectService.get(object(), uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_update_project_requires_active_client(monkeypatch: pytest.MonkeyPatch) -> None:
    org_id = uuid.uuid4()
    project = SimpleNamespace(id=uuid.uuid4(), organization_id=org_id)
    project_repo = AsyncMock()
    project_repo.get_active_by_id.return_value = project
    client_repo = AsyncMock()
    client_repo.get_active_by_id.return_value = None

    monkeypatch.setattr("app.configuration.service.ProjectRepository", lambda session: project_repo)
    monkeypatch.setattr("app.configuration.service.ClientRepository", lambda session: client_repo)

    with pytest.raises(NotFoundError):
        await ProjectService.update(
            AsyncMock(),
            org_id,
            uuid.uuid4(),
            project.id,
            ProjectUpdate(client_id=uuid.uuid4()),
        )


@pytest.mark.asyncio
async def test_delete_project_returns_delete_response(monkeypatch: pytest.MonkeyPatch) -> None:
    org_id = uuid.uuid4()
    actor_id = uuid.uuid4()
    project = SimpleNamespace(id=uuid.uuid4(), organization_id=org_id, code="PROJ", name="Project")
    repo = AsyncMock()
    repo.get_active_by_id.return_value = project
    audit_repo = AsyncMock()
    audit_repo.create_event.return_value = None

    monkeypatch.setattr("app.configuration.service.ProjectRepository", lambda session: repo)
    monkeypatch.setattr(
        "app.configuration.service.AuditEventRepository", lambda session: audit_repo
    )

    result = await ProjectService.delete(object(), org_id, actor_id, project.id)

    assert result == DeleteResponse(id=project.id)
    repo.soft_delete.assert_awaited_once_with(project)
    audit_repo.create_event.assert_awaited_once()
