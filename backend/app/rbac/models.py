import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import BaseModel, TenantScopedMixin


class Role(BaseModel, TenantScopedMixin):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)


class Permission(BaseModel, TenantScopedMixin):
    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint(
            "organization_id", "resource", "action",
            name="uq_permissions_org_resource_action",
        ),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    resource: Mapped[str] = mapped_column(String(255), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)


class RolePermission(BaseModel, TenantScopedMixin):
    """Many-to-many join between Role and Permission within a tenant."""

    __tablename__ = "role_permissions"
    __table_args__ = (
        UniqueConstraint("organization_id", "role_id", "permission_id", name="uq_role_permissions"),
    )

    role_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    permission_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("permissions.id", ondelete="CASCADE"),
        nullable=False,
    )


class UserRole(BaseModel, TenantScopedMixin):
    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", "role_id", name="uq_user_roles"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
