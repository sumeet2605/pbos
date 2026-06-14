import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientCreate(BaseModel):
    name: str
    code: str
    description: str | None = None
    status: str = "active"


class ClientUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    code: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class ProjectCreate(BaseModel):
    client_id: uuid.UUID
    name: str
    code: str
    description: str | None = None
    status: str = "active"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    client_id: uuid.UUID
    name: str
    code: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime
