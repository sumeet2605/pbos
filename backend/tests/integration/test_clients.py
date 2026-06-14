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
async def test_create_client_authenticated(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    headers = {"Authorization": f"{_SCHEME} {seeded_auth['token']}"}
    response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["name"] == "Client A"
    assert data["code"] == "CLIENT-A"


@pytest.mark.asyncio
async def test_list_clients(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    headers = {"Authorization": f"{_SCHEME} {seeded_auth['token']}"}
    await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
        headers=headers,
    )

    response = await client.get("/api/v1/clients", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["total"] == 1
    assert payload["data"][0]["code"] == "CLIENT-A"


@pytest.mark.asyncio
async def test_get_client_by_id(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    headers = {"Authorization": f"{_SCHEME} {seeded_auth['token']}"}
    create_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
        headers=headers,
    )
    client_id = create_response.json()["data"]["id"]

    response = await client.get(f"/api/v1/clients/{client_id}", headers=headers)

    assert response.status_code == 200
    assert response.json()["data"]["id"] == client_id


@pytest.mark.asyncio
async def test_update_client(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    headers = {"Authorization": f"{_SCHEME} {seeded_auth['token']}"}
    create_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
        headers=headers,
    )
    client_id = create_response.json()["data"]["id"]

    response = await client.put(
        f"/api/v1/clients/{client_id}",
        json={"name": "Client B", "code": "CLIENT-B", "status": "inactive"},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["name"] == "Client B"
    assert data["code"] == "CLIENT-B"
    assert data["status"] == "inactive"


@pytest.mark.asyncio
async def test_delete_client_hides_it_from_queries(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    headers = {"Authorization": f"{_SCHEME} {seeded_auth['token']}"}
    create_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
        headers=headers,
    )
    client_id = create_response.json()["data"]["id"]

    delete_response = await client.delete(f"/api/v1/clients/{client_id}", headers=headers)
    list_response = await client.get("/api/v1/clients", headers=headers)
    detail_response = await client.get(f"/api/v1/clients/{client_id}", headers=headers)

    assert delete_response.status_code == 200
    assert delete_response.json()["data"] == {"id": client_id, "deleted": True}
    assert list_response.json()["meta"]["total"] == 0
    assert detail_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_client_with_active_projects_conflicts(
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
            "description": "Project for client",
        },
        headers=headers,
    )

    response = await client.delete(f"/api/v1/clients/{client_id}", headers=headers)

    assert response.status_code == 400
    assert response.json()["errors"][0]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_create_client_unauthenticated(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A", "description": "Primary client"},
    )

    assert response.status_code == 401
    assert response.json()["success"] is False
