"""Integration tests - RBAC route enforcement.

Regression tests for P0 finding: all client/project/audit routes were open
(no require_permission dependency).  These tests verify that:

1. Non-superuser users without the required permission receive 403.
2. Non-superuser users WITH the required permission receive 2xx.
3. Superusers bypass RBAC and always receive 2xx.
"""

import uuid

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.identity.models import User
from app.organizations.models import Organization
from app.rbac.models import Permission, Role, RolePermission, UserRole

_SCHEME = "Bearer"


async def _create_org(db: AsyncSession) -> Organization:
    org = Organization(name=f"RBAC Org {uuid.uuid4()}", slug=f"rbac-{uuid.uuid4().hex[:8]}")
    db.add(org)
    await db.flush()
    return org


async def _create_user(
    db: AsyncSession,
    org: Organization,
    *,
    is_superuser: bool = False,
) -> tuple[User, str]:
    user = User(
        organization_id=org.id,
        email=f"user-{uuid.uuid4().hex[:6]}@example.com",
        hashed_password=hash_password("secret"),
        full_name="Test",
        is_active=True,
        is_superuser=is_superuser,
    )
    db.add(user)
    await db.flush()
    token = create_access_token(user.id, org.id)
    return user, token


async def _grant_permission(
    db: AsyncSession,
    org: Organization,
    user: User,
    resource: str,
    action: str,
) -> None:
    role = Role(organization_id=org.id, name=f"role-{resource}-{action}")
    db.add(role)
    await db.flush()

    perm = Permission(
        organization_id=org.id,
        name=f"{resource}:{action}",
        resource=resource,
        action=action,
    )
    db.add(perm)
    await db.flush()

    db.add(RolePermission(organization_id=org.id, role_id=role.id, permission_id=perm.id))
    db.add(UserRole(organization_id=org.id, user_id=user.id, role_id=role.id))
    await db.flush()


# ── client routes ──────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def no_perm_setup(db_session: AsyncSession) -> dict[str, object]:
    org = await _create_org(db_session)
    _, token = await _create_user(db_session, org, is_superuser=False)
    return {"org": org, "token": token}


@pytest.mark.asyncio
async def test_create_client_forbidden_without_permission(
    client: AsyncClient, no_perm_setup: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {no_perm_setup['token']}"}
    resp = await client.post("/api/v1/clients", json={"name": "X", "code": "X"}, headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_clients_forbidden_without_permission(
    client: AsyncClient, no_perm_setup: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {no_perm_setup['token']}"}
    resp = await client.get("/api/v1/clients", headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_audit_events_forbidden_without_permission(
    client: AsyncClient, no_perm_setup: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {no_perm_setup['token']}"}
    resp = await client.get("/api/v1/audit-events", headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_client_allowed_with_write_permission(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    org = await _create_org(db_session)
    user, token = await _create_user(db_session, org, is_superuser=False)
    await _grant_permission(db_session, org, user, "client", "write")

    headers = {"Authorization": f"{_SCHEME} {token}"}
    resp = await client.post(
        "/api/v1/clients", json={"name": "Allowed", "code": "ALLOWED"}, headers=headers
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_list_clients_allowed_with_read_permission(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    org = await _create_org(db_session)
    user, token = await _create_user(db_session, org, is_superuser=False)
    await _grant_permission(db_session, org, user, "client", "read")

    headers = {"Authorization": f"{_SCHEME} {token}"}
    resp = await client.get("/api/v1/clients", headers=headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_superuser_bypasses_rbac(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Superusers must not be blocked by require_permission."""
    org = await _create_org(db_session)
    _, token = await _create_user(db_session, org, is_superuser=True)

    headers = {"Authorization": f"{_SCHEME} {token}"}
    resp = await client.get("/api/v1/clients", headers=headers)
    assert resp.status_code == 200


# ── project routes ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_project_forbidden_without_permission(
    client: AsyncClient, no_perm_setup: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {no_perm_setup['token']}"}
    resp = await client.post(
        "/api/v1/projects",
        json={"client_id": str(uuid.uuid4()), "name": "P", "code": "P"},
        headers=headers,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_projects_forbidden_without_permission(
    client: AsyncClient, no_perm_setup: dict[str, object]
) -> None:
    headers = {"Authorization": f"{_SCHEME} {no_perm_setup['token']}"}
    resp = await client.get("/api/v1/projects", headers=headers)
    assert resp.status_code == 403


# ── cross-permission boundary ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_read_permission_does_not_grant_write(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """A user with only client:read must not be able to create a client (403)."""
    org = await _create_org(db_session)
    user, token = await _create_user(db_session, org, is_superuser=False)
    await _grant_permission(db_session, org, user, "client", "read")

    headers = {"Authorization": f"{_SCHEME} {token}"}
    resp = await client.post(
        "/api/v1/clients", json={"name": "Sneaky", "code": "SNKY"}, headers=headers
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_wrong_resource_permission_does_not_grant_access(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """A user with project:write must not be able to create a client."""
    org = await _create_org(db_session)
    user, token = await _create_user(db_session, org, is_superuser=False)
    await _grant_permission(db_session, org, user, "project", "write")

    headers = {"Authorization": f"{_SCHEME} {token}"}
    resp = await client.post(
        "/api/v1/clients", json={"name": "X", "code": "X"}, headers=headers
    )
    assert resp.status_code == 403
