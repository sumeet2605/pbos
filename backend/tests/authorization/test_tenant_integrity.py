"""Integration tests - tenant integrity constraints.

Regression tests for P1 finding: organization_id columns in TenantScopedMixin
had no FK constraint to organizations.id, allowing orphan rows in SQLite
and potential cross-tenant leakage.

These tests verify that:
1. organization_id is required (not nullable).
2. The FK is defined in the SQLAlchemy metadata.
3. Tenant-scoped models cannot reference a non-existent organization
   (tested via SQLite with FK pragmas enabled).
"""

import uuid

import pytest
import pytest_asyncio
from sqlalchemy import event, inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base
from app.identity.models import User
from app.organizations.models import Organization
from app.rbac.models import Role
from app.shared.models import TenantScopedMixin

# ── schema inspection ──────────────────────────────────────────────────────────

def test_tenant_scoped_mixin_organization_id_not_nullable() -> None:
    """organization_id defined in TenantScopedMixin must be non-nullable."""
    col = TenantScopedMixin.__dict__["organization_id"]
    # mapped_column descriptor - extract the underlying Column
    col_obj = col.column  # type: ignore[attr-defined]
    assert not col_obj.nullable, "organization_id must be NOT NULL"


def test_organization_id_fk_defined_on_user_model() -> None:
    """User.organization_id must carry a FK to organizations.id."""
    mapper = inspect(User)
    fk_targets = {
        fk.target_fullname
        for col in mapper.columns
        if col.key == "organization_id"
        for fk in col.foreign_keys
    }
    assert any("organizations" in t for t in fk_targets), (
        f"No FK to organizations found on User.organization_id. Got: {fk_targets}"
    )


def test_organization_id_fk_defined_on_role_model() -> None:
    """Role.organization_id must carry a FK to organizations.id."""
    mapper = inspect(Role)
    fk_targets = {
        fk.target_fullname
        for col in mapper.columns
        if col.key == "organization_id"
        for fk in col.foreign_keys
    }
    assert any("organizations" in t for t in fk_targets), (
        f"No FK to organizations found on Role.organization_id. Got: {fk_targets}"
    )


# ── FK enforcement in SQLite ───────────────────────────────────────────────────

@pytest_asyncio.fixture
async def fk_engine():
    """A fresh SQLite engine with foreign-key enforcement enabled."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)

    @event.listens_for(engine.sync_engine, "connect")
    def _enable_fks(conn, _record):
        conn.execute("PRAGMA foreign_keys=ON")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.mark.asyncio
async def test_tenant_scoped_row_requires_valid_organization(fk_engine) -> None:
    """Inserting a Role with a non-existent org_id must fail under FK enforcement."""
    session_factory = async_sessionmaker(fk_engine, expire_on_commit=False)

    async with session_factory() as session:
        role = Role(
            organization_id=uuid.uuid4(),  # orphan - no matching org
            name="orphan-role",
        )
        session.add(role)
        with pytest.raises((IntegrityError, Exception)):
            await session.flush()


@pytest.mark.asyncio
async def test_tenant_scoped_row_succeeds_with_valid_organization(fk_engine) -> None:
    """Inserting a Role with a real org_id must succeed."""
    session_factory = async_sessionmaker(fk_engine, expire_on_commit=False)

    async with session_factory() as session:
        org = Organization(name="Valid Org", slug="valid-org", is_active=True)
        session.add(org)
        await session.flush()

        role = Role(organization_id=org.id, name="valid-role")
        session.add(role)
        await session.flush()  # must not raise

    assert True  # reached without exception
