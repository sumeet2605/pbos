import {
  createClientApiV1ClientsPost,
  createProjectApiV1ProjectsPost,
  deleteClientApiV1ClientsIdDelete,
  deleteProjectApiV1ProjectsIdDelete,
  getClientApiV1ClientsIdGet,
  getProjectApiV1ProjectsIdGet,
  listAuditEventsApiV1AuditEventsGet,
  listClientsApiV1ClientsGet,
  listProjectsApiV1ProjectsGet,
  loginApiV1AuthLoginPost,
  meApiV1AuthMeGet,
  updateClientApiV1ClientsIdPut,
  updateProjectApiV1ProjectsIdPut,
} from '@/generated/client'
import type {
  ClientCreate,
  ClientResponse,
  ClientUpdate,
  DeleteResponse,
  LoginRequest,
  PaginatedApiResponseAuditEventResponse,
  PaginatedApiResponseClientResponse,
  PaginatedApiResponseProjectResponse,
  ProjectCreate,
  ProjectResponse,
  ProjectUpdate,
  TokenResponse,
  UserResponse,
} from '@/generated/client'
import { unwrapData, unwrapPaginated } from '@/api/client'

interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface AuditEventFilters {
  entityType?: string
  action?: string
}

export function buildPaginationParams({ page = 1, pageSize = 10 }: PaginationParams): {
  skip: number
  limit: number
} {
  return {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  }
}

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const response = await loginApiV1AuthLoginPost({ body: payload })
  return unwrapData<TokenResponse>(response)
}

export async function fetchCurrentUser(): Promise<UserResponse> {
  const response = await meApiV1AuthMeGet()
  return unwrapData<UserResponse>(response)
}

export async function listClients(params: PaginationParams = {}): Promise<PaginatedApiResponseClientResponse> {
  const response = await listClientsApiV1ClientsGet({
    query: buildPaginationParams(params),
  })
  return unwrapPaginated<PaginatedApiResponseClientResponse>({
    ...response,
    data: response.data ?? [],
  })
}

export async function getClient(id: string): Promise<ClientResponse> {
  const response = await getClientApiV1ClientsIdGet({ path: { id } })
  return unwrapData<ClientResponse>(response)
}

export async function createClient(payload: ClientCreate): Promise<ClientResponse> {
  const response = await createClientApiV1ClientsPost({ body: payload })
  return unwrapData<ClientResponse>(response)
}

export async function updateClient(id: string, payload: ClientUpdate): Promise<ClientResponse> {
  const response = await updateClientApiV1ClientsIdPut({ body: payload, path: { id } })
  return unwrapData<ClientResponse>(response)
}

export async function deleteClient(id: string): Promise<DeleteResponse> {
  const response = await deleteClientApiV1ClientsIdDelete({ path: { id } })
  return unwrapData<DeleteResponse>(response)
}

export async function listProjects(
  params: PaginationParams = {}
): Promise<PaginatedApiResponseProjectResponse> {
  const response = await listProjectsApiV1ProjectsGet({
    query: buildPaginationParams(params),
  })
  return unwrapPaginated<PaginatedApiResponseProjectResponse>({
    ...response,
    data: response.data ?? [],
  })
}

export async function getProject(id: string): Promise<ProjectResponse> {
  const response = await getProjectApiV1ProjectsIdGet({ path: { id } })
  return unwrapData<ProjectResponse>(response)
}

export async function createProject(payload: ProjectCreate): Promise<ProjectResponse> {
  const response = await createProjectApiV1ProjectsPost({ body: payload })
  return unwrapData<ProjectResponse>(response)
}

export async function updateProject(id: string, payload: ProjectUpdate): Promise<ProjectResponse> {
  const response = await updateProjectApiV1ProjectsIdPut({ body: payload, path: { id } })
  return unwrapData<ProjectResponse>(response)
}

export async function deleteProject(id: string): Promise<DeleteResponse> {
  const response = await deleteProjectApiV1ProjectsIdDelete({ path: { id } })
  return unwrapData<DeleteResponse>(response)
}

export async function listAuditEvents(
  params: PaginationParams & AuditEventFilters = {}
): Promise<PaginatedApiResponseAuditEventResponse> {
  const { entityType, action, ...pagination } = params
  const response = await listAuditEventsApiV1AuditEventsGet({
    query: {
      ...buildPaginationParams(pagination),
      action: action || undefined,
      entity_type: entityType || undefined,
    },
  })

  return unwrapPaginated<PaginatedApiResponseAuditEventResponse>({
    ...response,
    data: response.data ?? [],
  })
}
