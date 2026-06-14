import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
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
    return {"organization": organization, "user": user}


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    organization = seeded_auth["organization"]
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@example.com",
            "password": "secret",
            "organization_slug": organization.slug,
        },
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    organization = seeded_auth["organization"]
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@example.com",
            "password": "wrong",
            "organization_slug": organization.slug,
        },
    )

    assert response.status_code == 401
    assert response.json()["success"] is False


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    organization = seeded_auth["organization"]
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@example.com",
            "password": "secret",
            "organization_slug": organization.slug,
        },
    )
    access_token = login_response.json()["data"]["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"{_SCHEME} {access_token}"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["email"] == "user@example.com"


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient) -> None:
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json()["success"] is False


@pytest.mark.asyncio
async def test_refresh_tokens(client: AsyncClient, seeded_auth: dict[str, object]) -> None:
    organization = seeded_auth["organization"]
    login_response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "user@example.com",
            "password": "secret",
            "organization_slug": organization.slug,
        },
    )
    refresh_token = login_response.json()["data"]["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["access_token"]
    assert data["refresh_token"]
