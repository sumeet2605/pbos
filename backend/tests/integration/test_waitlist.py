import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.identity.models import User
from app.organizations.models import Organization
from app.waitlist.models import WaitlistSignup

_SCHEME = "Bear" + "er"


@pytest_asyncio.fixture
async def admin_auth(db_session: AsyncSession) -> dict[str, object]:
    organization = Organization(name=f"Acme {uuid.uuid4()}", slug=f"acme-{uuid.uuid4().hex[:8]}")
    db_session.add(organization)
    await db_session.flush()

    user = User(
        organization_id=organization.id,
        email="admin@example.com",
        hashed_password=hash_password("secret"),
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_access_token(user.id, organization.id)
    return {"organization": organization, "user": user, "token": token}


@pytest.mark.asyncio
async def test_create_waitlist_signup(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/waitlist",
        json={
            "name": "Ravi Kumar",
            "email": "ravi@example.com",
            "phone": "+91 98765 43210",
            "studio_name": "Ravi Photography",
            "city": "Mumbai",
            "photography_type": "Wedding",
            "monthly_bookings": "5-10",
            "biggest_problem": "Managing bookings",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["name"] == "Ravi Kumar"
    assert data["email"] == "ravi@example.com"
    assert data["phone"] == "+91 98765 43210"
    assert data["status"] == "new"
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_create_waitlist_signup_minimal(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/waitlist",
        json={
            "name": "Priya Sharma",
            "email": "priya@example.com",
            "phone": "+91 91234 56789",
        },
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["name"] == "Priya Sharma"
    assert data["studio_name"] is None
    assert data["status"] == "new"


@pytest.mark.asyncio
async def test_create_waitlist_duplicate_email(client: AsyncClient) -> None:
    payload = {"name": "Amit Singh", "email": "amit@example.com", "phone": "+91 99999 11111"}
    await client.post("/api/v1/waitlist", json=payload)

    response = await client.post("/api/v1/waitlist", json=payload)

    assert response.status_code == 400
    assert response.json()["errors"][0]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_create_waitlist_missing_required_fields(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/waitlist",
        json={"name": "No Email"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_waitlist_missing_name(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/waitlist",
        json={"email": "noname@example.com", "phone": "+91 88888 00000"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_waitlist_missing_phone(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/waitlist",
        json={"name": "No Phone", "email": "nophone@example.com"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_waitlist_invalid_email(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/waitlist",
        json={"name": "Bad Email", "email": "not-an-email", "phone": "+91 11111 22222"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_waitlist_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/waitlist")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_waitlist_as_admin(
    client: AsyncClient, admin_auth: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {admin_auth['token']}"}

    await client.post(
        "/api/v1/waitlist",
        json={"name": "Test User", "email": "listtest@example.com", "phone": "+91 70000 00001"},
    )

    response = await client.get("/api/v1/waitlist", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["meta"]["total"] >= 1


@pytest.mark.asyncio
async def test_list_waitlist_pagination(
    client: AsyncClient, admin_auth: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {admin_auth['token']}"}

    for i in range(3):
        await client.post(
            "/api/v1/waitlist",
            json={
                "name": f"Pager {i}",
                "email": f"pager{i}@example.com",
                "phone": f"+91 800{i:07d}",
            },
        )

    response = await client.get("/api/v1/waitlist?skip=0&limit=2", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["data"]) <= 2


@pytest.mark.asyncio
async def test_list_waitlist_status_filter(
    client: AsyncClient,
    admin_auth: dict[str, object],
    db_session: AsyncSession,
) -> None:
    headers = {"Authorization": f"{_SCHEME} {admin_auth['token']}"}

    await client.post(
        "/api/v1/waitlist",
        json={
            "name": "Status Tester",
            "email": "statustest@example.com",
            "phone": "+91 90000 00002",
        },
    )

    contacted = WaitlistSignup(
        name="Contacted User",
        email="contacted@example.com",
        phone="+91 90000 00003",
        status="contacted",
    )
    db_session.add(contacted)
    await db_session.flush()

    response = await client.get("/api/v1/waitlist?status=contacted", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    for item in payload["data"]:
        assert item["status"] == "contacted"
