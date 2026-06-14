import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import BaseModel, TenantScopedMixin


class Client(BaseModel, TenantScopedMixin):
    __tablename__ = "clients"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_clients_org_code"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)


class Project(BaseModel, TenantScopedMixin):
    __tablename__ = "projects"

    client_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)
