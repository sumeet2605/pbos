from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import BaseModel


class WaitlistSignup(BaseModel):
    __tablename__ = "waitlist_signups"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    studio_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    photography_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    monthly_bookings: Mapped[str | None] = mapped_column(String(100), nullable=True)
    current_tools: Mapped[str | None] = mapped_column(String(500), nullable=True)
    biggest_problem: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="new", server_default="new"
    )
