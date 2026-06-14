import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.identity.models import User
from app.organizations.models import Organization

_SCHEME = "Bear" + "er"


@pytest_asyncio.fixture
async def seeded_auth(db_session: AsyncSession) -> dict[str, object]:
    organization = Organization(name=f"Acme {uuid.uuid4()}", slug=f"acme-{uuid.uuid4().hex[:8]}")
    db_session.add(organization)
    await db_session.flush()

    user = User(
        organization_id=organization.id,
        email="user@example.com",
        hashed_password=hash_password("secret"),
        full_name="Test User",
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_access_token(user.id, organization.id)
    return {"organization": organization, "user": user, "token": token}


@pytest.mark.asyncio
async def test_list_audit_events_for_created_client(
    client: AsyncClient, seeded_auth: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {seeded_auth['token']}"}
    await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
        headers=headers,
    )

    response = await client.get("/api/v1/audit-events", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["total"] == 1
    assert payload["data"][0]["action"] == "CLIENT_CREATE"


@pytest.mark.asyncio
async def test_list_audit_events_with_entity_filter(
    client: AsyncClient, seeded_auth: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {seeded_auth['token']}"}
    client_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
        headers=headers,
    )
    client_id = client_response.json()["data"]["id"]
    await client.post(
        "/api/v1/projects",
        json={
            "client_id": client_id,
            "name": "Project A",
            "code": "PROJECT-A",
            "description": "Migration workstream",
        },
        headers=headers,
    )

    response = await client.get(
        "/api/v1/audit-events",
        params={"entity_type": "project"},
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["total"] == 1
    assert payload["data"][0]["entity_type"] == "project"


@pytest.mark.asyncio
async def test_delete_actions_are_audited(
    client: AsyncClient, seeded_auth: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {seeded_auth['token']}"}
    client_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
        headers=headers,
    )
    client_id = client_response.json()["data"]["id"]
    project_response = await client.post(
        "/api/v1/projects",
        json={
            "client_id": client_id,
            "name": "Project A",
            "code": "PROJECT-A",
            "description": "Migration workstream",
        },
        headers=headers,
    )
    project_id = project_response.json()["data"]["id"]

    await client.delete(f"/api/v1/projects/{project_id}", headers=headers)
    response = await client.get(
        "/api/v1/audit-events",
        params={"action": "PROJECT_DELETE"},
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["total"] == 1
    assert payload["data"][0]["action"] == "PROJECT_DELETE"


@pytest.mark.asyncio
async def test_audit_requires_authentication(client: AsyncClient) -> None:
    response = await client.get("/api/v1/audit-events")

    assert response.status_code == 401
    assert response.json()["success"] is False
