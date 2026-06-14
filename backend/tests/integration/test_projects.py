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
        is_superuser=False,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_access_token(user.id, organization.id)
    return {"organization": organization, "user": user, "token": token}


@pytest.mark.asyncio
async def test_create_project_authenticated(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    headers = {"Authorization": f"{_SCHEME} {seeded_auth['token']}"}
    client_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
        headers=headers,
    )
    client_id = client_response.json()["data"]["id"]

    response = await client.post(
        "/api/v1/projects",
        json={
            "client_id": client_id,
            "name": "Project A",
            "code": "PROJECT-A",
            "description": "Primary project",
        },
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["name"] == "Project A"
    assert data["client_id"] == client_id


@pytest.mark.asyncio
async def test_list_projects(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
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
            "description": "Primary project",
        },
        headers=headers,
    )

    response = await client.get("/api/v1/projects", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["total"] == 1
    assert payload["data"][0]["code"] == "PROJECT-A"


@pytest.mark.asyncio
async def test_get_project_by_id(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
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
            "description": "Primary project",
        },
        headers=headers,
    )
    project_id = project_response.json()["data"]["id"]

    response = await client.get(f"/api/v1/projects/{project_id}", headers=headers)

    assert response.status_code == 200
    assert response.json()["data"]["id"] == project_id
