import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.configuration.schemas import (
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.configuration.service import ClientService, ProjectService
from app.core.database import get_db
from app.core.deps import get_current_org_id, get_current_user
from app.identity.models import User
from app.shared.responses import APIResponse, DeleteResponse, PaginatedAPIResponse, ok, paginated

router = APIRouter()


@router.post("/clients", response_model=APIResponse[ClientResponse], status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse[ClientResponse]:
    client = await ClientService.create(db, organization_id, current_user.id, data)
    return ok(client)


@router.get("/clients", response_model=PaginatedAPIResponse[ClientResponse])
async def list_clients(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> PaginatedAPIResponse[ClientResponse]:
    clients, total = await ClientService.list(db, organization_id, skip, limit)
    return paginated(
        clients,
        total=total,
        page=(skip // limit) + 1 if limit else 1,
        page_size=limit,
    )


@router.get("/clients/{id}", response_model=APIResponse[ClientResponse])
async def get_client(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse[ClientResponse]:
    client = await ClientService.get(db, organization_id, id)
    return ok(client)


@router.put("/clients/{id}", response_model=APIResponse[ClientResponse])
async def update_client(
    id: uuid.UUID,
    data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse[ClientResponse]:
    client = await ClientService.update(db, organization_id, current_user.id, id, data)
    return ok(client)


@router.delete("/clients/{id}", response_model=APIResponse[DeleteResponse])
async def delete_client(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse[DeleteResponse]:
    result = await ClientService.delete(db, organization_id, current_user.id, id)
    return ok(result)


@router.post("/projects", response_model=APIResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse[ProjectResponse]:
    project = await ProjectService.create(db, organization_id, current_user.id, data)
    return ok(project)


@router.get("/projects", response_model=PaginatedAPIResponse[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> PaginatedAPIResponse[ProjectResponse]:
    projects, total = await ProjectService.list(db, organization_id, skip, limit)
    return paginated(
        projects,
        total=total,
        page=(skip // limit) + 1 if limit else 1,
        page_size=limit,
    )


@router.get("/projects/{id}", response_model=APIResponse[ProjectResponse])
async def get_project(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse[ProjectResponse]:
    project = await ProjectService.get(db, organization_id, id)
    return ok(project)


@router.put("/projects/{id}", response_model=APIResponse[ProjectResponse])
async def update_project(
    id: uuid.UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse[ProjectResponse]:
    project = await ProjectService.update(db, organization_id, current_user.id, id, data)
    return ok(project)


@router.delete("/projects/{id}", response_model=APIResponse[DeleteResponse])
async def delete_project(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization_id: uuid.UUID = Depends(get_current_org_id),
) -> APIResponse[DeleteResponse]:
    result = await ProjectService.delete(db, organization_id, current_user.id, id)
    return ok(result)
