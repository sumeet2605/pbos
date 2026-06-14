import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuration.schemas import ClientCreate, ProjectCreate
from app.configuration.service import ClientService, ProjectService
from app.core.database import get_db
from app.core.deps import get_current_org_id, get_current_user
from app.identity.models import User
from app.shared.responses import APIResponse, ok, paginated

router = APIRouter()


@router.post("/clients", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse:
    client = await ClientService.create(db, organization_id, current_user.id, data)
    return ok(client.model_dump(mode="json"))


@router.get("/clients", response_model=APIResponse)
async def list_clients(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse:
    clients, total = await ClientService.list(db, organization_id, skip, limit)
    return paginated(
        [client.model_dump(mode="json") for client in clients],
        total=total,
        page=(skip // limit) + 1 if limit else 1,
        page_size=limit,
    )


@router.get("/clients/{id}", response_model=APIResponse)
async def get_client(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse:
    client = await ClientService.get(db, organization_id, id)
    return ok(client.model_dump(mode="json"))


@router.post("/projects", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse:
    project = await ProjectService.create(db, organization_id, current_user.id, data)
    return ok(project.model_dump(mode="json"))


@router.get("/projects", response_model=APIResponse)
async def list_projects(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse:
    projects, total = await ProjectService.list(db, organization_id, skip, limit)
    return paginated(
        [project.model_dump(mode="json") for project in projects],
        total=total,
        page=(skip // limit) + 1 if limit else 1,
        page_size=limit,
    )


@router.get("/projects/{id}", response_model=APIResponse)
async def get_project(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse:
    project = await ProjectService.get(db, organization_id, id)
    return ok(project.model_dump(mode="json"))
