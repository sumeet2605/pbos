import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

StatusValue = Literal["active", "inactive"]


class ClientCreate(BaseModel):
    name: str
    code: str
    description: str | None = None
    status: StatusValue = "active"


class ClientUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    status: StatusValue | None = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    code: str
    description: str | None
    status: StatusValue
    created_at: datetime
    updated_at: datetime


class ProjectCreate(BaseModel):
    client_id: uuid.UUID
    name: str
    code: str
    description: str | None = None
    status: StatusValue = "active"


class ProjectUpdate(BaseModel):
    client_id: uuid.UUID | None = None
    name: str | None = None
    code: str | None = None
    description: str | None = None
    status: StatusValue | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    client_id: uuid.UUID
    name: str
    code: str
    description: str | None
    status: StatusValue
    created_at: datetime
    updated_at: datetime
