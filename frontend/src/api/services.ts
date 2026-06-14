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

const requestOptions = {
  responseStyle: 'data' as const,
  throwOnError: true as const,
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
  const response = await loginApiV1AuthLoginPost({ body: payload, ...requestOptions })
  return unwrapData<TokenResponse>(response)
}

export async function fetchCurrentUser(): Promise<UserResponse> {
  const response = await meApiV1AuthMeGet(requestOptions)
  return unwrapData<UserResponse>(response)
}

export async function listClients(params: PaginationParams = {}): Promise<PaginatedApiResponseClientResponse> {
  const result = await listClientsApiV1ClientsGet({
    query: buildPaginationParams(params),
    ...requestOptions,
  })
  const response = unwrapPaginated<PaginatedApiResponseClientResponse>(result)
  const normalized: PaginatedApiResponseClientResponse = {
    ...response,
    data: response.data ?? [],
  }
  return normalized
}

export async function getClient(id: string): Promise<ClientResponse> {
  const response = await getClientApiV1ClientsIdGet({ path: { id }, ...requestOptions })
  return unwrapData<ClientResponse>(response)
}

export async function createClient(payload: ClientCreate): Promise<ClientResponse> {
  const response = await createClientApiV1ClientsPost({ body: payload, ...requestOptions })
  return unwrapData<ClientResponse>(response)
}

export async function updateClient(id: string, payload: ClientUpdate): Promise<ClientResponse> {
  const response = await updateClientApiV1ClientsIdPut({ body: payload, path: { id }, ...requestOptions })
  return unwrapData<ClientResponse>(response)
}

export async function deleteClient(id: string): Promise<DeleteResponse> {
  const response = await deleteClientApiV1ClientsIdDelete({ path: { id }, ...requestOptions })
  return unwrapData<DeleteResponse>(response)
}

export async function listProjects(
  params: PaginationParams = {}
): Promise<PaginatedApiResponseProjectResponse> {
  const result = await listProjectsApiV1ProjectsGet({
    query: buildPaginationParams(params),
    ...requestOptions,
  })
  const response = unwrapPaginated<PaginatedApiResponseProjectResponse>(result)
  const normalized: PaginatedApiResponseProjectResponse = {
    ...response,
    data: response.data ?? [],
  }
  return normalized
}

export async function getProject(id: string): Promise<ProjectResponse> {
  const response = await getProjectApiV1ProjectsIdGet({ path: { id }, ...requestOptions })
  return unwrapData<ProjectResponse>(response)
}

export async function createProject(payload: ProjectCreate): Promise<ProjectResponse> {
  const response = await createProjectApiV1ProjectsPost({ body: payload, ...requestOptions })
  return unwrapData<ProjectResponse>(response)
}

export async function updateProject(id: string, payload: ProjectUpdate): Promise<ProjectResponse> {
  const response = await updateProjectApiV1ProjectsIdPut({ body: payload, path: { id }, ...requestOptions })
  return unwrapData<ProjectResponse>(response)
}

export async function deleteProject(id: string): Promise<DeleteResponse> {
  const response = await deleteProjectApiV1ProjectsIdDelete({ path: { id }, ...requestOptions })
  return unwrapData<DeleteResponse>(response)
}

export async function listAuditEvents(
  params: PaginationParams & AuditEventFilters = {}
): Promise<PaginatedApiResponseAuditEventResponse> {
  const { entityType, action, ...pagination } = params
  const result = await listAuditEventsApiV1AuditEventsGet({
    query: {
      ...buildPaginationParams(pagination),
      action: action || undefined,
      entity_type: entityType || undefined,
    },
    ...requestOptions,
  })
  const response = unwrapPaginated<PaginatedApiResponseAuditEventResponse>(result)

  const normalized: PaginatedApiResponseAuditEventResponse = {
    ...response,
    data: response.data ?? [],
  }
  return normalized
}
