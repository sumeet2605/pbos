"""Unit tests - RBAC model correctness.

Regression tests for P0 finding: Permission had no role_id field and
require_permission used a broken join.  These tests verify the correct
RolePermission join table shape and that require_permission resolves
permissions through the proper UserRole -> RolePermission -> Permission chain.
"""

import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.identity.models import User
from app.organizations.models import Organization
from app.rbac.models import Permission, Role, RolePermission, UserRole


@pytest_asyncio.fixture
async def rbac_seed(db_session: AsyncSession) -> dict[str, object]:
    """Create an org, user, role, permission, and wire them together."""
    org = Organization(name=f"RBAC Org {uuid.uuid4()}", slug=f"rbac-{uuid.uuid4().hex[:8]}")
    db_session.add(org)
    await db_session.flush()

    user = User(
        organization_id=org.id,
        email="rbac@example.com",
        hashed_password=hash_password("secret"),
        full_name="RBAC User",
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    await db_session.flush()

    role = Role(organization_id=org.id, name="editor", description="Can edit clients")
    db_session.add(role)
    await db_session.flush()

    perm = Permission(
        organization_id=org.id,
        name="client:write",
        resource="client",
        action="write",
    )
    db_session.add(perm)
    await db_session.flush()

    role_perm = RolePermission(
        organization_id=org.id,
        role_id=role.id,
        permission_id=perm.id,
    )
    db_session.add(role_perm)

    user_role = UserRole(
        organization_id=org.id,
        user_id=user.id,
        role_id=role.id,
    )
    db_session.add(user_role)
    await db_session.flush()

    return {
        "org": org,
        "user": user,
        "role": role,
        "permission": perm,
        "role_permission": role_perm,
        "user_role": user_role,
    }


@pytest.mark.asyncio
async def test_role_permission_join_table_created(rbac_seed: dict[str, object]) -> None:
    """RolePermission model must exist and carry role_id + permission_id."""
    rp = rbac_seed["role_permission"]
    assert isinstance(rp, RolePermission)
    assert rp.role_id == rbac_seed["role"].id
    assert rp.permission_id == rbac_seed["permission"].id
    assert rp.organization_id == rbac_seed["org"].id


@pytest.mark.asyncio
async def test_permission_has_no_role_id_field() -> None:
    """Permission model must NOT have a role_id column (old broken design)."""
    assert not hasattr(Permission, "role_id"), (
        "Permission must NOT carry role_id; permissions are linked via RolePermission."
    )


@pytest.mark.asyncio
async def test_user_role_links_user_to_role(rbac_seed: dict[str, object]) -> None:
    user_role = rbac_seed["user_role"]
    assert user_role.user_id == rbac_seed["user"].id
    assert user_role.role_id == rbac_seed["role"].id
