"""Make role/permission scoping nullable + seed platform super-admin

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-14
"""
import uuid
from datetime import datetime

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

UUID = postgresql.UUID(as_uuid=True)


def upgrade() -> None:
    # make tenant columns nullable so platform-scoped (organization_id = NULL) records are possible
    op.alter_column("roles", "organization_id", existing_type=UUID, nullable=True)
    op.alter_column("permissions", "organization_id", existing_type=UUID, nullable=True)
    op.alter_column("user_roles", "organization_id", existing_type=UUID, nullable=True)
    op.alter_column("users", "organization_id", existing_type=UUID, nullable=True)

    conn = op.get_bind()

    role_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    mapping_id = str(uuid.uuid4())
    now = datetime.utcnow()

    # attempt to use app hasher; when running inside container/app env this will work.
    try:
        from app.core.security import hash_password

        hashed_pw = hash_password("ChangeMe123!")
    except Exception:
        hashed_pw = "CHANGEME_PLACEHOLDER_HASH"

    conn.execute(
        sa.text(
            """
        INSERT INTO roles (id, name, description, organization_id, created_at, updated_at)
        VALUES (:id, :name, :desc, :org, :now, :now)
        """
        ),
        {"id": role_id, "name": "super-admin", "desc": "Platform super administrator", "org": None, "now": now},
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO users (id, email, hashed_password, full_name, is_active, is_superuser, organization_id, created_at, updated_at)
        VALUES (:id, :email, :pwd, :full, :active, :super, :org, :now, :now)
        """
        ),
        {
            "id": user_id,
            "email": "superadmin@example.com",
            "pwd": hashed_pw,
            "full": "Platform Super Admin",
            "active": True,
            "super": True,
            "org": None,
            "now": now,
        },
    )

    conn.execute(
        sa.text(
            """
        INSERT INTO user_roles (id, user_id, role_id, organization_id, created_at, updated_at)
        VALUES (:id, :user_id, :role_id, :org, :now, :now)
        """
        ),
        {"id": mapping_id, "user_id": user_id, "role_id": role_id, "org": None, "now": now},
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name = :name)"), {"name": "super-admin"})
    conn.execute(sa.text("DELETE FROM users WHERE email = :email"), {"email": "superadmin@example.com"})
    conn.execute(sa.text("DELETE FROM roles WHERE name = :name"), {"name": "super-admin"})

    op.alter_column("users", "organization_id", existing_type=UUID, nullable=False)
    op.alter_column("user_roles", "organization_id", existing_type=UUID, nullable=False)
    op.alter_column("permissions", "organization_id", existing_type=UUID, nullable=False)
    op.alter_column("roles", "organization_id", existing_type=UUID, nullable=False)
