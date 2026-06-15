import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator

WaitlistStatus = Literal["new", "contacted", "onboarded", "rejected"]

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class WaitlistCreate(BaseModel):
    name: str
    email: str
    phone: str
    studio_name: str | None = None
    city: str | None = None
    photography_type: str | None = None
    monthly_bookings: str | None = None
    current_tools: str | None = None
    biggest_problem: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email address.")
        return v.lower().strip()


class WaitlistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    phone: str
    studio_name: str | None
    city: str | None
    photography_type: str | None
    monthly_bookings: str | None
    current_tools: str | None
    biggest_problem: str | None
    status: str
    created_at: datetime
    updated_at: datetime
