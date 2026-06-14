"""Tenant isolation tests - verify that one organization cannot access another's data."""

import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.identity.models import User
from app.organizations.models import Organization

_SCHEME = "Bearer"


async def _create_org_and_user(db: AsyncSession) -> tuple[Organization, User, str]:
    org = Organization(name=f"Org {uuid.uuid4()}", slug=f"org-{uuid.uuid4().hex[:8]}")
    db.add(org)
    await db.flush()

    user = User(
        organization_id=org.id,
        email=f"user-{uuid.uuid4().hex[:6]}@example.com",
        hashed_password=hash_password("secret"),
        full_name="Test User",
        is_active=True,
        is_superuser=True,
    )
    db.add(user)
    await db.flush()

    token = create_access_token(user.id, org.id)
    return org, user, token


@pytest_asyncio.fixture
async def two_tenants(db_session: AsyncSession) -> dict[str, object]:
    org_a, user_a, token_a = await _create_org_and_user(db_session)
    org_b, user_b, token_b = await _create_org_and_user(db_session)
    return {
        "org_a": org_a,
        "user_a": user_a,
        "token_a": token_a,
        "org_b": org_b,
        "user_b": user_b,
        "token_b": token_b,
    }


@pytest.mark.asyncio
async def test_client_list_scoped_to_tenant(
    client: AsyncClient, two_tenants: dict[str, object]
) -> None:
    """Org A creating a client must not appear in Org B's client list."""
    headers_a = {"Authorization": f"{_SCHEME} {two_tenants['token_a']}"}
    headers_b = {"Authorization": f"{_SCHEME} {two_tenants['token_b']}"}

    await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A"},
        headers=headers_a,
    )

    response_b = await client.get("/api/v1/clients", headers=headers_b)

    assert response_b.status_code == 200
    assert response_b.json()["meta"]["total"] == 0


@pytest.mark.asyncio
async def test_client_detail_cross_tenant_returns_404(
    client: AsyncClient, two_tenants: dict[str, object]
) -> None:
    """Org B cannot retrieve a client that belongs to Org A."""
    headers_a = {"Authorization": f"{_SCHEME} {two_tenants['token_a']}"}
    headers_b = {"Authorization": f"{_SCHEME} {two_tenants['token_b']}"}

    create_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A"},
        headers=headers_a,
    )
    client_id = create_response.json()["data"]["id"]

    response = await client.get(f"/api/v1/clients/{client_id}", headers=headers_b)

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_project_list_scoped_to_tenant(
    client: AsyncClient, two_tenants: dict[str, object]
) -> None:
    """Org A creating a project must not appear in Org B's project list."""
    headers_a = {"Authorization": f"{_SCHEME} {two_tenants['token_a']}"}
    headers_b = {"Authorization": f"{_SCHEME} {two_tenants['token_b']}"}

    client_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A"},
        headers=headers_a,
    )
    client_id = client_response.json()["data"]["id"]

    await client.post(
        "/api/v1/projects",
        json={"client_id": client_id, "name": "Project A", "code": "PROJ-A"},
        headers=headers_a,
    )

    response_b = await client.get("/api/v1/projects", headers=headers_b)

    assert response_b.status_code == 200
    assert response_b.json()["meta"]["total"] == 0


@pytest.mark.asyncio
async def test_project_detail_cross_tenant_returns_404(
    client: AsyncClient, two_tenants: dict[str, object]
) -> None:
    """Org B cannot retrieve a project that belongs to Org A."""
    headers_a = {"Authorization": f"{_SCHEME} {two_tenants['token_a']}"}
    headers_b = {"Authorization": f"{_SCHEME} {two_tenants['token_b']}"}

    client_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A"},
        headers=headers_a,
    )
    client_id = client_response.json()["data"]["id"]

    project_response = await client.post(
        "/api/v1/projects",
        json={"client_id": client_id, "name": "Project A", "code": "PROJ-A"},
        headers=headers_a,
    )
    project_id = project_response.json()["data"]["id"]

    response = await client.get(f"/api/v1/projects/{project_id}", headers=headers_b)

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_audit_events_scoped_to_tenant(
    client: AsyncClient, two_tenants: dict[str, object]
) -> None:
    """Org A's audit events must not be visible to Org B."""
    headers_a = {"Authorization": f"{_SCHEME} {two_tenants['token_a']}"}
    headers_b = {"Authorization": f"{_SCHEME} {two_tenants['token_b']}"}

    await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A"},
        headers=headers_a,
    )

    response_b = await client.get("/api/v1/audit-events", headers=headers_b)

    assert response_b.status_code == 200
    assert response_b.json()["meta"]["total"] == 0


@pytest.mark.asyncio
async def test_cross_tenant_client_update_rejected(
    client: AsyncClient, two_tenants: dict[str, object]
) -> None:
    """Org B must not be able to update a client owned by Org A."""
    headers_a = {"Authorization": f"{_SCHEME} {two_tenants['token_a']}"}
    headers_b = {"Authorization": f"{_SCHEME} {two_tenants['token_b']}"}

    create_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A"},
        headers=headers_a,
    )
    client_id = create_response.json()["data"]["id"]

    response = await client.put(
        f"/api/v1/clients/{client_id}",
        json={"name": "Hijacked"},
        headers=headers_b,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_cross_tenant_project_update_rejected(
    client: AsyncClient, two_tenants: dict[str, object]
) -> None:
    """Org B must not be able to update a project owned by Org A."""
    headers_a = {"Authorization": f"{_SCHEME} {two_tenants['token_a']}"}
    headers_b = {"Authorization": f"{_SCHEME} {two_tenants['token_b']}"}

    client_response = await client.post(
        "/api/v1/clients",
        json={"name": "Client A", "code": "CLIENT-A"},
        headers=headers_a,
    )
    client_id = client_response.json()["data"]["id"]

    project_response = await client.post(
        "/api/v1/projects",
        json={"client_id": client_id, "name": "Project A", "code": "PROJ-A"},
        headers=headers_a,
    )
    project_id = project_response.json()["data"]["id"]

    response = await client.put(
        f"/api/v1/projects/{project_id}",
        json={"name": "Hijacked"},
        headers=headers_b,
    )

    assert response.status_code == 404
